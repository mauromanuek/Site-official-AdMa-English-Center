import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// FCM (Simulado para o Frontend Estático)
// Na prática, o web SDK não suporta subscribeToTopic. Isto requer uma Cloud Function.
export const messaging = {
  subscribeToTopic: async (token: string, topic: string) => {
    console.log(`[FCM Simulado] Subscrição efetuada: token ${token} -> tópico ${topic}`);
    // fetch('https://SUA_CLOUD_FUNCTION/subscribe', { ... })
    return Promise.resolve();
  }
};
