import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { Cohort } from '@/types/game';

interface AudienceInteractionProps {
  cohorts: Cohort[];
  onCohortSelect: (cohortId: string) => void;
}

export const AudienceInteraction: React.FC<AudienceInteractionProps> = ({
  cohorts,
  onCohortSelect,
}) => {
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const { sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (selectedCohort) {
      onCohortSelect(selectedCohort);
    }
  }, [selectedCohort, onCohortSelect]);

  const handleReaction = (reaction: string) => {
    if (!user || !selectedCohort) return;

    sendMessage({
      type: 'audience_reaction',
      userId: user.id,
      cohortId: selectedCohort,
      reaction,
    });

    setReactions((prev) => ({
      ...prev,
      [reaction]: (prev[reaction] || 0) + 1,
    }));
  };

  const handleCohortSelect = (cohortId: string) => {
    setSelectedCohort(cohortId);
  };

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-500 text-white p-2 rounded">
        Disconnected from server
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="mb-4">
        <h3 className="text-white text-lg mb-2">Select Cohort</h3>
        <div className="flex flex-wrap gap-2">
          {cohorts.map((cohort) => (
            <button
              key={cohort.id}
              onClick={() => handleCohortSelect(cohort.id)}
              className={`px-3 py-1 rounded ${
                selectedCohort === cohort.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
              }`}
            >
              {cohort.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCohort && (
        <div>
          <h3 className="text-white text-lg mb-2">Reactions</h3>
          <div className="flex gap-2">
            <button
              onClick={() => handleReaction('👍')}
              className="p-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              👍 {reactions['👍'] || 0}
            </button>
            <button
              onClick={() => handleReaction('👎')}
              className="p-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              👎 {reactions['👎'] || 0}
            </button>
            <button
              onClick={() => handleReaction('😂')}
              className="p-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              😂 {reactions['😂'] || 0}
            </button>
            <button
              onClick={() => handleReaction('🤔')}
              className="p-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              🤔 {reactions['🤔'] || 0}
            </button>
          </div>
        </div>
      )}

      {selectedCohort && (
        <div className="mt-4">
          <h3 className="text-white text-lg mb-2">Cohort Stats</h3>
          <div className="text-gray-300">
            <p>Members: {cohorts.find((c) => c.id === selectedCohort)?.members.length}</p>
            <p>Score: {cohorts.find((c) => c.id === selectedCohort)?.score}</p>
            <p>Streak: {cohorts.find((c) => c.id === selectedCohort)?.streak}</p>
          </div>
        </div>
      )}
    </div>
  );
}; 