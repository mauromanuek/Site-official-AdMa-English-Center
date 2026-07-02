import { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, messaging } from '../lib/firebase';
import { phoneToEmail } from '../lib/utils';
import { Role } from '../types';
import { Book, Users, Briefcase, ArrowLeft } from 'lucide-react';

const AUTHORIZED_TEACHERS = ['923000000', '912000000', '999999999', '940602764']; // Edit according to needs

export function AuthScreen({ onRoleSelect }: { onRoleSelect: (role: Role) => void }) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    if (role === 'teacher' && !isLogin) {
      if (!AUTHORIZED_TEACHERS.includes(cleanPhone)) {
        setError('Este número não está autorizado para registo como Teacher.');
        return;
      }
    }

    setLoading(true);
    try {
      const email = phoneToEmail(phone);
      localStorage.setItem('intendedRole', role!);
      
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        
        if (role === 'parent') {
          try {
            // Placeholder: Em produção, deves obter o token via getToken() do Firebase Messaging
            const dummyToken = 'device_fcm_token_here';
            await messaging.subscribeToTopic(dummyToken, 'encarregados_adma');
          } catch (e) {
            console.error('Erro na subscrição FCM:', e);
          }
        }
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onRoleSelect(role!);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este número já está registado. Tente fazer Login.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Telefone ou palavra-passe incorretos.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
        {/* Soft glowing blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

        <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight mb-2">Quem és tu?</h1>
            <p className="text-gray-500 font-medium">Selecione o seu tipo de conta para continuar.</p>
          </div>
          
          <div className="space-y-4">
            <button onClick={() => setRole('student')} className="w-full bg-white/80 backdrop-blur-xl border border-gray-100 p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex items-center gap-4 group">
              <div className="bg-blue-50 p-4 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Book className="text-blue-600 w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold font-display text-gray-900 text-lg">Sou Estudante</div>
                <div className="text-sm text-gray-500">Aceder a aulas e desafios</div>
              </div>
            </button>
            
            <button onClick={() => setRole('parent')} className="w-full bg-white/80 backdrop-blur-xl border border-gray-100 p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex items-center gap-4 group">
              <div className="bg-green-50 p-4 rounded-xl group-hover:bg-green-100 transition-colors">
                <Users className="text-green-600 w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold font-display text-gray-900 text-lg">Sou Encarregado</div>
                <div className="text-sm text-gray-500">Acompanhar os educandos</div>
              </div>
            </button>
            
            <button onClick={() => setRole('teacher')} className="w-full bg-white/80 backdrop-blur-xl border border-gray-100 p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all flex items-center gap-4 group">
              <div className="bg-purple-50 p-4 rounded-xl group-hover:bg-purple-100 transition-colors">
                <Briefcase className="text-purple-600 w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold font-display text-gray-900 text-lg">Sou Teacher</div>
                <div className="text-sm text-gray-500">Gerir alunos e publicar</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
      {/* Soft glowing blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

      <button onClick={() => setRole(null)} className="absolute top-8 left-6 p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center z-20">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500 mt-12">
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-1">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
        <p className="text-gray-500 font-medium mb-8">Conta de {role === 'student' ? 'Estudante' : role === 'parent' ? 'Encarregado' : 'Professor'}</p>
        
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">{error}</div>}
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 ml-1">Número de Telefone</label>
            <input 
              type="tel" 
              required
              className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              value={phone}
              placeholder="Ex: 923000000"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 ml-1">Palavra-passe</label>
            <input 
              type="password" 
              required
              className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
              value={password}
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(37,99,235,0.24)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100 mt-2"
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Registar')}
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
            {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">
              {isLogin ? 'Criar agora' : 'Fazer Login'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
