import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { ArrowLeft, Users, Filter, Trash2 } from 'lucide-react';

export function StudentManagement({ profile, onBack, onViewProfile }: { profile: UserProfile, onBack: () => void, onViewProfile?: (u: UserProfile) => void }) {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterMyStudents, setFilterMyStudents] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    return onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
  }, []);

  const classes = Array.from(new Set(students.map(s => s.className).filter(Boolean))) as string[];

  const filtered = students.filter(s => {
    if (filterMyStudents && s.teacherId !== profile.id) return false;
    if (filterClass !== 'all' && s.className !== filterClass) return false;
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    
    setDeletingId(studentId);
    try {
      await deleteDoc(doc(db, 'users', studentId));
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
        <h2 className="font-display font-bold text-gray-900 text-xl">Gestão de Alunos</h2>
      </div>

      <div className="p-6">
        <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 mb-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-gray-900 mb-2">
            <Filter className="w-5 h-5 text-indigo-500" /> Filtros
          </div>
          
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors">
            <input type="checkbox" checked={filterMyStudents} onChange={e => setFilterMyStudents(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
            <span className="font-medium text-gray-800">Apenas os meus alunos</span>
          </label>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Filtrar por Turma</label>
            <select 
              value={filterClass} 
              onChange={e => setFilterClass(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">Todas as turmas</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-gray-400 text-center py-8 font-medium">Nenhum aluno encontrado.</p>}
          {filtered.map(s => (
            <div key={s.id} onClick={() => onViewProfile?.(s)} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-indigo-100 transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <Avatar photo={s.photo} className="w-12 h-12 shadow-sm" />
                <div>
                  <div className="font-bold text-gray-900 text-lg hover:underline">{s.name}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">{s.className || 'Sem Turma'}</span>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-md">{s.level || 'Sem Nível'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {confirmDeleteId === s.id ? (
                  <>
                    <button 
                      disabled={deletingId === s.id}
                      onClick={(e) => handleDelete(e, s.id)}
                      className="text-xs bg-red-500 text-white font-bold px-3 py-2 rounded-xl hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {deletingId === s.id ? '...' : 'Apagar'}
                    </button>
                    <button 
                      disabled={deletingId === s.id}
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="text-xs bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl hover:bg-gray-300 transition-all active:scale-95 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 active:scale-95"
                    title="Remover da Turma"
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
