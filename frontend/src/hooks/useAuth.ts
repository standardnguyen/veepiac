import { useEffect } from 'react';
import useAppStore from 'store';
import api from 'api/client';

/**
 * Hook for handling authentication state
 */
export const useAuth = () => {
  const { apiKey, setApiKey, isAuthenticated } = useAppStore();

  useEffect(() => {
    // Set API key in the API client when it changes in the store
    if (apiKey) {
      api.setApiKey(apiKey);
    } else {
      api.clearApiKey();
    }
  }, [apiKey]);

  const login = (key: string) => {
    setApiKey(key);
  };

  const logout = () => {
    setApiKey(null);
  };

  return {
    apiKey,
    isAuthenticated,
    login,
    logout
  };
};

export default useAuth;
