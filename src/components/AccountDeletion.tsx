import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { ArrowLeft, Trash2, Filter } from 'lucide-react';

export function AccountDeletion({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filterRole, setFilterRole] = useState<'all' | 'student' | 'teacher' | 'parent'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    return onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
  }, []);

  const filtered = users.filter(u => filterRole === 'all' || u.role === filterRole);

  const handleDelete = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    
    setDeletingId(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));

      const qSent = query(collection(db, 'messages'), where('senderId', '==', userId));
      const sentSnap = await getDocs(qSent);
      sentSnap.forEach(d => deleteDoc(doc(db, 'messages', d.id)));

      const qRec = query(collection(db, 'messages'), where('receiverId', '==', userId));
      const recSnap = await getDocs(qRec);
      recSnap.forEach(d => deleteDoc(doc(db, 'messages', d.id)));

      const qPosts = query(collection(db, 'posts'), where('authorId', '==', userId));
      const postSnap = await getDocs(qPosts);
      postSnap.forEach(d => deleteDoc(doc(db, 'posts', d.id)));
      
      const qNotif = query(collection(db, 'notifications'), where('userId', '==', userId));
      const notifSnap = await getDocs(qNotif);
      notifSnap.forEach(d => deleteDoc(doc(db, 'notifications', d.id)));

      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in pb-20">
      <div className="bg-white/80 backdrop-blur-xl p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10 shadow-sm pt-8">
        <button onClick={onBack} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-gray-900 text-xl">Eliminar Contas</h2>
      </div>

      <div className="p-6">
        <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <Filter className="w-5 h-5 text-red-500" /> Filtrar Categoria
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilterRole('all')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterRole('student')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'student' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
            >
              Estudantes
            </button>
            <button 
              onClick={() => setFilterRole('teacher')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'teacher' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
            >
              Professores
            </button>
            <button 
              onClick={() => setFilterRole('parent')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all border ${filterRole === 'parent' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'}`}
            >
              Encarregados
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-gray-400 text-center py-8 font-medium">Nenhum utilizador encontrado.</p>}
          {filtered.map(u => (
            <div key={u.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between transition-all">
              <div className="flex items-center gap-4">
                <Avatar photo={u.photo} className="w-12 h-12 shadow-sm" />
                <div>
                  <div className="font-bold text-gray-900 text-lg">{u.name}</div>
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
                {confirmDeleteId === u.id ? (
                  <>
                    <button 
                      disabled={deletingId === u.id}
                      onClick={(e) => handleDelete(e, u.id)}
                      className="text-xs bg-red-500 text-white font-bold px-3 py-2 rounded-xl hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {deletingId === u.id ? 'A apagar...' : 'Confirmar'}
                    </button>
                    <button 
                      disabled={deletingId === u.id}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="text-xs bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl hover:bg-gray-300 transition-all active:scale-95 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(u.id); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 active:scale-95"
                    title="Eliminar Conta Definitivamente"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
