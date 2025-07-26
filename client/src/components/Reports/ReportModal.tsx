import React, { useState, useEffect } from 'react';
import { Flag, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'post' | 'comment' | 'review';
  itemId: number;
  reportedUserId: number;
}

interface ReportReason {
  reason_id: number;
  reason_text: string;
  description: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  itemType,
  itemId,
  reportedUserId
}) => {
  const { user } = useAuth();
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReportReasons();
    }
  }, [isOpen]);

  const fetchReportReasons = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/reasons`);
      const data = await response.json();
      
      if (data.success) {
        setReasons(data.reasons);
      }
    } catch (error) {
      console.error('Error fetching report reasons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to report content');
      return;
    }

    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reporterUserId: user.id,
          reportedItemType: itemType,
          reportedItemId: itemId,
          reportedUserId: reportedUserId,
          reason: selectedReason,
          description: description.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedReason('');
          setDescription('');
          setError(null);
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedReason('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Report Content</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 mb-4">
              <AlertTriangle className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Submitted</h3>
            <p className="text-gray-600">
              Thank you for reporting this content. We'll review it shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Reason Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why are you reporting this {itemType}?
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reasons.map((reason) => (
                  <label
                    key={reason.reason_id}
                    className="flex items-start space-x-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.reason_text}
                      checked={selectedReason === reason.reason_text}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reason.reason_text}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reason.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional context about why you're reporting this content..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {description.length}/500 characters
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedReason}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
