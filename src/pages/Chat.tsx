import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { TEAM_CONFIG } from '@/lib/types';
import { isConfigured } from '@/lib/firebase';
import { subscribeToChat, sendChatMessage } from '@/lib/firestore';
import { useUser } from '@/context/UserContext';

const EVENT_ID = 'sac-2026';

const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', eventId: 'sac-2026', userId: 'mw-1', userName: 'Kenny S.', userTeam: 'morning-woods', text: 'Morning Woods looking strong this year! Let\'s go boys!', timestamp: Date.now() - 3600000 },
  { id: '2', eventId: 'sac-2026', userId: 'ce-1', userName: 'Player CE1', userTeam: 'chip-endels', text: 'Talk is cheap. See you on the first tee.', timestamp: Date.now() - 3000000 },
  { id: '3', eventId: 'sac-2026', userId: 'mw-3', userName: 'Player MW3', userTeam: 'morning-woods', text: 'Who\'s got the range balls?', timestamp: Date.now() - 1800000 },
  { id: '4', eventId: 'sac-2026', userId: 'ce-5', userName: 'Player CE5', userTeam: 'chip-endels', text: 'Cup is coming back to us this year. Chip-Endels all day!', timestamp: Date.now() - 600000 },
];

export default function Chat() {
  const { currentUser } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>(isConfigured ? [] : MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConfigured) return;
    return subscribeToChat(EVENT_ID, setMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !currentUser) return;
    const text = input.trim();
    setInput('');

    if (isConfigured) {
      await sendChatMessage({
        eventId: EVENT_ID,
        userId: currentUser.id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        text,
      });
    } else {
      const msg: ChatMessage = {
        id: String(Date.now()),
        eventId: EVENT_ID,
        userId: currentUser.id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy to-navy-light text-white px-4 py-4 text-center">
        <h1 className="font-display text-xl font-bold">The 19th Hole</h1>
        <p className="text-white/50 text-xs mt-1">
          Event chat &middot; trash talk encouraged
          {isConfigured && <span className="text-green-light"> &middot; live</span>}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-cream/50">
        {messages.length === 0 && (
          <div className="text-center py-12 text-sac-text-light">
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-1">Be the first to talk trash</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = currentUser ? msg.userId === currentUser.id : false;
          const teamConfig = TEAM_CONFIG[msg.userTeam];
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-semibold ${
                    msg.userTeam === 'morning-woods' ? 'text-usa' : 'text-euro'
                  }`}>
                    {msg.userName}
                  </span>
                  <span className={`text-[8px] px-1 py-px rounded-sm font-bold tracking-wider uppercase ${
                    msg.userTeam === 'morning-woods'
                      ? 'bg-usa/10 text-usa'
                      : 'bg-euro/10 text-euro'
                  }`}>
                    {teamConfig.shortName}
                  </span>
                  <span className="text-[9px] text-sac-text-light">{formatTime(msg.timestamp)}</span>
                </div>
                <div className={`rounded-2xl px-3 py-2 text-sm ${
                  isMe
                    ? 'bg-usa text-white rounded-tr-sm'
                    : msg.userTeam === 'chip-endels'
                    ? 'bg-euro/10 text-sac-text rounded-tl-sm'
                    : 'bg-white text-sac-text rounded-tl-sm shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-cream-dark px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Talk trash..."
            className="flex-1 bg-cream rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold/40 placeholder:text-sac-text-light"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-gold flex items-center justify-center hover:bg-gold-light transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-navy" />
          </button>
        </div>
      </div>
    </div>
  );
}
