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
      const token = await getToken(messaging, {
        vapidKey: 'BHzJ97jXG-oN4_U3E5yYk9zO242X0_5vU3-E5yYk9zO242X0_5vU3-E5yYk9zO242X0_5vU3' // NOTA: o vapidKey real deve ser obtido no Firebase Console (Cloud Messaging -> Web Push certs)
      });
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};
