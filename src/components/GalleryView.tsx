import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types';
import { ArrowLeft, Image as ImageIcon, PlayCircle, Trash2, X } from 'lucide-react';

export function GalleryView({ onBack }: { onBack: () => void }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      const allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      const mediaPosts = allPosts.filter(p => p.mediaType === 'Imagem' || p.mediaType === 'Vídeo' || (p.mediaUrl && p.mediaUrl.trim() !== ''));
      setPosts(mediaPosts);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (confirm('Eliminar esta publicação da galeria?')) {
      await deleteDoc(doc(db, 'posts', postId));
      if (selectedPost?.id === postId) setSelectedPost(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in pb-20 relative">
      <div className="bg-white/80 backdrop-blur-xl p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10 shadow-sm pt-8">
        <button onClick={onBack} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-gray-700 shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-gray-900 text-xl flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-indigo-500" />
          Galeria
        </h2>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500 font-medium">A carregar galeria...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-medium">Nenhum ficheiro multimédia encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map(post => {
              const isVideo = post.mediaType === 'Vídeo' || post.mediaUrl?.toLowerCase().match(/\.(mp4|webm|ogg)$/) || post.mediaUrl?.includes('youtube.com') || post.mediaUrl?.includes('youtu.be');
              const imageSrc = post.mediaType === 'Imagem' ? `./fotos/${post.fileName}` : post.mediaUrl;
              
              return (
                <div key={post.id} className="flex flex-col gap-2">
                  <div 
                    className="relative aspect-square rounded-2xl overflow-hidden bg-gray-200 shadow-sm group cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    {isVideo ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/10 backdrop-blur-sm relative">
                        {post.mediaType === 'Vídeo' ? (
                          <video className="absolute inset-0 w-full h-full object-cover opacity-50">
                            <source src={`./videos/${post.fileName}`} type="video/mp4" />
                          </video>
                        ) : null}
                        <PlayCircle className="w-12 h-12 text-white/80 drop-shadow-md z-10" />
                      </div>
                    ) : (
                      <img 
                        src={imageSrc} 
                        alt={post.content} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    )}
                    <div className="hidden absolute inset-0 bg-gray-100 flex-col items-center justify-center text-gray-500 font-medium text-xs text-center p-2">
                      Indisponível
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-white text-xs font-medium line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, post.id)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedPost(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors" onClick={() => setSelectedPost(null)}>
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl w-full max-h-[80vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {selectedPost.mediaType === 'Vídeo' || selectedPost.mediaUrl?.toLowerCase().match(/\.(mp4|webm|ogg)$/) || selectedPost.mediaUrl?.includes('youtube.com') || selectedPost.mediaUrl?.includes('youtu.be') ? (
              selectedPost.mediaType === 'Vídeo' ? (
                <video controls className="max-w-full max-h-[70vh] rounded-xl shadow-2xl bg-black">
                  <source src={`./videos/${selectedPost.fileName}`} type="video/mp4" />
                </video>
              ) : (
                <video controls className="max-w-full max-h-[70vh] rounded-xl shadow-2xl bg-black">
                  <source src={selectedPost.mediaUrl} />
                </video>
              )
            ) : (
              <img 
                src={selectedPost.mediaType === 'Imagem' ? `./fotos/${selectedPost.fileName}` : selectedPost.mediaUrl} 
                alt={selectedPost.content} 
                className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain bg-black/50" 
              />
            )}
            <div className="text-white mt-6 text-center w-full bg-black/50 p-4 rounded-xl backdrop-blur-sm">
              <p className="font-medium">{selectedPost.content}</p>
              <p className="text-white/60 text-sm mt-2">{selectedPost.authorName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
