import React, { useState, useEffect } from 'react';
import { KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from 'api/client';

const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'none' | 'testing' | 'success' | 'error'>('none');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const storedKey = localStorage.getItem('veepiac-api-key');
    if (storedKey) {
      setSavedKey(storedKey);
      setApiKey(storedKey);
    }

    // Check for dark mode preference
    const darkModePreference = localStorage.getItem('veepiac-dark-mode') === 'true';
    setDarkMode(darkModePreference);
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return;

    setSaving(true);
    // Simulate API call with timeout
    setTimeout(() => {
      // Save API key
      api.setApiKey(apiKey.trim());
      setSavedKey(apiKey.trim());
      setSaving(false);
    }, 500);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setSavedKey(null);
    api.clearApiKey();
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) return;

    setTestStatus('testing');
    try {
      // Test API key by making a simple search request
      await api.searchQuotes('test', 1, 1);
      setTestStatus('success');
    } catch (err) {
      console.error('API key test failed:', err);
      setTestStatus('error');
    }
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('veepiac-dark-mode', newDarkMode.toString());
    
    // Apply dark mode to document
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Key</h2>
          <p className="text-gray-600 mb-4">
            Enter your API key to access premium features like creating video clips.
            {!savedKey && " Don't have an API key? Contact the administrator."}
          </p>

          <div className="mb-4">
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <KeyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                id="api-key"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey.trim() || apiKey === savedKey}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save API Key'}
            </button>
            <button
              onClick={handleTestApiKey}
              disabled={testStatus === 'testing' || !apiKey.trim()}
              className="btn btn-secondary"
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test API Key'}
            </button>
            {savedKey && (
              <button
                onClick={handleClearApiKey}
                className="btn btn-danger"
              >
                Clear API Key
              </button>
            )}
          </div>

          {testStatus === 'success' && (
            <div className="mt-4 flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              API key is valid!
            </div>
          )}

          {testStatus === 'error' && (
            <div className="mt-4 flex items-center text-veep-red-600">
              <XCircleIcon className="h-5 w-5 mr-1" />
              API key test failed. Please check your key.
            </div>
          )}

          {savedKey && (
            <div className="mt-4 flex items-center text-green-600">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              API key saved.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Display Preferences</h2>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="dark-mode"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-veep-blue-600 focus:ring-veep-blue-500"
                checked={darkMode}
                onChange={handleToggleDarkMode}
              />
              <label htmlFor="dark-mode" className="ml-2 block text-sm text-gray-900">
                Dark Mode (coming soon)
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Dark mode is under development and will be available in a future update.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About Veepiac</h2>
          <p className="text-gray-600 mb-2">
            Version: 0.1.0
          </p>
          <p className="text-gray-600 mb-2">
            Veepiac is a searchable database of Veep TV show dialogue with synchronized video frames, 
            allowing users to search for quotes, create memes, GIFs, and clips from the show.
          </p>
          <p className="text-gray-600">
            Inspired by Frinkiac (for The Simpsons). This project is not affiliated with HBO or the creators of Veep.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;