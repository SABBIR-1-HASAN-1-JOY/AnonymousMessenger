import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Utensils, 
  Plane, 
  Film, 
  Heart, 
  GraduationCap, 
  Shirt, 
  Trophy, 
  Book, 
  Music, 
  Monitor, 
  Gamepad2, 
  Home, 
  Sparkles, 
  Car, 
  Building, 
  DollarSign, 
  MoreHorizontal 
} from 'lucide-react';
import { categories } from '../../types';
import { useApp } from '../../context/AppContext';

const CategoryList: React.FC = () => {
  const { entities } = useApp();

  const categoryIcons: { [key: string]: React.ReactNode } = {
    'Electronics': <Smartphone className="w-8 h-8" />,
    'Restaurants': <Utensils className="w-8 h-8" />,
    'Travel': <Plane className="w-8 h-8" />,
    'Entertainment': <Film className="w-8 h-8" />,
    'Healthcare': <Heart className="w-8 h-8" />,
    'Education': <GraduationCap className="w-8 h-8" />,
    'Fashion': <Shirt className="w-8 h-8" />,
    'Sports': <Trophy className="w-8 h-8" />,
    'Books': <Book className="w-8 h-8" />,
    'Movies': <Film className="w-8 h-8" />,
    'Music': <Music className="w-8 h-8" />,
    'Software': <Monitor className="w-8 h-8" />,
    'Games': <Gamepad2 className="w-8 h-8" />,
    'Home & Garden': <Home className="w-8 h-8" />,
    'Beauty': <Sparkles className="w-8 h-8" />,
    'Automotive': <Car className="w-8 h-8" />,
    'Real Estate': <Building className="w-8 h-8" />,
    'Financial Services': <DollarSign className="w-8 h-8" />,
    'Other': <MoreHorizontal className="w-8 h-8" />
  };

  const categoryColors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-orange-500 to-orange-600',
    'from-cyan-500 to-cyan-600'
  ];

  const getCategoryCount = (category: string) => {
    return entities.filter(entity => entity.category === category).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Categories</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover entities organized by category. Find products, places, services, and experiences that matter to you.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const count = getCategoryCount(category);
            const colorClass = categoryColors[index % categoryColors.length];
            
            return (
              <Link
                key={category}
                to={`/categories/${encodeURIComponent(category)}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
              >
                <div className="p-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${colorClass} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {categoryIcons[category] || <MoreHorizontal className="w-8 h-8" />}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {count} {count === 1 ? 'entity' : 'entities'}
                  </p>
                  
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    Explore
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform Statistics</h2>
            <p className="text-gray-600">See what's popular across all categories</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{entities.length}</div>
              <div className="text-gray-600">Total Entities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{categories.length}</div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.max(...categories.map(cat => getCategoryCount(cat)), 0)}
              </div>
              <div className="text-gray-600">Largest Category</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {(entities.reduce((sum, entity) => sum + entity.overallRating, 0) / entities.length || 0).toFixed(1)}
              </div>
              <div className="text-gray-600">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryList;