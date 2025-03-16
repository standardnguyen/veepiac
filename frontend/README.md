# Veepiac Frontend

This is the frontend for the Veepiac application, which allows users to search for quotes from the Veep TV show and create memes, GIFs, and clips.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Project Structure

```
src/
├── api/              # API client and type definitions
├── components/       # Reusable components
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── store/            # State management with Zustand
├── App.tsx           # Main App component with routing
└── index.tsx         # Entry point
```

## Features

- Search for quotes from Veep
- View detailed information about quotes, including surrounding dialogue
- Create memes with customizable text
- Create animated GIFs
- Create video clips with audio
- Responsive design

## Dependencies

- React
- React Router
- Tailwind CSS
- Axios
- Zustand (for state management)
- Headless UI (for accessible UI components)
- Heroicons (for icons)

## API Integration

The frontend communicates with the Veepiac API to fetch quotes, create media, and more. The API client is implemented in `src/api/client.ts`.

By default, the development server proxies API requests to `http://localhost:5000`.
