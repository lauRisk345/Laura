import React from 'react';
import { RoomState, MatrixGameState, Player } from '../types/game';
import { PlayerAvatar } from './PlayerAvatar';
import { Sparkles, Trophy, Clock, HelpCircle, Check, X, Flame } from 'lucide-react';

interface Props {
  room: RoomState;
  currentUserId: string;
  onSubmitAnswer: (optionId: string) => void;
  onOpenGuide: () => void;
  onRestart: () => void;
}

export const ConfusionMatrixGame: React.FC<Props> = ({
  room,
  currentUserId,
  onSubmitAnswer,
  onOpenGuide,
  onRestart,
}) => {
  const state = room.matrixState;
  if (!state) return null;

  const currentRound = state.currentRound;
  const myAnswer = state.playerAnswers[currentUserId];
  const isHost = room.hostId === currentUserId;

  // Podium sorting
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Game Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Ronda {state.roundIndex + 1} de {state.totalRounds}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {currentRound?.type === 'calculation' ? 'Cálculo Matemático' : currentRound?.type === 'scenario' ? 'Caso Práctico' : 'Concepto Clave'}
              </span>
            </div>
            <h3 className="font-bold text-white text-base truncate max-w-sm">
              {currentRound?.title || 'Batalla de Clasificación'}
            </h3>
          </div>
        </div>

        {/* Timer & Guide Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs text-indigo-300 font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ver Fórmulas</span>
          </button>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
              state.timeRemaining <= 5
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-slate-850 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{state.timeRemaining}s</span>
          </div>
        </div>
      </div>

      {/* Main Arena Area */}
      {state.status === 'game_over' ? (
        /* Game Over Podium */
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 inline-block animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">¡Partida Finalizada!</h2>
            <p className="text-sm text-slate-400">
              Rendimiento en Clasificación y Matriz de Confusión
            </p>
          </div>

          {/* Podium Cards */}
          <div className="flex flex-wrap items-end justify-center gap-4 w-full max-w-md pt-4">
            {sortedPlayers.slice(0, 3).map((p, idx) => {
              const medalColors = ['border-amber-400 bg-amber-500/10', 'border-slate-300 bg-slate-400/10', 'border-amber-700 bg-amber-800/10'];
              const heights = ['h-40', 'h-32', 'h-28'];
              return (
                <div
                  key={p.id}
                  className={`flex-1 min-w-[100px] border-2 rounded-2xl p-3 flex flex-col items-center justify-between shadow-lg ${medalColors[idx]} ${heights[idx]}`}
                >
                  <div className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <div className="text-2xl">{p.avatar}</div>
                  <div className="font-bold text-white text-xs truncate max-w-full">{p.name}</div>
                  <div className="font-mono text-xs font-bold text-amber-300">{p.score} pts</div>
                </div>
              );
            })}
          </div>

          {isHost && (
            <button
              onClick={onRestart}
              className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              Jugar Nueva Partida
            </button>
          )}
        </div>
      ) : (
        /* Round In Progress or Recap */
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4 overflow-y-auto">
          {/* Question / Challenge Prompt */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800/90 rounded-2xl">
              <p className="text-sm md:text-base font-semibold text-slate-100 leading-relaxed">
                {currentRound?.prompt}
              </p>
            </div>

            {/* Matrix Visualizer Box if current round provides data */}
            {currentRound?.matrixData && (
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 max-w-lg mx-auto">
                <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">
                  Matriz de Observaciones
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  {/* TP Box (Orange) */}
                  <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/50 flex flex-col items-center">
                    <span className="text-[10px] text-orange-300 font-semibold uppercase">
                      Verdaderos Positivos (TP)
                    </span>
                    <span className="text-xl font-bold font-mono text-orange-400">
                      {currentRound.matrixData.tp}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {currentRound.matrixData.class1Name || 'Clase 1'} predicha bien
                    </span>
                  </div>

                  {/* FN Box (Green) */}
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex flex-col items-center">
                    <span className="text-[10px] text-emerald-300 font-semibold uppercase">
                      Falsos Negativos (FN)
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {currentRound.matrixData.fn}
                    </span>
                    <span className="text-[9px] text-slate-400">Omisiones del modelo</span>
                  </div>

                  {/* FP Box (Yellow) */}
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 flex flex-col items-center">
                    <span className="text-[10px] text-amber-300 font-semibold uppercase">
                      Falsos Positivos (FP)
                    </span>
                    <span className="text-xl font-bold font-mono text-amber-400">
                      {currentRound.matrixData.fp}
                    </span>
                    <span className="text-[9px] text-slate-400">Falsas alarmas</span>
                  </div>

                  {/* TN Box (Blue) */}
                  <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/50 flex flex-col items-center">
                    <span className="text-[10px] text-sky-300 font-semibold uppercase">
                      Verdaderos Negativos (TN)
                    </span>
                    <span className="text-xl font-bold font-mono text-sky-400">
                      {currentRound.matrixData.tn}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {currentRound.matrixData.class2Name || 'Clase 2'} predicha bien
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentRound?.options.map((opt) => {
              const isSelectedByMe = myAnswer?.optionId === opt.id;
              const isRecap = state.status === 'round_recap';
              const isCorrect = opt.id === currentRound.correctOptionId;

              let style = 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-200';
              if (isSelectedByMe && !isRecap) {
                style = 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400';
              }
              if (isRecap) {
                if (isCorrect) {
                  style = 'bg-emerald-900/40 border-emerald-500 text-white ring-2 ring-emerald-500/50';
                } else if (isSelectedByMe && !isCorrect) {
                  style = 'bg-rose-900/40 border-rose-500 text-white ring-1 ring-rose-500';
                } else {
                  style = 'opacity-40 bg-slate-850 border-slate-800 text-slate-400';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={Boolean(myAnswer) || isRecap}
                  onClick={() => onSubmitAnswer(opt.id)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-[0.99] ${style}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-900/80 border border-slate-700 text-xs font-bold flex items-center justify-center shrink-0 uppercase">
                    {opt.id}
                  </span>
                  <div className="flex-1 text-xs md:text-sm font-medium leading-snug">
                    {opt.text}
                  </div>
                  {isRecap && isCorrect && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isRecap && isSelectedByMe && !isCorrect && <X className="w-5 h-5 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Recap Explanation Box */}
          {state.status === 'round_recap' && (
            <div className="p-3.5 bg-slate-950/70 border border-indigo-500/30 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Explicación del Concepto (Hugo Martínez Gallego):</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentRound?.explanation}
              </p>
            </div>
          )}

          {/* Players Answer Status Bar */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Estado de los jugadores:</span>
            <div className="flex items-center gap-2">
              {room.players.map((p) => {
                const ans = state.playerAnswers[p.id];
                const answered = Boolean(ans);
                return (
                  <div
                    key={p.id}
                    title={`${p.name}: ${answered ? 'Respondió' : 'Pensando...'}`}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] ${
                      answered
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{p.avatar}</span>
                    <span className="max-w-[70px] truncate">{p.name}</span>
                    {answered && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
