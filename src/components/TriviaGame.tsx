import React from 'react';
import { RoomState } from '../types/game';
import { Sparkles, Trophy, Clock, Check, X } from 'lucide-react';

interface Props {
  room: RoomState;
  currentUserId: string;
  onSubmitAnswer: (optionIndex: number) => void;
  onRestart: () => void;
}

export const TriviaGame: React.FC<Props> = ({
  room,
  currentUserId,
  onSubmitAnswer,
  onRestart,
}) => {
  const state = room.triviaState;
  if (!state) return null;

  const currentQ = state.currentQuestion;
  const myAnswer = state.playerAnswers[currentUserId];
  const isHost = room.hostId === currentUserId;
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Pregunta {state.questionIndex + 1} de {state.totalQuestions}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {currentQ?.category || 'Trivia Tech'}
              </span>
            </div>
            <h3 className="font-bold text-white text-base truncate max-w-sm">
              Duelo Trivia Express
            </h3>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
            state.timeRemaining <= 4
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
              : 'bg-slate-850 border-slate-700 text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{state.timeRemaining}s</span>
        </div>
      </div>

      {state.status === 'game_over' ? (
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 inline-block animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">¡Fin del Duelo Trivia!</h2>
            <p className="text-sm text-slate-400">Clasificación final</p>
          </div>

          <div className="flex flex-wrap items-end justify-center gap-4 w-full max-w-md pt-4">
            {sortedPlayers.slice(0, 3).map((p, idx) => (
              <div
                key={p.id}
                className="flex-1 min-w-[100px] border-2 border-purple-500/40 bg-purple-950/20 rounded-2xl p-3 flex flex-col items-center justify-between shadow-lg"
              >
                <div className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                <div className="text-2xl">{p.avatar}</div>
                <div className="font-bold text-white text-xs truncate max-w-full">{p.name}</div>
                <div className="font-mono text-xs font-bold text-amber-300">{p.score} pts</div>
              </div>
            ))}
          </div>

          {isHost && (
            <button
              onClick={onRestart}
              className="mt-4 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              Jugar de Nuevo
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl space-y-4 overflow-y-auto">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <p className="text-sm md:text-base font-semibold text-slate-100 leading-relaxed">
              {currentQ?.question}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQ?.options.map((opt, idx) => {
              const isSelected = myAnswer?.optionIndex === idx;
              const isRecap = state.status === 'round_recap';
              const isCorrect = idx === currentQ.correctIndex;

              let style = 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-200';
              if (isSelected && !isRecap) {
                style = 'bg-purple-600/30 border-purple-500 text-white shadow-lg ring-1 ring-purple-400';
              }
              if (isRecap) {
                if (isCorrect) {
                  style = 'bg-emerald-900/40 border-emerald-500 text-white ring-2 ring-emerald-500/50';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-900/40 border-rose-500 text-white ring-1 ring-rose-500';
                } else {
                  style = 'opacity-40 bg-slate-850 border-slate-800 text-slate-400';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={Boolean(myAnswer) || isRecap}
                  onClick={() => onSubmitAnswer(idx)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all active:scale-[0.99] ${style}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <div className="flex-1 text-xs md:text-sm font-medium leading-snug">
                    {opt}
                  </div>
                  {isRecap && isCorrect && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isRecap && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {state.status === 'round_recap' && (
            <div className="p-3.5 bg-slate-950/70 border border-purple-500/30 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Explicación:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentQ?.explanation}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Jugadores:</span>
            <div className="flex items-center gap-2">
              {room.players.map((p) => {
                const ans = state.playerAnswers[p.id];
                const answered = Boolean(ans);
                return (
                  <div
                    key={p.id}
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
