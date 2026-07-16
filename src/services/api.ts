import axios from 'axios';

const API_URL = 'https://backend-energia-production.up.railway.app';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Adiciona o token em toda requisição, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o token for inválido/expirado, desloga automaticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getDadosCliente = async (clienteId: string, horas = 24) => {
  const res = await api.get(`/dados/${clienteId}?horas=${horas}`);
  return res.data;
};

export const getBalanco = async (clienteId: string, horas = 24) => {
  const res = await api.get(`/balanco/${clienteId}?horas=${horas}`);
  return res.data;
};

export const enviarDados = async (dados: {
  cliente_id: string;
  consumo_kw: number;
  geracao_kw: number;
  tensao_v?: number;
  corrente_a?: number;
}) => {
  const res = await api.post('/dados', dados);
  return res.data;
};

export const getDadosInversor = async (clienteId: string, horas = 24) => {
  const res = await api.get(`/inversor/${clienteId}?horas=${horas}`);
  return res.data;
};

export const getDadosIrradiancia = async (clienteId: string, horas = 24) => {
  const res = await api.get(`/irradiancia/${clienteId}?horas=${horas}`);
  return res.data;
};
export const getResumoGrupo = async (grupoId: number) => {
  const res = await api.get(`/grupos/${grupoId}/resumo`);
  return res.data;
};
export const getClienteAtivo = (): string => {
  return localStorage.getItem('cliente_ativo') || localStorage.getItem('cliente_id') || 'cliente_001';
};
interface StringInversorPayload {
  kwp: number;
}

interface InversorPayload {
  marca: string;
  modelo: string;
  potencia_kw: number;
  mppts: number;
  strings: StringInversorPayload[];
}

interface CriarUsinaPayload {
  nome: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  tipo_instalacao?: string;
  potencia_kwp?: number;
  foto_base64?: string;
  inversores: InversorPayload[];
}

export const criarMinhaUsina = async (dados: CriarUsinaPayload) => {
  const res = await api.post('/minhas-usinas', dados);
  return res.data;
};
export const getMinhasUsinas = async () => {
  const res = await api.get('/minhas-usinas');
  return res.data;
};