import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';

export const CommentatorInviteQR: React.FC = () => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();

  useEffect(() => {
    if (user?.isHost) {
      sendMessage({ type: 'generate_invite_code' });
    }
  }, [user, sendMessage]);

  const handleGenerateInvite = () => {
    sendMessage({ type: 'generate_invite_code' });
  };

  if (!user?.isHost) {
    return null;
  }

  const inviteUrl = inviteCode
    ? `${window.location.origin}/commentator-signup?code=${inviteCode}`
    : null;

  return (
    <div className="fixed top-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-white text-lg mb-2">Commentator Invite</h3>
      {inviteUrl ? (
        <div className="flex flex-col items-center">
          <QRCode
            value={inviteUrl}
            size={200}
            level="H"
            includeMargin
            className="mb-2"
          />
          <p className="text-white text-sm mb-2">Scan to sign up as commentator</p>
          <button
            onClick={handleGenerateInvite}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Generate New Code
          </button>
        </div>
      ) : (
        <button
          onClick={handleGenerateInvite}
          className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Generate Invite Code
        </button>
      )}
    </div>
  );
}; 