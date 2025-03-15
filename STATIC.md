## Overview
The static directory contains a hierarchical organization of TV show data, with seasons, episodes, and related files structured in a consistent way. This structure is created and populated throughout various processing steps.

## Directory Structure
```
static/
│
├── subtitles.db                      # SQLite database with subtitles and episodes tables
│
├── Season 1/
│   ├── S01E01/                       # Episode directory
│   │   ├── title.txt                 # Episode title extracted from source filename
│   │   ├── video.mkv                 # Actual episode video file
│   │   ├── frames/                   # Directory containing extracted video frames
│   │   │   ├── frame_0000000001.jpg
│   │   │   ├── frame_0000000002.jpg
│   │   │   └── ...
│   │   ├── thumbnails/               # Directory containing thumbnail images
│   │   │   ├── thumb_0000000001.jpg
│   │   │   ├── thumb_0000000002.jpg
│   │   │   └── ...
│   │   └── subtitles.csv             # Processed subtitle data for this episode
│   │
│   ├── S01E02/
│   │   ├── title.txt
│   │   ├── video.mkv
│   │   ├── frames/
│   │   │   └── ...
│   │   ├── thumbnails/
│   │   │   └── ...
│   │   └── subtitles.csv
│   │
│   └── ...
│
├── Season 2/
│   ├── S02E01/
│   │   ├── title.txt
│   │   ├── video.mkv
│   │   ├── frames/
│   │   │   └── ...
│   │   ├── thumbnails/
│   │   │   └── ...
│   │   └── subtitles.csv
│   └── ...
│
└── ...
```

## File Descriptions
### Database File
- **subtitles.db**: SQLite database containing all subtitles and episode information

### Season Directories
Each season is organized in its own directory named `Season X` where X is the season number.

### Episode Directories
Each episode has its own directory named in the format `SxxEyy` where:
- `xx` is the two-digit season number (e.g., 01, 02)
- `yy` is the two-digit episode number within that season (e.g., 01, 02)

### Episode Files
Within each episode directory, you'll find:
- **title.txt**: Contains the episode title extracted from the source filename
  - Simple text file with just the title (e.g., "Fundraiser", "Oslo")
- **video.mkv**: The actual episode video file in Matroska format
- **frames/** directory: Contains all extracted video frames in JPG format
  - Frame filenames are in the format `frame_XXXXXXXXXX.jpg` with 10-digit zero padding
- **thumbnails/** directory: Contains thumbnail images for the episode
  - Thumbnail filenames are in the format `thumb_XXXXXXXXXX.jpg` with 10-digit zero padding
- **subtitles.csv**: CSV file containing processed subtitle data
  - Contains columns for subtitle number, timestamp, content, and frame numbers
