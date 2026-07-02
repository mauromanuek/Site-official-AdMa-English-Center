import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { MessageSquare } from 'lucide-react';

export function MessagesView({ profile, onOpenChat, onViewProfile }: { profile: UserProfile, onOpenChat: (u: UserProfile) => void, onViewProfile?: (u: UserProfile) => void }) {
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', profile.id));
    return onSnapshot(q, (snap) => {
      const chatData = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      chatData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      setChats(chatData);
    });
  }, [profile.id]);

  return (
    <div className="p-6 pt-12 animate-in fade-in min-h-screen">
      <h2 className="text-3xl font-display font-bold text-gray-900 mb-6 flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        Mensagens
      </h2>
      
      <div className="space-y-4">
        {chats.length === 0 && (
          <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm">
            <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Nenhuma conversa ainda. Utilize a pesquisa para iniciar uma.</p>
          </div>
        )}
        
        {chats.map(chat => {
          const otherUserId = chat.participants.find((p: string) => p !== profile.id);
          const otherUser = chat.usersData?.[otherUserId];
          if (!otherUser) return null;
          
          return (
            <div 
              key={chat.id} 
              onClick={() => onOpenChat(otherUser)} 
              className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all active:scale-[0.98]"
            >
              <div onClick={(e) => { e.stopPropagation(); onViewProfile?.(otherUser); }}>
                <Avatar photo={otherUser.photo} className="w-14 h-14 shadow-sm" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <div 
                    className="font-bold text-gray-900 text-lg truncate hover:underline"
                    onClick={(e) => { e.stopPropagation(); onViewProfile?.(otherUser); }}
                  >
                    {otherUser.name}
                  </div>
                  <div className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    {chat.updatedAt ? new Date(chat.updatedAt.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </div>
                </div>
                <div className="text-sm text-gray-500 truncate font-medium">{chat.lastMessage}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
