from flask import Flask, request, jsonify, g
from functools import wraps
import uuid
import datetime
import time
import os
from pathlib import Path
import logging

from config import config
from database import db
from media_generator import MemeGenerator, GifGenerator, ClipGenerator

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config.is_development else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure app for proxy servers in production
if config.is_production:
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# Schedule periodic cleanup of expired media files
@app.before_first_request
def setup_cleanup():
    if config.get('auto_cleanup_media', True):
        # In a production app, you would use a task scheduler like Celery
        # For simplicity, we'll just log a reminder
        logger.info("Media cleanup should be scheduled with a cron job or task scheduler")
        # cleanup_expired_media() # Uncomment to run on startup

# Define error codes
ERROR_CODES = {
    400: "Bad Request - Check request parameters",
    401: "Unauthorized - Invalid API key",
    403: "Forbidden - Premium feature or rate limit exceeded",
    404: "Not Found - Resource doesn't exist",
    429: "Too Many Requests - Rate limit exceeded",
    500: "Server Error - Please contact support"
}

# API key validation decorator
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In development mode, we might bypass API key validation
        if config.is_development and config.get('bypass_api_key', False):
            g.api_tier = 'premium'  # Default to premium in dev mode
            return f(*args, **kwargs)
        
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({"error": ERROR_CODES[401]}), 401
        
        # TODO: Implement proper API key validation
        # This is a placeholder implementation
        g.api_tier = 'free'  # Default tier
        
        if api_key == 'test-standard':
            g.api_tier = 'standard'
        elif api_key == 'test-premium':
            g.api_tier = 'premium'
        
        return f(*args, **kwargs)
    return decorated_function

# Rate limiting decorator
def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the user's tier
        tier = getattr(g, 'api_tier', 'free')
        
        # Check if rate limit is exceeded
        # This is a very simple implementation, in production you would use Redis or another cache
        # to track request counts over time
        
        # In development mode, we might bypass rate limiting
        if config.is_development and config.get('bypass_rate_limit', False):
            return f(*args, **kwargs)
        
        # Get the daily limit based on tier
        daily_limit = config.get(f'api.rate_limits.{tier}', 100)
        
        # TODO: Implement proper rate limiting
        # This is a placeholder implementation
        
        return f(*args, **kwargs)
    return decorated_function

# Error handler for common HTTP errors
@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(429)
def handle_error(error):
    return jsonify({"error": ERROR_CODES.get(error.code, "Unknown error")}), error.code

@app.errorhandler(Exception)
def handle_exception(e):
    logger.exception("Unhandled exception")
    return jsonify({"error": ERROR_CODES[500]}), 500

# API routes
@app.route('/v1/search', methods=['GET'])
@require_api_key
@rate_limit
def search_quotes():
    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    
    page = int(request.args.get('page', 1))
    limit = min(int(request.args.get('limit', 20)), 50)  # Max limit is 50
    
    results = db.search_quotes(query, page, limit)
    return jsonify(results)

@app.route('/v1/subtitle/<int:subtitle_id>', methods=['GET'])
@require_api_key
@rate_limit
def get_subtitle(subtitle_id):
    frames_before = min(int(request.args.get('frames_before', 3)), 10)
    frames_after = min(int(request.args.get('frames_after', 3)), 10)
    subtitles_before = min(int(request.args.get('subtitles_before', 2)), 5)
    subtitles_after = min(int(request.args.get('subtitles_after', 2)), 5)
    
    result = db.get_subtitle(
        subtitle_id, 
        frames_before, 
        frames_after, 
        subtitles_before, 
        subtitles_after
    )
    
    if not result:
        return jsonify({"error": f"Subtitle with ID {subtitle_id} not found"}), 404
    
    return jsonify(result)

@app.route('/v1/episode/<episode_id>', methods=['GET'])
@require_api_key
@rate_limit
def get_episode_subtitles(episode_id):
    # Validate episode_id format (e.g., S01E04)
    if not (len(episode_id) == 6 and episode_id[0] == 'S' and episode_id[3] == 'E'):
        return jsonify({"error": "Invalid episode ID format. Expected format: S01E04"}), 400
    
    page = int(request.args.get('page', 1))
    limit = min(int(request.args.get('limit', 50)), 100)  # Max limit is 100
    
    result = db.get_episode_subtitles(episode_id, page, limit)
    
    if not result:
        return jsonify({"error": f"Episode {episode_id} not found"}), 404
    
    return jsonify(result)

@app.route('/v1/create/meme', methods=['POST'])
@require_api_key
@rate_limit
def create_meme():
    data = request.json
    
    required_fields = ['subtitle_id', 'text']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Default values
    frame_id = data.get('frame_id')  # If not provided, use the subtitle's main frame
    font = data.get('font', 'impact')
    text_color = data.get('text_color', '#ffffff')
    outline_color = data.get('outline_color', '#000000')
    
    try:
        generator = MemeGenerator()
        meme_id = str(uuid.uuid4())[:8]  # Generate a unique ID
        meme_url = generator.create_meme(
            subtitle_id=data['subtitle_id'],
            frame_id=frame_id,
            text=data['text'],
            font=font,
            text_color=text_color,
            outline_color=outline_color,
            meme_id=meme_id
        )
        
        # Calculate expiry date (7 days from now)
        expires_at = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + "Z"
        
        return jsonify({
            "meme_id": meme_id,
            "url": meme_url,
            "expires_at": expires_at
        })
    except Exception as e:
        logger.exception("Error creating meme")
        return jsonify({"error": str(e)}), 500

@app.route('/v1/create/gif', methods=['POST'])
@require_api_key
@rate_limit
def create_gif():
    data = request.json
    
    required_fields = ['subtitle_id', 'start_frame', 'end_frame']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Default values
    caption = data.get('caption', True)
    speed = data.get('speed', 1.0)
    quality = data.get('quality', 'medium')
    
    try:
        generator = GifGenerator()
        gif_id = str(uuid.uuid4())[:8]  # Generate a unique ID
        gif_url = generator.create_gif(
            subtitle_id=data['subtitle_id'],
            start_frame=data['start_frame'],
            end_frame=data['end_frame'],
            caption=caption,
            speed=speed,
            quality=quality,
            gif_id=gif_id
        )
        
        # Calculate expiry date (7 days from now)
        expires_at = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + "Z"
        
        return jsonify({
            "gif_id": gif_id,
            "url": gif_url,
            "expires_at": expires_at
        })
    except Exception as e:
        logger.exception("Error creating GIF")
        return jsonify({"error": str(e)}), 500

@app.route('/v1/create/clip', methods=['POST'])
@require_api_key
@rate_limit
def create_clip():
    # Check if user is allowed to create clips
    if g.api_tier not in ['premium']:
        return jsonify({
            "error": "Creating video clips requires a premium subscription"
        }), 403
    
    data = request.json
    
    required_fields = ['subtitle_id', 'start_time', 'end_time']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Default values
    caption = data.get('caption', True)
    format = data.get('format', 'mp4')
    quality = data.get('quality', 'medium')
    
    try:
        generator = ClipGenerator()
        clip_id = str(uuid.uuid4())[:8]  # Generate a unique ID
        clip_url = generator.create_clip(
            subtitle_id=data['subtitle_id'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            caption=caption,
            format=format,
            quality=quality,
            clip_id=clip_id
        )
        
        # Calculate expiry date (7 days from now)
        expires_at = (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + "Z"
        
        return jsonify({
            "clip_id": clip_id,
            "url": clip_url,
            "expires_at": expires_at
        })
    except Exception as e:
        logger.exception("Error creating clip")
        return jsonify({"error": str(e)}), 500

# Static file serving routes
@app.route('/frames/<episode>/<frame_id>.jpg', methods=['GET'])
def serve_frame(episode, frame_id):
    """Serve a frame image"""
    try:
        # Parse episode ID to get season and episode
        season_num = int(episode[1:3])
        episode_num = int(episode[4:6])
        
        # Extract frame number from frame_id
        frame_num = int(frame_id)
        
        # Build path to frame
        frame_dir = config.static_dir / f"Season {season_num}" / episode / "frames"
        
        # Look for the frame file (may be named with zero padding)
        frame_path = frame_dir / f"frame_{frame_num:010d}.jpg"
        
        if not frame_path.exists():
            # Try alternative naming formats if the expected one doesn't exist
            for file in frame_dir.glob(f"*{frame_num}*.jpg"):
                frame_path = file
                break
            else:
                abort(404)
        
        return send_from_directory(frame_path.parent, frame_path.name)
    except Exception as e:
        logger.exception(f"Error serving frame: {e}")
        abort(404)

@app.route('/thumbnails/<episode>/<index>.jpg', methods=['GET'])
def serve_thumbnail(episode, index):
    """Serve a thumbnail image"""
    try:
        # Parse episode ID to get season and episode
        season_num = int(episode[1:3])
        episode_num = int(episode[4:6])
        
        # Extract thumbnail index
        thumb_idx = int(index)
        
        # Build path to thumbnail
        thumb_dir = config.static_dir / f"Season {season_num}" / episode / "thumbnails"
        
        # Look for the thumbnail file (may be named with zero padding)
        thumb_path = thumb_dir / f"thumb_{thumb_idx:010d}.jpg"
        
        if not thumb_path.exists():
            # Try alternative naming formats if the expected one doesn't exist
            for file in thumb_dir.glob(f"*{thumb_idx}*.jpg"):
                thumb_path = file
                break
            else:
                abort(404)
        
        return send_from_directory(thumb_path.parent, thumb_path.name)
    except Exception as e:
        logger.exception(f"Error serving thumbnail: {e}")
        abort(404)

@app.route('/memes/<meme_id>.jpg', methods=['GET'])
def serve_meme(meme_id):
    """Serve a generated meme image"""
    try:
        meme_path = config.get('media_output_dir', 'media_output') / "memes" / f"{meme_id}.jpg"
        if not os.path.exists(meme_path):
            abort(404)
        return send_from_directory(meme_path.parent, meme_path.name)
    except Exception as e:
        logger.exception(f"Error serving meme: {e}")
        abort(404)

@app.route('/gifs/<gif_id>.gif', methods=['GET'])
def serve_gif(gif_id):
    """Serve a generated GIF"""
    try:
        gif_path = config.get('media_output_dir', 'media_output') / "gifs" / f"{gif_id}.gif"
        if not os.path.exists(gif_path):
            abort(404)
        return send_from_directory(gif_path.parent, gif_path.name)
    except Exception as e:
        logger.exception(f"Error serving GIF: {e}")
        abort(404)

@app.route('/clips/<clip_id>.<format>', methods=['GET'])
def serve_clip(clip_id, format):
    """Serve a generated video clip"""
    try:
        # Check that the format is allowed
        allowed_formats = ['mp4', 'webm']
        if format not in allowed_formats:
            abort(400)
            
        clip_path = config.get('media_output_dir', 'media_output') / "clips" / f"{clip_id}.{format}"
        if not os.path.exists(clip_path):
            abort(404)
        return send_from_directory(clip_path.parent, clip_path.name)
    except Exception as e:
        logger.exception(f"Error serving clip: {e}")
        abort(404)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "version": config.get('api.version', 'v1'),
        "environment": config.get('environment'),
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    host = config.get('server.host', '127.0.0.1')
    port = config.get('server.port', 5000)
    debug = config.get('server.debug', True)
    
    logger.info(f"Starting Veepiac API on {host}:{port}")
    logger.info(f"Environment: {config.get('environment')}")
    logger.info(f"Static directory: {config.static_dir}")
    logger.info(f"Database path: {config.database_path}")
    
    app.run(host=host, port=port, debug=debug)
