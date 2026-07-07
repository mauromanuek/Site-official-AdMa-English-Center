import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
let adminInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount)
    });
    adminInitialized = true;
    console.log("Firebase Admin initialized successfully.");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Push notifications will not work.");
  }
} catch (e) {
  console.error("Failed to initialize Firebase Admin:", e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple CORS middleware to allow communication from any frontend (e.g., GitHub Pages)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // Route for testing and diagnosing push notifications
  const handleSendTestNotification = async (req: express.Request, res: express.Response) => {
    console.log("=== INÍCIO DO DIAGNÓSTICO DE NOTIFICAÇÃO PUSH ===");
    console.log("Corpo do pedido recebido:", req.body);

    if (!adminInitialized) {
      console.error("Erro: Firebase Admin não inicializado.");
      return res.status(500).json({ error: "Firebase Admin não inicializado. Certifica-te de configurar FIREBASE_SERVICE_ACCOUNT_KEY." });
    }

    const { token, userId, title, body } = req.body;
    let targetToken = token;

    if (!targetToken && userId) {
      console.log(`Buscando token para o userId no Firestore: "${userId}"`);
      try {
        const dbAdmin = getFirestore();
        const userDoc = await dbAdmin.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          targetToken = userData?.fcmToken;
          console.log(`Token encontrado no documento do usuário: "${targetToken}"`);
        } else {
          console.warn(`Aviso: Documento do usuário "${userId}" não existe no Firestore.`);
        }
      } catch (dbErr) {
        console.error("Erro ao consultar Firestore para obter token por userId:", dbErr);
      }
    }

    if (!targetToken) {
      console.error("Erro: Nenhum token ou userId válido foi fornecido.");
      return res.status(400).json({ error: "Nenhum token ou userId válido com fcmToken foi fornecido." });
    }

    // Diagnóstico e validação do token
    console.log(`Validando o token FCM: "${targetToken}"`);
    if (typeof targetToken !== 'string' || targetToken.trim() === '') {
      console.error("Erro: O token não é uma string válida.");
      return res.status(400).json({ error: "O token recebido é inválido (não é uma string preenchida)." });
    }

    // Verificar se o token existe cadastrado na base de dados (coleção 'users')
    try {
      const dbAdmin = getFirestore();
      const usersSnap = await dbAdmin.collection('users').where('fcmToken', '==', targetToken).get();
      if (usersSnap.empty) {
        console.warn(`Aviso: O token "${targetToken}" não foi encontrado em nenhum documento da coleção 'users' do Firestore.`);
      } else {
        console.log(`Sucesso: Token encontrado em ${usersSnap.size} documento(s) na coleção 'users'.`);
        usersSnap.forEach(doc => {
          console.log(`  - Associado ao usuário ID: ${doc.id}, Nome: ${doc.data().name || 'N/D'}`);
        });
      }
    } catch (dbErr) {
      console.error("Erro ao verificar presença do token no Firestore:", dbErr);
    }

    // Disparar o push usando o SDK do Firebase Admin
    try {
      console.log(`Enviando notificação via Firebase Admin para o token...`);
      const message = {
        notification: {
          title: title || "Teste do Adma English Center",
          body: body || "Esta é uma notificação de teste push bem-sucedida!"
        },
        token: targetToken,
      };

      const response = await getMessaging().send(message);
      console.log("Sucesso! Notificação de teste enviada. ID da resposta:", response);
      console.log("=== FIM DO DIAGNÓSTICO (SUCESSO) ===");
      return res.json({ 
        success: true, 
        message: "Notificação de teste enviada com sucesso!", 
        fcmResponse: response,
        tokenUsed: targetToken 
      });
    } catch (sendError: any) {
      console.error("Falha ao disparar mensagem FCM:", sendError);
      console.log("=== FIM DO DIAGNÓSTICO (FALHA) ===");
      return res.status(500).json({ 
        success: false, 
        error: "Falha ao enviar notificação através do Firebase", 
        details: sendError.message 
      });
    }
  };

  app.post("/send-test-notification", handleSendTestNotification);
  app.post("/api/send-test-notification", handleSendTestNotification);

  // API route for sending push notifications
  app.post("/api/send-push", async (req, res) => {
    if (!adminInitialized) {
      return res.status(500).json({ error: "Firebase Admin not initialized. Please configure FIREBASE_SERVICE_ACCOUNT_KEY na plataforma (Settings)." });
    }

    const { tokens, title, body } = req.body;
    
    if (!tokens || !tokens.length) {
      return res.status(400).json({ error: "No tokens provided" });
    }

    try {
      const message = {
        notification: {
          title: title || "Nova Notificação",
          body: body || "Você tem uma nova mensagem."
        },
        tokens: tokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);
      res.json({ success: true, response });
    } catch (error: any) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
