/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useMultiplayer } from './hooks/useMultiplayer';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { ConfusionGuideModal } from './components/ConfusionGuideModal';
import { soundManager } from './utils/sound';
import { Gamepad2, Volume2, VolumeX, BookOpen, Sparkles } from 'lucide-react';
import { GameMode } from './types/game';

const RANDOM_NAMES = ['AstroGamer', 'DataKnight', 'CyberFox', 'NovaPlayer', 'PixelWizard', 'MatrixPro'];
const RANDOM_AVATARS = ['🎮', '🚀', '🤖', '🦊', '🦁', '⚡', '🎯', '👾'];
const RANDOM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function App() {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('nexus_name') || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  });
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('nexus_avatar') || RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)];
  });
  const [color, setColor] = useState(() => {
    return localStorage.getItem('nexus_color') || RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const {
    isConnected,
    room,
    publicRooms,
    errorMessage,
    floatingReactions,
    typers,
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
  } = useMultiplayer();

  const handleUpdateProfile = (name: string, newAvatar: string, newColor: string) => {
    setPlayerName(name);
    setAvatar(newAvatar);
    setColor(newColor);
    localStorage.setItem('nexus_name', name);
    localStorage.setItem('nexus_avatar', newAvatar);
    localStorage.setItem('nexus_color', newColor);
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Find my current player ID in room
  const myPlayerInRoom = room?.players.find((p) => p.name === playerName && !p.isBot);
  const currentUserId = myPlayerInRoom ? myPlayerInRoom.id : room?.players[0]?.id || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-lg">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">NexusPlay</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multijugador Online
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Juegos en vivo & Chat Integrado</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-indigo-300 border border-slate-700/80 text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Guía Matriz de Confusión</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-800"
              title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500 animate-pulse'}`} />
              <span className="font-semibold text-slate-300">{playerName}</span>
              <span className="text-base">{avatar}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {!room ? (
          <Lobby
            publicRooms={publicRooms}
            playerName={playerName}
            avatar={avatar}
            color={color}
            onUpdateProfile={handleUpdateProfile}
            onCreateRoom={(roomName, gameMode, isPriv, maxP) =>
              createRoom(roomName, gameMode, isPriv, maxP, playerName, avatar, color)
            }
            onJoinRoom={(roomId) => joinRoom(roomId, playerName, avatar, color)}
            onRefreshRooms={refreshRooms}
            onOpenGuide={() => setIsGuideOpen(true)}
            isConnected={isConnected}
            errorMessage={errorMessage}
          />
        ) : (
          <GameRoom
            room={room}
            currentUserId={currentUserId}
            typers={typers}
            floatingReactions={floatingReactions}
            onLeaveRoom={leaveRoom}
            onSetReady={setReady}
            onChangeMode={changeMode}
            onAddBot={addBot}
            onRemoveBot={removeBot}
            onStartGame={startGame}
            onRestartGame={restartGame}
            onSendMessage={sendChat}
            onSendReaction={sendReaction}
            onTyping={setTyping}
            onSubmitMatrixAnswer={submitMatrixAnswer}
            onDropConnect4Chip={dropConnect4Chip}
            onResetConnect4={resetConnect4}
            onSubmitTriviaAnswer={submitTriviaAnswer}
            onOpenGuide={() => setIsGuideOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}
      </main>

      {/* Educational Guide Modal */}
      <ConfusionGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
