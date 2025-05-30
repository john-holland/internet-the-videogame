import { useEffect, useRef, useCallback, useState } from 'react';
import { Commentator } from '@/server/services/CommentatorService';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketHook {
  sendMessage: (message: WebSocketMessage) => void;
  isConnected: boolean;
  commentators: Commentator[];
  onCommentatorUpdate?: (commentators: Commentator[]) => void;
  lastMessage: WebSocketMessage | null;
}

export const useWebSocket = (
  url: string = 'ws://localhost:3000',
  onCommentatorUpdate?: (commentators: Commentator[]) => void
): WebSocketHook => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [commentators, setCommentators] = useState<Commentator[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'commentators_list':
          setCommentators(data.commentators);
          onCommentatorUpdate?.(data.commentators);
          break;

        case 'commentator_added':
          setCommentators((prev) => [...prev, data.commentator]);
          onCommentatorUpdate?.([...commentators, data.commentator]);
          break;

        case 'commentator_updated':
          setCommentators((prev) =>
            prev.map((c) =>
              c.id === data.commentator.id ? data.commentator : c
            )
          );
          onCommentatorUpdate?.(
            commentators.map((c) =>
              c.id === data.commentator.id ? data.commentator : c
            )
          );
          break;

        case 'commentator_deleted':
          setCommentators((prev) =>
            prev.filter((c) => c.id !== data.commentatorId)
          );
          onCommentatorUpdate?.(
            commentators.filter((c) => c.id !== data.commentatorId)
          );
          break;
      }

      try {
        setLastMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onCommentatorUpdate]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  return { sendMessage, isConnected, commentators, lastMessage };
}; 