import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Star, User, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { entities, searchEntities } = useApp();
  const [filter, setFilter] = useState<'all' | 'entities' | 'users'>('all');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query) {
      const entityResults = searchEntities(query);
      // For now, we'll only search entities since we don't have a user search function
      setResults(entityResults);
    }
  }, [query, searchEntities]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results
          </h1>
          <p className="text-gray-600">
            {query ? `Results for "${query}"` : 'Enter a search term to find entities and users'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              defaultValue={query}
              placeholder="Search entities, users..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const newQuery = (e.target as HTMLInputElement).value;
                  window.location.href = `/search?q=${encodeURIComponent(newQuery)}`;
                }
              }}
            />
          </div>
        </div>

        {query && (
          <>
            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Results ({results.length})
                </button>
                <button
                  onClick={() => setFilter('entities')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'entities'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Entities ({results.length})
                </button>
                <button
                  onClick={() => setFilter('users')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filter === 'users'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Users (0)
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="mb-6">
              <p className="text-gray-600">
                Found {results.length} {results.length === 1 ? 'result' : 'results'}
              </p>
            </div>

            {/* Results Grid */}
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((entity) => (
                  <Link
                    key={entity.id}
                    to={`/entities/${entity.id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={entity.picture || 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=800'}
                        alt={entity.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {entity.category}
                        </span>
                        <div className="flex items-center">
                          {renderStars(Math.round(entity.overallRating))}
                          <span className="ml-1 text-sm text-gray-600">
                            {entity.overallRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {entity.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {entity.description}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{entity.reviewCount} reviews</span>
                        <span>{entity.followers.length} followers</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or browse our categories
                </p>
                <Link
                  to="/categories"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Browse Categories
                </Link>
              </div>
            )}
          </>
        )}

        {/* Popular Searches */}
        {!query && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Popular Searches</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['iPhone', 'Restaurant', 'Hotel', 'Movie', 'Book', 'Game', 'Software', 'Fashion'].map((term) => (
                <Link
                  key={term}
                  to={`/search?q=${encodeURIComponent(term)}`}
                  className="p-3 border border-gray-200 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span className="text-gray-700 font-medium">{term}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;