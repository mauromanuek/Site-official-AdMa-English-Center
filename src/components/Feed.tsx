import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post, UserProfile } from '../types';
import { Avatar } from './Avatar';
import { Trash2, Star, Video } from 'lucide-react';
import { cn } from '../lib/utils';

export function Feed({ viewer, onViewProfile }: { viewer: UserProfile, onViewProfile?: (u: string) => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const allPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      
      const filtered = allPosts.filter(post => {
        if (viewer.role === 'teacher') return true;
        if (viewer.role === 'parent') {
          return post.privacy === 'publico';
        }
        // student
        if (post.privacy === 'publico' || post.privacy === 'apenas_alunos') return true;
        if (post.privacy === 'minha_turma') {
          return post.authorId === viewer.teacherId;
        }
        return false;
      });

      setPosts(filtered);
    });
    return () => unsubscribe();
  }, [viewer]);

  const handleDelete = async (postId: string) => {
    await deleteDoc(doc(db, 'posts', postId));
    setConfirmDeleteId(null);
  };

  if (posts.length === 0) {
    return <div className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 text-gray-400 font-medium shadow-sm">Nenhuma publicação ainda.</div>;
  }

  return (
    <div className="space-y-4 pb-20">
      {posts.map(post => (
        <div key={post.id} className={cn("p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border relative overflow-hidden", post.type === 'destaque' ? 'bg-amber-50/30 border-amber-200/50' : 'bg-white border-gray-100')}>
          
          {post.type === 'destaque' && (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-orange-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3" fill="currentColor" /> Destaque
            </div>
          )}

          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onViewProfile?.(post.authorId)}>
              <Avatar photo={post.authorPhoto} className="w-12 h-12 shadow-sm" />
              <div>
                <div className="font-bold text-gray-900 leading-tight hover:underline">{post.authorName}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium flex items-center flex-wrap gap-1.5">
                  {post.createdAt ? new Date(post.createdAt.toMillis()).toLocaleString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                  <span className="opacity-50">•</span>
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {post.privacy === 'minha_turma' ? 'Minha Turma' : post.privacy === 'apenas_alunos' ? 'Apenas Alunos' : 'Público'}
                  </span>
                </div>
              </div>
            </div>
            
            {viewer.role === 'teacher' && viewer.id === post.authorId && (
              <div className="flex items-center gap-2 z-10">
                {confirmDeleteId === post.id ? (
                  <>
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
                  </>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteId(post.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">{post.content}</p>

          {post.mediaType === 'Imagem' && post.fileName && (
            <div className="mt-4 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center min-h-[100px] relative group">
              <img 
                src={post.fileName.startsWith('data:') || post.fileName.startsWith('http') ? post.fileName : `/fotos/${post.fileName}`} 
                alt="Média da publicação" 
                className="w-full h-auto object-cover max-h-96 feed-img" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500 font-medium">
                Média indisponível
              </div>
            </div>
          )}

          {post.mediaType === 'Vídeo' && post.fileName && (
            <div className="mt-4 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center min-h-[100px] relative group">
              <video 
                controls 
                className="w-full h-auto max-h-96 object-contain feed-vid"
                onError={(e) => {
                  const target = e.target as HTMLVideoElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
                src={post.fileName.startsWith('data:') || post.fileName.startsWith('http') ? post.fileName : `/videos/${post.fileName}`}
              />
              <div className="hidden absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500 font-medium">
                Média indisponível
              </div>
            </div>
          )}

          {post.mediaUrl && !post.mediaType && (
            <div className="mt-4 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center min-h-[100px] relative group">
              {post.mediaUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/) ? (
                <video controls className="w-full h-auto max-h-96 object-contain">
                  <source src={post.mediaUrl} />
                </video>
              ) : (
                <img src={post.mediaUrl} alt="Média da publicação" className="w-full h-auto object-cover max-h-96" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
