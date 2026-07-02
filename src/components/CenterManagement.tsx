import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';

export function CenterManagement({ onBack }: { onBack: () => void }) {
  const [config, setConfig] = useState<{ levels: string[], classes: string[], schedules: string[] }>({ levels: [], classes: [], schedules: [] });
  const [newLevel, setNewLevel] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{field: string, value: string} | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, 'config', 'center');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setConfig(snap.data() as any);
      } else {
        await setDoc(docRef, { levels: [], classes: [], schedules: [] });
      }
    };
    fetchConfig();
  }, []);

  const addField = async (field: 'levels' | 'classes' | 'schedules', value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return;
    const docRef = doc(db, 'config', 'center');
    await updateDoc(docRef, { [field]: arrayUnion(value.trim()) });
    setConfig({ ...config, [field]: [...config[field], value.trim()] });
    setValue('');
  };

  const removeField = async (field: 'levels' | 'classes' | 'schedules', value: string) => {
    const docRef = doc(db, 'config', 'center');
    await updateDoc(docRef, { [field]: arrayRemove(value) });
    setConfig({ ...config, [field]: config[field].filter(v => v !== value) });
    setConfirmDelete(null);
  };

  const renderSection = (title: string, field: 'levels' | 'classes' | 'schedules', value: string, setValue: (v: string) => void, placeholder: string) => (
    <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
      <h3 className="font-display font-bold text-gray-900 text-lg mb-4">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={value} 
          onChange={e => setValue(e.target.value)} 
          placeholder={placeholder}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
        />
        <button 
          onClick={() => addField(field, value, setValue)}
          className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-2">
        {config[field].length === 0 && <p className="text-gray-400 text-sm font-medium">Nenhum registo.</p>}
        {config[field].map(item => (
          <div key={item} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="font-medium text-gray-700">{item}</span>
            {confirmDelete?.field === field && confirmDelete?.value === item ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => removeField(field, item)}
                  className="text-xs bg-red-500 text-white font-bold px-2 py-1 rounded-md hover:bg-red-600"
                >
                  Apagar
                </button>
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-1 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete({ field, value: item })} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in pb-20">
      <div className="bg-white/80 backdrop-blur-xl p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10 shadow-sm pt-8">
        <button onClick={onBack} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-gray-900 text-xl">Gerir Centro</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {renderSection('Níveis Disponíveis', 'levels', newLevel, setNewLevel, 'Ex: Iniciação, Intermédio...')}
        {renderSection('Turmas', 'classes', newClass, setNewClass, 'Ex: Turma A, Turma B...')}
        {renderSection('Horários', 'schedules', newSchedule, setNewSchedule, 'Ex: Segunda 10:00, Sábado 14:00...')}
      </div>
    </div>
  );
}
