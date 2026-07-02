import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { Search, MessageCircle, X, Clock } from 'lucide-react';

export function SearchView({ profile, onOpenChat, onViewProfile }: { profile: UserProfile, onOpenChat: (u: UserProfile) => void, onViewProfile: (u: UserProfile) => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher' | 'parent'>('all');

  useEffect(() => {
    getDocs(collection(db, 'users')).then(snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)).filter(u => u.id !== profile.id));
    });
  }, [profile.id]);

  const filtered = users.filter(u => {
    const matchesSearch = search.trim() === '' || u.name.toLowerCase().includes(search.toLowerCase()) || (u.phone && u.phone.includes(search));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 pt-12 animate-in fade-in min-h-screen pb-32 bg-[#f8fafc]">
      <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">Comunidade</h2>
      
      <div className="relative mb-4">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Pesquisar por nome ou número..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
        <button 
          onClick={() => setFilterRole('all')}
          className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilterRole('student')}
          className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'student' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
        >
          Estudantes
        </button>
        <button 
          onClick={() => setFilterRole('teacher')}
          className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'teacher' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
        >
          Professores
        </button>
        <button 
          onClick={() => setFilterRole('parent')}
          className={`shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'parent' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}
        >
          Encarregados
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100 mt-4">
            <p className="text-gray-500 font-medium">Nenhum utilizador encontrado.</p>
          </div>
        )}
        
        {filtered.map(u => (
          <div key={u.id} className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 flex items-center justify-between hover:border-blue-100 transition-colors cursor-pointer active:scale-[0.98]" onClick={() => onViewProfile(u)}>
            <div className="flex items-center gap-4">
              <Avatar photo={u.photo} className="w-12 h-12 shadow-sm" />
              <div>
                <div className="font-bold text-gray-900 text-lg leading-tight">{u.name}</div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block mt-1 capitalize ${
                  u.role === 'teacher' ? 'bg-purple-50 text-purple-600' : 
                  u.role === 'parent' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-indigo-50 text-indigo-600'
                }`}>
                  {u.role === 'teacher' ? 'Professor' : u.role === 'parent' ? 'Encarregado' : 'Estudante'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onOpenChat(u); }}
                className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
