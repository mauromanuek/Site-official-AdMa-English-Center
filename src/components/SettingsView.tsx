import React, { useState, useEffect } from 'react';
import { updateDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { ArrowLeft, Save, Moon, Sun, User, Image as ImageIcon } from 'lucide-react';

export function SettingsView({ profile, onBack }: { profile: UserProfile, onBack: () => void }) {
  const [name, setName] = useState(profile.name || '');
  const [photo, setPhoto] = useState(profile.photo || '');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setFeedbackMsg('');
    try {
      const newName = name.trim();
      const newPhoto = photo.trim();
      
      await updateDoc(doc(db, 'users', profile.id), {
        name: newName,
        photo: newPhoto
      });

      const qPosts = query(collection(db, 'posts'), where('authorId', '==', profile.id));
      const postSnaps = await getDocs(qPosts);
      const postUpdates = postSnaps.docs.map(d => updateDoc(doc(db, 'posts', d.id), {
        authorName: newName,
        authorPhoto: newPhoto
      }));
      await Promise.all(postUpdates);

      if (profile.role === 'parent') {
        const qPedidos = query(collection(db, 'pedidos_vinculacao'), where('parentId', '==', profile.id));
        const pedidoSnaps = await getDocs(qPedidos);
        const pedidoUpdates = pedidoSnaps.docs.map(d => updateDoc(doc(db, 'pedidos_vinculacao', d.id), {
          parentName: newName
        }));
        await Promise.all(pedidoUpdates);
      }

      const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', profile.id));
      const chatSnaps = await getDocs(qChats);
      const chatUpdates = chatSnaps.docs.map(d => {
        const data = d.data();
        const usersData = data.usersData || {};
        if (usersData[profile.id]) {
          usersData[profile.id].name = newName;
          usersData[profile.id].photo = newPhoto;
          return updateDoc(doc(db, 'chats', d.id), { usersData });
        }
        return Promise.resolve();
      });
      await Promise.all(chatUpdates);

      setFeedbackMsg('Alterações guardadas com sucesso.');
    } catch (err) {
      console.error(err);
      setFeedbackMsg('Erro ao guardar alterações.');
    } finally {
      setLoading(false);
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900 animate-in fade-in pb-20 transition-colors">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 sticky top-0 z-10 shadow-sm pt-8 transition-colors">
        <button onClick={onBack} className="p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all text-gray-700 dark:text-gray-200 shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-gray-900 dark:text-white text-xl">Definições</h2>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="font-display font-bold text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" /> Perfil
          </h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alterar Nome</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner text-gray-900 dark:text-white transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alterar Foto (Nome do ficheiro ou URL)</label>
              <div className="relative">
                <ImageIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={photo} 
                  onChange={e => setPhoto(e.target.value)} 
                  placeholder="Ex: foto_perfil.jpg"
                  className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner text-gray-900 dark:text-white transition-colors" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(79,70,229,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'A Guardar...' : 'Guardar Alterações'}
            </button>
            {feedbackMsg && (
              <div className="mt-4 p-3 rounded-lg text-center font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {feedbackMsg}
              </div>
            )}
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="font-display font-bold text-gray-900 dark:text-white text-lg mb-6 flex items-center gap-2">
            <Sun className="w-5 h-5 text-indigo-500" /> Preferências
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                {darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-white">Dark Mode</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Alternar tema escuro</div>
              </div>
            </div>
            
            <button 
              onClick={toggleDarkMode}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
