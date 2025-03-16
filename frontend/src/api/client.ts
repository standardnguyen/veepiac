import axios from 'axios';

// Base API client
const apiClient = axios.create({
  baseURL: '/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add API key if available
const apiKey = localStorage.getItem('veepiac-api-key');
if (apiKey) {
  apiClient.defaults.headers.common['X-API-Key'] = apiKey;
}

// Define interfaces for API responses
export interface Timestamp {
  start: string;
  end: string;
}

export interface Subtitle {
  subtitle_id: number;
  episode: string;
  episode_title: string;
  index: number;
  timestamp: Timestamp;
  dialogue: string;
  frame_indices: number[];
  thumbnail_url: string;
}

export interface Pagination {
  total_results: number;
  page: number;
  total_pages: number;
  limit: number;
}

export interface SearchResponse {
  results: Subtitle[];
  pagination: Pagination;
}

export interface Frame {
  frame_id: number;
  timestamp: string;
  url: string;
}

export interface SubtitleDetails {
  subtitle: Subtitle;
  frames: {
    before: Frame[];
    current: Frame;
    after: Frame[];
  };
  surrounding_subtitles: {
    before: {
      subtitle_id: number;
      dialogue: string;
      timestamp: Timestamp;
    }[];
    after: {
      subtitle_id: number;
      dialogue: string;
      timestamp: Timestamp;
    }[];
  };
  episode_link: string;
}

export interface Episode {
  id: string;
  title: string;
  season: number;
  episode: number;
  air_date?: string;
}

export interface EpisodeResponse {
  episode: Episode;
  subtitles: Subtitle[];
  pagination: {
    total_subtitles: number;
    page: number;
    total_pages: number;
    limit: number;
  };
}

export interface MemeResponse {
  meme_id: string;
  url: string;
  expires_at: string;
}

export interface GifResponse {
  gif_id: string;
  url: string;
  expires_at: string;
}

export interface ClipResponse {
  clip_id: string;
  url: string;
  expires_at: string;
}

// API functions
export const api = {
  // Search quotes
  searchQuotes: async (query: string, page = 1, limit = 20): Promise<SearchResponse> => {
    const response = await apiClient.get('/search', {
      params: { query, page, limit }
    });
    return response.data;
  },

  // Get subtitle details
  getSubtitle: async (
    subtitleId: number, 
    framesBefore = 3, 
    framesAfter = 3,
    subtitlesBefore = 2,
    subtitlesAfter = 2
  ): Promise<SubtitleDetails> => {
    const response = await apiClient.get(`/subtitle/${subtitleId}`, {
      params: { 
        frames_before: framesBefore,
        frames_after: framesAfter,
        subtitles_before: subtitlesBefore,
        subtitles_after: subtitlesAfter
      }
    });
    return response.data;
  },

  // Get episode subtitles
  getEpisodeSubtitles: async (
    episodeId: string,
    page = 1,
    limit = 50
  ): Promise<EpisodeResponse> => {
    const response = await apiClient.get(`/episode/${episodeId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Create a meme
  createMeme: async (
    subtitleId: number,
    text: string,
    frameId?: number,
    font = 'impact',
    textColor = '#ffffff',
    outlineColor = '#000000'
  ): Promise<MemeResponse> => {
    const response = await apiClient.post('/create/meme', {
      subtitle_id: subtitleId,
      frame_id: frameId,
      text,
      font,
      text_color: textColor,
      outline_color: outlineColor
    });
    return response.data;
  },

  // Create a GIF
  createGif: async (
    subtitleId: number,
    startFrame: number,
    endFrame: number,
    caption = true,
    speed = 1.0,
    quality = 'medium'
  ): Promise<GifResponse> => {
    const response = await apiClient.post('/create/gif', {
      subtitle_id: subtitleId,
      start_frame: startFrame,
      end_frame: endFrame,
      caption,
      speed,
      quality
    });
    return response.data;
  },

  // Create a clip
  createClip: async (
    subtitleId: number,
    startTime: string,
    endTime: string,
    caption = true,
    format = 'mp4',
    quality = 'medium'
  ): Promise<ClipResponse> => {
    const response = await apiClient.post('/create/clip', {
      subtitle_id: subtitleId,
      start_time: startTime,
      end_time: endTime,
      caption,
      format,
      quality
    });
    return response.data;
  },

  // Set API key
  setApiKey: (key: string) => {
    localStorage.setItem('veepiac-api-key', key);
    apiClient.defaults.headers.common['X-API-Key'] = key;
  },

  // Clear API key
  clearApiKey: () => {
    localStorage.removeItem('veepiac-api-key');
    delete apiClient.defaults.headers.common['X-API-Key'];
  }
};

export default api;
