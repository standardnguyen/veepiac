import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PhotoIcon, GifIcon, FilmIcon } from '@heroicons/react/24/outline';
import api, { SubtitleDetails } from 'api/client';

const SubtitlePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<SubtitleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [showMemeForm, setShowMemeForm] = useState(false);
  const [memeText, setMemeText] = useState('');
  const [memeUrl, setMemeUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const subtitleId = parseInt(id);
        const response = await api.getSubtitle(subtitleId, 5, 5, 3, 3);
        setDetails(response);
        // Default to current frame
        setSelectedFrame(response.frames.current.frame_id);
      } catch (err) {
        console.error('Error fetching subtitle details:', err);
        setError('Failed to fetch subtitle details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleCreateMeme = async () => {
    if (!id || !memeText.trim() || !selectedFrame) return;
    
    setCreating(true);
    try {
      const subtitleId = parseInt(id);
      const response = await api.createMeme(
        subtitleId,
        memeText,
        selectedFrame
      );
      setMemeUrl(response.url);
    } catch (err) {
      console.error('Error creating meme:', err);
      setError('Failed to create meme. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-veep-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading subtitle details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="text-center py-12">
        <div className="bg-veep-red-50 border border-veep-red-200 text-veep-red-700 px-4 py-3 rounded-md inline-block">
          {error || 'Failed to load subtitle details'}
        </div>
        <div className="mt-6">
          <Link to="/search" className="text-veep-blue-600 hover:text-veep-blue-800">
            &larr; Back to search
          </Link>
        </div>
      </div>
    );
  }

  const allFrames = [
    ...details.frames.before,
    details.frames.current,
    ...details.frames.after
  ];

  return (
    <div>
      <div className="mb-6">
        <Link to="/search" className="inline-flex items-center text-veep-blue-600 hover:text-veep-blue-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to search
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Main frame and navigation */}
            <div className="w-full md:w-2/3">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {selectedFrame && (
                  <img 
                    src={allFrames.find(f => f.frame_id === selectedFrame)?.url || details.frames.current.url}
                    alt="Selected frame"
                    className="w-full h-full object-contain"
                  />
                )}
                
                {memeUrl && (
                  <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center">
                    <img 
                      src={memeUrl}
                      alt="Generated meme"
                      className="max-w-full max-h-full"
                    />
                    <div className="mt-4 flex gap-4">
                      <a 
                        href={memeUrl}
                        download="veepiac-meme.jpg"
                        className="btn btn-primary"
                      >
                        Download
                      </a>
                      <button 
                        onClick={() => setMemeUrl(null)}
                        className="btn btn-secondary"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Frame navigation */}
              <div className="mt-3 flex space-x-2 overflow-auto pb-2">
                {allFrames.map((frame) => (
                  <button
                    key={frame.frame_id}
                    onClick={() => setSelectedFrame(frame.frame_id)}
                    className={`flex-shrink-0 w-20 h-12 rounded-md overflow-hidden border-2 ${
                      selectedFrame === frame.frame_id
                        ? 'border-veep-blue-600'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={frame.url}
                      alt={`Frame ${frame.frame_id}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Quote and metadata */}
            <div className="w-full md:w-1/3">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {details.subtitle.episode} - {details.subtitle.episode_title}
                </h2>
                <p className="text-gray-500 text-sm">
                  {details.subtitle.timestamp.start} - {details.subtitle.timestamp.end}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <blockquote className="text-gray-800 text-lg font-medium">
                  "{details.subtitle.dialogue}"
                </blockquote>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={() => {
                    setShowMemeForm(!showMemeForm);
                    if (showMemeForm) {
                      setMemeText('');
                    } else {
                      setMemeText(details.subtitle.dialogue);
                    }
                  }}
                  className="btn btn-secondary flex items-center"
                >
                  <PhotoIcon className="h-5 w-5 mr-1" />
                  {showMemeForm ? 'Cancel Meme' : 'Create Meme'}
                </button>
                <Link
                  to={`/create?subtitle_id=${details.subtitle.subtitle_id}&type=gif`}
                  className="btn btn-secondary flex items-center"
                >
                  <GifIcon className="h-5 w-5 mr-1" />
                  Create GIF
                </Link>
                <Link
                  to={`/create?subtitle_id=${details.subtitle.subtitle_id}&type=clip`}
                  className="btn btn-secondary flex items-center"
                >
                  <FilmIcon className="h-5 w-5 mr-1" />
                  Create Clip
                </Link>
              </div>

              {showMemeForm && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Create Meme</h3>
                  <div className="mb-3">
                    <label htmlFor="meme-text" className="block text-sm font-medium text-gray-700 mb-1">
                      Text
                    </label>
                    <textarea
                      id="meme-text"
                      rows={3}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                      value={memeText}
                      onChange={(e) => setMemeText(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleCreateMeme}
                    disabled={creating || !memeText.trim()}
                    className="btn btn-primary w-full"
                  >
                    {creating ? 'Creating...' : 'Generate Meme'}
                  </button>
                </div>
              )}

              {/* Episode navigation - link to episode page */}
              <div className="mt-8">
                <Link
                  to={`/episode/${details.subtitle.episode}`}
                  className="text-veep-blue-600 hover:text-veep-blue-800"
                >
                  View all quotes from this episode
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Surrounding subtitles */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Surrounding Dialogue</h3>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {details.surrounding_subtitles.before.map((sub) => (
              <li key={sub.subtitle_id} className="p-4 hover:bg-gray-50">
                <Link to={`/subtitle/${sub.subtitle_id}`} className="block">
                  <p className="text-gray-800">{sub.dialogue}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {sub.timestamp.start} - {sub.timestamp.end}
                  </p>
                </Link>
              </li>
            ))}
            <li className="p-4 bg-gray-50">
              <p className="text-gray-800 font-medium">{details.subtitle.dialogue}</p>
              <p className="text-gray-500 text-sm mt-1">
                {details.subtitle.timestamp.start} - {details.subtitle.timestamp.end}
              </p>
            </li>
            {details.surrounding_subtitles.after.map((sub) => (
              <li key={sub.subtitle_id} className="p-4 hover:bg-gray-50">
                <Link to={`/subtitle/${sub.subtitle_id}`} className="block">
                  <p className="text-gray-800">{sub.dialogue}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {sub.timestamp.start} - {sub.timestamp.end}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubtitlePage;
