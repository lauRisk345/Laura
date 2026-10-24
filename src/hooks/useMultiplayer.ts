import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RoomState,
  GameMode,
  ChatMessage,
  ServerMessage,
  ClientMessage,
} from '../types/game';
import { soundManager } from '../utils/sound';
import confetti from 'canvas-confetti';

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  senderColor: string;
  x: number;
}

export function useMultiplayer() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [publicRooms, setPublicRooms] = useState<{
    roomId: string;
    roomName: string;
    gameMode: GameMode;
    playerCount: number;
    maxPlayers: number;
    isPrivate: boolean;
    status: string;
  }[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [typers, setTypers] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState<string>('');

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);
        // Ask for public rooms list
        ws.send(JSON.stringify({ type: 'get_rooms' } satisfies ClientMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data: ServerMessage = JSON.parse(event.data);

          switch (data.type) {
            case 'room_state': {
              setRoom(data.room);
              // Infer our player ID if not set
              break;
            }

            case 'rooms_list': {
              setPublicRooms(data.rooms);
              break;
            }

            case 'chat_message': {
              setRoom((prev) => {
                if (!prev) return prev;
                // Idempotent deduplication by id
                if (prev.messages.some((m) => m.id === data.message.id)) {
                  return prev;
                }
                return {
                  ...prev,
                  messages: [...prev.messages, data.message],
                };
              });
              if (!data.message.isSystem) {
                soundManager.playSound('chat');
              }
              break;
            }

            case 'floating_reaction': {
              const newReaction: FloatingReaction = {
                id: 'react_' + Math.random().toString(36).substring(2, 9),
                emoji: data.emoji,
                senderName: data.senderName,
                senderColor: data.senderColor,
                x: 20 + Math.random() * 60, // percentage 20-80%
              };
              setFloatingReactions((prev) => [...prev, newReaction]);
              setTimeout(() => {
                setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
              }, 2500);
              break;
            }

            case 'typing_update': {
              setTypers(data.typers);
              break;
            }

            case 'sound_trigger': {
              soundManager.playSound(data.sound);
              if (data.sound === 'win') {
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              }
              break;
            }

            case 'error': {
              setErrorMessage(data.message);
              setTimeout(() => setErrorMessage(null), 5000);
              break;
            }
          }
        } catch (err) {
          console.error('Error handling server message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    } catch (e) {
      console.error('Could not connect to WebSocket:', e);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const createRoom = useCallback(
    (roomName: string, gameMode: GameMode, isPrivate: boolean, maxPlayers: number, playerName: string, avatar: string, color: string) => {
      send({
        type: 'create_room',
        roomName,
        gameMode,
        isPrivate,
        maxPlayers,
        playerName,
        avatar,
        color,
      });
    },
    [send]
  );

  const joinRoom = useCallback(
    (roomId: string, playerName: string, avatar: string, color: string) => {
      send({
        type: 'join_room',
        roomId,
        playerName,
        avatar,
        color,
      });
    },
    [send]
  );

  const leaveRoom = useCallback(() => {
    send({ type: 'leave_room' });
    setRoom(null);
  }, [send]);

  const setReady = useCallback(
    (isReady: boolean) => {
      send({ type: 'set_ready', isReady });
    },
    [send]
  );

  const changeMode = useCallback(
    (gameMode: GameMode) => {
      send({ type: 'change_mode', gameMode });
    },
    [send]
  );

  const addBot = useCallback(() => {
    send({ type: 'add_bot' });
  }, [send]);

  const removeBot = useCallback(
    (botId: string) => {
      send({ type: 'remove_bot', botId });
    },
    [send]
  );

  const startGame = useCallback(() => {
    send({ type: 'start_game' });
  }, [send]);

  const restartGame = useCallback(() => {
    send({ type: 'restart_game' });
  }, [send]);

  const sendChat = useCallback(
    (text: string) => {
      send({ type: 'send_chat', text });
    },
    [send]
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      send({ type: 'send_reaction', emoji });
    },
    [send]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      send({ type: 'typing', isTyping });
    },
    [send]
  );

  const submitMatrixAnswer = useCallback(
    (optionId: string) => {
      send({ type: 'matrix_answer', optionId });
    },
    [send]
  );

  const dropConnect4Chip = useCallback(
    (col: number) => {
      send({ type: 'connect4_drop', col });
    },
    [send]
  );

  const resetConnect4 = useCallback(() => {
    send({ type: 'connect4_reset' });
  }, [send]);

  const submitTriviaAnswer = useCallback(
    (optionIndex: number) => {
      send({ type: 'trivia_answer', optionIndex });
    },
    [send]
  );

  const refreshRooms = useCallback(() => {
    send({ type: 'get_rooms' });
  }, [send]);

  return {
    isConnected,
    room,
    publicRooms,
    errorMessage,
    floatingReactions,
    typers,
    playerId,
    setPlayerId,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    changeMode,
    addBot,
    removeBot,
    startGame,
    restartGame,
    sendChat,
    sendReaction,
    setTyping,
    submitMatrixAnswer,
    dropConnect4Chip,
    resetConnect4,
    submitTriviaAnswer,
    refreshRooms,
  };
}
