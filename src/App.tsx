/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, Role } from './types';
import { AuthScreen } from './components/AuthScreen';
import { ProfileForm } from './components/ProfileForm';
import { TeacherDashboard } from './components/TeacherDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { StudentProfile } from './components/StudentProfile';
import { WelcomeScreen } from './components/WelcomeScreen';
import { BottomNav } from './components/BottomNav';
import { MessagesView } from './components/MessagesView';
import { ChatView } from './components/ChatView';
import { SearchView } from './components/SearchView';
import { NotificationsView } from './components/NotificationsView';
import { Clock } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [started, setStarted] = useState(false);

  const [currentView, setCurrentView] = useState<'home' | 'messages' | 'search' | 'notifications'>('home');
  const [activeChat, setActiveChat] = useState<UserProfile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);

  const handleViewProfile = async (userOrId: UserProfile | string) => {
    if (typeof userOrId === 'string') {
      const docRef = await getDoc(doc(db, 'users', userOrId));
      if (docRef.exists()) {
        setViewingProfile({ id: docRef.id, ...docRef.data() } as UserProfile);
      }
    } else {
      setViewingProfile(userOrId);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('hasStarted')) {
      setStarted(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setStarted(true); // Auto bypass welcome if logged in
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
            setNeedsProfile(false);
          } else {
            setNeedsProfile(true);
            // Recover role if it was selected prior to auth, else default to student just in case
            const storedRole = localStorage.getItem('intendedRole') as Role;
            if (storedRole) {
              setSelectedRole(storedRole);
            } else {
              setSelectedRole('student'); 
            }
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setNeedsProfile(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    localStorage.setItem('hasStarted', 'true');
    setStarted(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-blue-600 font-bold font-sans">A carregar...</div>;
  }

  if (!started && !user) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  if (!user) {
    return <AuthScreen onRoleSelect={(role) => setSelectedRole(role)} />;
  }

  if (needsProfile && selectedRole) {
    return <ProfileForm user={user} role={selectedRole} onComplete={(p) => { setProfile(p); setNeedsProfile(false); }} />;
  }

  if (!profile) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-blue-600 font-bold font-sans">A carregar perfil...</div>;

  if (profile.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Pendente</h2>
        <p className="text-gray-600">A sua conta está a aguardar a aprovação do professor selecionado. Por favor, aguarde.</p>
        <button onClick={() => auth.signOut()} className="mt-8 text-blue-600 font-bold hover:underline">Sair da Conta</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#f8fafc] min-h-screen shadow-2xl relative font-sans overflow-x-hidden flex flex-col">
      <div className="flex-1 pb-24">
        {viewingProfile ? (
          <StudentProfile 
            student={viewingProfile} 
            viewer={profile} 
            onClose={() => setViewingProfile(null)} 
            onViewProfile={handleViewProfile} 
            onMessage={() => {
              setViewingProfile(null);
              setActiveChat(viewingProfile);
              setCurrentView('messages');
            }}
          />
        ) : (
          <>
            {currentView === 'home' && (
              <>
                {profile.role === 'teacher' && <TeacherDashboard profile={profile} onViewProfile={handleViewProfile} />}
                {profile.role === 'parent' && <ParentDashboard profile={profile} onViewProfile={handleViewProfile} />}
                {profile.role === 'student' && <StudentDashboard profile={profile} onViewProfile={handleViewProfile} />}
              </>
            )}
            {currentView === 'messages' && !activeChat && <MessagesView profile={profile} onOpenChat={setActiveChat} onViewProfile={handleViewProfile} />}
            {currentView === 'messages' && activeChat && <ChatView profile={profile} targetUser={activeChat} onBack={() => setActiveChat(null)} onViewProfile={handleViewProfile} />}
            {currentView === 'search' && <SearchView profile={profile} onOpenChat={(u) => { setActiveChat(u); setCurrentView('messages'); }} onViewProfile={handleViewProfile} />}
            {currentView === 'notifications' && <NotificationsView profile={profile} onViewProfile={handleViewProfile} />}
          </>
        )}
      </div>

      {!activeChat && !viewingProfile && <BottomNav currentView={currentView} onViewChange={(v) => setCurrentView(v as any)} userId={profile.id} />}
    </div>
  );
}
