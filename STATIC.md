database/
│
├── subtitles.db                      # SQLite database with subtitles and episodes tables
│
├── Season 1/
│   ├── S01E01/                       # Episode directory
│   │   ├── title.txt                 # Episode title extracted from source filename
│   │   ├── frames/                   # Directory containing extracted video frames
│   │   │   ├── frame_0000000001.png
│   │   │   ├── frame_0000000002.png
│   │   │   └── ...
│   │   └── subtitles.csv             # Processed subtitle data for this episode
│   │
│   ├── S01E02/
│   │   ├── title.txt
│   │   ├── frames/
│   │   │   └── ...
│   │   └── subtitles.csv
│   │
│   └── ...
│
├── Season 2/
│   ├── S02E01/
│   │   └── ...
│   └── ...
│
└── ...
