import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';

interface Commentator {
  id: string;
  name: string;
  isActive: boolean;
}

export const AdminPanel: React.FC = () => {
  const [commentators, setCommentators] = useState<Commentator[]>([]);
  const [newCommentatorName, setNewCommentatorName] = useState('');
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();

  useEffect(() => {
    // Request current commentators list
    sendMessage({ type: 'get_commentators' });
  }, [sendMessage]);

  const handleAddCommentator = () => {
    if (!newCommentatorName.trim()) return;
    
    sendMessage({
      type: 'add_commentator',
      name: newCommentatorName.trim(),
    });
    setNewCommentatorName('');
  };

  const handleToggleCommentator = (commentatorId: string, isActive: boolean) => {
    sendMessage({
      type: 'toggle_commentator',
      commentatorId,
      isActive: !isActive,
    });
  };

  const handleDeleteCommentator = (commentatorId: string) => {
    sendMessage({
      type: 'delete_commentator',
      commentatorId,
    });
  };

  if (!user?.isHost) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg w-80">
      <h2 className="text-white text-xl mb-4">Admin Panel</h2>
      
      <div className="mb-4">
        <h3 className="text-white text-lg mb-2">Commentators</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newCommentatorName}
            onChange={(e) => setNewCommentatorName(e.target.value)}
            placeholder="New commentator name"
            className="flex-1 px-2 py-1 rounded bg-gray-700 text-white"
          />
          <button
            onClick={handleAddCommentator}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        
        <div className="space-y-2">
          {commentators.map((commentator) => (
            <div
              key={commentator.id}
              className="flex items-center justify-between bg-gray-700 p-2 rounded"
            >
              <span className="text-white">{commentator.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleCommentator(commentator.id, commentator.isActive)}
                  className={`px-2 py-1 rounded ${
                    commentator.isActive
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  {commentator.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => handleDeleteCommentator(commentator.id)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 