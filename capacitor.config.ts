import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // appId no formato reverso de domínio — usado como identificador único
  // nas lojas (Google Play / App Store). Troque "com.flexenergy.app" se
  // vocês já tiverem um domínio/appId reservado.
  appId: 'com.flexenergy.app',
  appName: 'Flex Energy',
  webDir: 'build', // pasta gerada pelo `npm run build` (Create React App)
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Live update (OTA): baixa uma nova versão do JS/HTML/CSS sem precisar
    // passar pela loja de novo. `appId` e `updateUrl` são preenchidos
    // automaticamente pelo CLI do Capgo no passo de onboarding (ver
    // PROXIMOS_PASSOS.md) — não precisa editar isso na mão.
    CapacitorUpdater: {
      autoUpdate: true,
    },
  },
};

export default config;
