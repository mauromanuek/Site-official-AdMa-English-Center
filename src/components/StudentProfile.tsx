import { useState, useEffect } from 'react';
import { updateDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Avatar } from './Avatar';
import { MessageCircle, ArrowLeft, BookOpen, Star, Users, Briefcase, Calendar } from 'lucide-react';

export function StudentProfile({ student, viewer, onClose, onViewProfile, onMessage }: { student: UserProfile, viewer: UserProfile, onClose?: () => void, onViewProfile?: (u: UserProfile) => void, onMessage?: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState<Record<string, string>>(student.skills || { grammar: '', speaking: '', writing: '', reading: '' });
  const [level, setLevel] = useState(student.level || '');
  const [className, setClassName] = useState(student.className || '');
  const [schedule, setSchedule] = useState(student.schedule || '');
  const [loading, setLoading] = useState(false);
  const [teacherStudents, setTeacherStudents] = useState<UserProfile[]>([]);
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
    if (student.role === 'teacher') {
      const fetchStudents = async () => {
        const q = query(collection(db, 'users'), where('role', '==', 'student'), where('teacherId', '==', student.id));
        const snap = await getDocs(q);
        setTeacherStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      };
      fetchStudents();
    }
  }, [student.role, student.id]);

  const calcScore = (s: Record<string, string>) => {
    const vals = Object.values(s).map(v => parseInt(v) || 0);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };
  const score = calcScore(skills);

  const handleSaveSkills = async () => {
    setLoading(true);
    await updateDoc(doc(db, 'users', student.id), { skills, score, level, className, schedule });
    setIsEditing(false);
    setLoading(false);
  };

  const [anonMessage, setAnonMessage] = useState('');
  const [anonLoading, setAnonLoading] = useState(false);
  const [anonFeedback, setAnonFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleSendAnonymousMessage = async () => {
    if (!anonMessage.trim()) return;
    
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('sms_date');
    let count = parseInt(localStorage.getItem('sms_count') || '0', 10);
    
    if (storedDate !== today) {
      count = 0;
      localStorage.setItem('sms_date', today);
    }
    
    if (count >= 5) {
      setAnonFeedback({ type: 'error', msg: 'Limite diário de 5 SMS atingido.' });
      return;
    }
    
    setAnonLoading(true);
    setAnonFeedback(null);
    try {
      await import('firebase/firestore').then(({ addDoc, collection, serverTimestamp }) => {
        return addDoc(collection(db, 'mensagens_anonimas'), {
          teacherId: student.id,
          message: anonMessage.trim(),
          createdAt: serverTimestamp()
        });
      });
      
      count++;
      localStorage.setItem('sms_count', count.toString());
      setAnonMessage('');
      setAnonFeedback({ type: 'success', msg: 'Mensagem anónima enviada com sucesso.' });
    } catch (err) {
      console.error("Error sending anonymous message:", err);
      setAnonFeedback({ type: 'error', msg: 'Erro ao enviar mensagem.' });
    } finally {
      setAnonLoading(false);
      setTimeout(() => setAnonFeedback(null), 3000);
    }
  };

  const showSmsButton = () => {
    if (viewer.id === student.id) return false; // Own profile
    if (viewer.role === 'student') {
      return viewer.level === student.level;
    }
    return true; // Teacher and Parent can send SMS
  };

  const displayLevel = configLoaded && !centerConfig.levels.includes(student.level || '') ? '' : student.level;
  const displayClassName = configLoaded && !centerConfig.classes.includes(student.className || '') ? '' : student.className;
  const displaySchedule = configLoaded && !centerConfig.schedules.includes(student.schedule || '') ? '' : student.schedule;

  return (
    <div className="bg-[#f8fafc] min-h-screen relative flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
      
      {/* Top Profile Header */}
      <div className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 pt-12 rounded-b-[2.5rem] text-white flex flex-col items-center shadow-[0_10px_40px_rgba(79,70,229,0.3)] relative overflow-hidden">
        {/* Soft geometric shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-purple-400/20 rounded-full blur-2xl"></div>
        
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-8 left-6 p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center z-20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative mt-2 z-10 flex flex-col items-center">
          <div className="relative inline-block mb-4">
            <div className="p-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
              <Avatar photo={student.photo} className="w-28 h-28 border-4 border-white" />
            </div>
            
            {student.role !== 'teacher' && (
              <div className="absolute -right-3 -bottom-3 bg-white rounded-full p-1 shadow-xl z-20">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r={24} className="stroke-gray-100" strokeWidth="4" fill="none" />
                  <circle 
                    cx="28" cy="28" r={24} 
                    className="stroke-[#f59e0b] transition-all duration-1000 ease-out" 
                    strokeWidth="4" fill="none" 
                    strokeDasharray={2 * Math.PI * 24} 
                    strokeDashoffset={(2 * Math.PI * 24) - (score / 100) * (2 * Math.PI * 24)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-gray-900 font-display">
                  {score}%
                </div>
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-display font-bold tracking-tight drop-shadow-sm text-center px-4">{student.name}</h2>
        </div>

        {student.role !== 'teacher' && (
          <div className="text-blue-100/90 text-sm flex items-center justify-center flex-wrap gap-3 mt-2 font-medium bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            {isEditing ? (
              <select value={level} onChange={e => setLevel(e.target.value)} className="bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-white/50">
                <option value="" className="text-gray-900">Nível...</option>
                {centerConfig.levels.map(l => <option key={l} value={l} className="text-gray-900">{l}</option>)}
              </select>
            ) : (
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {displayLevel || 'Sem Nível'}</span>
            )}
            <span className="opacity-50">•</span>
            {isEditing ? (
              <select value={className} onChange={e => setClassName(e.target.value)} className="bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-white/50">
                <option value="" className="text-gray-900">Turma...</option>
                {centerConfig.classes.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
              </select>
            ) : (
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {displayClassName || 'Sem Turma'}</span>
            )}
          </div>
        )}
      </div>

      {showSmsButton() && (
        <div className="w-full px-6 mt-[-1.5rem] relative z-20">
          <button 
            onClick={onMessage}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:shadow-[0_8px_30px_rgba(20,184,166,0.4)]"
          >
            <MessageCircle className="w-5 h-5" /> Enviar Mensagem
          </button>
        </div>
      )}

      <div className="w-full p-6 mt-4">
        {student.role === 'teacher' ? (
          <>
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 overflow-hidden">
              <h3 className="font-display font-bold text-gray-900 text-xl flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-indigo-500" />
                Alunos ({teacherStudents.length})
              </h3>
              <div className="space-y-3">
                {teacherStudents.map(s => (
                  <div key={s.id} onClick={() => onViewProfile?.(s)} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100/50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <Avatar photo={s.photo} className="w-10 h-10 shadow-sm" />
                    <div>
                      <div className="font-bold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500 font-medium">{s.className || 'Sem turma'}</div>
                    </div>
                  </div>
                ))}
                {teacherStudents.length === 0 && (
                  <p className="text-gray-500 text-center py-4 font-medium text-sm">Sem alunos registados.</p>
                )}
              </div>
            </div>
            
            {(viewer.role === 'student' || viewer.role === 'parent') && (
              <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 overflow-hidden mt-4">
                <h3 className="font-display font-bold text-gray-900 text-xl flex items-center gap-2 mb-4">
                  <MessageCircle className="w-5 h-5 text-indigo-500" />
                  Sugestões/Denúncias Anónimas
                </h3>
                <div className="space-y-4">
                  <textarea
                    value={anonMessage}
                    onChange={(e) => setAnonMessage(e.target.value)}
                    placeholder="Escreva a sua mensagem anónima aqui..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32"
                  />
                  <button
                    onClick={handleSendAnonymousMessage}
                    disabled={anonLoading || !anonMessage.trim()}
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {anonLoading ? 'A enviar...' : 'Enviar SMS Anónimo'}
                  </button>
                  {anonFeedback && (
                    <div className={`p-3 rounded-xl text-sm font-bold text-center ${anonFeedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {anonFeedback.msg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-gray-900 text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Horário de Aulas
                </h3>
                {viewer.role === 'teacher' && (
                  <button 
                    onClick={() => isEditing ? handleSaveSkills() : setIsEditing(true)}
                    disabled={loading}
                    className="bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-xl text-sm active:scale-95 transition-all hover:bg-indigo-100"
                  >
                    {loading ? '...' : isEditing ? 'Salvar' : 'Editar'}
                  </button>
                )}
              </div>
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                 {isEditing ? (
                    <select 
                      value={schedule} 
                      onChange={(e) => setSchedule(e.target.value)}
                      className="border border-indigo-200 rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-inner font-medium text-gray-900"
                    >
                      <option value="">Selecione o horário...</option>
                      {centerConfig.schedules.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 ) : (
                    <p className="text-gray-700 font-medium">{displaySchedule || 'Sem horário definido'}</p>
                 )}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-bold text-gray-900 text-xl flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Habilidades
                </h3>
              </div>
    
              <div className="space-y-4">
                {Object.keys(skills).map((k) => (
                  <div key={k} className="flex justify-between items-center text-sm bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                    <span className="text-gray-500 capitalize font-medium">{k}</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={skills[k]} 
                        onChange={(e) => setSkills({ ...skills, [k]: e.target.value })}
                        className="border border-indigo-200 rounded-xl p-2 text-right focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32 bg-white shadow-inner font-bold text-gray-900"
                      />
                    ) : (
                      <span className="font-bold text-gray-900 bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">{skills[k] || '—'}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
