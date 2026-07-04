import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, updateDoc, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, PedidoVinculacao } from '../types';
import { Avatar } from './Avatar';
import { Feed } from './Feed';
import { NavigationMenu } from './NavigationMenu';
import { Edit3, Users, ChevronDown, ChevronUp, CheckCircle, Bell } from 'lucide-react';

import { CenterManagement } from './CenterManagement';
import { TeacherManagement } from './TeacherManagement';
import { StudentManagement } from './StudentManagement';
import { UsageHistory } from './UsageHistory';
import { AccountDeletion } from './AccountDeletion';

import { SettingsView } from './SettingsView';
import { GalleryView } from './GalleryView';

export function TeacherDashboard({ profile, onViewProfile }: { profile: UserProfile, onViewProfile?: (u: string | UserProfile) => void }) {
  const [currentTab, setCurrentTab] = useState<'panel' | 'manage_teachers' | 'manage_students' | 'manage_center' | 'usage_history' | 'delete_accounts' | 'settings' | 'gallery'>('panel');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [pedidos, setPedidos] = useState<PedidoVinculacao[]>([]);
  const [showMyStudentsOnly, setShowMyStudentsOnly] = useState(false);
  const [expandedGlobal, setExpandedGlobal] = useState(false);
  const [centerConfig, setCenterConfig] = useState<{ levels: string[], classes: string[], schedules: string[] }>({ levels: [], classes: [], schedules: [] });
  const [configLoaded, setConfigLoaded] = useState(false);
  
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Post modal state
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postPrivacy, setPostPrivacy] = useState<'minha_turma'|'apenas_alunos'|'publico'>('publico');
  const [postType, setPostType] = useState<'comunicado' | 'destaque'>('comunicado');
  const [mediaType, setMediaType] = useState<'Imagem' | 'Vídeo' | 'Nenhum'>('Nenhum');
  const [fileName, setFileName] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  // Github Gallery state
  const [showGithubGallery, setShowGithubGallery] = useState(false);
  const [githubFiles, setGithubFiles] = useState<{name: string, url: string}[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('gh_repo') || '');
  const [ghToken, setGhToken] = useState(localStorage.getItem('gh_token') || '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');

  const [pendingAccounts, setPendingAccounts] = useState<UserProfile[]>([]);

  useEffect(() => {
    const docRef = doc(db, 'config', 'center');
    onSnapshot(docRef, snap => {
      if (snap.exists()) {
        setCenterConfig(snap.data() as any);
      }
      setConfigLoaded(true);
    });
  }, []);

  useEffect(() => {
    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });

    const qPedidos = query(collection(db, 'pedidos_vinculacao'), where('status', '==', 'pending'));
    const unsubPedidos = onSnapshot(qPedidos, (snap) => {
      const allPedidos = snap.docs.map(d => ({ id: d.id, ...d.data() } as PedidoVinculacao));
      setPedidos(allPedidos);
    });

    const qPending = query(collection(db, 'users'), where('status', '==', 'pending'), where('teacherId', '==', profile.id));
    const unsubPending = onSnapshot(qPending, (snap) => {
      setPendingAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });

    return () => { unsubStudents(); unsubPedidos(); unsubPending(); };
  }, [profile.id]);

  const handleApproveAccount = async (user: UserProfile) => {
    await updateDoc(doc(db, 'users', user.id), { status: 'approved' });
    
    await addDoc(collection(db, 'notifications'), {
      userId: user.id,
      title: 'Conta Aprovada',
      message: `O professor ${profile.name} aprovou a sua conta. Já pode aceder à plataforma!`,
      type: 'geral',
      read: false,
      createdAt: serverTimestamp()
    });
  };

  const handleLinkStudent = async (studentId: string) => {
    await updateDoc(doc(db, 'users', studentId), { teacherId: profile.id });
  };

  const handleApprovePedido = async (pedido: PedidoVinculacao, studentId: string) => {
    await updateDoc(doc(db, 'users', studentId), { parentId: pedido.parentId });
    await updateDoc(doc(db, 'pedidos_vinculacao', pedido.id), { status: 'approved', studentId });
    
    // Notify parent
    await addDoc(collection(db, 'notifications'), {
      userId: pedido.parentId,
      title: 'Vinculação Aprovada',
      message: `O professor ${profile.name} aceitou a sua vinculação ao aluno.`,
      type: 'pedido_vinculacao',
      read: false,
      relatedId: pedido.id,
      createdAt: serverTimestamp()
    });
  };

  const fetchGithubGallery = async () => {
    if (!ghRepo) {
      alert("Por favor, informe o formato utilizador/repositorio.");
      return;
    }
    setGithubLoading(true);
    try {
      const folder = mediaType === 'Imagem' ? 'fotos' : 'videos';
      let res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/public/${folder}`, {
        headers: ghToken ? { Authorization: `token ${ghToken}` } : {}
      });
      let data = await res.json();
      
      if (!res.ok) {
        res = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${folder}`, {
          headers: ghToken ? { Authorization: `token ${ghToken}` } : {}
        });
        if (res.ok) {
          data = await res.json();
        } else {
          alert('Erro ao aceder ao repositório GitHub. Verifique o repositório e o token.');
          setGithubLoading(false);
          return;
        }
      }
      
      localStorage.setItem('gh_repo', ghRepo);
      localStorage.setItem('gh_token', ghToken);
      
      const files = data.filter((f: any) => f.type === 'file').map((f: any) => ({
        name: f.name,
        url: f.download_url
      }));
      setGithubFiles(files);
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao GitHub.');
    }
    setGithubLoading(false);
  };

  const handlePost = async () => {
    if (!postContent.trim()) return;
    
    const postRef = await addDoc(collection(db, 'posts'), {
      authorId: profile.id,
      authorName: profile.name,
      authorPhoto: profile.photo || '',
      content: postContent,
      privacy: postPrivacy,
      type: postType,
      mediaUrl: postType === 'destaque' ? mediaUrl : '',
      mediaType: mediaType,
      fileName: fileName.trim(),
      createdAt: serverTimestamp()
    });

    if (postType === 'destaque') {
      const myStudents = students.filter(s => s.teacherId === profile.id);
      const targetStudents = postPrivacy === 'minha_turma' ? myStudents : students;
      
      const promises = targetStudents.map(s => 
        addDoc(collection(db, 'notifications'), {
          userId: s.id,
          title: 'Destaque da Semana',
          message: `O professor ${profile.name} publicou o destaque da semana!`,
          type: 'destaque',
          read: false,
          relatedId: postRef.id,
          createdAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
    }

    setPostContent('');
    setMediaUrl('');
    setMediaType('Nenhum');
    setFileName('');
    setPostType('comunicado');
    setIsPosting(false);
  };

  const myStudents = students.filter(s => s.teacherId === profile.id);
  const unlinkedStudents = students.filter(s => !s.teacherId);
  
  const myPedidos = pedidos.filter(p => {
    const student = students.find(s => s.phone === p.studentPhone);
    return student && student.teacherId === profile.id;
  });

  if (currentTab === 'manage_center') {
    return <CenterManagement onBack={() => setCurrentTab('panel')} />;
  }
  if (currentTab === 'manage_teachers') {
    return <TeacherManagement onBack={() => setCurrentTab('panel')} />;
  }
  if (currentTab === 'manage_students') {
    return <StudentManagement profile={profile} onViewProfile={onViewProfile} onBack={() => setCurrentTab('panel')} />;
  }
  if (currentTab === 'usage_history') {
    return <UsageHistory profile={profile} onBack={() => setCurrentTab('panel')} />;
  }
  if (currentTab === 'delete_accounts') {
    return <AccountDeletion onBack={() => setCurrentTab('panel')} />;
  }
  if (currentTab === 'settings') {
    return <SettingsView profile={profile} onBack={() => setCurrentTab('panel')} />;
  }
  if (currentTab === 'gallery') {
    return <GalleryView onBack={() => setCurrentTab('panel')} />;
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 relative">
      {isNotifyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Adma English Center</h2>
            <p className="text-sm text-gray-500 mb-4">
              Esta mensagem será enviada para a aba "Notificações" de <b>todos os encarregados</b>. 
              (Para testar, entre numa conta de encarregado e abra a aba do sino).
            </p>
            
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none h-32 mb-4"
              placeholder="Digite a mensagem da notificação aqui..."
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsNotifyModalOpen(false);
                  setNotifyMessage('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                disabled={isSendingNotif}
              >
                Cancelar
              </button>
              <button
                disabled={!notifyMessage.trim() || isSendingNotif}
                onClick={async () => {
                  if (!notifyMessage.trim()) return;
                  setIsSendingNotif(true);
                  try {
                    const q = query(collection(db, 'users'), where('role', '==', 'parent'));
                    const snap = await getDocs(q);
                    let count = 0;
                    const tokens: string[] = [];
                    const promises = snap.docs.map(d => {
                      count++;
                      const userData = d.data();
                      if (userData.fcmToken) {
                        tokens.push(userData.fcmToken);
                      }
                      return addDoc(collection(db, 'notifications'), {
                        userId: d.id,
                        type: 'info',
                        title: 'Adma English Center',
                        message: notifyMessage.trim(),
                        read: false,
                        createdAt: serverTimestamp()
                      });
                    });
                    await Promise.all(promises);

                    let pushResult = '';
                    if (tokens.length > 0) {
                      try {
                        const response = await fetch('/api/send-push', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tokens,
                            title: 'Adma English Center',
                            body: notifyMessage.trim()
                          })
                        });
                        const result = await response.json();
                        if (response.ok) {
                          pushResult = `\nPush Web enviado para ${tokens.length} dispositivos!`;
                        } else {
                          pushResult = `\nAviso Push Web: ${result.error || 'Erro na API'}`;
                        }
                      } catch (e) {
                        pushResult = `\nErro ao conectar à API de Push.`;
                        console.error(e);
                      }
                    } else {
                      pushResult = `\nNenhum dispositivo com permissão de notificação externa encontrado.`;
                    }

                    alert(`Mensagem "Adma English Center" guardada com sucesso! ${count} encarregados receberão o alerta dentro da App na aba de notificações.${pushResult}`);
                    setIsNotifyModalOpen(false);
                    setNotifyMessage('');
                  } catch (e) {
                    console.error(e);
                    alert('Erro ao enviar notificação.');
                  } finally {
                    setIsSendingNotif(false);
                  }
                }}
                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSendingNotif ? 'A Enviar...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Profile Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white p-8 pt-12 rounded-b-[2.5rem] shadow-[0_10px_40px_rgba(99,102,241,0.3)] relative overflow-hidden">
        {/* Soft geometric shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-fuchsia-400/20 rounded-full blur-2xl"></div>

        <NavigationMenu role={profile.role} profileId={profile.id} onAction={(action) => {
          if (action === 'panel') setCurrentTab('panel');
          if (action === 'gallery') setCurrentTab('gallery');
          if (action === 'manage_teachers') setCurrentTab('manage_teachers');
          if (action === 'manage_students') setCurrentTab('manage_students');
          if (action === 'manage_center') setCurrentTab('manage_center');
          if (action === 'usage_history') setCurrentTab('usage_history');
          if (action === 'delete_accounts') setCurrentTab('delete_accounts');
          if (action === 'settings') setCurrentTab('settings');
        }} />

        <button
          onClick={() => setIsNotifyModalOpen(true)}
          className="absolute top-8 right-6 z-40 p-2.5 bg-amber-500/90 backdrop-blur-md rounded-xl text-white hover:bg-amber-600 transition-all shadow-sm active:scale-95 flex items-center justify-center border border-amber-400/50"
          title="Notificar Todos os Encarregados"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-5 relative z-10 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => onViewProfile?.(profile)}>
          <div className="p-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
            <Avatar photo={profile.photo} className="w-20 h-20 border-4 border-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight hover:underline">{profile.name}</h1>
            <p className="text-indigo-100 text-sm font-medium bg-white/10 px-3 py-1 rounded-full inline-block mt-1 border border-white/10">Teacher</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 px-6 mt-[-2rem] relative z-20">
        <button 
          onClick={() => setIsPosting(true)}
          className="flex-1 bg-white text-gray-900 font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 border border-gray-100/50 hover:border-purple-200"
        >
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Edit3 className="w-5 h-5" /></div>
          Publicar
        </button>
        <button 
          onClick={() => setShowMyStudentsOnly(!showMyStudentsOnly)}
          className={`flex-1 font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-2 border ${showMyStudentsOnly ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-900 border-gray-100/50 hover:border-indigo-200'}`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showMyStudentsOnly ? 'bg-indigo-200 text-indigo-700' : 'bg-indigo-50 text-indigo-600'}`}><Users className="w-5 h-5" /></div>
          Meus Alunos
        </button>
      </div>

      {/* Central List */}
      <div className="px-6 mt-8 mb-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <button 
            onClick={() => setExpandedGlobal(!expandedGlobal)}
            className="w-full flex justify-between items-center p-5 bg-[#f8fafc] font-display font-bold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            {showMyStudentsOnly ? 'Meus Alunos' : 'Alunos Sem Professor'}
            <span className="text-gray-400 bg-white p-1 rounded-full shadow-sm">{expandedGlobal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
          </button>
          
          {expandedGlobal && (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto scrollbar-hide">
              {showMyStudentsOnly ? (
                myStudents.length === 0 ? <div className="p-8 text-center text-sm text-gray-400 font-medium">Nenhum aluno vinculado.</div> :
                myStudents.map(s => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar photo={s.photo} className="w-10 h-10 shadow-sm" />
                      <span className="font-bold text-gray-900">{s.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                unlinkedStudents.length === 0 ? <div className="p-8 text-center text-sm text-gray-400 font-medium">Todos os alunos têm professor.</div> :
                unlinkedStudents.map(s => {
                  const displayLevel = configLoaded && !centerConfig.levels.includes(s.level || '') ? '' : s.level;
                  return (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar photo={s.photo} className="w-10 h-10 shadow-sm" />
                      <div>
                        <div className="font-bold text-gray-900">{s.name}</div>
                        {displayLevel && <div className="text-xs text-indigo-600 font-medium">{displayLevel}</div>}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleLinkStudent(s.id)}
                      className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold hover:bg-indigo-100 hover:scale-105 active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                )})
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(myPedidos.length > 0 || pendingAccounts.length > 0) && (
        <div className="px-6 mb-8 space-y-4">
          <h3 className="font-display font-bold text-gray-900 text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500 fill-red-100" />
            Aprovações Pendentes
          </h3>
          
          {pendingAccounts.map(u => (
            <div key={u.id} className="bg-white border-l-4 border-orange-500 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
              <div className="text-sm text-gray-700 leading-relaxed">
                O <span className="font-bold text-gray-900">{u.role === 'student' ? 'aluno' : 'encarregado'}</span> <span className="font-bold text-gray-900">{u.name}</span> solicitou a criação de conta.
              </div>
              <button 
                onClick={() => handleApproveAccount(u)}
                className="bg-orange-500 text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-orange-600 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(249,115,22,0.3)] flex justify-center items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprovar Conta
              </button>
            </div>
          ))}

          {myPedidos.map(p => {
            const student = students.find(s => s.phone === p.studentPhone);
            if (!student) return null;
            return (
              <div key={p.id} className="bg-white border-l-4 border-red-500 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-4">
                <div className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-gray-900">{p.parentName}</span> quer vincular-se ao aluno <span className="font-bold text-gray-900">{student.name}</span>.
                </div>
                <button 
                  onClick={() => handleApprovePedido(p, student.id)}
                  className="bg-green-500 text-white font-bold py-3 px-4 rounded-xl text-sm hover:bg-green-600 active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(34,197,94,0.3)] flex justify-center items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Permitir Vinculação
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Feed */}
      <div className="px-6">
        <h3 className="font-display font-bold text-gray-900 text-xl mb-4">Mural da Escola</h3>
        <Feed viewer={profile} onViewProfile={onViewProfile} />
      </div>

      {/* Post Modal */}
      {isPosting && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setIsPosting(false)}></div>
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl z-10 p-6 flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-gray-900 text-xl">Nova Publicação</h3>
              <button onClick={() => setIsPosting(false)} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full active:scale-95">X</button>
            </div>
            
            <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-xl">
              <button 
                onClick={() => setPostType('comunicado')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${postType === 'comunicado' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Comunicado
              </button>
              <button 
                onClick={() => setPostType('destaque')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${postType === 'destaque' ? 'bg-white shadow-sm text-amber-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Destaque da Semana
              </button>
            </div>

            <textarea 
              className="w-full border border-gray-200 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 bg-[#f8fafc] resize-none text-gray-700 shadow-inner"
              placeholder={postType === 'destaque' ? 'Descrição do destaque...' : 'O que tem a comunicar hoje?'}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />

            <div className="mb-4 flex gap-2">
              <select 
                className="w-1/3 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[#f8fafc] text-sm shadow-inner"
                value={mediaType}
                onChange={(e) => {
                  setMediaType(e.target.value as 'Imagem' | 'Vídeo' | 'Nenhum');
                  setFileName('');
                }}
              >
                <option value="Nenhum">Sem Média</option>
                <option value="Imagem">Imagem</option>
                <option value="Vídeo">Vídeo</option>
              </select>
              
              {mediaType !== 'Nenhum' ? (
                <div className="w-2/3 relative flex flex-col gap-2 justify-center">
                  <button 
                    onClick={() => {
                      setShowGithubGallery(true);
                      fetchGithubGallery();
                    }}
                    className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold py-3 px-4 rounded-xl border-0 text-sm shadow-sm transition-colors text-center"
                  >
                    Selecionar da Galeria da App
                  </button>
                </div>
              ) : (
                <div className="w-2/3 border border-gray-200 rounded-xl p-3 bg-gray-100 text-sm shadow-inner opacity-50 flex items-center text-gray-400">
                  Nenhuma média selecionada
                </div>
              )}
            </div>
            
            {fileName && mediaType !== 'Nenhum' && (
              <div className="mb-4 text-xs font-medium text-indigo-600 bg-indigo-50 p-2 rounded-lg flex items-center justify-between">
                <span>Ficheiro anexado com sucesso.</span>
                <button onClick={() => setFileName('')} className="text-gray-500 hover:text-gray-800 font-bold px-2">&times;</button>
              </div>
            )}

            {postType === 'destaque' && (
              <div className="mb-4">
                <input 
                  type="url"
                  placeholder="URL do Vídeo ou Imagem (Opcional - Link externo)"
                  className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#f8fafc] text-sm shadow-inner"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 mb-3">Privacidade</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="radio" name="privacy" value="minha_turma" checked={postPrivacy === 'minha_turma'} onChange={(e) => setPostPrivacy(e.target.value as any)} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                  Minha Turma <span className="text-gray-400 text-xs ml-auto">(Só alunos)</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="radio" name="privacy" value="apenas_alunos" checked={postPrivacy === 'apenas_alunos'} onChange={(e) => setPostPrivacy(e.target.value as any)} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                  Apenas Alunos <span className="text-gray-400 text-xs ml-auto">(Geral)</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input type="radio" name="privacy" value="publico" checked={postPrivacy === 'publico'} onChange={(e) => setPostPrivacy(e.target.value as any)} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                  Público <span className="text-gray-400 text-xs ml-auto">(Todos)</span>
                </label>
              </div>
            </div>

            <button 
              onClick={handlePost}
              disabled={!postContent.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_8px_30px_rgb(99,102,241,0.24)] disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              Publicar Agora
            </button>
          </div>
        </div>
      )}
      {showGithubGallery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Galeria da App</h2>
              <button onClick={() => setShowGithubGallery(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                &times;
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Repositório GitHub (ex: user/repo)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={ghRepo}
                  onChange={e => setGhRepo(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl p-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                  placeholder="mauromkmanuel/meu-repo"
                />
                <button 
                  onClick={fetchGithubGallery}
                  disabled={githubLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                >
                  {githubLoading ? 'A Carregar...' : 'Buscar'}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-100">
              {githubLoading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">A carregar ficheiros da galeria...</div>
              ) : githubFiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {githubFiles.map(file => (
                    <div 
                      key={file.name} 
                      onClick={() => {
                        setFileName(file.name);
                        setShowGithubGallery(false);
                      }}
                      className="relative group cursor-pointer border-2 border-transparent hover:border-indigo-500 rounded-xl overflow-hidden aspect-square bg-gray-200"
                    >
                      {mediaType === 'Imagem' ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <video src={file.url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-xs truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
                  {ghRepo ? 'Nenhum ficheiro encontrado nesta pasta.' : 'Configure o repositório acima para ver os ficheiros.'}
                </div>
              )}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>Os ficheiros devem estar na pasta <strong>public/fotos</strong> (para imagens) ou <strong>public/videos</strong> (para vídeos) do seu repositório.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
