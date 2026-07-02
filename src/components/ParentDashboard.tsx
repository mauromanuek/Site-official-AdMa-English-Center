import { useState, useEffect, FormEvent } from 'react';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, PedidoVinculacao } from '../types';
import { Avatar } from './Avatar';
import { Feed } from './Feed';
import { StudentProfile } from './StudentProfile';
import { NavigationMenu } from './NavigationMenu';
import { SettingsView } from './SettingsView';
import { Users, Search, PlusCircle, ArrowRight, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export function ParentDashboard({ profile, onViewProfile }: { profile: UserProfile, onViewProfile?: (u: string | UserProfile) => void }) {
  const [educandos, setEducandos] = useState<UserProfile[]>([]);
  const [pedidos, setPedidos] = useState<PedidoVinculacao[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isAdding, setIsAdding] = useState(false);
  const [studentPhone, setStudentPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [centerConfig, setCenterConfig] = useState<{ levels: string[], classes: string[], schedules: string[] }>({ levels: [], classes: [], schedules: [] });
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    import('firebase/firestore').then(({ doc, getDoc }) => {
      getDoc(doc(db, 'config', 'center')).then(snap => {
        if (snap.exists()) setCenterConfig(snap.data() as any);
        setConfigLoaded(true);
      });
    });
  }, []);

  useEffect(() => {
    const qStudents = query(collection(db, 'users'), where('parentId', '==', profile.id));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setEducandos(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });

    const qPedidos = query(collection(db, 'pedidos_vinculacao'), where('parentId', '==', profile.id));
    const unsubPedidos = onSnapshot(qPedidos, (snap) => {
      setPedidos(snap.docs.map(d => ({ id: d.id, ...d.data() } as PedidoVinculacao)));
    });

    return () => { unsubStudents(); unsubPedidos(); };
  }, [profile.id]);

  const handleAddEducando = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = studentPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      setError('Telefone inválido.'); return;
    }
    
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      const snap = await getDocs(q);
      const studentDocs = snap.docs.filter(d => d.data().role === 'student');
      
      if (studentDocs.length === 0) {
        setError('Nenhum aluno encontrado com este número.');
      } else {
        const student = { id: studentDocs[0].id, ...studentDocs[0].data() } as UserProfile;
        if (student.parentId === profile.id) {
          setError('Este aluno já é o seu educando.');
        } else if (!student.teacherId) {
          setError('Este aluno ainda não está associado a um professor.');
        } else {
          if (pedidos.some(p => p.studentPhone === cleanPhone && p.status === 'pending')) {
            setError('Já existe um pedido pendente para este número.');
          } else {
            await addDoc(collection(db, 'pedidos_vinculacao'), {
              parentId: profile.id,
              parentName: profile.name,
              studentPhone: cleanPhone,
              teacherId: student.teacherId,
              status: 'pending',
              createdAt: serverTimestamp()
            });
            setIsAdding(false);
            setStudentPhone('');
          }
        }
      }
    } catch (err) {
      setError('Erro ao processar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  const pendingPedidos = pedidos.filter(p => p.status === 'pending');

  if (showSettings) {
    return <SettingsView profile={profile} onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      <div className={cn("min-h-screen transition-all duration-300 pb-20", isAdding ? "blur-[6px] opacity-60 pointer-events-none" : "")}>
        {/* Top Profile Header */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white p-8 pt-12 rounded-b-[2.5rem] shadow-[0_10px_40px_rgba(20,184,166,0.3)] relative overflow-hidden">
          {/* Soft geometric shapes */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl"></div>

          <NavigationMenu role={profile.role} profileId={profile.id} onAction={(action) => {
            if (action === 'settings') setShowSettings(true);
          }} />

          <div className="flex items-center gap-5 relative z-10 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onViewProfile?.(profile)}>
            <div className="p-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
              <Avatar photo={profile.photo} className="w-20 h-20 border-4 border-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight hover:underline">{profile.name}</h1>
              <p className="text-teal-100 text-sm font-medium bg-white/10 px-3 py-1 rounded-full inline-block mt-1 border border-white/10">Encarregado</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 mt-[-2rem] relative z-20">
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full bg-white text-gray-900 font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-gray-100/50 hover:border-teal-200"
          >
            <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center"><PlusCircle className="w-5 h-5" /></div>
            Adicionar Educando
          </button>
        </div>

        {/* Meus Educandos Block */}
        <div className="px-6 mt-8">
          <h3 className="font-display font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-500" /> Meus Educandos
          </h3>

          <div className="space-y-4">
            {educandos.length === 0 && pendingPedidos.length === 0 && (
              <div className="bg-white border border-gray-100 p-8 rounded-3xl text-center shadow-sm">
                <p className="text-gray-400 font-medium">Ainda não tem educandos associados.</p>
              </div>
            )}

            {educandos.map(student => {
              const displayLevel = configLoaded && !centerConfig.levels.includes(student.level || '') ? '' : student.level;
              const displayClassName = configLoaded && !centerConfig.classes.includes(student.className || '') ? '' : student.className;
              const displaySchedule = configLoaded && !centerConfig.schedules.includes(student.schedule || '') ? '' : student.schedule;

              return (
              <div 
                key={student.id} 
                onClick={() => onViewProfile?.(student)}
                className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-teal-100 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  <Avatar photo={student.photo} className="w-14 h-14 shadow-sm" />
                  <div>
                    <div className="font-bold text-gray-900 text-lg hover:underline">{student.name}</div>
                    <div className="text-sm text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-md inline-block mt-1">Educando Confirmado</div>
                    {(displayLevel || displayClassName || displaySchedule) && (
                      <div className="text-xs text-gray-500 font-medium mt-1.5 flex flex-col gap-0.5">
                        {displaySchedule && <div><span className="font-bold">Horário:</span> {displaySchedule}</div>}
                        {(displayLevel || displayClassName) && (
                          <div className="flex items-center gap-1">
                            {displayLevel && <span>{displayLevel}</span>}
                            {displayLevel && displayClassName && <span>•</span>}
                            {displayClassName && <span>{displayClassName}</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600" />
                </div>
              </div>
            )})}

            {pendingPedidos.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-100 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{p.studentPhone}</div>
                  <div className="text-sm text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-md inline-block mt-1">Aguardando Aprovação</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="px-6 mt-8">
          <h3 className="font-display font-bold text-gray-900 text-xl mb-4">Mural da Escola</h3>
          <Feed viewer={profile} onViewProfile={onViewProfile} />
        </div>
      </div>

      {/* Add Educando Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 border border-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-gray-900 text-xl">Vincular Educando</h3>
              <button onClick={() => { setIsAdding(false); setError(''); }} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full active:scale-95">X</button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6 font-medium">Introduza o número de telefone do estudante. O Teacher responsável terá de aprovar o pedido.</p>
            
            <form onSubmit={handleAddEducando} className="space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="tel"
                  required
                  placeholder="Ex: 923000000"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                />
              </div>
              
              {error && (
                <div className={`p-4 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-100`}>
                  {error}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(20,184,166,0.24)] active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
              >
                {loading ? 'Aguarde...' : 'Enviar Pedido'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
