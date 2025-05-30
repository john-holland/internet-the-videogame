'use client';

import { useEffect, useRef, useState } from "react";
import { GameState, Player, ContentSource, Answer } from "@/types/game";
import { icpService } from "@/services/icp";
import AudienceVisualization from "@/components/AudienceVisualization";

const IFRAME_URL = "https://web.archive.org/web/20230000000000*/reddit.com";

export default function Home() {
  const [scale, setScale] = useState(1.2);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setScale(1.2 + Math.random() * 0.1);
  }, []);

  useEffect(() => {
    // Subscribe to game state updates
    const unsubscribe = icpService.onGameStateUpdate((state) => {
      setGameState(state);
    });

    return () => {
      unsubscribe();
      icpService.disconnect();
    };
  }, []);

  const handleJoinAsOne = async () => {
    const newPlayer = await icpService.joinGame('player_' + Math.random().toString(36).substr(2, 9));
    setPlayer(newPlayer);
  };

  const handleJoinAudience = async () => {
    const newPlayer = await icpService.joinGame('player_' + Math.random().toString(36).substr(2, 9));
    setPlayer(newPlayer);
  };

  const handleSubmitFake = async (content: string) => {
    if (!player) return;
    await icpService.submitFakeAnswer(player.id, content);
  };

  const handleSelectAnswer = async (index: number) => {
    if (!player || player.role !== 'the_one') return;
    setSelectedAnswer(index);
    setShowResult(true);
    await icpService.selectAnswer(player.id, index);
  };

  const renderGameUI = () => {
    if (!gameState || !player) return null;

    if (player.role === 'the_one') {
      const answers: Answer[] = [
        { ...gameState.currentRound.content, isReal: true },
        ...gameState.currentRound.fakeAnswers.map(fake => ({
          content: fake.content,
          author: fake.author,
          isReal: false
        }))
      ];

      return (
        <div className="flex flex-col gap-6 items-center">
          <div className="text-xl font-bold text-yellow-700">Round {gameState.roundNumber}</div>
          <div className="text-base text-gray-700 dark:text-gray-200 mb-2">
            Pick the real {gameState.currentRound.content.type} content:
          </div>
          <div className="flex flex-col gap-4 w-full">
            {answers.map((answer, idx) => (
              <button
                key={idx}
                className={`p-4 rounded-lg border-2 transition text-left shadow-md font-mono ${
                  selectedAnswer === idx
                    ? answer.isReal
                      ? "border-green-500 bg-green-100"
                      : "border-red-500 bg-red-100"
                    : "border-gray-300 bg-white hover:bg-yellow-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                }`}
                disabled={showResult}
                onClick={() => handleSelectAnswer(idx)}
              >
                <span className="block text-sm text-gray-500 mb-1">
                  {typeof answer.author === 'string' ? answer.author : answer.author.id}
                </span>
                {answer.content}
              </button>
            ))}
          </div>
          {showResult && (
            <div className="mt-4 text-lg font-semibold">
              {selectedAnswer !== null && answers[selectedAnswer].isReal ? (
                <span className="text-green-600">Correct! +1 point</span>
              ) : (
                <span className="text-red-600">Wrong! That was a fake.</span>
              )}
            </div>
          )}
          <div className="mt-2 text-gray-600 dark:text-gray-300">
            Score: {player.score}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 items-center">
        <div className="text-xl font-bold text-blue-700">
          {player.role === 'cohort_100' ? 'Top 100 Cohort' : 'Audience'}
        </div>
        <div className="text-base text-gray-700 dark:text-gray-200 mb-2">
          Submit a fake {gameState.currentRound.content.type} content to fool THE 1!
        </div>
        <input
          className="w-full p-3 rounded border border-gray-300 dark:bg-gray-800 dark:text-white"
          placeholder="Type your fake content..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmitFake((e.target as HTMLInputElement).value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
        />
        <div className="mt-2 text-gray-600 dark:text-gray-300">
          Score: {player.score}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Comic-style, zoomed iframe background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none select-none"
        style={{
          transform: `scale(${scale})`,
          filter: "contrast(1.1) saturate(1.2) grayscale(0.05)",
          transition: "transform 0.5s cubic-bezier(.4,2,.6,1)",
        }}
      >
        <iframe
          ref={iframeRef}
          src={IFRAME_URL}
          title="Internet Background"
          className="w-full h-full border-none pointer-events-none select-none"
          style={{ width: "100vw", height: "100vh" }}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Modal gameplay skin overlay */}
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
        <div className="bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl p-8 max-w-xl w-full border-4 border-yellow-400/80 relative">
          <h1 className="text-3xl font-extrabold mb-4 text-center text-yellow-600 drop-shadow-lg">
            Internet the Video Game
          </h1>
          <p className="text-lg text-gray-800 dark:text-gray-200 mb-6 text-center">
            The internet vs <span className="font-bold text-yellow-700">THE 1</span>.<br />
            Find the real content among the fakes. Audience, try to fool the 1!
          </p>
          {/* Game UI */}
          <div className="flex flex-col gap-4 items-center">
            {!player && (
              <>
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded-full shadow-lg transition"
                  onClick={handleJoinAsOne}
                >
                  Start as THE 1
                </button>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-full shadow transition"
                  onClick={handleJoinAudience}
                >
                  Join Audience
                </button>
              </>
            )}
            {player && renderGameUI()}
          </div>
        </div>
      </div>

      {/* MST3K-style audience visualization */}
      {gameState && (
        <AudienceVisualization
          players={gameState.audienceCohorts.flatMap(cohort => cohort.players)}
          totalAudience={gameState.totalAudience}
        />
      )}
    </div>
  );
}
