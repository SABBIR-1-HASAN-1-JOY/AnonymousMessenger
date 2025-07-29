import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface VoteData {
  upvotes: number;
  downvotes: number;
  averageRating: number; // Keep for compatibility but will always be 0
  ratingCount: number;   // Keep for compatibility but will always be 0
}

interface UserVote {
  voteType?: 'up' | 'down';
}

interface VoteComponentProps {
  entityType: 'post' | 'review';
  entityId: number;
  className?: string;
}

const VoteComponent: React.FC<VoteComponentProps> = ({
  entityType,
  entityId,
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/votes/counts/${entityType}/${entityId}`);
      if (response.ok) {
        const data = await response.json();
        setVoteData(data);
      } else {
        console.warn('Failed to fetch vote data:', response.status);
        // Don't show error to user for vote data fetch failures
      }
    } catch (error) {
      console.error('Error fetching vote data:', error);
      // Don't show error to user for vote data fetch failures
    }
  };

  const fetchUserVote = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/votes/user/${entityType}/${entityId}`,
        {
          headers: {
            'user-id': user.id.toString()
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserVote(data);
      } else {
        console.warn('Failed to fetch user vote:', response.status);
        // Don't show error to user for user vote fetch failures
      }
    } catch (error) {
      console.error('Error fetching user vote:', error);
      // Don't show error to user for user vote fetch failures
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    // Prevent admin users from voting
    if (user?.isAdmin || user?.role === 'admin') {
      alert('Admin users cannot vote on posts or reviews');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/votes/vote`, {
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
    </div>
  );
};

export default VoteComponent;
