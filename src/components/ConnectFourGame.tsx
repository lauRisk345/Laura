import React, { useState } from 'react';
import { RoomState } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';
import { Trophy, RotateCcw, Users, ArrowDown } from 'lucide-react';

interface Props {
  room: RoomState;
  currentUserId: string;
  onDropChip: (col: number) => void;
  onResetGame: () => void;
}

export const ConnectFourGame: React.FC<Props> = ({
  room,
  currentUserId,
  onDropChip,
  onResetGame,
}) => {
  const state = room.connect4State;
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  if (!state) return null;

  const player1 = room.players.find((p) => p.id === state.player1Id);
  const player2 = room.players.find((p) => p.id === state.player2Id);

  const isPlayer1 = currentUserId === state.player1Id;
  const isPlayer2 = currentUserId === state.player2Id;
  const isMyTurn = currentUserId === state.currentTurnPlayerId;
  const isParticipant = isPlayer1 || isPlayer2;
  const isHost = room.hostId === currentUserId;

  const winningCoords = new Set(
    state.winningLine ? state.winningLine.map(([r, c]) => `${r}-${c}`) : []
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Players Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Player 1 Card */}
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
            state.currentTurnPlayerId === state.player1Id && state.status === 'in_progress'
              ? 'bg-rose-500/15 border-rose-500 shadow-md shadow-rose-500/10 ring-2 ring-rose-500/30'
              : 'bg-slate-850/60 border-slate-700/60'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-rose-500 shadow-sm shrink-0 border border-rose-300"></div>
          {player1 && <PlayerAvatar player={player1} size="sm" showStatus={false} />}
        </div>

        {/* Status / VS indicator */}
        <div className="text-center">
          {state.status === 'in_progress' ? (
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Turno Actual
              </span>
              <div className="text-sm font-black text-indigo-300">
                {isMyTurn ? '¡Es tu turno!' : `Turno de ${room.players.find((p) => p.id === state.currentTurnPlayerId)?.name || 'Rival'}`}
              </div>
            </div>
          ) : state.status === 'won' ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm animate-bounce">
              <Trophy className="w-4 h-4" />
              <span>
                ¡Ganó {room.players.find((p) => p.id === state.winnerId)?.name}!
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-amber-400">¡Empate! Tablero lleno</span>
          )}
        </div>

        {/* Player 2 Card */}
        <div
          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
            state.currentTurnPlayerId === state.player2Id && state.status === 'in_progress'
              ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/30'
              : 'bg-slate-850/60 border-slate-700/60'
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-amber-400 shadow-sm shrink-0 border border-amber-200"></div>
          {player2 && <PlayerAvatar player={player2} size="sm" showStatus={false} />}
        </div>
      </div>

      {/* Main Board Arena */}
      <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xl">
        {!isParticipant && (
          <div className="mb-3 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Modo Espectador: Puedes animar y chatear en tiempo real</span>
          </div>
        )}

        {/* Column Drop Indicator Helpers */}
        {isMyTurn && state.status === 'in_progress' && (
          <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full max-w-sm mb-1 px-3">
            {[0, 1, 2, 3, 4, 5, 6].map((col) => (
              <button
                key={col}
                onClick={() => onDropChip(col)}
                onMouseEnter={() => setHoverCol(col)}
                onMouseLeave={() => setHoverCol(null)}
                className={`flex justify-center p-1 rounded-lg transition-all ${
                  hoverCol === col ? 'text-indigo-400 -translate-y-1' : 'text-slate-600 hover:text-slate-300'
                }`}
                title={`Soltar ficha en columna ${col + 1}`}
              >
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </button>
            ))}
          </div>
        )}

        {/* The 7x6 Board */}
        <div className="bg-blue-800 p-3 sm:p-4 rounded-3xl shadow-2xl border-4 border-blue-900 grid grid-cols-7 gap-2 sm:gap-3 max-w-sm w-full select-none">
          {state.board.map((row, rIdx) =>
            row.map((cellPlayerId, cIdx) => {
              const isP1 = cellPlayerId === state.player1Id;
              const isP2 = cellPlayerId === state.player2Id;
              const isWinCell = winningCoords.has(`${rIdx}-${cIdx}`);

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => {
                    if (isMyTurn && state.status === 'in_progress') {
                      onDropChip(cIdx);
                    }
                  }}
                  onMouseEnter={() => isMyTurn && setHoverCol(cIdx)}
                  onMouseLeave={() => setHoverCol(null)}
                  className={`aspect-square rounded-full transition-transform duration-200 cursor-pointer flex items-center justify-center relative overflow-hidden shadow-inner ${
                    cellPlayerId === null
                      ? hoverCol === cIdx && isMyTurn
                        ? isPlayer1
                          ? 'bg-rose-500/30'
                          : 'bg-amber-400/30'
                        : 'bg-slate-950'
                      : isP1
                      ? 'bg-gradient-to-tr from-rose-600 to-rose-400 border-2 border-rose-300'
                      : 'bg-gradient-to-tr from-amber-500 to-amber-300 border-2 border-amber-200'
                  } ${isWinCell ? 'ring-4 ring-white animate-pulse scale-105' : ''}`}
                >
                  {cellPlayerId && (
                    <div className="w-1/2 h-1/2 rounded-full border border-white/20 opacity-60"></div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Restart Action for Host */}
        {state.status !== 'in_progress' && isHost && (
          <button
            onClick={onResetGame}
            className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revancha / Nueva Partida</span>
          </button>
        )}
      </div>
    </div>
  );
};
