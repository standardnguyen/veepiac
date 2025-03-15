# Veepiac API

A RESTful API for searching and creating media from Veep TV show dialogue, inspired by Frinkiac.

## Installation

1. Clone the repository
    ```
    git clone https://github.com/yourusername/veepiac.git
    cd veepiac
    ```

2. Create a virtual environment
    ```
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. Install dependencies
    ```
    pip install -r requirements.txt
    ```

4. Create configuration file
    ```
    cp config.example.json config.json
    ```

5. Edit `config.json` to match your environment
    - In development mode, you can set `dev_static_drive` to point to a different drive where your static files are located
    - Update paths in the config to match your environment

## Directory Structure

The expected directory structure for static content follows this pattern:

```
static/
│
├── subtitles.db                      # SQLite database with subtitles and episodes tables
│
├── Season 1/
│   ├── S01E01/                       # Episode directory
│   │   ├── title.txt                 # Episode title
│   │   ├── video.mkv                 # Episode video file
│   │   ├── frames/                   # Extracted video frames
│   │   │   ├── frame_0000000001.jpg
│   │   │   └── ...
│   │   ├── thumbnails/               # Thumbnail images
│   │   │   ├── thumb_0000000001.jpg
│   │   │   └── ...
│   │   └── subtitles.csv             # Processed subtitle data
...
```

## Running the Server

Start the development server:
```
python app.py
```

For production, use Gunicorn:
```
gunicorn app:app
```

## API Endpoints

### Search Quotes
```
GET /v1/search?query=search_term&page=1&limit=20
```

### Get Subtitle Details
```
GET /v1/subtitle/12345?frames_before=3&frames_after=3&subtitles_before=2&subtitles_after=2
```

### Get Episode Subtitles
```
GET /v1/episode/S01E04?page=1&limit=50
```

### Create Meme
```
POST /v1/create/meme
Content-Type: application/json

{
  "subtitle_id": 12345,
  "frame_id": 12346,
  "text": "what the vice president does",
  "font": "impact",
  "text_color": "#ffffff",
  "outline_color": "#000000"
}
```

### Create GIF
```
POST /v1/create/gif
Content-Type: application/json

{
  "subtitle_id": 12345,
  "start_frame": 12342,
  "end_frame": 12348,
  "caption": true,
  "speed": 1.0,
  "quality": "medium"
}
```

### Create Clip
```
POST /v1/create/clip
Content-Type: application/json

{
  "subtitle_id": 12345,
  "start_time": "00:12:32,000",
  "end_time": "00:12:39,500",
  "caption": true,
  "format": "mp4",
  "quality": "medium"
}
```

## API Key Authentication

In production, access to the API requires an API key passed via the `X-API-Key` header. For development, you can set `bypass_api_key` to `true` in your config.json.

## Rate Limits

- Free tier: 100 requests per day
- Standard tier: 1,000 requests per day
- Premium tier: 5,000 requests per day

## Development vs Production

The configuration system handles differences between development and production environments:

- In development:
  - Static files can be on a different drive (set with `dev_static_drive`)
  - API key validation can be bypassed
  - Rate limiting can be bypassed

- In production:
  - Full API key validation is enabled
  - Rate limiting is enforced
  - Debug mode is disabled
