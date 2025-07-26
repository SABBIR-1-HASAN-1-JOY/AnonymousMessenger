import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import CommentComponent from '../common/CommentComponent';
import ReportButton from '../Reports/ReportButton';

const RateMyWorkDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts } = useApp(); // Use posts array for rate-my-work posts
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && posts) {
      const foundWork = posts.find((w: any) => 
        w.id?.toString() === id && w.type === 'rate-my-work'
      );
      setWork(foundWork);
      setLoading(false);
    }
  }, [id, posts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rate my work...</p>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Work not found</h2>
          <p className="text-gray-600 mb-4">The work you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/feed')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const getRelationshipTag = () => {
    if (!user) return null;
    
    if (work.userId === user.id) {
      return { text: 'Your work', color: 'bg-purple-100 text-purple-800' };
    }
    
    return null;
  };

  const relationshipTag = getRelationshipTag();

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Rate My Work Detail Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <Link 
                to={`/profile/${work.userId}`}
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
              >
                <span className="text-white font-medium text-lg">
                  {(work.userName || 'U').charAt(0)}
                </span>
              </Link>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link 
                    to={`/profile/${work.userId}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {work.userName || 'Unknown User'}
                  </Link>
                  {relationshipTag && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${relationshipTag.color}`}>
                      {relationshipTag.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(work.createdAt).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  <span className="capitalize">Rate My Work</span>
                  {work.category && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-purple-600 font-medium">{work.category}</span>
                    </>
                  )}
                </div>
              </div>
              <ReportButton
                itemType="post"
                itemId={parseInt(work.id.toString())}
                reportedUserId={parseInt(work.userId.toString())}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {work.title}
              </h2>
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                {work.description}
              </p>

              {/* Work Content/Media */}
              {work.content && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Work Content</h4>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {work.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Images */}
              {work.images && work.images.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {work.images.map((image: string, index: number) => (
                      <img 
                        key={index}
                        src={image} 
                        alt={`Work image ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Skills/Tags */}
              {work.skills && work.skills.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Skills & Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {work.skills.map((skill: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-6">
              <CommentComponent
                entityType="post"
                entityId={parseInt(work.id.toString())}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateMyWorkDetail;
