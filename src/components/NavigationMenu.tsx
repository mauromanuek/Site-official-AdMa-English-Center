import { useState } from 'react';
import { Menu, X, LogOut, Settings, Users, Book, Briefcase, History, Trash2, Image } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Role } from '../types';

export function NavigationMenu({ role, profileId, onAction }: { role: Role, profileId: string, onAction: (action: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: string) => {
    setIsOpen(false);
    onAction(action);
  };

  const getMenuItems = () => {
    if (role === 'teacher') {
      return [
        { id: 'panel', icon: Briefcase, label: 'Meu Painel' },
        { id: 'gallery', icon: Image, label: 'Galeria' },
        { id: 'manage_teachers', icon: Users, label: 'Gestão de Professores' },
        { id: 'manage_students', icon: Book, label: 'Gestão de Alunos' },
        { id: 'manage_center', icon: Settings, label: 'Gerir Centro' },
        { id: 'usage_history', icon: History, label: 'Histórico de Uso' },
        { id: 'delete_accounts', icon: Trash2, label: 'Eliminar Contas' },
        { id: 'settings', icon: Settings, label: 'Definições' },
      ];
    }
    if (role === 'student') {
      return [
        { id: 'profile', icon: Book, label: 'Meu Perfil' },
        { id: 'colleagues', icon: Users, label: 'Colegas' },
        { id: 'settings', icon: Settings, label: 'Definições' },
      ];
    }
    return [
      { id: 'students', icon: Users, label: 'Meus Educandos' },
      { id: 'settings', icon: Settings, label: 'Definições' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-8 left-6 z-40 p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-all shadow-sm active:scale-95 flex items-center justify-center border border-white/10"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Menu Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-500" onClick={() => setIsOpen(false)}></div>
          <div className="relative mr-auto w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500 ease-out">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#f8fafc]">
              <h2 className="font-display font-bold text-gray-900 text-xl tracking-tight">Menu</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-white rounded-full text-gray-500 hover:bg-gray-100 shadow-sm border border-gray-100 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              {menuItems.map((item, idx) => (
                <button key={idx} onClick={() => handleAction(item.id)} className="w-full flex items-center gap-4 px-6 py-4 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium text-left">
                  <item.icon className="w-5 h-5 opacity-70" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100 bg-[#f8fafc]">
              <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors active:scale-[0.98]">
                <LogOut className="w-5 h-5" /> Terminar Sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
