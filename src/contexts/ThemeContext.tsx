import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface Cores {
  bg: string;
  bg2: string;
  bg3: string;
  border: string;
  text: string;
  text2: string;
  text3: string;
  laranja: string;
  laranjaDark: string;
  laranjaGlow: string;
  verde: string;
  vermelho: string;
  amarelo: string;
  azul: string;
  roxo: string;
}

// Paleta atual (a que já existe na plataforma) — vira o modo "escuro".
const paletaEscura: Cores = {
  bg: '#0F1117',
  bg2: '#181C27',
  bg3: '#1E2436',
  border: 'rgba(255,255,255,0.07)',
  text: '#F8FAFC',
  text2: '#94A3B8',
  text3: '#64748B',
  laranja: '#F97316',
  laranjaDark: '#EA6000',
  laranjaGlow: 'rgba(249,115,22,0.12)',
  verde: '#16A34A',
  vermelho: '#DC2626',
  amarelo: '#EAB308',
  azul: '#3B82F6',
  roxo: '#A855F7',
};

// Paleta nova — modo "claro". Mesma marca (laranja) e cores de status,
// só invertendo fundo/texto pra ficar confortável em ambiente claro.
const paletaClara: Cores = {
  bg: '#F1F5F9',
  bg2: '#FFFFFF',
  bg3: '#F8FAFC',
  border: 'rgba(15,17,23,0.10)',
  text: '#0F1117',
  text2: '#475569',
  text3: '#64748B',
  laranja: '#F97316',
  laranjaDark: '#EA6000',
  laranjaGlow: 'rgba(249,115,22,0.10)',
  verde: '#16A34A',
  vermelho: '#DC2626',
  amarelo: '#CA8A04',
  azul: '#3B82F6',
  roxo: '#A855F7',
};

interface ThemeContextValue {
  mode: ThemeMode;
  cores: Cores;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const salvo = localStorage.getItem('tema');
    return salvo === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('tema', mode);
    // Também marca no <html>, pra qualquer CSS global (ex: App.css) poder
    // reagir ao tema sem precisar de JS em cada componente.
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  const cores = mode === 'dark' ? paletaEscura : paletaClara;

  return (
    <ThemeContext.Provider value={{ mode, cores, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme precisa ser usado dentro de um <ThemeProvider>');
  }
  return ctx;
};