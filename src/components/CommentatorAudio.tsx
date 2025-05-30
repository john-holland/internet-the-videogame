import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';

interface CommentatorAudioProps {
  commentatorId: string;
  isHost: boolean;
}

export const CommentatorAudio: React.FC<CommentatorAudioProps> = ({ commentatorId, isHost }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isStreaming, setIsStreaming] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          sendMessage({
            type: 'commentator_audio',
            commentatorId,
            audioData: event.data,
          });
        }
      };

      mediaRecorder.start(100); // Send audio data every 100ms
      setIsStreaming(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const handleAudioData = (audioData: Blob) => {
    if (audioRef.current) {
      const audioUrl = URL.createObjectURL(audioData);
      audioRef.current.src = audioUrl;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };

  useEffect(() => {
    // Cleanup function
    return () => {
      if (mediaRecorderRef.current) {
        stopStreaming();
      }
    };
  }, []);

  if (!isHost) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex items-center space-x-4">
        <button
          onClick={handlePlayPause}
          className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-white">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24"
          />
          <span className="text-white">🔊</span>
        </div>

        {user?.isCommentator && (
          <button
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={`p-2 rounded-full ${
              isStreaming ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isStreaming ? '⏹️' : '🎤'}
          </button>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}; 