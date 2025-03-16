import { create } from 'zustand';

interface AppState {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isAuthenticated: boolean;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  apiKey: localStorage.getItem('veepiac-api-key'),
  setApiKey: (key) => {
    if (key) {
      localStorage.setItem('veepiac-api-key', key);
    } else {
      localStorage.removeItem('veepiac-api-key');
    }
    set({ apiKey: key, isAuthenticated: !!key });
  },
  isAuthenticated: !!localStorage.getItem('veepiac-api-key'),
  recentSearches: JSON.parse(localStorage.getItem('veepiac-recent-searches') || '[]'),
  addRecentSearch: (query) => {
    set((state) => {
      // Don't add empty queries or duplicates
      if (!query.trim() || state.recentSearches.includes(query)) {
        return state;
      }
      
      // Add to the beginning and limit to 10 entries
      const newSearches = [query, ...state.recentSearches].slice(0, 10);
      localStorage.setItem('veepiac-recent-searches', JSON.stringify(newSearches));
      return { recentSearches: newSearches };
    });
  },
  clearRecentSearches: () => {
    localStorage.removeItem('veepiac-recent-searches');
    set({ recentSearches: [] });
  },
}));

export default useAppStore;
