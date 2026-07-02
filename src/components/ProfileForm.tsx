import { useState, FormEvent, useEffect } from 'react';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Role } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from 'lucide-react';

export function ProfileForm({ user, role, onComplete }: { user: FirebaseUser, role: Role, onComplete: (p: UserProfile) => void }) {
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [level, setLevel] = useState('');
  const [className, setClassName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [config, setConfig] = useState<{ levels: string[], classes: string[], schedules: string[] }>({ levels: [], classes: [], schedules: [] });
  const [teachers, setTeachers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (role === 'student') {
      getDoc(doc(db, 'config', 'center')).then(snap => {
        if (snap.exists()) {
          setConfig(snap.data() as any);
        }
      });
    }
    if (role === 'student' || role === 'parent') {
      getDocs(query(collection(db, 'users'), where('role', '==', 'teacher'))).then(snap => {
        setTeachers(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      });
    }
  }, [role]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const phone = user.email ? user.email.split('@')[0] : '';
      
      if (role === 'teacher') {
        const allowedDoc = await getDoc(doc(db, 'allowed_teachers', phone));
        if (!allowedDoc.exists()) {
          setErrorMsg('Este número não está autorizado a criar conta como professor. Solicite autorização a outro professor.');
          setLoading(false);
          return;
        }
      }

      if ((role === 'student' || role === 'parent') && !selectedTeacherId) {
        setErrorMsg('Por favor, selecione um professor para enviar a confirmação.');
        setLoading(false);
        return;
      }

      const newProfile: Partial<UserProfile> = {
        role,
        phone,
        name,
        photo,
        status: role === 'teacher' ? 'approved' : 'pending'
      };
      
      if (role === 'student') {
        newProfile.level = level;
        newProfile.className = className;
        newProfile.schedule = schedule;
        newProfile.score = 0;
        newProfile.teacherId = selectedTeacherId;
      } else if (role === 'parent') {
        newProfile.teacherId = selectedTeacherId;
      }

      await setDoc(doc(db, 'users', user.uid), newProfile);
      
      if (role === 'student' || role === 'parent') {
        await addDoc(collection(db, 'notifications'), {
          userId: selectedTeacherId,
          title: 'Novo Registo',
          message: `O ${role === 'student' ? 'aluno' : 'encarregado'} ${name} solicitou acesso.`,
          type: 'pedido_vinculacao',
          read: false,
          relatedId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      onComplete({ id: user.uid, ...newProfile } as UserProfile);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
      {/* Soft blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

      <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4 shadow-sm border border-blue-100">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-1">Completar Perfil</h2>
          <p className="text-gray-500 font-medium">Preencha os seus dados para aceder à plataforma.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 ml-1">Nome Completo</label>
            <input 
              type="text" 
              required
              className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              value={name}
              placeholder="Ex: Mauro Manuel"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 ml-1">Ficheiro da Foto (Opcional)</label>
            <input 
              type="text" 
              className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              value={photo}
              placeholder="Ex: url da foto (Deixe vazio para padrão)"
              onChange={(e) => setPhoto(e.target.value)}
            />
          </div>

          {(role === 'student' || role === 'parent') && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 ml-1">Enviar Confirmação Para (Professor)</label>
              <select 
                required
                className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner appearance-none"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <option value="" disabled>Selecione um professor...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {role === 'student' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 ml-1">Nível de Inglês</label>
                <select 
                  required
                  className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner appearance-none"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="" disabled>Selecione um nível...</option>
                  {config.levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 ml-1">Turma</label>
                  <select 
                    required
                    className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner appearance-none"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  >
                    <option value="" disabled>Selecione...</option>
                    {config.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 ml-1">Horário</label>
                  <select 
                    required
                    className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner appearance-none"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                  >
                    <option value="" disabled>Selecione...</option>
                    {config.schedules.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
          
          {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(37,99,235,0.24)] active:scale-[0.98] transition-all disabled:opacity-70 mt-6"
          >
            {loading ? 'Aguarde...' : 'Concluir'}
          </button>
        </form>
      </div>
    </div>
  );
}
