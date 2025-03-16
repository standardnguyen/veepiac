import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api, { EpisodeResponse } from 'api/client';

const EpisodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const highlightedSubtitle = searchParams.get('subtitle');
  
  const [episodeData, setEpisodeData] = useState<EpisodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await api.getEpisodeSubtitles(id, page);
        setEpisodeData(response);
      } catch (err) {
        console.error('Error fetching episode data:', err);
        setError('Failed to fetch episode data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodeData();
  }, [id, page]);

  useEffect(() => {
    // Scroll to highlighted subtitle if any
    if (highlightedSubtitle && !loading) {
      const element = document.getElementById(`subtitle-${highlightedSubtitle}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight effect
        element.classList.add('bg-veep-blue-50');
        setTimeout(() => {
          element.classList.remove('bg-veep-blue-50');
        }, 2000);
      }
    }
  }, [highlightedSubtitle, loading]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-veep-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-500">Loading episode data...</p>
      </div>
    );
  }

  if (error || !episodeData) {
    return (
      <div className="text-center py-12">
        <div className="bg-veep-red-50 border border-veep-red-200 text-veep-red-700 px-4 py-3 rounded-md inline-block">
          {error || 'Failed to load episode data'}
        </div>
        <div className="mt-6">
          <Link to="/" className="text-veep-blue-600 hover:text-veep-blue-800">
            &larr; Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-veep-blue-600 hover:text-veep-blue-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to home
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {episodeData.episode.id} - {episodeData.episode.title}
          </h1>
          <p className="text-gray-500 mt-1">
            Season {episodeData.episode.season}, Episode {episodeData.episode.episode}
            {episodeData.episode.air_date && ` • Aired on ${episodeData.episode.air_date}`}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">All Quotes</h2>
        <p className="text-gray-500">
          Showing {episodeData.subtitles.length} of {episodeData.pagination.total_subtitles} quotes
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <ul className="divide-y divide-gray-200">
          {episodeData.subtitles.map((subtitle) => (
            <li 
              key={subtitle.subtitle_id}
              id={`subtitle-${subtitle.subtitle_id}`}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <Link to={`/subtitle/${subtitle.subtitle_id}`} className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 md:w-1/4">
                  <div className="aspect-video bg-gray-200 rounded-md overflow-hidden">
                    <img 
                      src={subtitle.thumbnail_url}
                      alt={`Frame for ${subtitle.dialogue}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/320x180?text=Scene+Not+Found';
                      }}
                    />
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-gray-800">{subtitle.dialogue}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {subtitle.timestamp.start} - {subtitle.timestamp.end}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {episodeData.pagination.total_pages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <span aria-hidden="true">&laquo;</span>
            </button>
            
            {Array.from({ length: Math.min(5, episodeData.pagination.total_pages) }, (_, i) => {
              // Show pagination centered around current page
              let pageNum = page;
              if (page < 3) {
                pageNum = i + 1;
              } else if (page > episodeData.pagination.total_pages - 2) {
                pageNum = episodeData.pagination.total_pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              // Ensure page number is valid
              if (pageNum < 1 || pageNum > episodeData.pagination.total_pages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                    pageNum === page
                      ? 'bg-veep-blue-600 text-white'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= episodeData.pagination.total_pages}
              className="inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <span aria-hidden="true">&raquo;</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default EpisodePage;