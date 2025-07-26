import React from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VoteComponent from '../common/VoteComponent';
import CommentComponent from '../common/CommentComponent';
import ReportButton from '../Reports/ReportButton';
import { SimplePost, RateMyWorkPost } from '../../types';

interface PostCardProps {
  post: SimplePost | RateMyWorkPost;
  showAuthor?: boolean;
  className?: string;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  showAuthor = true, 
  className = '' 
}) => {
  const { user } = useAuth();

  const getRelationshipTag = () => {
    if (!user) return null;
    
    if (post.userId === user.id) {
      return { text: 'Your post', color: 'bg-blue-100 text-blue-800' };
    }
    
    return null;
  };

  const relationshipTag = getRelationshipTag();

  return (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      {/* Header */}
      {showAuthor && (
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-lg">
              {post.userName.charAt(0)}
            </span>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{post.userName}</h3>
                  {relationshipTag && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${relationshipTag.color}`}>
                      {relationshipTag.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(post.createdAt).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  <span className="capitalize">Post</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {post.type === 'rate-my-work' ? (
          <div>
            <p className="text-gray-700 mb-4">{post.description}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Rate my work post"
                className="w-full max-w-md h-64 object-cover rounded-lg mb-4"
              />
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">{post.content}</p>
            {post.image && (
              <img
                src={post.image}
                alt="Post image"
                className="w-full max-w-md h-64 object-cover rounded-lg mb-4"
              />
            )}
          </div>
        )}

        {/* Voting and Report */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
          <VoteComponent
            entityType="post"
            entityId={parseInt(post.id.toString())}
          />
          <ReportButton
            itemType="post"
            itemId={parseInt(post.id.toString())}
            reportedUserId={parseInt(post.userId.toString())}
          />
        </div>

        {/* Comments section */}
        <div className="mt-4 border-t pt-4">
          <CommentComponent
            entityType="post"
            entityId={parseInt(post.id.toString())}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCard;
