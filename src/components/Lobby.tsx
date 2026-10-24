import React, { useState } from 'react';
import { GameMode } from '../types/game';
import {
  Gamepad2,
  Users,
  Plus,
  ArrowRight,
  BookOpen,
  Sparkles,
  Lock,
  Globe,
  RefreshCw,
  Bot,
  Zap,
} from 'lucide-react';

interface Props {
  publicRooms: {
    roomId: string;
    roomName: string;
    gameMode: GameMode;
    playerCount: number;
    maxPlayers: number;
    isPrivate: boolean;
    status: string;
  }[];
  playerName: string;
  avatar: string;
  color: string;
  onUpdateProfile: (name: string, avatar: string, color: string) => void;
  onCreateRoom: (roomName: string, gameMode: GameMode, isPrivate: boolean, maxPlayers: number) => void;
  onJoinRoom: (roomId: string) => void;
  onRefreshRooms: () => void;
  onOpenGuide: () => void;
  isConnected: boolean;
  errorMessage: string | null;
}

const AVATAR_OPTIONS = ['🎮', '🚀', '🤖', '🦊', '🦁', '⚡', '🎯', '👾', '🦄', '🌟', '🧠', '🔥'];
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export const Lobby: React.FC<Props> = ({
  publicRooms,
  playerName,
  avatar,
  color,
  onUpdateProfile,
  onCreateRoom,
  onJoinRoom,
  onRefreshRooms,
  onOpenGuide,
  isConnected,
  errorMessage,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMode, setNewRoomMode] = useState<GameMode>('matrix');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(4);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(newRoomName || `Sala de ${playerName}`, newRoomMode, isPrivate, maxPlayers);
    setShowCreateModal(false);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim().toUpperCase());
    }
  };

  const modeBadges: Record<GameMode, { label: string; color: string; desc: string }> = {
    matrix: {
      label: 'Matriz de Confusión',
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      desc: 'Duelo de Machine Learning, TP, FP, TN, FN y métricas reales',
    },
    connect4: {
      label: 'Conecta 4 en Línea',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      desc: 'Clásico duelo estratégico 1v1 con espectadores en vivo',
    },
    trivia: {
      label: 'Trivia Express',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      desc: 'Competencia veloz de conocimiento tecnológico y de datos',
    },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Alert banner if error */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Multijugador en Tiempo Real + Chat Integrado</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            NexusPlay Arena
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Crea o únete a salas en línea para desafiar a tus amigos o a la IA en tiempo real.
            Incluye la <strong className="text-orange-400">Batalla de Matriz de Confusión</strong> inspirada en Machine Learning, Conecta 4 y Trivia rápida.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Sala de Juego</span>
            </button>

            <button
              onClick={onOpenGuide}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-indigo-300 font-semibold text-xs sm:text-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Guía: Matriz de Confusión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile & Join Code Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Tu Perfil de Jugador
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span>{isConnected ? 'Servidor Conectado' : 'Reconectando...'}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar Preview */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 shrink-0 transition-transform hover:scale-105"
              style={{
                backgroundColor: `${color}20`,
                borderColor: color,
              }}
            >
              {avatar}
            </div>

            {/* Nickname Input */}
            <div className="flex-1 w-full space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Tu Apodo / Nickname:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => onUpdateProfile(e.target.value, avatar, color)}
                maxLength={20}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                placeholder="Ingresa tu nombre..."
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400">Elige tu Avatar:</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => onUpdateProfile(playerName, av, color)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                    avatar === av
                      ? 'bg-indigo-600/30 border-2 border-indigo-500 scale-110 shadow-md'
                      : 'bg-slate-800/80 border border-slate-700/60 hover:bg-slate-700'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400">Color de Jugador:</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateProfile(playerName, avatar, c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-lg' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Join by Code Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Unirse con Código
            </span>
            <p className="text-[11px] text-slate-400">
              Introduce el código de 4 letras que te compartió tu amigo.
            </p>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="EJ: ABCD"
              maxLength={6}
              className="w-full bg-slate-950 border border-slate-700 text-center font-mono font-black text-lg tracking-widest text-indigo-300 rounded-xl py-2.5 uppercase focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <span>Entrar a la Sala</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 bg-slate-850/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>¿Sin amigos conectados ahora? Crea una sala y agrega un <strong>Bot IA</strong> para jugar ya mismo.</span>
          </div>
        </div>
      </div>

      {/* Public Rooms Browser */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Salas Públicas en Vivo</h3>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-mono">
              {publicRooms.length}
            </span>
          </div>

          <button
            onClick={onRefreshRooms}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Gamepad2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs">No hay salas públicas abiertas en este momento.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold transition-colors"
            >
              ¡Sé el primero en crear una sala!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicRooms.map((r) => {
              const badge = modeBadges[r.gameMode];
              const isFull = r.playerCount >= r.maxPlayers;
              return (
                <div
                  key={r.roomId}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all hover:-translate-y-0.5 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="font-mono text-xs text-slate-500 font-bold">#{r.roomId}</span>
                    </div>
                    <h4 className="font-bold text-white text-xs truncate">{r.roomName}</h4>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{r.playerCount} / {r.maxPlayers}</span>
                    </div>

                    <button
                      disabled={isFull}
                      onClick={() => onJoinRoom(r.roomId)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                    >
                      {isFull ? 'Llena' : 'Unirse'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Room */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Crear Nueva Sala</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Nombre de la Sala:</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={`Sala de ${playerName}`}
                  maxLength={30}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Selecciona el Juego:</label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'matrix',
                      title: 'Batalla de Matriz de Confusión',
                      desc: 'Desafíos de Machine Learning: TP, FP, TN, FN, Precision, Recall y F1 (Basado en la guía de H. Martínez)',
                      icon: '🧠',
                    },
                    {
                      id: 'connect4',
                      title: 'Conecta 4 Galáctico',
                      desc: 'Duelo estratégico 1v1 con espectadores y chat simultáneo',
                      icon: '🔴',
                    },
                    {
                      id: 'trivia',
                      title: 'Duelo Trivia Express',
                      desc: 'Preguntas de velocidad sobre tecnología, ciencia y datos',
                      icon: '⚡',
                    },
                  ].map((mode) => (
                    <div
                      key={mode.id}
                      onClick={() => setNewRoomMode(mode.id as GameMode)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        newRoomMode === mode.id
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{mode.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white text-xs">{mode.title}</div>
                        <div className="text-[11px] text-slate-400 leading-tight">{mode.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs font-semibold text-white">Sala Privada</div>
                  <div className="text-[10px] text-slate-400">Solo accesible mediante código directo</div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Crear y Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
