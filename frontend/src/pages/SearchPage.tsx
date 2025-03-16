import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api, { SearchResponse, Subtitle } from 'api/client';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  
  const [query, setQuery] = useState(searchQuery);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await api.searchQuotes(searchQuery, page);
        setResults(response);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to fetch search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim(), page: '1' });
    }
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: searchQuery, page: newPage.toString() });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Veep Quotes</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-3 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-veep-blue-600 sm:text-sm sm:leading-6"
            placeholder="Search for Veep quotes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center px-4 font-medium text-white bg-veep-blue-600 hover:bg-veep-blue-700 focus:outline-none focus:ring-2 focus:ring-veep-blue-500 focus:ring-offset-2 rounded-r-md"
          >
            Search
          </button>
        </div>
      </form>

      {searchQuery && (
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {loading ? 'Searching...' : results ? `Results for "${searchQuery}"` : 'No results found'}
          </h2>
          {results && (
            <p className="text-sm text-gray-500">
              Showing {results.results.length} of {results.pagination.total_results} results
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-veep-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Searching...</p>
        </div>
      )}

      {error && (
        <div className="bg-veep-red-50 border border-veep-red-200 text-veep-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {!loading && !error && results && (
        <>
          {results.results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.results.map((quote) => (
                <SearchResultCard key={quote.subtitle_id} quote={quote} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {results.pagination.total_pages > 1 && (
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
                
                {Array.from({ length: Math.min(5, results.pagination.total_pages) }, (_, i) => {
                  // Show pagination centered around current page
                  let pageNum = page;
                  if (page < 3) {
                    pageNum = i + 1;
                  } else if (page > results.pagination.total_pages - 2) {
                    pageNum = results.pagination.total_pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  // Ensure page number is valid
                  if (pageNum < 1 || pageNum > results.pagination.total_pages) return null;

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
                  disabled={page >= results.pagination.total_pages}
                  className="inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <span aria-hidden="true">&raquo;</span>
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SearchResultCard: React.FC<{ quote: Subtitle }> = ({ quote }) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/subtitle/${quote.subtitle_id}`}>
        <div className="relative aspect-video bg-gray-200">
          <img 
            src={quote.thumbnail_url} 
            alt={`Scene from ${quote.episode} - ${quote.episode_title}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fall back to a placeholder if the image fails to load
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/320x180?text=Scene+Not+Found';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="text-sm font-medium">
              {quote.episode} - {quote.episode_title}
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-gray-900">{quote.dialogue}</p>
          <p className="mt-2 text-sm text-gray-500">
            {quote.timestamp.start} - {quote.timestamp.end}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default SearchPage;
