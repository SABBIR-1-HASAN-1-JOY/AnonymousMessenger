import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Filter, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CategoryDetail: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const { entities, categories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating-desc');

  const decodedCategory = category ? decodeURIComponent(category) : '';
  
  // Move the conditional rendering after all hooks
  const categoryExists = categories.includes(decodedCategory);
  const categoryEntities = categoryExists ? entities.filter(entity => entity.category === decodedCategory) : [];

  const filteredEntities = React.useMemo(() => {
    let filtered = categoryEntities;

    if (searchQuery) {
      filtered = filtered.filter(entity =>
        entity.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort entities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating-desc':
          return (b.overallRating || 0) - (a.overallRating || 0);
        case 'rating-asc':
          return (a.overallRating || 0) - (b.overallRating || 0);
        case 'reviews-desc':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        case 'reviews-asc':
          return (a.reviewCount || 0) - (b.reviewCount || 0);
        case 'name-asc':
          return a.item_name.localeCompare(b.item_name);
        case 'name-desc':
          return b.item_name.localeCompare(a.item_name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'followers-desc':
          return (b?.followers?.length || 0) - (a?.followers?.length || 0);
        case 'followers-asc':
          return (a?.followers?.length || 0) - (b?.followers?.length || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [categoryEntities, searchQuery, sortBy]);

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

  // Handle category not found after all hooks have been called
  if (!categoryExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h2>
          <Link to="/categories" className="text-blue-600 hover:text-blue-700">
            Back to categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/categories"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to categories
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{decodedCategory}</h1>
              <p className="mt-2 text-gray-600">
                {categoryEntities.length} {categoryEntities.length === 1 ? 'entity' : 'entities'} in this category
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${decodedCategory}...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="rating-desc">★ Highest Rated</option>
                <option value="rating-asc">☆ Lowest Rated</option>
                <option value="reviews-desc">💬 Most Reviews</option>
                <option value="reviews-asc">💬 Least Reviews</option>
                <option value="name-asc">🔤 A to Z</option>
                <option value="name-desc">🔤 Z to A</option>
                <option value="newest">🆕 Newest First</option>
                <option value="oldest">📅 Oldest First</option>
                <option value="followers-desc">👥 Most Followers</option>
                <option value="followers-asc">👤 Least Followers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-600 mb-2 sm:mb-0">
            Showing {filteredEntities.length} of {categoryEntities.length} entities in {decodedCategory}
            {searchQuery && (
              <span className="ml-2 text-green-600 font-medium">
                matching "{searchQuery}"
              </span>
            )}
          </p>
          <p className="text-sm text-gray-500">
            Sorted by {
              sortBy === 'rating-desc' ? 'highest rated' :
              sortBy === 'rating-asc' ? 'lowest rated' :
              sortBy === 'reviews-desc' ? 'most reviews' :
              sortBy === 'reviews-asc' ? 'least reviews' :
              sortBy === 'name-asc' ? 'A to Z' :
              sortBy === 'name-desc' ? 'Z to A' :
              sortBy === 'newest' ? 'newest first' :
              sortBy === 'oldest' ? 'oldest first' :
              sortBy === 'followers-desc' ? 'most followers' :
              sortBy === 'followers-asc' ? 'least followers' : 'default'
            }
          </p>
        </div>

        {/* Entity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEntities.map((entity) => (
            <Link
              key={entity.item_id}
              to={`/entities/${entity.item_id}`}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={entity.picture || 'https://images.pexels.com/photos/3944091/pexels-photo-3944091.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={entity.item_name}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {entity.category}
                  </span>
                  <div className="flex items-center">
                    {renderStars(Math.round(entity.overallRating || 0))}
                    <span className="ml-1 text-sm text-gray-600">
                      {(entity.overallRating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {entity.item_name}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {entity.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{entity.reviewCount || 0} reviews</span>
                  <span>{entity?.followers?.length || 0} followers</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredEntities.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No entities found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `No entities match "${searchQuery}" in ${decodedCategory}`
                : `No entities in ${decodedCategory} yet`
              }
            </p>
            <Link
              to="/entities/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Add the first entity
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDetail;