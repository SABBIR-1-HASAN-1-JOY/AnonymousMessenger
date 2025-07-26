import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import ReportModal from './ReportModal';
import { useAuth } from '../../context/AuthContext';

interface ReportButtonProps {
  itemType: 'post' | 'comment' | 'review';
  itemId: number;
  reportedUserId: number;
  className?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({
  itemType,
  itemId,
  reportedUserId,
  className = ''
}) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't show report button if user is not logged in or trying to report their own content
  // Handle both string and number comparisons for user IDs
  const currentUserId = user?.id?.toString();
  const targetUserId = reportedUserId?.toString();
  
  if (!user || !currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-2 text-gray-500 hover:text-red-600 transition-colors hover:bg-red-50 rounded-md ${className}`}
        title={`Report this ${itemType}`}
      >
        <Flag className="w-4 h-4" />
      </button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemType={itemType}
        itemId={itemId}
        reportedUserId={reportedUserId}
      />
    </>
  );
};

export default ReportButton;
