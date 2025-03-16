# Veepiac

A searchable database of Veep TV show dialogue with synchronized video frames, allowing you to search for quotes, create memes, GIFs, and clips from the show.

![Veepiac](https://via.placeholder.com/800x400?text=Veepiac+Screenshot)

## About

Veepiac is inspired by [Frinkiac](https://frinkiac.com/) (for The Simpsons) and similar tools that allow fans to search for their favorite quotes and turn them into shareable content. This project is not affiliated with HBO or the creators of Veep.

## Features

- **Search Engine**: Find quotes from Veep by searching for dialogue
- **Frame Viewer**: See the exact scene from any line of dialogue
- **Meme Generator**: Add custom text to create shareable memes
- **GIF Creator**: Generate animated GIFs from scene sequences
- **Video Clip Maker**: Create short video clips with audio (premium feature)
- **Episode Browser**: Browse all quotes from a specific episode

## Project Structure

The project consists of two main components:

- **Backend API** (Python/Flask): Handles searches, manages the database, and generates media
- **Frontend UI** (React/TypeScript): Provides a user-friendly interface

```
├── backend/             # Flask API server
│   ├── app.py           # Main application entry point
│   ├── config.py        # Configuration handling
│   ├── database.py      # Database connection & queries
│   ├── media_generator.py # Meme/GIF/clip generation
│   └── ...
├── frontend/            # React application
│   ├── public/          # Static assets
│   ├── src/             # Source code
│   │   ├── api/         # API client
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── ...
│   └── ...
└── ...
```

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- FFmpeg (for media generation)
- SQLite database with Veep subtitles
- Video frames extracted from episodes

### Backend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/veepiac.git
   cd veepiac
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Create configuration file
   ```bash
   cp config.example.json config.json
   ```

5. Edit `config.json` to match your environment
   - Set proper paths for static files and database
   - Configure server settings

### Frontend Setup

1. Install Node.js dependencies
   ```bash
   cd frontend
   npm install
   ```

2. Create production build
   ```bash
   npm run build
   ```

## Running the Application

### Development Mode

1. Start the backend server
   ```bash
   cd backend
   python app.py
   ```

2. In a separate terminal, start the frontend development server
   ```bash
   cd frontend
   npm start
   ```

3. Access the application at http://localhost:3000

### Production Mode

1. Build the frontend
   ```bash
   cd frontend
   npm run build
   ```

2. Configure a production web server (Nginx, Apache) to serve the static files from the build directory

3. Run the backend API with Gunicorn
   ```bash
   cd backend
   gunicorn --bind 0.0.0.0:5000 wsgi:app
   ```

## API Documentation

For detailed API documentation, see [API.md](./API.md)

## Static Directory Structure

The application expects a specific directory structure for frame images and subtitle data. For details, see [STATIC.md](./STATIC.md)

## Database Schema

For information about the subtitle database schema, see [SCHEMA.md](./SCHEMA.md)

## Configuration Options

Edit `config.json` to modify the following settings:

- `environment`: "development" or "production"
- `static_dir`: Path to the directory containing episode frames and subtitles
- `database_path`: Path to the SQLite database file
- `server`: Configuration for the Flask server
  - `host`: Server hostname/IP (default: "127.0.0.1")
  - `port`: Server port (default: 5000)
  - `debug`: Enable debug mode (default: true in development)
- `api`: API-specific settings
  - `rate_limits`: Request limits for different subscription tiers

## Authentication

The API uses API keys for authentication. In development mode, you can bypass authentication by setting `bypass_api_key: true` in your configuration.

For testing:
- Use `test-standard` as the API key for standard tier
- Use `test-premium` as the API key for premium tier

## License

[Standard’s Petty Software License v0.1](https://github.com/standardnguyen/licenses/blob/main/petty/v1.0/LICENSE.md)
