import axios from 'axios';

const API_URL = 'https://backend-energia-production.up.railway.app';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

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