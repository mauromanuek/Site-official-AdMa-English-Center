import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { Feed } from './Feed';
import { StudentProfile } from './StudentProfile';
import { Book, Users, Star, Calendar, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { NavigationMenu } from './NavigationMenu';
import { SettingsView } from './SettingsView';

export function StudentDashboard({ profile, onViewProfile }: { profile: UserProfile, onViewProfile?: (u: string | UserProfile) => void }) {
  const [modalType, setModalType] = useState<'habilidades' | 'categorias' | 'horario' | 'settings' | null>(null);
  const [sameLevelStudents, setSameLevelStudents] = useState<UserProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
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
    if (modalType === 'categorias') {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const unsub = onSnapshot(q, (snap) => {
        setSameLevelStudents(
          snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile))
          .filter(s => s.id !== profile.id && s.level === profile.level)
        );
      });
      return () => unsub();
    }
  }, [modalType, profile.level, profile.id]);

  const calcScore = (s?: Record<string, string>) => {
    if (!s) return 0;
    const vals = Object.values(s).map(v => parseInt(v) || 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const score = calcScore(profile.skills);
  
  const displayLevel = configLoaded && !centerConfig.levels.includes(profile.level || '') ? '' : profile.level;
  const displayClassName = configLoaded && !centerConfig.classes.includes(profile.className || '') ? '' : profile.className;
  const displaySchedule = configLoaded && !centerConfig.schedules.includes(profile.schedule || '') ? '' : profile.schedule;

  if (modalType === 'settings') {
    return <SettingsView profile={profile} onBack={() => setModalType(null)} />;
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      <div className={cn("min-h-screen transition-all duration-300 pb-20", modalType ? "blur-[6px] opacity-60 pointer-events-none" : "")}>
        
        {/* Header Section */}
        <div className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 pt-12 rounded-b-[2.5rem] text-white flex flex-col items-center shadow-[0_10px_40px_rgba(79,70,229,0.3)] relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-purple-400/20 rounded-full blur-2xl"></div>
          
          <NavigationMenu role={profile.role} profileId={profile.id} onAction={(action) => {
            if (action === 'colleagues') setModalType('categorias');
            if (action === 'settings') setModalType('settings');
          }} />

          <div className="relative mt-2 z-10 flex flex-col items-center">
            <div className="relative inline-block mb-4">
              <div className="p-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
                <Avatar photo={profile.photo} className="w-28 h-28 border-4 border-white" />
              </div>
              
              <div className="absolute -right-3 -bottom-3 bg-white rounded-full p-1 shadow-xl z-20">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r={24} className="stroke-gray-100" strokeWidth="4" fill="none" />
                  <circle cx="28" cy="28" r={24} className="stroke-[#f59e0b] transition-all duration-1000 ease-out" strokeWidth="4" fill="none" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={(2 * Math.PI * 24) - (score / 100) * (2 * Math.PI * 24)} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-gray-900 font-display">{score}%</div>
              </div>
            </div>
            
            <h2 className="text-3xl font-display font-bold tracking-tight drop-shadow-sm text-center px-4">{profile.name}</h2>
          </div>
          
          <div className="text-blue-100/90 text-sm flex items-center gap-3 mt-2 font-medium bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {displayLevel || 'Sem Nível'}</span>
            <span className="opacity-50">•</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {displayClassName || 'Sem Turma'}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 px-6 mt-[-2rem] relative z-20">
          <button 
            onClick={() => setModalType('habilidades')} 
            className="flex-1 min-w-[45%] bg-white text-gray-900 font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 border border-gray-100/50 hover:border-blue-200"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Book className="w-5 h-5" /></div>
            Habilidades
          </button>
          <button 
            onClick={() => setModalType('horario')} 
            className="flex-1 min-w-[45%] bg-white text-gray-900 font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 border border-gray-100/50 hover:border-emerald-200"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Calendar className="w-5 h-5" /></div>
            Horário
          </button>
          <button 
            onClick={() => setModalType('categorias')} 
            className="flex-1 min-w-[100%] bg-white text-gray-900 font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 border border-gray-100/50 hover:border-indigo-200"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><Users className="w-5 h-5" /></div>
            Colegas
          </button>
        </div>

        <div className="px-6 mt-8">
          <h3 className="font-display font-bold text-gray-900 text-xl mb-4">Mural da Escola</h3>
          <Feed viewer={profile} onViewProfile={onViewProfile} />
        </div>
      </div>

      {/* Modals on top of blur */}
      {modalType === 'habilidades' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 border border-white">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setModalType(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-600 shadow-sm border border-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-gray-900 text-xl">Habilidades</h3>
            </div>
            
            {profile.skills && Object.keys(profile.skills).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(profile.skills).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 text-sm">
                    <span className="text-gray-500 capitalize font-medium">{k}</span>
                    <span className="font-bold text-gray-900 bg-white px-4 py-1.5 rounded-full shadow-sm">{v || '—'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 font-medium">Nenhuma habilidade registada.</p>
            )}
          </div>
        </div>
      )}

      {modalType === 'horario' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 border border-white">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setModalType(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-600 shadow-sm border border-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-gray-900 text-xl">Horário de Aulas</h3>
            </div>
            
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50 text-center">
              {displaySchedule ? (
                <p className="font-bold text-gray-900 text-lg">{displaySchedule}</p>
              ) : (
                <p className="text-gray-400 font-medium">Sem horário registado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {modalType === 'categorias' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200 border border-white">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setModalType(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-600 shadow-sm border border-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display font-bold text-gray-900 text-xl">Colegas</h3>
            </div>
            
            <div className="overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {sameLevelStudents.length === 0 ? (
                <p className="text-gray-400 text-center py-8 font-medium">Nenhum colega encontrado neste nível.</p>
              ) : (
                sameLevelStudents.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { setModalType(null); onViewProfile?.(s); }} 
                    className="flex items-center justify-between p-4 bg-white rounded-2xl cursor-pointer hover:shadow-md active:scale-[0.98] transition-all border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar photo={s.photo} className="w-12 h-12" />
                      <span className="font-bold text-gray-900">{s.name}</span>
                    </div>
                    <span className="text-gray-400">➔</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
