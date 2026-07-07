export const BACKEND_URL = 'https://adma-english-center-api.onrender.com';

/**
 * Dispara uma notificação push através do backend no Render.
 * 
 * @param token Token FCM do dispositivo do utilizador
 * @param titulo Título da notificação
 * @param mensagem Corpo da notificação
 */
export async function dispararNotificacao(token: string, titulo: string, mensagem: string) {
  try {
    console.log(`[Push Notification] A enviar notificação para o token: ${token}...`);
    
    const response = await fetch(`${BACKEND_URL}/sendNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        titulo,
        mensagem,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na resposta do servidor: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Push Notification] Notificação enviada com sucesso:', data);
    return data;
  } catch (error) {
    console.error('[Push Notification] Falha ao disparar notificação:', error);
    throw error;
  }
}
