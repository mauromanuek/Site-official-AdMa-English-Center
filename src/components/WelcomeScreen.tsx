import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden font-sans">
      {/* Decorative soft glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

      <div className="z-10 flex flex-col items-center text-center max-w-sm w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] mb-8 border border-white/50">
          <BookOpen className="w-14 h-14 text-blue-600" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4 tracking-tight leading-tight">
          Bem-vindo ao <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            AdMa English Center
          </span>
        </h1>
        
        <p className="text-gray-500 text-base mb-10 leading-relaxed font-medium">
          Transforme a sua jornada no aprendizado do inglês com uma plataforma moderna, rápida e intuitiva.
        </p>
        
        <button 
          onClick={onStart}
          className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl focus:outline-none shadow-[0_8px_30px_rgb(37,99,235,0.24)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.36)] hover:-translate-y-1 active:scale-[0.98]"
        >
          <Sparkles className="w-5 h-5 text-blue-200" />
          Começar Agora
          <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
