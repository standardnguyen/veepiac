import sqlite3
from contextlib import contextmanager
from config import config

class Database:
    """Database connection manager for Veepiac API"""
    
    def __init__(self, db_path=None):
        """Initialize database with path from config or override"""
        self.db_path = db_path or config.database_path
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        # Enable row factory for dict-like access
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    @contextmanager
    def get_cursor(self):
        """Context manager for database cursors"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                yield cursor
                conn.commit()
            except Exception:
                conn.rollback()
                raise
    
    def search_quotes(self, query, page=1, limit=20):
        """Search subtitle database for matching keywords"""
        offset = (page - 1) * limit
        
        with self.get_cursor() as cursor:
            # Get total count
            cursor.execute(
                "SELECT COUNT(*) as count FROM subtitles WHERE content LIKE ?",
                (f"%{query}%",)
            )
            total_results = cursor.fetchone()["count"]
            
            # Get results
            cursor.execute(
                """
                SELECT 
                    s.id as subtitle_id,
                    'S' || printf('%02d', s.season) || 'E' || printf('%02d', s.episode) as episode,
                    e.title as episode_title,
                    s.subtitle_number as index,
                    s.timestamp_start as timestamp_start,
                    s.timestamp_end as timestamp_end,
                    s.content as dialogue,
                    s.start_frame,
                    s.end_frame
                FROM subtitles s
                JOIN episodes e ON s.season = e.season AND s.episode = e.episode_of_season
                WHERE s.content LIKE ?
                ORDER BY s.season, s.episode, s.subtitle_number
                LIMIT ? OFFSET ?
                """,
                (f"%{query}%", limit, offset)
            )
            
            results = []
            for row in cursor.fetchall():
                # Convert row to dict and format data
                result = dict(row)
                
                # Format frame indices (just using a sample for now)
                frame_indices = [0, 1, 2]  # Would be calculated in real implementation
                
                # Format timestamps
                timestamp = {
                    "start": result.pop("timestamp_start"),
                    "end": result.pop("timestamp_end")
                }
                
                # Create thumbnail URL
                thumbnail_url = f"{config.get('cdn.base_url')}/thumbnails/{result['episode']}/{result['index']}.jpg"
                
                # Add formatted fields to result
                result["timestamp"] = timestamp
                result["frame_indices"] = frame_indices
                result["thumbnail_url"] = thumbnail_url
                
                results.append(result)
            
            # Calculate pagination info
            total_pages = (total_results + limit - 1) // limit
            
            return {
                "results": results,
                "pagination": {
                    "total_results": total_results,
                    "page": page,
                    "total_pages": total_pages,
                    "limit": limit
                }
            }

    def get_subtitle(self, subtitle_id, frames_before=3, frames_after=3, subtitles_before=2, subtitles_after=2):
        """Get detailed information about a specific subtitle"""
        with self.get_cursor() as cursor:
            # Get primary subtitle
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
            
            subtitle = dict(row)
            season = int(subtitle["episode"][1:3])
            episode = int(subtitle["episode"][4:6])
            index = subtitle["index"]
            
            # Format timestamp
            subtitle["timestamp"] = {
                "start": subtitle.pop("timestamp_start"),
                "end": subtitle.pop("timestamp_end")
            }
            
            # Calculate frame indices (placeholder)
            subtitle["frame_indices"] = [1, 8, 0]
            
            # Get frames before
            cursor.execute(
                """
                SELECT 
                    id as frame_id,
                    timestamp_start as timestamp
                FROM subtitles
                WHERE season = ? AND episode = ? AND subtitle_number < ?
                ORDER BY subtitle_number DESC
                LIMIT ?
                """,
                (season, episode, index, frames_before)
            )
            frames_before_data = [dict(row) for row in cursor.fetchall()]
            frames_before_data.reverse()  # Put in chronological order
            
            # Get frames after
            cursor.execute(
                """
                SELECT 
                    id as frame_id,
                    timestamp_start as timestamp
                FROM subtitles
                WHERE season = ? AND episode = ? AND subtitle_number > ?
                ORDER BY subtitle_number ASC
                LIMIT ?
                """,
                (season, episode, index, frames_after)
            )
            frames_after_data = [dict(row) for row in cursor.fetchall()]
            
            # Add URLs to frames
            cdn_base = config.get('cdn.base_url')
            for frame in frames_before_data + frames_after_data:
                frame["url"] = f"{cdn_base}/frames/{subtitle['episode']}/{frame['frame_id']}.jpg"
            
            current_frame = {
                "frame_id": subtitle_id,
                "timestamp": subtitle["timestamp"]["start"],
                "url": f"{cdn_base}/frames/{subtitle['episode']}/{subtitle_id}.jpg"
            }
            
            # Get surrounding subtitles
            # Before
            cursor.execute(
                """
                SELECT 
                    id as subtitle_id,
                    content as dialogue,
                    timestamp_start,
                    timestamp_end
                FROM subtitles 
                WHERE season = ? AND episode = ? AND subtitle_number < ?
                ORDER BY subtitle_number DESC
                LIMIT ?
                """,
                (season, episode, index, subtitles_before)
            )
            subtitles_before_data = [dict(row) for row in cursor.fetchall()]
            subtitles_before_data.reverse()  # Put in chronological order
            
            # After
            cursor.execute(
                """
                SELECT 
                    id as subtitle_id,
                    content as dialogue,
                    timestamp_start,
                    timestamp_end
                FROM subtitles 
                WHERE season = ? AND episode = ? AND subtitle_number > ?
                ORDER BY subtitle_number ASC
                LIMIT ?
                """,
                (season, episode, index, subtitles_after)
            )
            subtitles_after_data = [dict(row) for row in cursor.fetchall()]
            
            # Format timestamps for surrounding subtitles
            for sub in subtitles_before_data + subtitles_after_data:
                sub["timestamp"] = {
                    "start": sub.pop("timestamp_start"),
                    "end": sub.pop("timestamp_end")
                }
            
            return {
                "subtitle": subtitle,
                "frames": {
                    "before": frames_before_data,
                    "current": current_frame,
                    "after": frames_after_data
                },
                "surrounding_subtitles": {
                    "before": subtitles_before_data,
                    "after": subtitles_after_data
                },
                "episode_link": f"/episode/{subtitle['episode']}?subtitle={subtitle_id}"
            }
    
    def get_episode_subtitles(self, episode_id, page=1, limit=50):
        """Get all subtitles for a specific episode with pagination"""
        offset = (page - 1) * limit
        
        # Parse episode ID (format: S01E04)
        season = int(episode_id[1:3])
        episode = int(episode_id[4:6])
        
        with self.get_cursor() as cursor:
            # Get episode information
            cursor.execute(
                """
                SELECT 
                    'S' || printf('%02d', season) || 'E' || printf('%02d', episode_of_season) as id,
                    title,
                    season,
                    episode_of_season as episode,
                    episode_overall,
                    CASE 
                        WHEN air_date IS NULL THEN NULL
                        ELSE air_date
                    END as air_date
                FROM episodes
                WHERE season = ? AND episode_of_season = ?
                """,
                (season, episode)
            )
            
            episode_row = cursor.fetchone()
            if not episode_row:
                return None
                
            episode_info = dict(episode_row)
            
            # Get total count of subtitles
            cursor.execute(
                "SELECT COUNT(*) as count FROM subtitles WHERE season = ? AND episode = ?",
                (season, episode)
            )
            total_subtitles = cursor.fetchone()["count"]
            
            # Get subtitles
            cursor.execute(
                """
                SELECT 
                    id as subtitle_id,
                    subtitle_number as index,
                    timestamp_start,
                    timestamp_end,
                    content as dialogue,
                    start_frame,
                    end_frame
                FROM subtitles
                WHERE season = ? AND episode = ?
                ORDER BY subtitle_number
                LIMIT ? OFFSET ?
                """,
                (season, episode, limit, offset)
            )
            
            subtitles = []
            for row in cursor.fetchall():
                subtitle = dict(row)
                
                # Format timestamps
                subtitle["timestamp"] = {
                    "start": subtitle.pop("timestamp_start"),
                    "end": subtitle.pop("timestamp_end")
                }
                
                # Add frame indices and thumbnail URL
                subtitle["frame_indices"] = [1, 4, 2]  # Placeholder
                subtitle["thumbnail_url"] = f"{config.get('cdn.base_url')}/thumbnails/{episode_id}/{subtitle['index']}.jpg"
                
                subtitles.append(subtitle)
            
            # Calculate pagination info
            total_pages = (total_subtitles + limit - 1) // limit
            
            return {
                "episode": episode_info,
                "subtitles": subtitles,
                "pagination": {
                    "total_subtitles": total_subtitles,
                    "page": page,
                    "total_pages": total_pages,
                    "limit": limit
                }
            }

# Create a singleton database instance
db = Database()
