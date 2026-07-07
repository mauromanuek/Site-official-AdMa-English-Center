import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBDJhrW9d1bF7qEC6gfCsGIsShG0LFBWL0",
  authDomain: "adma-english.firebaseapp.com",
  projectId: "adma-english",
  messagingSenderId: "710941492375",
  appId: "1:710941492375:web:bbb5aa8aaa6b73b1db15d2",
  measurementId: "G-B2VN8556LQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize messaging (only in browser)
let messagingInstance: any = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messagingInstance = getMessaging(app);
  } catch (e) {
    console.error("Firebase Messaging Error:", e);
  }
}
export const messaging = messagingInstance;

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      let registration;
      if ('serviceWorker' in navigator) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered successfully:', registration);
      }
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BMWNpsr_RM_TNZ-HD_v0EeVd-C3BjEkGSH-_a5M7fyih-L3sF83PFDvbWUIjzXLDW3lpJkLvCEtDG-cwF626Nms',
        serviceWorkerRegistration: registration
      });
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    throw error;
  }
  return null;
};
