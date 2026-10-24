import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { Send, Smile, MessageSquare, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface Props {
  messages: ChatMessage[];
  currentUserId: string;
  typers: string[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  onTyping: (isTyping: boolean) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const QUICK_EMOJIS = ['🔥', '😂', '👏', '🧠', '🎯', '🚀', '😱', '🏆'];

export const ChatPanel: React.FC<Props> = ({
  messages,
  currentUserId,
  typers,
  onSendMessage,
  onSendReaction,
  onTyping,
  isMuted,
  onToggleMute,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiBar, setShowEmojiBar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onTyping(true);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    onTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white text-xs tracking-wide">Chat de la Sala</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-1.5 py-0.5 rounded-full border border-indigo-500/30">
            En vivo
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p>¡No hay mensajes aún!</p>
            <p className="text-[11px]">Escribe un saludo o envía una reacción rápida.</p>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="py-1 px-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300 flex items-center gap-1.5"
              >
                <span className="text-sm shrink-0">{msg.senderAvatar || '⚡'}</span>
                <span className="flex-1">{msg.text}</span>
                <span className="text-[9px] text-slate-500 shrink-0">{formatTime(msg.timestamp)}</span>
              </div>
            );
          }

          const isMe = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[88%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
            >
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                <span className="font-semibold" style={{ color: msg.senderColor }}>
                  {msg.senderAvatar} {msg.senderName}
                </span>
                <span>• {formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-2xl break-words leading-relaxed text-xs shadow-sm ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/70 rounded-tl-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Typers indicator */}
        {typers.length > 0 && (
          <div className="text-[11px] text-indigo-400 italic flex items-center gap-1.5 py-1 px-2 animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>{typers.join(', ')} {typers.length === 1 ? 'está' : 'están'} escribiendo...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emoji Reactions Bar */}
      {showEmojiBar && (
        <div className="px-2 py-1.5 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="text-base p-1 hover:bg-slate-800 rounded-lg hover:scale-125 transition-all active:scale-95"
              title={`Enviar reacción ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowEmojiBar((prev) => !prev)}
          className={`p-2 rounded-xl transition-colors ${
            showEmojiBar ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Alternar barra de emojis"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Escribe en el chat..."
          maxLength={280}
          className="flex-1 bg-slate-900 border border-slate-700/80 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95"
          title="Enviar mensaje"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
