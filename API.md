# Veepiac API Documentation

## Overview

The Veepiac API provides access to a searchable database of Veep TV show dialogue with synchronized video frames, allowing users to search for quotes, create memes, GIFs, and clips from the show.

## Authentication

Authentication details will be provided when you register for an API key. Some endpoints may have usage limitations or paywalled features to manage server costs.

## Base URL

```
https://api.veepiac.com/v1
```

## Endpoints

### Search Quotes

Searches the subtitle database for matching keywords.

```
GET /search
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Keywords to search for in dialogue |
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Results per page (default: 20, max: 50) |

#### Response

```json
{
  "results": [
    {
      "subtitle_id": 12345,
      "episode": "S01E04",
      "episode_title": "Chung",
      "index": 42,
      "timestamp": {
        "start": "00:12:34,500",
        "end": "00:12:37,800"
      },
      "dialogue": "I've got a secret. The vice presidency is not a real job.",
      "frame_indices": [1, 8, 0],
      "thumbnail_url": "https://cdn.veepiac.com/thumbnails/S01E04/42.jpg"
    },
    // Additional results...
  ],
  "pagination": {
    "total_results": 126,
    "page": 1,
    "total_pages": 7,
    "limit": 20
  }
}
```

### Get Subtitle Details

Returns detailed information about a specific subtitle, including surrounding frames and subtitles.

```
GET /subtitle/{subtitle_id}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subtitle_id | integer | Yes | ID of the subtitle |
| frames_before | integer | No | Number of frames to return before the subtitle (default: 3) |
| frames_after | integer | No | Number of frames to return after the subtitle (default: 3) |
| subtitles_before | integer | No | Number of subtitles to return before (default: 2) |
| subtitles_after | integer | No | Number of subtitles to return after (default: 2) |

#### Response

```json
{
  "subtitle": {
    "subtitle_id": 12345,
    "episode": "S01E04",
    "episode_title": "Chung",
    "index": 42,
    "timestamp": {
      "start": "00:12:34,500",
      "end": "00:12:37,800"
    },
    "dialogue": "I've got a secret. The vice presidency is not a real job.",
    "frame_indices": [1, 8, 0]
  },
  "frames": {
    "before": [
      {
        "frame_id": 12342,
        "timestamp": "00:12:33,200",
        "url": "https://cdn.veepiac.com/frames/S01E04/12342.jpg"
      },
      // Additional frames...
    ],
    "current": {
      "frame_id": 12345,
      "timestamp": "00:12:34,500",
      "url": "https://cdn.veepiac.com/frames/S01E04/12345.jpg"
    },
    "after": [
      {
        "frame_id": 12346,
        "timestamp": "00:12:35,100",
        "url": "https://cdn.veepiac.com/frames/S01E04/12346.jpg"
      },
      // Additional frames...
    ]
  },
  "surrounding_subtitles": {
    "before": [
      {
        "subtitle_id": 12343,
        "dialogue": "Do you know what the vice president does?",
        "timestamp": {
          "start": "00:12:31,200",
          "end": "00:12:33,400"
        }
      },
      // Additional subtitles...
    ],
    "after": [
      {
        "subtitle_id": 12346,
        "dialogue": "I mean, it's not like it's a real job, right?",
        "timestamp": {
          "start": "00:12:38,100",
          "end": "00:12:40,300"
        }
      },
      // Additional subtitles...
    ]
  },
  "episode_link": "/episode/S01E04?subtitle=12345"
}
```

### Get Episode Subtitles

Returns all subtitles for a specific episode with pagination.

```
GET /episode/{episode_id}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| episode_id | string | Yes | Episode identifier (e.g., "S01E04") |
| page | integer | No | Page number for pagination (default: 1) |
| limit | integer | No | Results per page (default: 50, max: 100) |

#### Response

```json
{
  "episode": {
    "id": "S01E04",
    "title": "Chung",
    "season": 1,
    "episode": 4,
    "air_date": "2012-05-13"
  },
  "subtitles": [
    {
      "subtitle_id": 12340,
      "index": 37,
      "timestamp": {
        "start": "00:11:45,200",
        "end": "00:11:48,400"
      },
      "dialogue": "Ma'am, I don't think you should go in there right now.",
      "frame_indices": [1, 4, 2],
      "thumbnail_url": "https://cdn.veepiac.com/thumbnails/S01E04/37.jpg"
    },
    // Additional subtitles...
  ],
  "pagination": {
    "total_subtitles": 342,
    "page": 1,
    "total_pages": 7,
    "limit": 50
  }
}
```

### Create Meme

Create a meme image from a specific frame with custom text.

```
POST /create/meme
```

#### Request Body

```json
{
  "subtitle_id": 12345,
  "frame_id": 12346,
  "text": "what the vice president does",
  "font": "impact",
  "text_color": "#ffffff",
  "outline_color": "#000000"
}
```

#### Response

```json
{
  "meme_id": "a7c8b9d0",
  "url": "https://cdn.veepiac.com/memes/a7c8b9d0.jpg",
  "expires_at": "2025-03-22T15:31:42Z"
}
```

### Create GIF

Create an animated GIF from a sequence of frames.

```
POST /create/gif
```

#### Request Body

```json
{
  "subtitle_id": 12345,
  "start_frame": 12342,
  "end_frame": 12348,
  "caption": true,
  "speed": 1.0,
  "quality": "medium"
}
```

#### Response

```json
{
  "gif_id": "e5f6g7h8",
  "url": "https://cdn.veepiac.com/gifs/e5f6g7h8.gif",
  "expires_at": "2025-03-22T15:31:42Z"
}
```

### Create Clip

Create a video clip with audio.

```
POST /create/clip
```

*Note: This feature may be paywalled depending on server costs.*

#### Request Body

```json
{
  "subtitle_id": 12345,
  "start_time": "00:12:32,000",
  "end_time": "00:12:39,500",
  "caption": true,
  "format": "mp4",
  "quality": "medium"
}
```

#### Response

```json
{
  "clip_id": "i9j0k1l2",
  "url": "https://cdn.veepiac.com/clips/i9j0k1l2.mp4",
  "expires_at": "2025-03-22T15:31:42Z"
}
```

## Rate Limits

- Free tier: 100 requests per day
- Standard tier: 1,000 requests per day
- Premium tier: 5,000 requests per day

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Check request parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Premium feature or rate limit exceeded |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Please contact support |

## Additional Notes

- All image and video URLs are temporary and will expire after 7 days
- The database includes stage directions for better search results
- Search results are ranked by relevance to the query
