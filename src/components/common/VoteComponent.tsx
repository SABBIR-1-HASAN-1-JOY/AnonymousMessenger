import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VoteData {
  upvotes: number;
  downvotes: number;
  averageRating: number;
  ratingCount: number;
}

interface UserVote {
  voteType?: 'up' | 'down';
  rating?: number;
}

interface VoteComponentProps {
  entityType: 'post' | 'review';
  entityId: number;
  showRating?: boolean; // For posts that can be rated 1-5 stars
  className?: string;
}

const VoteComponent: React.FC<VoteComponentProps> = ({
  entityType,
  entityId,
  showRating = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [voteData, setVoteData] = useState<VoteData>({
    upvotes: 0,
    downvotes: 0,
    averageRating: 0,
    ratingCount: 0
  });
  const [userVote, setUserVote] = useState<UserVote | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch vote data and user's vote
  useEffect(() => {
    fetchVoteData();
    if (user) {
      fetchUserVote();
    }
  }, [entityType, entityId, user]);

  const fetchVoteData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/votes/counts/${entityType}/${entityId}`);
      if (response.ok) {
        const data = await response.json();
        setVoteData(data);
      }
    } catch (error) {
      console.error('Error fetching vote data:', error);
    }
  };

  const fetchUserVote = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/votes/user/${entityType}/${entityId}`,
        {
          headers: {
            'user-id': user.id.toString()
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserVote(data);
      }
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/votes/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id.toString()
        },
        body: JSON.stringify({
          entityType,
          entityId,
          voteType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVoteData(data.voteCounts);
        
        // Update user vote state
        if (data.vote) {
          setUserVote({ voteType: data.vote.vote_type });
        } else {
          setUserVote(null);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      alert('Please log in to rate');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/votes/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id.toString()
        },
        body: JSON.stringify({
          postId: entityId,
          rating
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVoteData(data.voteCounts);
        
        // Update user vote state
        if (data.vote) {
          setUserVote({ rating: data.vote.rating });
        } else {
          setUserVote(null);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to rate');
      }
    } catch (error) {
      console.error('Error rating:', error);
      alert('Failed to rate');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = userVote?.rating ? i < userVote.rating : i < Math.round(voteData.averageRating);
      const isUserRating = userVote?.rating && i < userVote.rating;
      
      return (
        <button
          key={i}
          onClick={() => handleRating(i + 1)}
          disabled={loading}
          className={`w-5 h-5 transition-colors ${
            filled
              ? isUserRating
                ? 'text-blue-500 fill-current'
                : 'text-yellow-400 fill-current'
              : 'text-gray-300 hover:text-yellow-400'
          } ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Star className="w-full h-full" />
        </button>
      );
    });
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Upvote/Downvote */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleVote('up')}
          disabled={loading}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            userVote?.voteType === 'up'
              ? 'bg-green-100 text-green-600'
              : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
          } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-sm font-medium">{voteData.upvotes}</span>
        </button>

        <button
          onClick={() => handleVote('down')}
          disabled={loading}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            userVote?.voteType === 'down'
              ? 'bg-red-100 text-red-600'
              : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
          } ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-sm font-medium">{voteData.downvotes}</span>
        </button>
      </div>

      {/* Rating (for posts) */}
      {showRating && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {renderStars()}
          </div>
          <span className="text-sm text-gray-600">
            {voteData.averageRating > 0 
              ? `${voteData.averageRating.toFixed(1)} (${voteData.ratingCount})`
              : 'No ratings yet'
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default VoteComponent;
