export type GameMode = 'matrix' | 'connect4' | 'trivia';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  streak: number;
  isBot?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  reaction?: string;
}

export interface MatrixRound {
  id: number;
  type: 'concept' | 'calculation' | 'scenario' | 'matrix_fill';
  title: string;
  prompt: string;
  options: {
    id: string;
    text: string;
    explanation?: string;
  }[];
  correctOptionId: string;
  matrixData?: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    class1Name?: string;
    class2Name?: string;
  };
  explanation: string;
  timeLimit: number;
}

export interface TriviaQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timeLimit: number;
}

export interface MatrixGameState {
  roundIndex: number;
  totalRounds: number;
  currentRound: MatrixRound | null;
  roundStartTime: number;
  timeRemaining: number;
  status: 'waiting' | 'in_progress' | 'round_recap' | 'game_over';
  playerAnswers: Record<string, { optionId: string; answeredAt: number; isCorrect: boolean; pointsEarned: number }>;
  scores: Record<string, number>;
  winnerId?: string;
}

export interface Connect4GameState {
  board: (string | null)[][]; // 6 rows x 7 cols: null or playerId
  currentTurnPlayerId: string;
  player1Id: string;
  player2Id: string;
  status: 'waiting' | 'in_progress' | 'won' | 'draw';
  winnerId?: string;
  winningLine?: [number, number][]; // coordinates of the 4 winning chips
  turnTimeRemaining: number;
}

export interface TriviaGameState {
  questionIndex: number;
  totalQuestions: number;
  currentQuestion: TriviaQuestion | null;
  roundStartTime: number;
  timeRemaining: number;
  status: 'waiting' | 'in_progress' | 'round_recap' | 'game_over';
  playerAnswers: Record<string, { optionIndex: number; answeredAt: number; isCorrect: boolean; pointsEarned: number }>;
  scores: Record<string, number>;
  winnerId?: string;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  gameMode: GameMode;
  isPrivate: boolean;
  passcode?: string;
  maxPlayers: number;
  hostId: string;
  status: 'lobby' | 'playing' | 'ended';
  players: Player[];
  messages: ChatMessage[];
  matrixState?: MatrixGameState;
  connect4State?: Connect4GameState;
  triviaState?: TriviaGameState;
}

// Client to Server Events
export type ClientMessage =
  | { type: 'create_room'; roomName: string; gameMode: GameMode; isPrivate: boolean; maxPlayers: number; playerName: string; avatar: string; color: string }
  | { type: 'join_room'; roomId: string; playerName: string; avatar: string; color: string }
  | { type: 'leave_room' }
  | { type: 'set_ready'; isReady: boolean }
  | { type: 'change_mode'; gameMode: GameMode }
  | { type: 'add_bot' }
  | { type: 'remove_bot'; botId: string }
  | { type: 'start_game' }
  | { type: 'restart_game' }
  | { type: 'send_chat'; text: string }
  | { type: 'send_reaction'; emoji: string }
  | { type: 'typing'; isTyping: boolean }
  // Matrix game actions
  | { type: 'matrix_answer'; optionId: string }
  // Connect 4 actions
  | { type: 'connect4_drop'; col: number }
  | { type: 'connect4_reset' }
  // Trivia actions
  | { type: 'trivia_answer'; optionIndex: number }
  | { type: 'get_rooms' };

// Server to Client Events
export type ServerMessage =
  | { type: 'room_state'; room: RoomState }
  | { type: 'rooms_list'; rooms: { roomId: string; roomName: string; gameMode: GameMode; playerCount: number; maxPlayers: number; isPrivate: boolean; status: string }[] }
  | { type: 'chat_message'; message: ChatMessage }
  | { type: 'floating_reaction'; emoji: string; senderName: string; senderColor: string }
  | { type: 'typing_update'; typers: string[] }
  | { type: 'error'; message: string }
  | { type: 'sound_trigger'; sound: 'start' | 'win' | 'lose' | 'drop' | 'correct' | 'wrong' | 'tick' };
