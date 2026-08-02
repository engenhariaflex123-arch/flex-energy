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

export type ResultadoVerificacao = {
  status: 'atualizado' | 'aplicando' | 'erro' | 'web';
  mensagem: string;
};

// Força o app a checar agora mesmo se existe um bundle novo no Capgo, sem
// precisar fechar e abrir o app (que é quando a checagem automática roda).
// Usado pelo botão "Verificar atualização" no menu lateral.
export const verificarAtualizacao = async (): Promise<ResultadoVerificacao> => {
  if (!Capacitor.isNativePlatform()) {
    return { status: 'web', mensagem: 'Essa opção só se aplica ao aplicativo instalado (não ao site).' };
  }

  try {
    const latest = await CapacitorUpdater.getLatest();

    if (latest.kind === 'up_to_date' || !latest.url) {
      return { status: 'atualizado', mensagem: 'Você já está na versão mais recente.' };
    }

    const bundle = await CapacitorUpdater.download({ url: latest.url, version: latest.version });
    // set() já aplica a atualização e reinicia o app sozinho.
    await CapacitorUpdater.set({ id: bundle.id });

    return { status: 'aplicando', mensagem: 'Atualização encontrada! Aplicando agora, o app vai reiniciar.' };
  } catch (err) {
    console.log('Erro ao verificar atualização', err);
    return { status: 'erro', mensagem: 'Não foi possível verificar atualização agora. Tenta de novo mais tarde.' };
  }
};