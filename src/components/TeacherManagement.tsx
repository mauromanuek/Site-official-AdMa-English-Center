import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft, UserPlus, Phone, Trash2 } from 'lucide-react';

export function TeacherManagement({ onBack }: { onBack: () => void }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allowedTeachers, setAllowedTeachers] = useState<any[]>([]);
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<{id: string, col: string} | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubUsers = onSnapshot(q, snap => {
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const qAllowed = query(collection(db, 'allowed_teachers'));
    const unsubAllowed = onSnapshot(qAllowed, snap => {
      setAllowedTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubAllowed();
    };
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const cleanPhone = newPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      setMsg('Preencha o telefone.'); return;
    }
    setLoading(true);
    
    try {
      await setDoc(doc(db, 'allowed_teachers', cleanPhone), {
        phone: cleanPhone,
        createdAt: serverTimestamp()
      });

      setNewPhone('');
      setMsg('Número autorizado com sucesso.');
    } catch (e) {
      setMsg('Erro ao autorizar número.');
    }
    setLoading(false);
  };

  const handleDeleteTeacher = async (id: string, collectionName: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
      setMsg('Erro ao apagar.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in pb-20">
      <div className="bg-white/80 backdrop-blur-xl p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10 shadow-sm pt-8">
        <button onClick={onBack} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-gray-900 text-xl">Gestão de Professores</h2>
      </div>

      <div className="p-6">
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-8">
          <h3 className="font-display font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-500" /> Autorizar Novo Professor
          </h3>
          <p className="text-sm text-gray-500 mb-4">Adicione o número de telefone de um professor para permitir que ele crie uma conta.</p>
          <form onSubmit={handleAddTeacher} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telefone</label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} required placeholder="Ex: 923000000" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" />
              </div>
            </div>
            {msg && <p className={`text-sm font-medium p-3 rounded-xl ${msg.includes('sucesso') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{msg}</p>}
            <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? 'Aguarde...' : 'Autorizar Número'}
            </button>
          </form>
        </div>

        <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Professores Registados</h3>
        <div className="space-y-3 mb-8">
          {teachers.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900">{t.name}</div>
                <div className="text-sm text-gray-500">{t.phone}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-1 rounded-md">Ativo</div>
                {confirmDeleteId?.id === t.id && confirmDeleteId?.col === 'users' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteTeacher(t.id, 'users')}
                      className="text-xs bg-red-500 text-white font-bold px-2 py-1 rounded-md hover:bg-red-600"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteId({ id: t.id, col: 'users' })}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {teachers.length === 0 && <p className="text-gray-500 text-sm">Nenhum professor registado.</p>}
        </div>

        <h3 className="font-display font-bold text-gray-900 text-lg mb-4">Números Autorizados (Pendentes)</h3>
        <div className="space-y-3">
          {allowedTeachers.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="font-bold text-gray-900">{t.phone}</div>
              <div className="flex items-center gap-3">
                <div className="text-xs bg-orange-50 text-orange-600 font-bold px-2 py-1 rounded-md">Pendente</div>
                {confirmDeleteId?.id === t.id && confirmDeleteId?.col === 'allowed_teachers' ? (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteTeacher(t.id, 'allowed_teachers')}
                      className="text-xs bg-red-500 text-white font-bold px-2 py-1 rounded-md hover:bg-red-600"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded-md hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteId({ id: t.id, col: 'allowed_teachers' })}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {allowedTeachers.length === 0 && <p className="text-gray-500 text-sm">Nenhum número pendente.</p>}
        </div>
      </div>
    </div>
  );
}
