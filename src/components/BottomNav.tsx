import { Home, MessageSquare, Search, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function BottomNav({ currentView, onViewChange, userId }: { currentView: string, onViewChange: (v: string) => void, userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    return onSnapshot(q, snap => {
      setUnreadCount(snap.docs.length);
    });
  }, [userId]);

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-gray-100 p-4 flex justify-around items-center z-40 pb-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <button 
        onClick={() => onViewChange('home')}
        className={cn("flex flex-col items-center gap-1.5 transition-colors", currentView === 'home' ? "text-blue-600 scale-110 transition-transform" : "text-gray-400 hover:text-gray-600")}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-bold">Início</span>
      </button>
      <button 
        onClick={() => onViewChange('search')}
        className={cn("flex flex-col items-center gap-1.5 transition-colors", currentView === 'search' ? "text-blue-600 scale-110 transition-transform" : "text-gray-400 hover:text-gray-600")}
      >
        <Search className="w-6 h-6" />
        <span className="text-[10px] font-bold">Pesquisa</span>
      </button>
      <button 
        onClick={() => onViewChange('notifications')}
        className={cn("flex flex-col items-center gap-1.5 transition-colors relative", currentView === 'notifications' ? "text-blue-600 scale-110 transition-transform" : "text-gray-400 hover:text-gray-600")}
      >
        <div className="relative">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold">Notificações</span>
      </button>
      <button 
        onClick={() => onViewChange('messages')}
        className={cn("flex flex-col items-center gap-1.5 transition-colors", currentView === 'messages' ? "text-blue-600 scale-110 transition-transform" : "text-gray-400 hover:text-gray-600")}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="text-[10px] font-bold">Mensagens</span>
      </button>
    </div>
  );
}
