# Subtitle Database Schema

This document describes the database schema for the subtitle processing and episode information system. The database consists of two main tables: `subtitles` and `episodes`.

## Database Location

The SQLite database is located at:
```
{destination_directory}/subtitles.db
```

## Table: subtitles

This table stores all subtitle information extracted from the source video files.

### Schema

| Column Name     | Data Type | Description                                       |
|-----------------|-----------|---------------------------------------------------|
| id              | INTEGER   | Primary key, auto-increment                       |
| episode         | INTEGER   | Episode number within season                      |
| season          | INTEGER   | Season number                                     |
| file_path       | TEXT      | Path to the original subtitle CSV file            |
| subtitle_number | INTEGER   | Sequence number of subtitle within episode        |
| timestamp       | TEXT      | Full timestamp string (start --> end)             |
| timestamp_start | TEXT      | Start timestamp                                   |
| timestamp_end   | TEXT      | End timestamp                                     |
| content         | TEXT      | Subtitle text content                             |
| start_frame     | INTEGER   | Starting frame number                             |
| end_frame       | INTEGER   | Ending frame number                               |

### Indexes

- `idx_subtitles_episode`: Index on `episode` column
- `idx_subtitles_season`: Index on `season` column
- `idx_subtitles_content`: Index on `content` column
- `idx_subtitles_frames`: Index on `start_frame` and `end_frame` columns

## Table: episodes

This table stores information about each episode, including titles extracted from the source files.

### Schema

| Column Name      | Data Type | Description                                    |
|------------------|-----------|------------------------------------------------|
| id               | INTEGER   | Primary key, auto-increment                    |
| season           | INTEGER   | Season number                                  |
| episode_of_season| INTEGER   | Episode number within its season               |
| episode_overall  | INTEGER   | Episode number across the entire series        |
| title            | TEXT      | Episode title                                  |

### Indexes

- `idx_episodes_season`: Index on `season` column
- `idx_episodes_title`: Index on `title` column

### Constraints

- `UNIQUE(season, episode_of_season)`: Ensures no duplicate episode entries within a season

## Example Queries

### View all episodes in order
```sql
SELECT * FROM episodes ORDER BY season, episode_of_season;
```

### Get episode information by title
```sql
SELECT * FROM episodes WHERE title LIKE '%keyword%';
```

### Find all subtitles from a specific episode
```sql
SELECT s.* FROM subtitles s
JOIN episodes e ON s.season = e.season AND s.episode = e.episode_of_season
WHERE e.title = 'Oslo';
```

### Find episodes containing specific dialogue
```sql
SELECT e.title, s.content FROM episodes e 
JOIN subtitles s ON e.season = s.season AND e.episode_of_season = s.episode
WHERE s.content LIKE '%search term%';
```

### Get a specific frame's subtitle
```sql
SELECT s.content, e.title FROM subtitles s
JOIN episodes e ON s.season = e.season AND s.episode = e.episode_of_season
WHERE s.start_frame <= 1000 AND s.end_frame >= 1000;
```
