import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

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

  app.use(express.json());

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
