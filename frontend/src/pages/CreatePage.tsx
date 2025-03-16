import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, PhotoIcon, GifIcon, FilmIcon } from '@heroicons/react/24/outline';
import api, { SubtitleDetails, MemeResponse, GifResponse, ClipResponse } from 'api/client';

const CreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const subtitleId = searchParams.get('subtitle_id');
  const type = searchParams.get('type') || 'meme';
  
  const [details, setDetails] = useState<SubtitleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<MemeResponse | GifResponse | ClipResponse | null>(null);

  // Meme form state
  const [memeText, setMemeText] = useState('');
  const [memeFont, setMemeFont] = useState('impact');
  const [memeTextColor, setMemeTextColor] = useState('#ffffff');
  const [memeOutlineColor, setMemeOutlineColor] = useState('#000000');

  // GIF form state
  const [startFrame, setStartFrame] = useState<number>(0);
  const [endFrame, setEndFrame] = useState<number>(0);
  const [gifCaption, setGifCaption] = useState(true);
  const [gifSpeed, setGifSpeed] = useState(1.0);
  const [gifQuality, setGifQuality] = useState('medium');

  // Clip form state
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [clipCaption, setClipCaption] = useState(true);
  const [clipFormat, setClipFormat] = useState('mp4');
  const [clipQuality, setClipQuality] = useState('medium');

  useEffect(() => {
    const fetchSubtitleDetails = async () => {
      if (!subtitleId) return;
      
      setLoading(true);
      setError(null);
      try {
        const id = parseInt(subtitleId);
        const response = await api.getSubtitle(id, 10, 10);
        setDetails(response);
        setSelectedFrame(response.frames.current.frame_id);
        
        // Initialize form values
        setMemeText(response.subtitle.dialogue);
        
        // For GIFs, set default frame range
        if (response.frames.before.length > 0 && response.frames.after.length > 0) {
          setStartFrame(response.frames.before[0].frame_id);
          setEndFrame(response.frames.after[response.frames.after.length - 1].frame_id);
        }
        
        // For clips, set default time range
        setStartTime(response.subtitle.timestamp.start);
        setEndTime(response.subtitle.timestamp.end);
      } catch (err) {
        console.error('Error fetching subtitle details:', err);
        setError('Failed to fetch subtitle details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubtitleDetails();
  }, [subtitleId]);

  const handleCreateMeme = async () => {
    if (!subtitleId || !memeText.trim() || !selectedFrame) return;
    
    setCreating(true);
    setError(null);
    try {
      const id = parseInt(subtitleId);
      const response = await api.createMeme(
        id,
        memeText,
        selectedFrame,
        memeFont,
        memeTextColor,
        memeOutlineColor
      );
      setResult(response);
    } catch (err) {
      console.error('Error creating meme:', err);
      setError('Failed to create meme. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateGif = async () => {
    if (!subtitleId || !startFrame || !endFrame) return;
    
    setCreating(true);
    setError(null);
    try {
      const id = parseInt(subtitleId);
      const response = await api.createGif(
        id,
        startFrame,
        endFrame,
        gifCaption,
        gifSpeed,
        gifQuality
      );
      setResult(response);
    } catch (err) {
      console.error('Error creating GIF:', err);
      setError('Failed to create GIF. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateClip = async () => {
    if (!subtitleId || !startTime || !endTime) return;
    
    setCreating(true);
    setError(null);
    try {
      const id = parseInt(subtitleId);
      const response = await api.createClip(
        id,
        startTime,
        endTime,
        clipCaption,
        clipFormat,
        clipQuality
      );
      setResult(response);
    } catch (err) {
      console.error('Error creating clip:', err);
      setError('Failed to create clip. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-veep-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-veep-red-50 border border-veep-red-200 text-veep-red-700 px-4 py-3 rounded-md inline-block">
          {error}
        </div>
        <div className="mt-6">
          <Link to="/" className="text-veep-blue-600 hover:text-veep-blue-800">
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!details || !subtitleId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Media</h1>
        <p className="text-gray-600 mb-6">
          To create a meme, GIF, or clip, first search for a quote and then click the create button.
        </p>
        <Link to="/search" className="btn btn-primary">
          Search for Quotes
        </Link>
      </div>
    );
  }

  // Combine all frames for display
  const allFrames = [
    ...details.frames.before,
    details.frames.current,
    ...details.frames.after
  ];

  return (
    <div>
      <div className="mb-6">
        <Link to={`/subtitle/${subtitleId}`} className="inline-flex items-center text-veep-blue-600 hover:text-veep-blue-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to quote
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Create {type === 'gif' ? 'GIF' : type === 'clip' ? 'Video Clip' : 'Meme'}
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {details.subtitle.episode} - {details.subtitle.episode_title}
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <blockquote className="text-gray-800">
                "{details.subtitle.dialogue}"
              </blockquote>
              <p className="text-gray-500 text-sm mt-2">
                {details.subtitle.timestamp.start} - {details.subtitle.timestamp.end}
              </p>
            </div>
          </div>

          {/* Creation type navigation */}
          <div className="flex flex-wrap mb-6 gap-3">
            <Link
              to={`/create?subtitle_id=${subtitleId}&type=meme`}
              className={`btn flex items-center ${type === 'meme' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <PhotoIcon className="h-5 w-5 mr-1" />
              Meme
            </Link>
            <Link
              to={`/create?subtitle_id=${subtitleId}&type=gif`}
              className={`btn flex items-center ${type === 'gif' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <GifIcon className="h-5 w-5 mr-1" />
              GIF
            </Link>
            <Link
              to={`/create?subtitle_id=${subtitleId}&type=clip`}
              className={`btn flex items-center ${type === 'clip' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <FilmIcon className="h-5 w-5 mr-1" />
              Clip
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Preview area */}
            <div className="w-full md:w-1/2">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {result ? (
                  <>
                    {(type === 'meme' || type === 'gif') ? (
                      <img
                        src={(result as MemeResponse | GifResponse).url}
                        alt={type === 'meme' ? 'Generated meme' : 'Generated GIF'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        src={(result as ClipResponse).url}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </>
                ) : (
                  <img
                    src={selectedFrame ? allFrames.find(f => f.frame_id === selectedFrame)?.url : details.frames.current.url}
                    alt="Preview frame"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Frame navigation (for meme) */}
              {type === 'meme' && !result && (
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
              )}

              {/* Result actions */}
              {result && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={(result as any).url}
                    download={`veepiac-${type}.${type === 'clip' ? clipFormat : type === 'gif' ? 'gif' : 'jpg'}`}
                    className="btn btn-primary"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => setResult(null)}
                    className="btn btn-secondary"
                  >
                    Create Another
                  </button>
                  <p className="text-sm text-gray-500 w-full mt-2">
                    Note: This file will expire after 7 days.
                  </p>
                </div>
              )}
            </div>

            {/* Creation form */}
            <div className="w-full md:w-1/2">
              {!result && (
                <>
                  {/* Meme form */}
                  {type === 'meme' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Meme Options</h3>
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label htmlFor="meme-font" className="block text-sm font-medium text-gray-700 mb-1">
                            Font
                          </label>
                          <select
                            id="meme-font"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={memeFont}
                            onChange={(e) => setMemeFont(e.target.value)}
                          >
                            <option value="impact">Impact</option>
                            <option value="arial">Arial</option>
                            <option value="comic">Comic Sans</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="meme-text-color" className="block text-sm font-medium text-gray-700 mb-1">
                            Text Color
                          </label>
                          <input
                            type="color"
                            id="meme-text-color"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={memeTextColor}
                            onChange={(e) => setMemeTextColor(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="meme-outline-color" className="block text-sm font-medium text-gray-700 mb-1">
                          Outline Color
                        </label>
                        <input
                          type="color"
                          id="meme-outline-color"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                          value={memeOutlineColor}
                          onChange={(e) => setMemeOutlineColor(e.target.value)}
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

                  {/* GIF form */}
                  {type === 'gif' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">GIF Options</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label htmlFor="start-frame" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Frame
                          </label>
                          <select
                            id="start-frame"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={startFrame}
                            onChange={(e) => setStartFrame(parseInt(e.target.value))}
                          >
                            {allFrames.map((frame) => (
                              <option key={`start-${frame.frame_id}`} value={frame.frame_id}>
                                Frame {frame.frame_id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="end-frame" className="block text-sm font-medium text-gray-700 mb-1">
                            End Frame
                          </label>
                          <select
                            id="end-frame"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={endFrame}
                            onChange={(e) => setEndFrame(parseInt(e.target.value))}
                          >
                            {allFrames.map((frame) => (
                              <option key={`end-${frame.frame_id}`} value={frame.frame_id}>
                                Frame {frame.frame_id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="gif-speed" className="block text-sm font-medium text-gray-700 mb-1">
                          Speed: {gifSpeed}x
                        </label>
                        <input
                          type="range"
                          id="gif-speed"
                          min="0.5"
                          max="2"
                          step="0.1"
                          className="block w-full"
                          value={gifSpeed}
                          onChange={(e) => setGifSpeed(parseFloat(e.target.value))}
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="gif-quality" className="block text-sm font-medium text-gray-700 mb-1">
                          Quality
                        </label>
                        <select
                          id="gif-quality"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                          value={gifQuality}
                          onChange={(e) => setGifQuality(e.target.value)}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center">
                          <input
                            id="gif-caption"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-veep-blue-600 focus:ring-veep-blue-500"
                            checked={gifCaption}
                            onChange={(e) => setGifCaption(e.target.checked)}
                          />
                          <label htmlFor="gif-caption" className="ml-2 block text-sm text-gray-900">
                            Include caption
                          </label>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCreateGif}
                        disabled={creating || startFrame > endFrame}
                        className="btn btn-primary w-full"
                      >
                        {creating ? 'Creating...' : 'Generate GIF'}
                      </button>
                    </div>
                  )}

                  {/* Clip form */}
                  {type === 'clip' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Clip Options</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time
                          </label>
                          <input
                            type="text"
                            id="start-time"
                            placeholder="00:12:34,500"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">
                            End Time
                          </label>
                          <input
                            type="text"
                            id="end-time"
                            placeholder="00:12:37,800"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                          <label htmlFor="clip-format" className="block text-sm font-medium text-gray-700 mb-1">
                            Format
                          </label>
                          <select
                            id="clip-format"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={clipFormat}
                            onChange={(e) => setClipFormat(e.target.value)}
                          >
                            <option value="mp4">MP4</option>
                            <option value="webm">WebM</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="clip-quality" className="block text-sm font-medium text-gray-700 mb-1">
                            Quality
                          </label>
                          <select
                            id="clip-quality"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
                            value={clipQuality}
                            onChange={(e) => setClipQuality(e.target.value)}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center">
                          <input
                            id="clip-caption"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-veep-blue-600 focus:ring-veep-blue-500"
                            checked={clipCaption}
                            onChange={(e) => setClipCaption(e.target.checked)}
                          />
                          <label htmlFor="clip-caption" className="ml-2 block text-sm text-gray-900">
                            Include subtitles
                          </label>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCreateClip}
                        disabled={creating || !startTime || !endTime}
                        className="btn btn-primary w-full"
                      >
                        {creating ? 'Creating...' : 'Generate Clip'}
                      </button>
                      
                      {type === 'clip' && (
                        <p className="mt-3 text-sm text-gray-500">
                          Note: Creating video clips requires a premium subscription.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
