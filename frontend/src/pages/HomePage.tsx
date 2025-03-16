import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
        <span className="block text-veep-blue-600 xl:inline">Veepiac</span>
      </h1>
      <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        Search for quotes from Veep, create memes, GIFs, and clips.
      </p>

      <div className="mt-10 sm:flex sm:justify-center">
        <div className="w-full sm:max-w-xl">
          <form onSubmit={handleSearch} className="mt-6">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-3 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                placeholder="Search for Veep quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center px-4 font-medium text-white bg-veep-blue-600 hover:bg-veep-blue-700 focus:outline-none focus:ring-2 focus:ring-veep-blue-500 focus:ring-offset-2 rounded-r-md"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Search Quotes</h3>
            <p className="mt-2 text-sm text-gray-500">
              Find your favorite Veep moments by searching for dialogue.
            </p>
          </div>
        </div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Create Memes</h3>
            <p className="mt-2 text-sm text-gray-500">
              Generate memes with customized text over scene images.
            </p>
          </div>
        </div>
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Make GIFs & Clips</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create animated GIFs and video clips from the show.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900">Examples</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sample memes would go here */}
          <div className="bg-gray-100 p-4 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-gray-500">Sample Meme</span>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-gray-500">Sample GIF</span>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-gray-500">Sample Clip</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;