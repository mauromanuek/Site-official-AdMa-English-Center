import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, requestNotificationPermission } from '../lib/firebase';
import { UserProfile, Notification as AppNotification } from '../types';
import { Bell, CheckCircle, Info, Star, Trash2, BellRing } from 'lucide-react';
import { Avatar } from './Avatar';
import { cn } from '../lib/utils';

export function NotificationsView({ profile, onViewProfile }: { profile: UserProfile, onViewProfile?: (u: string) => void }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('userId', '==', profile.id));
    const unsub = onSnapshot(q, snap => {
      const allNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      allNotifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setNotifications(allNotifs);
      setLoading(false);
    });
    return unsub;
  }, [profile.id]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch(e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch(e) {
      console.error(e);
    }
  };

  const handleEnablePush = async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await updateDoc(doc(db, 'users', profile.id), { fcmToken: token });
        setPermissionState('granted');
        alert('Notificações push ativadas com sucesso para este dispositivo!');
      } else {
        alert('Não foi possível obter o token. Verifica as tuas configurações ou permissões do browser.');
        setPermissionState(Notification.permission);
      }
    } catch (error: any) {
      console.error(error);
      alert('Erro ao ativar notificações: ' + (error.message || error));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">A carregar notificações...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" /> Notificações
        </h2>
      </div>

      {permissionState !== 'granted' && profile.role === 'parent' && (
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Ativar Alertas Push</h3>
            <p className="text-sm text-gray-600 mt-1">
              Recebe notificações instantâneas no teu telemóvel quando houver novidades sobre o teu educando.
            </p>
          </div>
          <button
            onClick={handleEnablePush}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            Ativar Agora
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Não tem notificações.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div 
              key={n.id} 
              onClick={() => markAsRead(n.id)}
              className={cn(
                "p-4 rounded-2xl border transition-all relative overflow-hidden group",
                n.read ? "bg-white border-gray-100" : "bg-blue-50/50 border-blue-100 shadow-sm"
              )}
            >
              {!n.read && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
              
              <div className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  n.type === 'pedido_vinculacao' ? "bg-orange-100 text-orange-600" : 
                  n.type === 'destaque' ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"
                )}>
                  {n.type === 'pedido_vinculacao' ? <CheckCircle className="w-5 h-5" /> : 
                   n.type === 'destaque' ? <Star className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className={cn("text-sm font-bold", n.read ? "text-gray-700" : "text-gray-900")}>{n.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
