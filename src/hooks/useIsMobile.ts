import { useEffect, useState } from 'react';

// Breakpoint único usado no app inteiro pra decidir quando trocar pro
// layout mobile (sidebar como overlay em vez de empurrar conteúdo, grids
// empilhando em 1 coluna, etc). 768px cobre celulares e a maioria dos
// tablets em retrato.
const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const atualizar = () => setIsMobile(mq.matches);
    atualizar();
    // addEventListener é o padrão moderno, mas alguns WebViews mais
    // antigos (relevante pro app mobile via Capacitor) só suportam a API
    // antiga addListener — tenta os dois, sem quebrar se um não existir.
    if (mq.addEventListener) {
      mq.addEventListener('change', atualizar);
      return () => mq.removeEventListener('change', atualizar);
    } else {
      mq.addListener(atualizar);
      return () => mq.removeListener(atualizar);
    }
  }, []);

  return isMobile;
}

export default useIsMobile;