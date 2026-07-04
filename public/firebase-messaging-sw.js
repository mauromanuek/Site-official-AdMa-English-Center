importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBDJhrW9d1bF7qEC6gfCsGIsShG0LFBWL0",
  authDomain: "adma-english.firebaseapp.com",
  projectId: "adma-english",
  messagingSenderId: "710941492375",
  appId: "1:710941492375:web:bbb5aa8aaa6b73b1db15d2",
  measurementId: "G-B2VN8556LQ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Nova Notificação';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
