import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
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

// Função para salvar token no Firestore de forma centralizada e reutilizável
export const saveTokenToFirestore = async (userId: string, token: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { fcmToken: token });
    console.log("fcmToken atualizado com sucesso no Firestore para o utilizador:", userId);
  } catch (error) {
    console.error("Erro ao salvar fcmToken no Firestore:", error);
    throw error;
  }
};

// Converte a chave VAPID Base64 para Uint8Array exigido pelo PushManager dos navegadores
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // 1. LIMPEZA AGRESSIVA: Remove espaços, quebras de linha e tabs invisíveis
  const cleaned = base64String.replace(/[\s\r\n\t]+/g, '');
  
  // 2. Padding: Garante que o comprimento é múltiplo de 4
  const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
  
  // 3. Substituições padrão para Base64 URL-Safe
  const base64 = (cleaned + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  // 4. Decodificação segura
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
  if (!messaging) {
    if (typeof window === 'undefined') {
      throw new Error("As notificações não podem ser inicializadas no servidor.");
    }
    if (!('serviceWorker' in navigator)) {
      throw new Error("Este browser não suporta Service Workers. No iOS, certifica-te de que estás no iOS 16.4+ e adicionaste a App ao ecrã principal (PWA).");
    }
    if (!('Notification' in window)) {
      throw new Error("Este browser não suporta a API de Notificações.");
    }
    throw new Error("O Firebase Cloud Messaging não pôde ser inicializado neste dispositivo.");
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      throw new Error("Permissão bloqueada. Clica no ícone de configurações/cadeado na barra de endereços do teu browser e ativa as notificações para este site.");
    }
    if (permission !== 'granted') {
      throw new Error("A permissão para receber notificações foi recusada ou fechada. Tenta novamente.");
    }

    let registration;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
        console.log('Service Worker registrado e pronto:', registration);
      } catch (swError: any) {
        throw new Error("Erro ao registar o Service Worker de notificações: " + (swError.message || swError));
      }
    }

    const rawVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BMWNpsr_RM_TNZ-HD_v0EeVd-C3BjEkGSH-_a5M7fyih-L3sF83PFDvbWUIjzXLDW3lpJkLvCEtDG-cwF626Nms';
    // 1. Limpeza agressiva: remove espaços, quebras de linha (\r, \n), tabs (\t) e aspas
    const cleanVapidKey = rawVapidKey.replace(/[\s\r\n\t]+/g, '').replace(/['"]/g, '');

    // 2. Valida a codificação com a função robusta
    try {
      urlBase64ToUint8Array(cleanVapidKey);
    } catch (vapidError: any) {
      throw new Error("A VITE_FIREBASE_VAPID_KEY configurada não é uma chave Base64 válida. Verifica os teus segredos. Erro: " + vapidError.message);
    }

    try {
      // O SDK do Firebase Messaging espera a string VAPID limpa em `vapidKey`.
      // Internamente o SDK faz a conversão para applicationServerKey via PushManager.
      const token = await getToken(messaging, {
        vapidKey: cleanVapidKey,
        serviceWorkerRegistration: registration
      });
      
      if (!token) {
        throw new Error("O Firebase retornou um token vazio. Verifica as tuas chaves VAPID no painel do Firebase.");
      }
      
      console.log('FCM Token obtido com sucesso:', token);
      return token;
    } catch (tokenError: any) {
      console.warn("Erro ao obter token FCM. Tentando auto-correção limpando subscrições antigas...", tokenError);
      
      // Auto-correção: se houver erro de chave VAPID incompatível com subscrição existente,
      // cancelamos a subscrição antiga no browser e tentamos novamente.
      if (registration) {
        try {
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            console.log('Limpando subscrição antiga do browser para evitar conflito de chaves VAPID...');
            await existingSubscription.unsubscribe();
            
            // Tenta obter o token novamente com a nova chave VAPID limpa
            const token = await getToken(messaging, {
              vapidKey: cleanVapidKey,
              serviceWorkerRegistration: registration
            });
            if (token) {
              console.log('Token FCM obtido com sucesso após auto-correção de subscrição:', token);
              return token;
            }
          }
        } catch (healError) {
          console.error("Falha ao executar auto-correção de subscrição:", healError);
        }
      }
      
      console.error("FCM Token Error details:", tokenError);
      throw new Error("Erro ao gerar token FCM. Detalhes: " + (tokenError.message || tokenError));
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
    throw error;
  }
};
