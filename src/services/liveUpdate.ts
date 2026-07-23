import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Avisa o plugin que o JS carregou com sucesso. Isso é OBRIGATÓRIO: se essa
// chamada não acontecer, o Capgo entende que a atualização falhou e faz
// rollback automático pra versão anterior (proteção contra update quebrado).
// Só roda dentro do app nativo — no navegador comum não faz nada.
export const confirmarAtualizacao = () => {
  if (!Capacitor.isNativePlatform()) return;
  CapacitorUpdater.notifyAppReady().catch((err) => {
    console.log('Erro ao confirmar atualização (capacitor-updater)', err);
  });
};
