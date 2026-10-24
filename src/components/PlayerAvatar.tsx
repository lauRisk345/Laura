import React from 'react';
import { Player } from '../types/game';
import { Crown, Bot, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  player: Player;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  showScore?: boolean;
}

export const PlayerAvatar: React.FC<Props> = ({
  player,
  size = 'md',
  showStatus = true,
  showScore = false,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-base',
    md: 'w-11 h-11 text-xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-bold shadow-md transition-all duration-200 select-none border-2`}
          style={{
            backgroundColor: `${player.color}20`,
            borderColor: player.color,
          }}
        >
          <span>{player.avatar || '🎮'}</span>
        </div>

        {player.isHost && (
          <span
            title="Anfitrión de la sala"
            className="absolute -top-1.5 -left-1.5 bg-amber-400 text-amber-950 p-0.5 rounded-full shadow-sm ring-1 ring-white"
          >
            <Crown className="w-3 h-3" />
          </span>
        )}

        {player.isBot && (
          <span
            title="Jugador Bot IA"
            className="absolute -bottom-1 -left-1 bg-purple-600 text-white p-0.5 rounded-full shadow-sm"
          >
            <Bot className="w-3 h-3" />
          </span>
        )}

        {showStatus && !player.isHost && (
          <span
            title={player.isReady ? 'Listo' : 'Esperando...'}
            className={`absolute -bottom-1 -right-1 p-0.5 rounded-full shadow-sm ${
              player.isReady ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {player.isReady ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          </span>
        )}
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-100 text-sm truncate max-w-[120px]">
            {player.name}
          </span>
          {player.isHost && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-medium px-1.5 py-0.5 rounded-md border border-amber-500/30">
              Host
            </span>
          )}
        </div>
        {showScore && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-amber-400 font-bold">{player.score} pts</span>
            {player.streak > 1 && (
              <span className="text-orange-400 font-semibold flex items-center gap-0.5">
                🔥 x{player.streak}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
