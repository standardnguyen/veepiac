import os
import json
from pathlib import Path

class Config:
    """Configuration handler for Veepiac API"""
    
    def __init__(self, config_file=None):
        """Initialize configuration from environment or config file"""
        self.config_file = config_file or os.environ.get('VEEPIAC_CONFIG', 'config.json')
        self.config = {}
        self.load_config()
        
    def load_config(self):
        """Load configuration from file"""
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        except FileNotFoundError:
            # Create default config if doesn't exist
            self.config = {
                "environment": os.environ.get("VEEPIAC_ENV", "development"),
                "static_dir": os.environ.get("VEEPIAC_STATIC_DIR", "./static"),
                "database_path": os.environ.get("VEEPIAC_DB_PATH", "./static/subtitles.db"),
                "server": {
                    "host": os.environ.get("VEEPIAC_HOST", "127.0.0.1"),
                    "port": int(os.environ.get("VEEPIAC_PORT", 5000)),
                    "debug": os.environ.get("VEEPIAC_DEBUG", "true").lower() == "true"
                },
                "api": {
                    "version": "v1",
                    "rate_limits": {
                        "free": 100,
                        "standard": 1000,
                        "premium": 5000
                    }
                },
                "cdn": {
                    "base_url": os.environ.get("VEEPIAC_CDN_URL", "https://cdn.veepiac.com"),
                    "file_expiry_days": 7
                }
            }
            self.save_config()
    
    def save_config(self):
        """Save current configuration to file"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def get(self, key, default=None):
        """Get configuration value by key"""
        keys = key.split('.')
        value = self.config
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key, value):
        """Set configuration value"""
        keys = key.split('.')
        config = self.config
        for i, k in enumerate(keys[:-1]):
            if k not in config:
                config[k] = {}
            config = config[k]
        config[keys[-1]] = value
        self.save_config()
    
    @property
    def is_development(self):
        """Check if running in development environment"""
        return self.get('environment') == 'development'
    
    @property
    def is_production(self):
        """Check if running in production environment"""
        return self.get('environment') == 'production'
    
    @property
    def static_dir(self):
        """Get path to static directory, resolving environment differences"""
        path = Path(self.get('static_dir'))
        if self.is_development and 'dev_static_drive' in self.config:
            # In development mode, the static directory might be on a different drive
            drive = self.get('dev_static_drive')
            if drive:
                # On Windows, replace the drive letter
                if os.name == 'nt':
                    path = Path(f"{drive}:\\{str(path.relative_to(path.anchor))}")
                # On Unix-like systems, mount points might be different
                else:
                    path = Path(drive) / path.relative_to('/')
        
        # Ensure the directory exists
        if not path.exists() and not self.get('ignore_missing_dirs', False):
            print(f"Warning: Static directory not found at {path}")
            
        return path
    
    @property
    def database_path(self):
        """Get path to database file, resolving environment differences"""
        db_path = Path(self.get('database_path'))
        # If path is relative, make it relative to static_dir
        if not db_path.is_absolute():
            return self.static_dir / db_path
        
        # For absolute paths, check if we need to adjust the drive letter in development
        if self.is_development and 'dev_static_drive' in self.config and os.name == 'nt':
            drive = self.get('dev_static_drive')
            if drive:
                # Replace drive letter for absolute Windows paths
                db_path = Path(f"{drive}:{db_path.drive[1:]}{str(db_path)[2:]}")
        
        # Ensure the file exists
        if not db_path.exists() and not self.get('ignore_missing_files', False):
            print(f"Warning: Database file not found at {db_path}")
            
        return db_path
        
    @property
    def media_output_dir(self):
        """Get path to media output directory, creating it if needed"""
        path = Path(self.get('media_output_dir', 'media_output'))
        
        # If path is relative, make it relative to the current directory
        if not path.is_absolute():
            path = Path.cwd() / path
            
        # Create directory if it doesn't exist
        path.mkdir(exist_ok=True)
        
        # Create subdirectories
        for subdir in ['memes', 'gifs', 'clips']:
            (path / subdir).mkdir(exist_ok=True)
            
        return path

# Create a singleton config instance
config = Config()
