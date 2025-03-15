import os
import re
import logging
from pathlib import Path
import tempfile
from datetime import datetime, timedelta
import shutil

from config import config

logger = logging.getLogger(__name__)

def cleanup_expired_media():
    """
    Clean up expired media files (older than the configured expiry period)
    """
    try:
        # Get the expiry period from config (default 7 days)
        expiry_days = config.get('cdn.file_expiry_days', 7)
        
        # Calculate the cutoff date
        cutoff_date = datetime.now() - timedelta(days=expiry_days)
        
        # Media output directory
        media_dir = config.media_output_dir
        
        # Check each media type directory
        for media_type in ['memes', 'gifs', 'clips']:
            media_type_dir = media_dir / media_type
            if not media_type_dir.exists():
                continue
                
            # Check each file in the directory
            for file_path in media_type_dir.iterdir():
                if not file_path.is_file():
                    continue
                    
                # Get the file's modification time
                mod_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                # If the file is older than the cutoff date, delete it
                if mod_time < cutoff_date:
                    logger.info(f"Deleting expired file: {file_path}")
                    os.remove(file_path)
                    
        logger.info(f"Cleanup complete. Removed files older than {expiry_days} days")
    except Exception as e:
        logger.exception(f"Error cleaning up expired media: {e}")


def get_error_frame_path():
    """Get path to the error placeholder image"""
    error_frame_path = Path(config.get('error_frame_path', ''))
    
    # If not specified or doesn't exist, use a default
    if not error_frame_path or not error_frame_path.exists():
        # Create a simple error image if needed
        # This would typically be a placeholder image for when frames can't be found
        return None
        
    return error_frame_path


def safe_filename(text):
    """Convert text to a safe filename"""
    # Replace spaces with underscores and remove invalid characters
    safe = re.sub(r'[^\w\-_.]', '', text.replace(' ', '_'))
    # Limit length
    return safe[:50]
