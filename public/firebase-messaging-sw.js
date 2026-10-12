// Service Worker do Firebase Cloud Messaging para Notificações em Segundo Plano (Background)
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

// Interceta mensagens recebidas quando a aba está fechada ou em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano:', payload);
  
  const title = payload.notification?.title || payload.data?.title || 'Adma English Center';
  const body = payload.notification?.body || payload.data?.body || payload.data?.message || 'Tem uma nova atualização na escola.';
  const clickUrl = payload.data?.click_action || payload.fcmOptions?.link || '/';

  const notificationOptions = {
    body: body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    data: {
      url: clickUrl
    }
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Ação ao clicar na notificação push do sistema operacional
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
