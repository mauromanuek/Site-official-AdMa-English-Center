import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Post } from '../types';
import { Trash2, ArrowLeft, Video } from 'lucide-react';
import { Avatar } from './Avatar';
import { cn } from '../lib/utils';

export function UsageHistory({ profile, onBack }: { profile: UserProfile, onBack: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'), 
      where('authorId', '==', profile.id)
    );
    const unsub = onSnapshot(q, snap => {
      const allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      allPosts.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setPosts(allPosts);
      setLoading(false);
    });
    return unsub;
  }, [profile.id]);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'posts', id));
    setConfirmDeleteId(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">A carregar histórico...</div>;
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 relative">
      <div className="bg-white p-4 flex items-center gap-4 sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <button onClick={onBack} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-gray-900 text-xl">Histórico de Uso</h2>
      </div>

      <div className="p-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-medium">Nenhuma publicação ainda.</div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar photo={post.authorPhoto} className="w-10 h-10 shadow-sm" />
                    <div>
                      <div className="font-bold text-gray-900 leading-tight">{post.authorName}</div>
                      <div className="text-xs text-gray-400 font-medium">{post.createdAt ? new Date(post.createdAt.toMillis()).toLocaleString('pt-PT') : 'Agora'}</div>
                    </div>
                  </div>
                  {confirmDeleteId === post.id ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="text-xs bg-red-500 text-white font-bold px-3 py-2 rounded-xl hover:bg-red-600 transition-colors"
                      >
                        Apagar
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(post.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {post.type === 'destaque' && (
                  <div className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-sm flex items-center gap-1.5 w-max">
                    <Star className="w-3.5 h-3.5" /> Destaque da Semana
                  </div>
                )}

                <p className="text-gray-700 leading-relaxed text-[15px] mb-3">{post.content}</p>

                {post.mediaUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                    {post.mediaUrl.match(/\.(jpeg|jpg|gif|png)$/) ? (
                      <img src={post.mediaUrl} alt="Mídia" className="w-full h-auto object-cover max-h-64" />
                    ) : (
                      <div className="p-4 flex items-center gap-3 text-blue-600 bg-blue-50/50">
                        <Video className="w-6 h-6" />
                        <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline break-all">{post.mediaUrl}</a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md">
                    {post.privacy === 'publico' ? 'Público' : post.privacy === 'apenas_alunos' ? 'Apenas Alunos' : 'Minha Turma'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Just an inline Star icon
function Star(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
