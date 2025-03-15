import os
import logging
import subprocess
from pathlib import Path
import tempfile
from PIL import Image, ImageDraw, ImageFont
import imageio
import uuid
import datetime
import shutil

from config import config

logger = logging.getLogger(__name__)

class MediaGenerator:
    """Base class for generating media from subtitles and frames"""
    
    def __init__(self):
        self.static_dir = config.static_dir
        self.cdn_base_url = config.get('cdn.base_url')
        self.output_dir = Path(config.get('media_output_dir', 'media_output'))
        
        # Create output directories if they don't exist
        for dir_name in ['memes', 'gifs', 'clips']:
            os.makedirs(self.output_dir / dir_name, exist_ok=True)
            
        # Font paths for text rendering
        self.font_dir = Path(config.get('font_dir', 'fonts'))
        self.default_font = self.font_dir / 'impact.ttf'
        
        # Check if the default font exists, if not use a system font
        if not self.default_font.exists():
            logger.warning(f"Default font not found at {self.default_font}, using system font")
            self.default_font = None
    
    def get_subtitle_info(self, subtitle_id):
        """Get subtitle information from database"""
        from database import db
        
        # Get basic subtitle info without all the surrounding frames and subtitles
        with db.get_cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    s.id as subtitle_id,
                    'S' || printf('%02d', s.season) || 'E' || printf('%02d', s.episode) as episode,
                    e.title as episode_title,
                    s.subtitle_number as index,
                    s.timestamp_start,
                    s.timestamp_end,
                    s.content as dialogue,
                    s.start_frame,
                    s.end_frame
                FROM subtitles s
                JOIN episodes e ON s.season = e.season AND s.episode = e.episode_of_season
                WHERE s.id = ?
                """,
                (subtitle_id,)
            )
            
            row = cursor.fetchone()
            if not row:
                return None
            
            return dict(row)
    
    def get_frame_path(self, episode, frame_id):
        """Get path to a frame image file"""
        season_num = int(episode[1:3])
        episode_num = int(episode[4:6])
        
        # Format: static/Season X/SXXEYY/frames/frame_NNNNNNNNNN.jpg
        frame_path = (self.static_dir / f"Season {season_num}" / 
                      episode / "frames" / f"frame_{frame_id:010d}.jpg")
        
        return frame_path
    
    def get_video_path(self, episode):
        """Get path to episode video file"""
        season_num = int(episode[1:3])
        episode_num = int(episode[4:6])
        
        # Format: static/Season X/SXXEYY/video.mkv
        video_path = (self.static_dir / f"Season {season_num}" / 
                      episode / "video.mkv")
        
        return video_path
    
    def format_url(self, file_type, file_id, extension):
        """Format URL for generated media files"""
        return f"{self.cdn_base_url}/{file_type}s/{file_id}.{extension}"


class MemeGenerator(MediaGenerator):
    """Generator for meme images with subtitles"""
    
    def create_meme(self, subtitle_id, text, meme_id=None, frame_id=None, 
                    font='impact', text_color='#ffffff', outline_color='#000000'):
        """
        Create a meme image from a subtitle frame with text overlay
        
        Args:
            subtitle_id: ID of the subtitle
            text: Text to overlay on the image
            meme_id: Optional ID for the meme (generated if not provided)
            frame_id: Optional specific frame ID (uses main frame from subtitle if not provided)
            font: Font to use for text
            text_color: Text color (hex)
            outline_color: Outline color (hex)
            
        Returns:
            URL of the generated meme
        """
        # Get subtitle info
        subtitle = self.get_subtitle_info(subtitle_id)
        if not subtitle:
            raise ValueError(f"Subtitle with ID {subtitle_id} not found")
        
        # If no frame_id provided, use the main frame from the subtitle
        if not frame_id:
            frame_id = subtitle.get('start_frame')
        
        # Get frame path
        frame_path = self.get_frame_path(subtitle['episode'], frame_id)
        if not frame_path.exists():
            raise ValueError(f"Frame not found: {frame_path}")
        
        # Generate meme ID if not provided
        if not meme_id:
            meme_id = str(uuid.uuid4())[:8]
        
        # Output path
        output_path = self.output_dir / "memes" / f"{meme_id}.jpg"
        
        try:
            # Open the image
            img = Image.open(frame_path)
            
            # Prepare text drawing
            draw = ImageDraw.Draw(img)
            
            # Get font
            try:
                # Try to load the requested font
                font_path = self.font_dir / f"{font.lower()}.ttf"
                if not font_path.exists():
                    font_path = self.default_font
                
                # Font size based on image dimensions
                font_size = int(img.width * 0.06)  # Scale font with image
                img_font = ImageFont.truetype(str(font_path), font_size) if font_path else ImageFont.load_default()
            except Exception:
                # Fallback to default font
                logger.warning(f"Failed to load font {font}, using default")
                img_font = ImageFont.load_default()
            
            # Draw text with outline
            text_position = (img.width // 2, img.height - font_size * 1.5)
            
            # Draw text outline
            outline_width = max(1, int(font_size * 0.05))
            for offset_x in range(-outline_width, outline_width + 1):
                for offset_y in range(-outline_width, outline_width + 1):
                    draw.text(
                        (text_position[0] + offset_x, text_position[1] + offset_y),
                        text,
                        font=img_font,
                        fill=outline_color,
                        anchor="ms"  # middle-bottom anchor
                    )
            
            # Draw main text
            draw.text(
                text_position,
                text,
                font=img_font,
                fill=text_color,
                anchor="ms"  # middle-bottom anchor
            )
            
            # Save the meme
            img.save(output_path, "JPEG", quality=95)
            
            # Return URL
            return self.format_url("meme", meme_id, "jpg")
            
        except Exception as e:
            logger.exception(f"Error creating meme: {e}")
            raise


class GifGenerator(MediaGenerator):
    """Generator for animated GIFs from frame sequences"""
    
    def create_gif(self, subtitle_id, start_frame, end_frame, gif_id=None, 
                   caption=True, speed=1.0, quality='medium'):
        """
        Create an animated GIF from a sequence of frames
        
        Args:
            subtitle_id: ID of the subtitle for context
            start_frame: Starting frame number
            end_frame: Ending frame number
            gif_id: Optional ID for the GIF
            caption: Whether to include subtitle text
            speed: Animation speed (1.0 = normal)
            quality: Image quality (low, medium, high)
            
        Returns:
            URL of the generated GIF
        """
        # Get subtitle info
        subtitle = self.get_subtitle_info(subtitle_id)
        if not subtitle:
            raise ValueError(f"Subtitle with ID {subtitle_id} not found")
        
        # Generate GIF ID if not provided
        if not gif_id:
            gif_id = str(uuid.uuid4())[:8]
        
        # Output path
        output_path = self.output_dir / "gifs" / f"{gif_id}.gif"
        
        # Quality settings
        quality_settings = {
            'low': {'size': 0.5, 'fps': 8},
            'medium': {'size': 0.75, 'fps': 12},
            'high': {'size': 1.0, 'fps': 20}
        }
        
        # Use specified quality or default to medium
        quality = quality.lower() if quality else 'medium'
        if quality not in quality_settings:
            quality = 'medium'
        
        settings = quality_settings[quality]
        
        try:
            # Get all frame paths between start and end
            frames = []
            for frame_num in range(start_frame, end_frame + 1):
                frame_path = self.get_frame_path(subtitle['episode'], frame_num)
                if frame_path.exists():
                    frames.append(frame_path)
            
            if not frames:
                raise ValueError(f"No frames found between {start_frame} and {end_frame}")
            
            # Read frames and resize if needed
            images = []
            for frame_path in frames:
                img = Image.open(frame_path)
                
                # Resize based on quality setting
                if settings['size'] < 1.0:
                    new_width = int(img.width * settings['size'])
                    new_height = int(img.height * settings['size'])
                    img = img.resize((new_width, new_height), Image.LANCZOS)
                
                # Add caption if requested
                if caption:
                    draw = ImageDraw.Draw(img)
                    
                    # Get font
                    try:
                        font_size = int(img.width * 0.05)  # Scale font with image
                        font_path = self.default_font
                        img_font = ImageFont.truetype(str(font_path), font_size) if font_path else ImageFont.load_default()
                    except Exception:
                        img_font = ImageFont.load_default()
                    
                    # Draw text with outline
                    text_position = (img.width // 2, img.height - font_size * 1.5)
                    text = subtitle['dialogue']
                    
                    # Draw outline
                    outline_width = max(1, int(font_size * 0.05))
                    for offset_x in range(-outline_width, outline_width + 1):
                        for offset_y in range(-outline_width, outline_width + 1):
                            draw.text(
                                (text_position[0] + offset_x, text_position[1] + offset_y),
                                text,
                                font=img_font,
                                fill="#000000",
                                anchor="ms"
                            )
                    
                    # Draw main text
                    draw.text(
                        text_position,
                        text,
                        font=img_font,
                        fill="#ffffff",
                        anchor="ms"
                    )
                
                # Convert to RGB if needed (GIF doesn't support RGBA)
                if img.mode == 'RGBA':
                    img = img.convert('RGB')
                
                images.append(img)
            
            # Calculate duration based on speed
            duration = 1.0 / (settings['fps'] * speed)
            
            # Create temporary file to avoid imageio issues
            with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Save GIF
            imageio.mimsave(temp_path, images, format='GIF', duration=duration, loop=0)
            
            # Move to final location
            shutil.move(temp_path, output_path)
            
            # Return URL
            return self.format_url("gif", gif_id, "gif")
            
        except Exception as e:
            logger.exception(f"Error creating GIF: {e}")
            raise


class ClipGenerator(MediaGenerator):
    """Generator for video clips"""
    
    def create_clip(self, subtitle_id, start_time, end_time, clip_id=None, 
                    caption=True, format='mp4', quality='medium'):
        """
        Create a video clip with audio
        
        Args:
            subtitle_id: ID of the subtitle for context
            start_time: Starting timestamp in format "HH:MM:SS,mmm"
            end_time: Ending timestamp in format "HH:MM:SS,mmm"
            clip_id: Optional ID for the clip
            caption: Whether to include subtitles
            format: Output format (mp4, webm, etc.)
            quality: Video quality (low, medium, high)
            
        Returns:
            URL of the generated clip
        """
        # Get subtitle info
        subtitle = self.get_subtitle_info(subtitle_id)
        if not subtitle:
            raise ValueError(f"Subtitle with ID {subtitle_id} not found")
        
        # Generate clip ID if not provided
        if not clip_id:
            clip_id = str(uuid.uuid4())[:8]
        
        # Output path
        output_path = self.output_dir / "clips" / f"{clip_id}.{format}"
        
        # Convert timestamp format from HH:MM:SS,mmm to HH:MM:SS.mmm for ffmpeg
        start_time = start_time.replace(',', '.')
        end_time = end_time.replace(',', '.')
        
        # Quality settings
        quality_settings = {
            'low': {'scale': '480:-1', 'crf': '28', 'preset': 'veryfast'},
            'medium': {'scale': '720:-1', 'crf': '23', 'preset': 'medium'},
            'high': {'scale': '1080:-1', 'crf': '18', 'preset': 'slow'}
        }
        
        # Use specified quality or default to medium
        quality = quality.lower() if quality else 'medium'
        if quality not in quality_settings:
            quality = 'medium'
        
        settings = quality_settings[quality]
        
        try:
            # Get video path
            video_path = self.get_video_path(subtitle['episode'])
            if not video_path.exists():
                raise ValueError(f"Video file not found: {video_path}")
            
            # Prepare FFmpeg command
            ffmpeg_cmd = [
                'ffmpeg',
                '-y',  # Overwrite output file if it exists
                '-ss', start_time,  # Start time
                '-to', end_time,  # End time
                '-i', str(video_path),  # Input file
                '-vf', f"scale={settings['scale']}",  # Scale video
                '-c:v', 'libx264',  # Video codec
                '-crf', settings['crf'],  # Quality
                '-preset', settings['preset'],  # Encoding speed/compression trade-off
                '-c:a', 'aac',  # Audio codec
                '-b:a', '128k',  # Audio bitrate
            ]
            
            # Add subtitles if requested
            if caption:
                # We might need to generate a temporary subtitle file
                # For simplicity, we'll just assume the subtitles are in the video
                ffmpeg_cmd.extend(['-c:s', 'copy'])
            
            # Add output file
            ffmpeg_cmd.append(str(output_path))
            
            # Run FFmpeg
            logger.info(f"Running FFmpeg: {' '.join(ffmpeg_cmd)}")
            subprocess.run(ffmpeg_cmd, check=True, capture_output=True)
            
            # Return URL
            return self.format_url("clip", clip_id, format)
            
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            raise ValueError(f"Error creating clip: FFmpeg error")
        except Exception as e:
            logger.exception(f"Error creating clip: {e}")
            raise
