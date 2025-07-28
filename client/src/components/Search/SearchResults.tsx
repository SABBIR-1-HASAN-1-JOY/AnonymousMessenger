import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface SearchEntity {
  id: string;
  name: string;
  description: string;
  category: string;
  picture?: string;
  type: 'entity';
}

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  type: 'user';
}

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [filter, setFilter] = useState<'all' | 'entities' | 'users'>('all');
  const [entities, setEntities] = useState<SearchEntity[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(query);

  // Sync local search query with URL parameter changes
  useEffect(() => {
    setLocalSearchQuery(query);
  }, [query]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setEntities([]);
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/search/all?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setEntities(data.entities || []);
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const getFilteredResults = () => {
    switch (filter) {
      case 'entities': return { entities, users: [] };
      case 'users': return { entities: [], users };
      default: return { entities, users };
    }
  };

  const filteredResults = getFilteredResults();
  const totalResults = entities.length + users.length;
  const filteredTotal = filteredResults.entities.length + filteredResults.users.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-600">{query ? `Results for "${query}"` : 'Enter a search term to find entities and users'}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="search"
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Search exact entity names or usernames..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
          </form>
        </div>

        {query && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {['all', 'entities', 'users'].map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as any)}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      filter === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {key[0].toUpperCase() + key.slice(1)} ({key === 'all' ? totalResults : key === 'entities' ? entities.length : users.length})
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">{loading ? 'Searching...' : `Found ${filteredTotal} ${filteredTotal === 1 ? 'result' : 'results'}`}</p>
            </div>

            {filteredTotal > 0 ? (
              <div className="space-y-8">
                {filteredResults.entities.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Entities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredResults.entities.map(entity => (
                        <Link key={entity.id} to={`/entities/${entity.id}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                          <img
                            src={entity.picture || 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=800'}
                            alt={entity.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">{entity.category}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{entity.name}</h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{entity.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {filteredResults.users.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Users</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredResults.users.map(searchUser => (
                        <Link key={searchUser.id} to={`/profile/${searchUser.id}`} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                          <div className="p-6">
                            <div className="flex items-center mb-4">
                              <img
                                src={searchUser.profilePicture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'}
                                alt={searchUser.displayName}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              <div className="ml-4 flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {searchUser.displayName}
                                </h3>
                                <p className="text-gray-600">@{searchUser.username}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !loading && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search terms or browse our categories</p>
                  <Link to="/categories" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">Browse Categories</Link>
                </div>
              )
            )}
          </>
        )}

        {!query && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Popular Searches</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['iPhone', 'Restaurant', 'Hotel', 'Movie', 'Book', 'Game', 'Software', 'Fashion'].map((term) => (
                <Link key={term} to={`/search?q=${encodeURIComponent(term)}`} className="p-3 border border-gray-200 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
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