import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { MATRIX_ROUNDS_POOL } from './src/data/matrixQuestions.ts';
import { TRIVIA_QUESTIONS_POOL } from './src/data/triviaQuestions.ts';
import {
  GameMode,
  Player,
  RoomState,
  ClientMessage,
  ServerMessage,
  ChatMessage,
  MatrixGameState,
  Connect4GameState,
  TriviaGameState,
} from './src/types/game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// In-memory rooms and socket mappings
const rooms = new Map<string, RoomState>();
const socketMeta = new Map<WebSocket, { playerId: string; roomId?: string; name: string }>();
const typingUsers = new Map<string, Set<string>>(); // roomId -> Set of player names
const roomIntervals = new Map<string, NodeJS.Timeout>();

// Bot avatar list
const BOT_NAMES = ['MatrixBot_AI', 'Cortex_Bot', 'Turing_AI', 'DataBot_Pro'];
const BOT_AVATARS = ['🤖', '🦾', '🧠', '👾'];

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(result) ? generateRoomId() : result;
}

function broadcastToRoom(roomId: string, message: ServerMessage) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const meta = socketMeta.get(client);
      if (meta && meta.roomId === roomId) {
        client.send(payload);
      }
    }
  });
}

function broadcastSoundToRoom(roomId: string, sound: 'start' | 'win' | 'lose' | 'drop' | 'correct' | 'wrong' | 'tick') {
  broadcastToRoom(roomId, { type: 'sound_trigger', sound });
}

function getPublicRoomsList() {
  const list: { roomId: string; roomName: string; gameMode: GameMode; playerCount: number; maxPlayers: number; isPrivate: boolean; status: string }[] = [];
  rooms.forEach((room) => {
    if (!room.isPrivate) {
      list.push({
        roomId: room.roomId,
        roomName: room.roomName,
        gameMode: room.gameMode,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        isPrivate: room.isPrivate,
        status: room.status,
      });
    }
  });
  return list;
}

function broadcastRoomsList() {
  const list = getPublicRoomsList();
  const payload = JSON.stringify({ type: 'rooms_list', rooms: list } satisfies ServerMessage);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const meta = socketMeta.get(client);
      if (!meta || !meta.roomId) {
        client.send(payload);
      }
    }
  });
}

// Check Connect 4 Board win condition
function checkConnect4Win(board: (string | null)[][]): { winnerId: string; winningLine: [number, number][] } | null {
  const ROWS = 6;
  const COLS = 7;

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const p = board[r][c];
      if (p && p === board[r][c + 1] && p === board[r][c + 2] && p === board[r][c + 3]) {
        return {
          winnerId: p,
          winningLine: [[r, c], [r, c + 1], [r, c + 2], [r, c + 3]],
        };
      }
    }
  }

  // Vertical
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p === board[r + 1][c] && p === board[r + 2][c] && p === board[r + 3][c]) {
        return {
          winnerId: p,
          winningLine: [[r, c], [r + 1, c], [r + 2, c], [r + 3, c]],
        };
      }
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const p = board[r][c];
      if (p && p === board[r + 1][c + 1] && p === board[r + 2][c + 2] && p === board[r + 3][c + 3]) {
        return {
          winnerId: p,
          winningLine: [[r, c], [r + 1, c + 1], [r + 2, c + 2], [r + 3, c + 3]],
        };
      }
    }
  }

  // Diagonal Up-Right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      const p = board[r][c];
      if (p && p === board[r - 1][c + 1] && p === board[r - 2][c + 2] && p === board[r - 3][c + 3]) {
        return {
          winnerId: p,
          winningLine: [[r, c], [r - 1, c + 1], [r - 2, c + 2], [r - 3, c + 3]],
        };
      }
    }
  }

  return null;
}

function isConnect4Full(board: (string | null)[][]): boolean {
  return board[0].every((cell) => cell !== null);
}

// Bot AI move for Connect 4
function getBestBotMove(board: (string | null)[][], botId: string, opponentId: string): number {
  const COLS = 7;
  const ROWS = 6;

  const validCols: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) validCols.push(c);
  }
  if (validCols.length === 0) return 0;

  // 1. Can bot win in one move?
  for (const c of validCols) {
    const copy = board.map((row) => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (copy[r][c] === null) {
        copy[r][c] = botId;
        break;
      }
    }
    if (checkConnect4Win(copy)?.winnerId === botId) {
      return c;
    }
  }

  // 2. Can opponent win in one move? Block it!
  for (const c of validCols) {
    const copy = board.map((row) => [...row]);
    for (let r = ROWS - 1; r >= 0; r--) {
      if (copy[r][c] === null) {
        copy[r][c] = opponentId;
        break;
      }
    }
    if (checkConnect4Win(copy)?.winnerId === opponentId) {
      return c;
    }
  }

  // 3. Prefer center column if available (column 3)
  if (validCols.includes(3)) {
    return 3;
  }

  // 4. Fallback random among valid
  return validCols[Math.floor(Math.random() * validCols.length)];
}

// Matrix Game Loop & Round Timer
function startMatrixGame(room: RoomState) {
  const shuffledRounds = [...MATRIX_ROUNDS_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
  room.status = 'playing';
  room.matrixState = {
    roundIndex: 0,
    totalRounds: shuffledRounds.length,
    currentRound: shuffledRounds[0],
    roundStartTime: Date.now(),
    timeRemaining: shuffledRounds[0].timeLimit,
    status: 'in_progress',
    playerAnswers: {},
    scores: {},
  };
  room.players.forEach((p) => {
    room.matrixState!.scores[p.id] = 0;
    p.score = 0;
    p.streak = 0;
  });

  broadcastSoundToRoom(room.roomId, 'start');
  broadcastToRoom(room.roomId, { type: 'room_state', room });

  runMatrixRoundTimer(room.roomId, shuffledRounds);
}

function runMatrixRoundTimer(roomId: string, rounds: typeof MATRIX_ROUNDS_POOL) {
  // Clear any existing timer
  if (roomIntervals.has(roomId)) {
    clearInterval(roomIntervals.get(roomId)!);
  }

  // Check if bot needs to answer after delay
  const room = rooms.get(roomId);
  if (room && room.matrixState) {
    const bots = room.players.filter((p) => p.isBot);
    bots.forEach((bot) => {
      const delay = 2000 + Math.random() * 4000;
      setTimeout(() => {
        const curRoom = rooms.get(roomId);
        if (curRoom && curRoom.matrixState && curRoom.matrixState.status === 'in_progress' && !curRoom.matrixState.playerAnswers[bot.id]) {
          const currentRound = curRoom.matrixState.currentRound;
          if (currentRound) {
            // 85% bot accuracy
            const willBeCorrect = Math.random() < 0.85;
            let chosenOption = currentRound.correctOptionId;
            if (!willBeCorrect) {
              const wrongOptions = currentRound.options.filter((o) => o.id !== currentRound.correctOptionId);
              chosenOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)].id;
            }
            handleMatrixAnswer(curRoom, bot.id, chosenOption);
          }
        }
      }, delay);
    });
  }

  const interval = setInterval(() => {
    const r = rooms.get(roomId);
    if (!r || !r.matrixState) {
      clearInterval(interval);
      return;
    }

    if (r.matrixState.status === 'in_progress') {
      r.matrixState.timeRemaining -= 1;
      if (r.matrixState.timeRemaining <= 3 && r.matrixState.timeRemaining > 0) {
        broadcastSoundToRoom(roomId, 'tick');
      }

      // Check if all players have answered or time expired
      const totalPlayers = r.players.length;
      const answeredCount = Object.keys(r.matrixState.playerAnswers).length;
      if (r.matrixState.timeRemaining <= 0 || answeredCount >= totalPlayers) {
        // Move to recap
        r.matrixState.status = 'round_recap';
        r.matrixState.timeRemaining = 5; // 5 seconds review
        broadcastToRoom(roomId, { type: 'room_state', room: r });
      } else {
        broadcastToRoom(roomId, { type: 'room_state', room: r });
      }
    } else if (r.matrixState.status === 'round_recap') {
      r.matrixState.timeRemaining -= 1;
      if (r.matrixState.timeRemaining <= 0) {
        // Next round or finish
        const nextIndex = r.matrixState.roundIndex + 1;
        if (nextIndex < rounds.length) {
          r.matrixState.roundIndex = nextIndex;
          r.matrixState.currentRound = rounds[nextIndex];
          r.matrixState.roundStartTime = Date.now();
          r.matrixState.timeRemaining = rounds[nextIndex].timeLimit;
          r.matrixState.status = 'in_progress';
          r.matrixState.playerAnswers = {};
          broadcastToRoom(roomId, { type: 'room_state', room: r });

          // Run bot answer for next round
          const bots = r.players.filter((p) => p.isBot);
          bots.forEach((bot) => {
            const delay = 2000 + Math.random() * 4000;
            setTimeout(() => {
              const curRoom = rooms.get(roomId);
              if (curRoom && curRoom.matrixState && curRoom.matrixState.status === 'in_progress' && !curRoom.matrixState.playerAnswers[bot.id]) {
                const currentRound = curRoom.matrixState.currentRound;
                if (currentRound) {
                  const willBeCorrect = Math.random() < 0.85;
                  let chosenOption = currentRound.correctOptionId;
                  if (!willBeCorrect) {
                    const wrong = currentRound.options.filter((o) => o.id !== currentRound.correctOptionId);
                    chosenOption = wrong[Math.floor(Math.random() * wrong.length)].id;
                  }
                  handleMatrixAnswer(curRoom, bot.id, chosenOption);
                }
              }
            }, delay);
          });
        } else {
          // Game Over!
          r.matrixState.status = 'game_over';
          r.status = 'ended';
          let highestScore = -1;
          let winnerId = '';
          r.players.forEach((p) => {
            if (p.score > highestScore) {
              highestScore = p.score;
              winnerId = p.id;
            }
          });
          r.matrixState.winnerId = winnerId;
          clearInterval(interval);
          broadcastSoundToRoom(roomId, 'win');
          broadcastToRoom(roomId, { type: 'room_state', room: r });
        }
      } else {
        broadcastToRoom(roomId, { type: 'room_state', room: r });
      }
    }
  }, 1000);

  roomIntervals.set(roomId, interval);
}

function handleMatrixAnswer(room: RoomState, playerId: string, optionId: string) {
  if (!room.matrixState || room.matrixState.status !== 'in_progress') return;
  if (room.matrixState.playerAnswers[playerId]) return; // already answered

  const currentRound = room.matrixState.currentRound;
  if (!currentRound) return;

  const isCorrect = optionId === currentRound.correctOptionId;
  const elapsed = (Date.now() - room.matrixState.roundStartTime) / 1000;
  const speedBonus = Math.max(0, Math.floor((currentRound.timeLimit - elapsed) * 10));
  const basePoints = isCorrect ? 100 : 0;

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    if (isCorrect) {
      player.streak = (player.streak || 0) + 1;
      const streakBonus = (player.streak - 1) * 20;
      const points = basePoints + speedBonus + streakBonus;
      player.score += points;
      room.matrixState.scores[playerId] = player.score;
      room.matrixState.playerAnswers[playerId] = {
        optionId,
        answeredAt: Date.now(),
        isCorrect: true,
        pointsEarned: points,
      };
    } else {
      player.streak = 0;
      room.matrixState.playerAnswers[playerId] = {
        optionId,
        answeredAt: Date.now(),
        isCorrect: false,
        pointsEarned: 0,
      };
    }
  }

  // Check if all players answered
  const allAnswered = room.players.every((p) => room.matrixState!.playerAnswers[p.id] !== undefined);
  if (allAnswered) {
    room.matrixState.status = 'round_recap';
    room.matrixState.timeRemaining = 5;
  }

  broadcastToRoom(room.roomId, { type: 'room_state', room });
}

// Trivia Game Loop
function startTriviaGame(room: RoomState) {
  const shuffledQuestions = [...TRIVIA_QUESTIONS_POOL].sort(() => Math.random() - 0.5);
  room.status = 'playing';
  room.triviaState = {
    questionIndex: 0,
    totalQuestions: shuffledQuestions.length,
    currentQuestion: shuffledQuestions[0],
    roundStartTime: Date.now(),
    timeRemaining: shuffledQuestions[0].timeLimit,
    status: 'in_progress',
    playerAnswers: {},
    scores: {},
  };
  room.players.forEach((p) => {
    room.triviaState!.scores[p.id] = 0;
    p.score = 0;
    p.streak = 0;
  });

  broadcastSoundToRoom(room.roomId, 'start');
  broadcastToRoom(room.roomId, { type: 'room_state', room });

  runTriviaTimer(room.roomId, shuffledQuestions);
}

function runTriviaTimer(roomId: string, questions: typeof TRIVIA_QUESTIONS_POOL) {
  if (roomIntervals.has(roomId)) {
    clearInterval(roomIntervals.get(roomId)!);
  }

  const room = rooms.get(roomId);
  if (room && room.triviaState) {
    const bots = room.players.filter((p) => p.isBot);
    bots.forEach((bot) => {
      const delay = 2000 + Math.random() * 3000;
      setTimeout(() => {
        const curRoom = rooms.get(roomId);
        if (curRoom && curRoom.triviaState && curRoom.triviaState.status === 'in_progress' && !curRoom.triviaState.playerAnswers[bot.id]) {
          const q = curRoom.triviaState.currentQuestion;
          if (q) {
            const isCorrect = Math.random() < 0.8;
            const chosen = isCorrect ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
            handleTriviaAnswer(curRoom, bot.id, chosen);
          }
        }
      }, delay);
    });
  }

  const interval = setInterval(() => {
    const r = rooms.get(roomId);
    if (!r || !r.triviaState) {
      clearInterval(interval);
      return;
    }

    if (r.triviaState.status === 'in_progress') {
      r.triviaState.timeRemaining -= 1;
      if (r.triviaState.timeRemaining <= 3 && r.triviaState.timeRemaining > 0) {
        broadcastSoundToRoom(roomId, 'tick');
      }

      const totalPlayers = r.players.length;
      const answeredCount = Object.keys(r.triviaState.playerAnswers).length;
      if (r.triviaState.timeRemaining <= 0 || answeredCount >= totalPlayers) {
        r.triviaState.status = 'round_recap';
        r.triviaState.timeRemaining = 4;
        broadcastToRoom(roomId, { type: 'room_state', room: r });
      } else {
        broadcastToRoom(roomId, { type: 'room_state', room: r });
      }
    } else if (r.triviaState.status === 'round_recap') {
      r.triviaState.timeRemaining -= 1;
      if (r.triviaState.timeRemaining <= 0) {
        const nextIndex = r.triviaState.questionIndex + 1;
        if (nextIndex < questions.length) {
          r.triviaState.questionIndex = nextIndex;
          r.triviaState.currentQuestion = questions[nextIndex];
          r.triviaState.roundStartTime = Date.now();
          r.triviaState.timeRemaining = questions[nextIndex].timeLimit;
          r.triviaState.status = 'in_progress';
          r.triviaState.playerAnswers = {};
          broadcastToRoom(roomId, { type: 'room_state', room: r });

          // Bot answers for next round
          const bots = r.players.filter((p) => p.isBot);
          bots.forEach((bot) => {
            const delay = 2000 + Math.random() * 3000;
            setTimeout(() => {
              const curRoom = rooms.get(roomId);
              if (curRoom && curRoom.triviaState && curRoom.triviaState.status === 'in_progress' && !curRoom.triviaState.playerAnswers[bot.id]) {
                const q = curRoom.triviaState.currentQuestion;
                if (q) {
                  const isCorrect = Math.random() < 0.8;
                  const chosen = isCorrect ? q.correctIndex : (q.correctIndex + 1) % q.options.length;
                  handleTriviaAnswer(curRoom, bot.id, chosen);
                }
              }
            }, delay);
          });
        } else {
          r.triviaState.status = 'game_over';
          r.status = 'ended';
          let highest = -1;
          let winId = '';
          r.players.forEach((p) => {
            if (p.score > highest) {
              highest = p.score;
              winId = p.id;
            }
          });
          r.triviaState.winnerId = winId;
          clearInterval(interval);
          broadcastSoundToRoom(roomId, 'win');
          broadcastToRoom(roomId, { type: 'room_state', room: r });
        }
      } else {
        broadcastToRoom(roomId, { type: 'room_state', room: r });
      }
    }
  }, 1000);

  roomIntervals.set(roomId, interval);
}

function handleTriviaAnswer(room: RoomState, playerId: string, optionIndex: number) {
  if (!room.triviaState || room.triviaState.status !== 'in_progress') return;
  if (room.triviaState.playerAnswers[playerId]) return;

  const q = room.triviaState.currentQuestion;
  if (!q) return;

  const isCorrect = optionIndex === q.correctIndex;
  const elapsed = (Date.now() - room.triviaState.roundStartTime) / 1000;
  const speedBonus = Math.max(0, Math.floor((q.timeLimit - elapsed) * 10));
  const basePoints = isCorrect ? 100 : 0;

  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    if (isCorrect) {
      player.streak = (player.streak || 0) + 1;
      const points = basePoints + speedBonus + (player.streak - 1) * 20;
      player.score += points;
      room.triviaState.scores[playerId] = player.score;
      room.triviaState.playerAnswers[playerId] = {
        optionIndex,
        answeredAt: Date.now(),
        isCorrect: true,
        pointsEarned: points,
      };
    } else {
      player.streak = 0;
      room.triviaState.playerAnswers[playerId] = {
        optionIndex,
        answeredAt: Date.now(),
        isCorrect: false,
        pointsEarned: 0,
      };
    }
  }

  const allAnswered = room.players.every((p) => room.triviaState!.playerAnswers[p.id] !== undefined);
  if (allAnswered) {
    room.triviaState.status = 'round_recap';
    room.triviaState.timeRemaining = 4;
  }

  broadcastToRoom(room.roomId, { type: 'room_state', room });
}

// Connect 4 Game Initialization
function startConnect4Game(room: RoomState) {
  if (room.players.length < 2) return;

  const p1 = room.players[0].id;
  const p2 = room.players[1].id;

  const emptyBoard: (string | null)[][] = Array(6)
    .fill(null)
    .map(() => Array(7).fill(null));

  room.status = 'playing';
  room.connect4State = {
    board: emptyBoard,
    currentTurnPlayerId: p1,
    player1Id: p1,
    player2Id: p2,
    status: 'in_progress',
    turnTimeRemaining: 30,
  };

  broadcastSoundToRoom(room.roomId, 'start');
  broadcastToRoom(room.roomId, { type: 'room_state', room });

  // If p1 is a bot (unlikely but possible), let bot move
  checkAndTriggerBotConnect4(room);
}

function handleConnect4Drop(room: RoomState, playerId: string, col: number) {
  if (!room.connect4State || room.connect4State.status !== 'in_progress') return;
  if (room.connect4State.currentTurnPlayerId !== playerId) return;
  if (col < 0 || col > 6) return;

  const board = room.connect4State.board;
  if (board[0][col] !== null) return; // Column is full

  // Find lowest available row
  let targetRow = -1;
  for (let r = 5; r >= 0; r--) {
    if (board[r][col] === null) {
      targetRow = r;
      break;
    }
  }
  if (targetRow === -1) return;

  board[targetRow][col] = playerId;
  broadcastSoundToRoom(room.roomId, 'drop');

  // Check Win
  const winResult = checkConnect4Win(board);
  if (winResult) {
    room.connect4State.status = 'won';
    room.connect4State.winnerId = winResult.winnerId;
    room.connect4State.winningLine = winResult.winningLine;
    room.status = 'ended';

    const winner = room.players.find((p) => p.id === winResult.winnerId);
    if (winner) {
      winner.score += 300;
    }

    broadcastSoundToRoom(room.roomId, 'win');
    broadcastToRoom(room.roomId, { type: 'room_state', room });
    return;
  }

  // Check Draw
  if (isConnect4Full(board)) {
    room.connect4State.status = 'draw';
    room.status = 'ended';
    broadcastToRoom(room.roomId, { type: 'room_state', room });
    return;
  }

  // Next player's turn
  const nextPlayerId =
    room.connect4State.currentTurnPlayerId === room.connect4State.player1Id
      ? room.connect4State.player2Id
      : room.connect4State.player1Id;

  room.connect4State.currentTurnPlayerId = nextPlayerId;
  room.connect4State.turnTimeRemaining = 30;

  broadcastToRoom(room.roomId, { type: 'room_state', room });

  // Trigger bot move if next player is bot
  checkAndTriggerBotConnect4(room);
}

function checkAndTriggerBotConnect4(room: RoomState) {
  if (!room.connect4State || room.connect4State.status !== 'in_progress') return;
  const currentId = room.connect4State.currentTurnPlayerId;
  const currentPlayer = room.players.find((p) => p.id === currentId);

  if (currentPlayer && currentPlayer.isBot) {
    const opponentId =
      currentId === room.connect4State.player1Id
        ? room.connect4State.player2Id
        : room.connect4State.player1Id;

    setTimeout(() => {
      const curRoom = rooms.get(room.roomId);
      if (curRoom && curRoom.connect4State && curRoom.connect4State.currentTurnPlayerId === currentId) {
        const bestCol = getBestBotMove(curRoom.connect4State.board, currentId, opponentId);
        handleConnect4Drop(curRoom, currentId, bestCol);
      }
    }, 900);
  }
}

// WebSocket Connection handling
wss.on('connection', (ws: WebSocket) => {
  const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
  socketMeta.set(ws, { playerId, name: 'Anónimo' });

  // Send initial room list
  ws.send(JSON.stringify({ type: 'rooms_list', rooms: getPublicRoomsList() } satisfies ServerMessage));

  ws.on('message', (data: Buffer | string) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());
      const meta = socketMeta.get(ws);
      if (!meta) return;

      switch (msg.type) {
        case 'get_rooms': {
          ws.send(JSON.stringify({ type: 'rooms_list', rooms: getPublicRoomsList() } satisfies ServerMessage));
          break;
        }

        case 'create_room': {
          const roomId = generateRoomId();
          meta.name = msg.playerName.trim() || 'Jugador 1';
          meta.roomId = roomId;

          const hostPlayer: Player = {
            id: meta.playerId,
            name: meta.name,
            avatar: msg.avatar || '🎮',
            color: msg.color || '#3b82f6',
            isHost: true,
            isReady: true,
            score: 0,
            streak: 0,
          };

          const newRoom: RoomState = {
            roomId,
            roomName: msg.roomName.trim() || `Sala de ${meta.name}`,
            gameMode: msg.gameMode,
            isPrivate: msg.isPrivate,
            maxPlayers: msg.maxPlayers || 4,
            hostId: meta.playerId,
            status: 'lobby',
            players: [hostPlayer],
            messages: [
              {
                id: 'sys_' + Date.now(),
                senderId: 'system',
                senderName: 'Sistema',
                senderColor: '#6b7280',
                senderAvatar: '⚡',
                text: `¡Bienvenido a ${msg.roomName || 'la sala'}! Comparte el código [${roomId}] con tus amigos para jugar.`,
                timestamp: Date.now(),
                isSystem: true,
              },
            ],
          };

          rooms.set(roomId, newRoom);
          broadcastRoomsList();
          ws.send(JSON.stringify({ type: 'room_state', room: newRoom } satisfies ServerMessage));
          break;
        }

        case 'join_room': {
          const room = rooms.get(msg.roomId.toUpperCase().trim());
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'La sala especificada no existe.' } satisfies ServerMessage));
            return;
          }

          if (room.players.length >= room.maxPlayers) {
            ws.send(JSON.stringify({ type: 'error', message: 'La sala está completa.' } satisfies ServerMessage));
            return;
          }

          meta.name = msg.playerName.trim() || `Jugador ${room.players.length + 1}`;
          meta.roomId = room.roomId;

          const newPlayer: Player = {
            id: meta.playerId,
            name: meta.name,
            avatar: msg.avatar || '⚡',
            color: msg.color || '#10b981',
            isHost: false,
            isReady: false,
            score: 0,
            streak: 0,
          };

          room.players.push(newPlayer);
          const joinMsg: ChatMessage = {
            id: 'join_' + Date.now(),
            senderId: 'system',
            senderName: 'Sistema',
            senderColor: '#10b981',
            senderAvatar: '👋',
            text: `${newPlayer.name} se unió a la sala.`,
            timestamp: Date.now(),
            isSystem: true,
          };
          room.messages.push(joinMsg);

          broadcastToRoom(room.roomId, { type: 'room_state', room });
          broadcastRoomsList();
          break;
        }

        case 'leave_room': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room) {
            const leavingPlayer = room.players.find((p) => p.id === meta.playerId);
            room.players = room.players.filter((p) => p.id !== meta.playerId);

            if (leavingPlayer) {
              room.messages.push({
                id: 'leave_' + Date.now(),
                senderId: 'system',
                senderName: 'Sistema',
                senderColor: '#ef4444',
                senderAvatar: '🚪',
                text: `${leavingPlayer.name} ha salido de la sala.`,
                timestamp: Date.now(),
                isSystem: true,
              });
            }

            // Transfer host or delete room if empty of humans
            const humanPlayers = room.players.filter((p) => !p.isBot);
            if (humanPlayers.length === 0) {
              if (roomIntervals.has(room.roomId)) {
                clearInterval(roomIntervals.get(room.roomId)!);
                roomIntervals.delete(room.roomId);
              }
              rooms.delete(room.roomId);
            } else {
              if (room.hostId === meta.playerId) {
                room.hostId = humanPlayers[0].id;
                humanPlayers[0].isHost = true;
                humanPlayers[0].isReady = true;
              }
              broadcastToRoom(room.roomId, { type: 'room_state', room });
            }
          }
          meta.roomId = undefined;
          broadcastRoomsList();
          break;
        }

        case 'set_ready': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room) {
            const player = room.players.find((p) => p.id === meta.playerId);
            if (player) {
              player.isReady = msg.isReady;
              broadcastToRoom(room.roomId, { type: 'room_state', room });
            }
          }
          break;
        }

        case 'change_mode': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room && room.hostId === meta.playerId && room.status === 'lobby') {
            room.gameMode = msg.gameMode;
            room.messages.push({
              id: 'mode_' + Date.now(),
              senderId: 'system',
              senderName: 'Sistema',
              senderColor: '#8b5cf6',
              senderAvatar: '🎮',
              text: `El anfitrión cambió el modo a: ${
                msg.gameMode === 'matrix'
                  ? 'Batalla de Matriz de Confusión'
                  : msg.gameMode === 'connect4'
                  ? 'Conecta 4 Galáctico'
                  : 'Duelo Trivia Express'
              }.`,
              timestamp: Date.now(),
              isSystem: true,
            });
            broadcastToRoom(room.roomId, { type: 'room_state', room });
            broadcastRoomsList();
          }
          break;
        }

        case 'add_bot': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room && room.hostId === meta.playerId && room.players.length < room.maxPlayers) {
            const botIdx = room.players.filter((p) => p.isBot).length;
            const botName = BOT_NAMES[botIdx % BOT_NAMES.length];
            const botAvatar = BOT_AVATARS[botIdx % BOT_AVATARS.length];
            const botPlayer: Player = {
              id: 'bot_' + Math.random().toString(36).substring(2, 7),
              name: botName,
              avatar: botAvatar,
              color: '#8b5cf6',
              isHost: false,
              isReady: true,
              score: 0,
              streak: 0,
              isBot: true,
            };
            room.players.push(botPlayer);
            room.messages.push({
              id: 'bot_join_' + Date.now(),
              senderId: 'system',
              senderName: 'Sistema',
              senderColor: '#8b5cf6',
              senderAvatar: '🤖',
              text: `¡${botName} ha sido incorporado como rival de IA!`,
              timestamp: Date.now(),
              isSystem: true,
            });
            broadcastToRoom(room.roomId, { type: 'room_state', room });
            broadcastRoomsList();
          }
          break;
        }

        case 'remove_bot': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room && room.hostId === meta.playerId) {
            room.players = room.players.filter((p) => p.id !== msg.botId);
            broadcastToRoom(room.roomId, { type: 'room_state', room });
            broadcastRoomsList();
          }
          break;
        }

        case 'start_game': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room && room.hostId === meta.playerId) {
            if (room.gameMode === 'matrix') {
              startMatrixGame(room);
            } else if (room.gameMode === 'connect4') {
              if (room.players.length < 2) {
                ws.send(JSON.stringify({ type: 'error', message: 'Conecta 4 necesita al menos 2 jugadores (puedes añadir un Bot IA).' } satisfies ServerMessage));
                return;
              }
              startConnect4Game(room);
            } else if (room.gameMode === 'trivia') {
              startTriviaGame(room);
            }
          }
          break;
        }

        case 'restart_game': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room && room.hostId === meta.playerId) {
            room.status = 'lobby';
            room.matrixState = undefined;
            room.connect4State = undefined;
            room.triviaState = undefined;
            room.players.forEach((p) => {
              p.isReady = p.isBot ? true : p.isHost;
              p.score = 0;
              p.streak = 0;
            });
            broadcastToRoom(room.roomId, { type: 'room_state', room });
          }
          break;
        }

        case 'send_chat': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room && msg.text.trim()) {
            const player = room.players.find((p) => p.id === meta.playerId);
            const chatMsg: ChatMessage = {
              id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 5),
              senderId: meta.playerId,
              senderName: player?.name || meta.name,
              senderColor: player?.color || '#3b82f6',
              senderAvatar: player?.avatar || '👤',
              text: msg.text.trim().slice(0, 300),
              timestamp: Date.now(),
            };
            room.messages.push(chatMsg);
            if (room.messages.length > 100) room.messages.shift();

            broadcastToRoom(room.roomId, { type: 'chat_message', message: chatMsg });

            // Occasional friendly reaction from bot in chat
            const bot = room.players.find((p) => p.isBot);
            if (bot && Math.random() < 0.35) {
              setTimeout(() => {
                const botResponses = [
                  '¡Buena jugada!',
                  'Calculando vector óptimo... 🤖',
                  '¡La precisión lo es todo!',
                  '¡Desafío aceptado! 🔥',
                  'Revisa bien la matriz de confusión 😉',
                ];
                const botMsg: ChatMessage = {
                  id: 'msg_' + Date.now(),
                  senderId: bot.id,
                  senderName: bot.name,
                  senderColor: bot.color,
                  senderAvatar: bot.avatar,
                  text: botResponses[Math.floor(Math.random() * botResponses.length)],
                  timestamp: Date.now(),
                };
                room.messages.push(botMsg);
                broadcastToRoom(room.roomId, { type: 'chat_message', message: botMsg });
              }, 1200);
            }
          }
          break;
        }

        case 'send_reaction': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room) {
            const player = room.players.find((p) => p.id === meta.playerId);
            broadcastToRoom(room.roomId, {
              type: 'floating_reaction',
              emoji: msg.emoji,
              senderName: player?.name || meta.name,
              senderColor: player?.color || '#3b82f6',
            });
          }
          break;
        }

        case 'typing': {
          if (!meta.roomId) return;
          if (!typingUsers.has(meta.roomId)) {
            typingUsers.set(meta.roomId, new Set());
          }
          const roomTypers = typingUsers.get(meta.roomId)!;
          if (msg.isTyping) {
            roomTypers.add(meta.name);
          } else {
            roomTypers.delete(meta.name);
          }
          broadcastToRoom(meta.roomId, {
            type: 'typing_update',
            typers: Array.from(roomTypers).filter((n) => n !== meta.name),
          });
          break;
        }

        case 'matrix_answer': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room) {
            handleMatrixAnswer(room, meta.playerId, msg.optionId);
          }
          break;
        }

        case 'connect4_drop': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room) {
            handleConnect4Drop(room, meta.playerId, msg.col);
          }
          break;
        }

        case 'connect4_reset': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room && room.hostId === meta.playerId) {
            startConnect4Game(room);
          }
          break;
        }

        case 'trivia_answer': {
          if (!meta.roomId) return;
          const room = rooms.get(meta.roomId);
          if (room) {
            handleTriviaAnswer(room, meta.playerId, msg.optionIndex);
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error parsing client message:', err);
    }
  });

  ws.on('close', () => {
    const meta = socketMeta.get(ws);
    if (meta && meta.roomId) {
      const room = rooms.get(meta.roomId);
      if (room) {
        const leavingPlayer = room.players.find((p) => p.id === meta.playerId);
        room.players = room.players.filter((p) => p.id !== meta.playerId);

        if (leavingPlayer) {
          room.messages.push({
            id: 'dc_' + Date.now(),
            senderId: 'system',
            senderName: 'Sistema',
            senderColor: '#ef4444',
            senderAvatar: '🔌',
            text: `${leavingPlayer.name} se ha desconectado.`,
            timestamp: Date.now(),
            isSystem: true,
          });
        }

        const humanPlayers = room.players.filter((p) => !p.isBot);
        if (humanPlayers.length === 0) {
          if (roomIntervals.has(room.roomId)) {
            clearInterval(roomIntervals.get(room.roomId)!);
            roomIntervals.delete(room.roomId);
          }
          rooms.delete(room.roomId);
        } else {
          if (room.hostId === meta.playerId) {
            room.hostId = humanPlayers[0].id;
            humanPlayers[0].isHost = true;
            humanPlayers[0].isReady = true;
          }
          broadcastToRoom(room.roomId, { type: 'room_state', room });
        }
      }
      broadcastRoomsList();
    }
    socketMeta.delete(ws);
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NexusPlay Server] Online multiplayer server running on port ${PORT}`);
  });
}

startServer();
