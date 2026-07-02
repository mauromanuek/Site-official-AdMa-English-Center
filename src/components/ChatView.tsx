import { useState, useEffect, useRef, FormEvent } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';

export function ChatView({ profile, targetUser, onBack, onViewProfile }: { profile: UserProfile, targetUser: UserProfile, onBack: () => void, onViewProfile?: (u: UserProfile) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const chatId = [profile.id, targetUser.id].sort().join('_');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [chatId]);

  const isTeacherChat = profile.role === 'teacher' && targetUser.role === 'teacher';
  
  const getTodayMessagesCount = () => {
    if (isTeacherChat) return 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return messages.filter(m => {
      if (m.senderId !== profile.id) return false;
      if (!m.createdAt) return true; // optimistic local message
      return m.createdAt.toMillis() > startOfToday.getTime();
    }).length;
  };

  const todayCount = getTodayMessagesCount();
  const limitReached = !isTeacherChat && todayCount >= 10;

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || limitReached) return;
    const msg = text.trim();
    setText('');
    
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: profile.id,
      text: msg,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, 'chats', chatId), {
      participants: [profile.id, targetUser.id],
      usersData: {
        [profile.id]: { name: profile.name, photo: profile.photo, id: profile.id },
        [targetUser.id]: { name: targetUser.name, photo: targetUser.photo, id: targetUser.id }
      },
      lastMessage: msg,
      updatedAt: serverTimestamp()
    }, { merge: true });

    await addDoc(collection(db, 'notifications'), {
      userId: targetUser.id,
      title: 'Nova Mensagem',
      message: `${profile.name}: ${msg}`,
      type: 'geral',
      createdAt: serverTimestamp(),
      read: false
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] animate-in slide-in-from-right-8 duration-300">
      <div className="bg-white/80 backdrop-blur-xl p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10 shadow-sm pt-8">
        <button onClick={onBack} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onViewProfile?.(targetUser)}>
          <Avatar photo={targetUser.photo} className="w-12 h-12 shadow-sm" />
          <div>
            <div className="font-display font-bold text-gray-900 text-lg leading-tight hover:underline">{targetUser.name}</div>
            <div className="text-xs text-blue-600 font-medium">Online</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 scrollbar-hide">
        {messages.map((m, i) => {
          const isMe = m.senderId === profile.id;
          const showAvatar = !isMe && (i === 0 || messages[i-1].senderId !== m.senderId);
          
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-8 flex-shrink-0">
                  {showAvatar && <Avatar photo={targetUser.photo} className="w-8 h-8 mt-1" />}
                </div>
              )}
              <div className={`max-w-[75%] p-4 rounded-[1.5rem] text-[15px] leading-relaxed shadow-sm ${
                isMe 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 fixed bottom-0 w-full max-w-md pb-8 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-20">
        {!isTeacherChat && (
          <div className="text-xs text-center text-gray-400 mb-2 font-medium flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {limitReached ? 'Limite diário de 10 mensagens atingido.' : `${10 - todayCount} mensagens restantes hoje.`}
          </div>
        )}
        <form onSubmit={handleSend} className="flex gap-3">
          <input 
            type="text" 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner disabled:opacity-50 disabled:bg-gray-100"
            placeholder={limitReached ? "Limite diário excedido" : "Escreva uma mensagem..."}
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={limitReached}
          />
          <button type="submit" disabled={!text.trim() || limitReached} className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 shadow-[0_4px_14px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex-shrink-0">
            <Send className="w-6 h-6 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
