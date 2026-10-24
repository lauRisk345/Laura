import React, { useState } from 'react';
import { RoomState, GameMode } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';
import { ChatPanel } from './ChatPanel';
import { ConfusionMatrixGame } from './ConfusionMatrixGame';
import { ConnectFourGame } from './ConnectFourGame';
import { TriviaGame } from './TriviaGame';
import { FloatingReaction } from '../hooks/useMultiplayer';
import {
  Copy,
  Check,
  LogOut,
  Play,
  Bot,
  UserCheck,
  Settings,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';

interface Props {
  room: RoomState;
  currentUserId: string;
  typers: string[];
  floatingReactions: FloatingReaction[];
  onLeaveRoom: () => void;
  onSetReady: (isReady: boolean) => void;
  onChangeMode: (mode: GameMode) => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onStartGame: () => void;
  onRestartGame: () => void;
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onTyping: (isTyping: boolean) => void;
  onSubmitMatrixAnswer: (optionId: string) => void;
  onDropConnect4Chip: (col: number) => void;
  onResetConnect4: () => void;
  onSubmitTriviaAnswer: (optionIndex: number) => void;
  onOpenGuide: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const GameRoom: React.FC<Props> = ({
  room,
  currentUserId,
  typers,
  floatingReactions,
  onLeaveRoom,
  onSetReady,
  onChangeMode,
  onAddBot,
  onRemoveBot,
  onStartGame,
  onRestartGame,
  onSendMessage,
  onSendReaction,
  onTyping,
  onSubmitMatrixAnswer,
  onDropConnect4Chip,
  onResetConnect4,
  onSubmitTriviaAnswer,
  onOpenGuide,
  isMuted,
  onToggleMute,
}) => {
  const [copied, setCopied] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const me = room.players.find((p) => p.id === currentUserId);
  const isHost = room.hostId === currentUserId;
  const isLobby = room.status === 'lobby';

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modeLabels: Record<GameMode, string> = {
    matrix: 'Matriz de Confusión (Machine Learning)',
    connect4: 'Conecta 4 Galáctico',
    trivia: 'Duelo Trivia Express',
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col space-y-3">
      {/* Floating Reactions Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-16 animate-float-fade flex flex-col items-center"
            style={{ left: `${r.x}%` }}
          >
            <span className="text-4xl filter drop-shadow-lg">{r.emoji}</span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 shadow-md text-white mt-1 whitespace-nowrap"
              style={{ color: r.senderColor }}
            >
              {r.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Top Room Bar */}
      <header className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base sm:text-lg truncate max-w-[200px] sm:max-w-md">
                {room.roomName}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {modeLabels[room.gameMode]}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Código de sala:</span>
              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1 font-mono font-bold text-indigo-400 hover:text-indigo-300 bg-slate-800 px-2 py-0.5 rounded-md transition-colors"
                title="Copiar código para compartir"
              >
                <span>{room.roomId}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {copied && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">¡Copiado!</span>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Chat Toggle Button */}
          <button
            onClick={() => setMobileChatOpen((prev) => !prev)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-semibold"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat ({room.messages.length})</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guía de Matriz</span>
          </button>

          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
            title="Salir de la sala"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Game Arena (Left) + Chat (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1 min-h-[580px]">
        {/* Game Arena (cols 1-2 or 1-3) */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col">
          {isLobby ? (
            /* LOBBY VIEW */
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-6">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-400" />
                      Jugadores en la Sala ({room.players.length} / {room.maxPlayers})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Esperando que todos los participantes estén listos para comenzar.
                    </p>
                  </div>

                  {isHost && (
                    <div className="flex items-center gap-2">
                      {room.players.length < room.maxPlayers && (
                        <button
                          onClick={onAddBot}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-colors"
                          title="Añadir rival controlado por IA"
                        >
                          <Bot className="w-4 h-4" />
                          <span>+ Añadir Bot IA</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Players Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {room.players.map((p) => {
                    const isBotPlayer = p.isBot;
                    return (
                      <div
                        key={p.id}
                        className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm"
                      >
                        <PlayerAvatar player={p} size="md" showStatus={true} showScore={false} />
                        {isHost && isBotPlayer && (
                          <button
                            onClick={() => onRemoveBot(p.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-500/10"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Host Mode Selection Panel */}
                {isHost && (
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Configurar Modo de Juego (Solo Anfitrión)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'matrix', label: 'Matriz de Confusión', icon: '🧠' },
                        { id: 'connect4', label: 'Conecta 4 en Línea', icon: '🔴' },
                        { id: 'trivia', label: 'Duelo Trivia Express', icon: '⚡' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => onChangeMode(m.id as GameMode)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            room.gameMode === m.id
                              ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xl">{m.icon}</span>
                          <span className="text-xs font-bold">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Ready / Start Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  {room.players.length === 1 ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Puedes invitar a un amigo con el código <strong>{room.roomId}</strong> o añadir un <strong>Bot IA</strong> para jugar ya.
                    </span>
                  ) : (
                    <span>
                      {room.players.filter((p) => p.isReady).length} de {room.players.length} jugadores listos.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isHost && me && (
                    <button
                      onClick={() => onSetReady(!me.isReady)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
                        me.isReady
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{me.isReady ? '¡Estoy Listo!' : 'Marcar como Listo'}</span>
                    </button>
                  )}

                  {isHost && (
                    <button
                      onClick={onStartGame}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Comenzar Partida</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE GAME VIEW */
            <div className="flex-1">
              {room.gameMode === 'matrix' && (
                <ConfusionMatrixGame
                  room={room}
                  currentUserId={currentUserId}
                  onSubmitAnswer={onSubmitMatrixAnswer}
                  onOpenGuide={onOpenGuide}
                  onRestart={onRestartGame}
                />
              )}
              {room.gameMode === 'connect4' && (
                <ConnectFourGame
                  room={room}
                  currentUserId={currentUserId}
                  onDropChip={onDropConnect4Chip}
                  onResetGame={onResetConnect4}
                />
              )}
              {room.gameMode === 'trivia' && (
                <TriviaGame
                  room={room}
                  currentUserId={currentUserId}
                  onSubmitAnswer={onSubmitTriviaAnswer}
                  onRestart={onRestartGame}
                />
              )}
            </div>
          )}
        </div>

        {/* Integrated Chat Panel (Right Sidebar on Desktop) */}
        <div
          className={`${
            mobileChatOpen ? 'fixed inset-4 z-50 md:static' : 'hidden md:flex'
          } md:col-span-1 flex-col h-full`}
        >
          {mobileChatOpen && (
            <div className="md:hidden flex justify-end pb-2">
              <button
                onClick={() => setMobileChatOpen(false)}
                className="px-3 py-1 bg-slate-800 text-slate-200 text-xs rounded-lg font-bold"
              >
                Cerrar Chat
              </button>
            </div>
          )}
          <ChatPanel
            messages={room.messages}
            currentUserId={currentUserId}
            typers={typers}
            onSendMessage={onSendMessage}
            onSendReaction={onSendReaction}
            onTyping={onTyping}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
          />
        </div>
      </div>
    </div>
  );
};
