import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { api } from './api';

// Registra o token de push no backend, associado ao usuário logado.
// Precisa existir a rota POST /device-token no backend (ver main.py).
const registrarTokenNoBackend = async (token: string) => {
  try {
    await api.post('/device-token', {
      token,
      plataforma: Capacitor.getPlatform(), // 'android' | 'ios'
    });
  } catch (err) {
    console.log('Não foi possível registrar o token de push no backend', err);
  }
};

// Chamar uma vez, ao iniciar o app (ver App.tsx). Não faz nada se estiver
// rodando no navegador comum (só funciona dentro do app nativo empacotado
// com Capacitor).
export const inicializarPush = async () => {
  if (!Capacitor.isNativePlatform()) return;

  const permStatus = await PushNotifications.checkPermissions();

  let permissao = permStatus.receive;
  if (permissao === 'prompt' || permissao === 'prompt-with-rationale') {
    const result = await PushNotifications.requestPermissions();
    permissao = result.receive;
  }

  if (permissao !== 'granted') {
    console.log('Usuário não autorizou notificações push');
    return;
  }

  await PushNotifications.register();

  // Token gerado com sucesso (FCM no Android, APNs no iOS) — envia pro backend
  PushNotifications.addListener('registration', (token: Token) => {
    registrarTokenNoBackend(token.value);
  });

  PushNotifications.addListener('registrationError', (err) => {
    console.log('Erro ao registrar push notification', err);
  });

  // Notificação recebida com o app aberto (foreground)
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('Push recebido em primeiro plano', notification);
  });

  // Usuário tocou na notificação (app em background ou fechado)
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('Usuário tocou na notificação', action.notification);
    // Aqui dá pra usar action.notification.data.cliente_id pra já abrir
    // o dashboard do cliente certo, por exemplo.
  });
};
