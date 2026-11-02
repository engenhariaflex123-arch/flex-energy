import axios from 'axios';

const API_URL = 'https://backend-energia-production.up.railway.app';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Adiciona o token em toda requisição, se existir
api.interceptors.request.use((config) => {
  if (config.method && config.method.toLowerCase() !== 'get') limparCacheApi();
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Cache curto + deduplicação de GETs.
//
// O Dashboard monta ~8 componentes que buscam dados sozinhos, e vários pedem
// EXATAMENTE a mesma URL ao mesmo tempo (ex: StatusCards e OperacaoCards
// pedem /dados?horas=1 e /irradiancia?horas=1; BalanceCard e PieChart
// pedem /balanco-hoje). Além disso, trocar de aba desmonta e remonta tudo,
// refazendo todas as chamadas do zero.
//
// Aqui: (1) chamadas idênticas em andamento viram UMA requisição só, e
// (2) a resposta fica guardada por alguns segundos — voltar pro Dashboard
// logo depois de ver a Análise abre na hora, sem esperar o backend.
// O TTL é menor que o intervalo de atualização automática (30s), então os
// cards continuam se atualizando normalmente.
// Qualquer POST/PATCH/DELETE limpa o cache (dado pode ter mudado).
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 15000;
const cacheGet = new Map<string, { em: number; data: any }>();
const emAndamento = new Map<string, Promise<any>>();

const chaveCache = (url: string) => `${localStorage.getItem('access_token') || ''}|${url}`;

export const limparCacheApi = () => { cacheGet.clear(); emAndamento.clear(); };

// GET com cache. ttlMs = 0 desliga o cache (mas mantém a deduplicação de
// chamadas simultâneas), usado em dados que atualizam mais rápido que o TTL.
const getCache = async (url: string, ttlMs = CACHE_TTL_MS): Promise<any> => {
  const chave = chaveCache(url);
  const agora = Date.now();
  const salvo = cacheGet.get(chave);
  if (ttlMs > 0 && salvo && agora - salvo.em < ttlMs) return salvo.data;
  const pendente = emAndamento.get(chave);
  if (pendente) return pendente;
  const req = api.get(url)
    .then((res) => {
      cacheGet.set(chave, { em: Date.now(), data: res.data });
      return res.data;
    })
    .finally(() => emAndamento.delete(chave));
  emAndamento.set(chave, req);
  return req;
};

// Se o token for inválido/expirado, desloga automaticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
  limparCacheApi();
  localStorage.removeItem('access_token');
  window.location.hash = '/login';
}
    return Promise.reject(error);
  }
);

// janela (ex: '1m'): pede ao backend 1 ponto por janela (média) em vez do
// dado bruto — usado no gráfico do dia, que não precisa de milhares de pontos.
export const getDadosCliente = async (clienteId: string, horas = 24, hoje = false, data?: string, janela?: string) => {
  const params = new URLSearchParams();
  params.append('horas', String(horas));
  params.append('hoje', String(hoje));
  if (data) params.append('data', data);
  if (janela) params.append('janela', janela);
  return getCache(`/dados/${clienteId}?${params.toString()}`);
};

export const getBalanco = async (clienteId: string, horas = 24) => {
  return getCache(`/balanco/${clienteId}?horas=${horas}`);
};

export interface BalancoHoje {
  cliente_id: string;
  data: string;
  geracao_kwh: number;
  consumo_kwh: number;
  consumo_instantaneo_kwh: number;
  energia_injetada_kwh: number;
  saldo_kwh: number;
  fonte_injecao: 'medido' | 'estimado';
  tipo_medicao: string;
}

// Card "Saldo Energético — Hoje" e rosquinha "Balanço": usa as fórmulas
// reais (energia injetada e consumida, medidas de verdade quando o cliente
// tem medidor bidirecional no padrão de entrada), não uma média simples
// de 24h.
// data opcional (YYYY-MM-DD, fuso de Brasília): sem ela, continua trazendo
// hoje (comportamento de sempre) — com ela, traz o saldo daquele dia
// específico, usado quando o usuário troca a data no filtro do gráfico
// principal, pra esses dois cards acompanharem junto em vez de ficarem
// travados em hoje.
export const getBalancoHoje = async (clienteId: string, data?: string): Promise<BalancoHoje> => {
  const params = new URLSearchParams();
  if (data) params.append('data', data);
  const query = params.toString() ? `?${params.toString()}` : '';
  return getCache(`/balanco-hoje/${clienteId}${query}`);
};

// Histórico agregado de energia (kWh) por dia/mês/ano - base para os
// gráficos de coluna (mês/ano) e o gráfico de pizza (geração/consumo/saldo).
export type PeriodoHistorico = 'dia' | 'mes' | 'ano';

export interface PontoHistorico {
  label: string;
  geracao_kwh: number;
  consumo_kwh: number;
  saldo_kwh: number;
  // Só vêm preenchidos pra clientes com medidor bidirecional (padrão de
  // entrada) — energia realmente MEDIDA saindo (injetada, positiva) e
  // entrando (importada da rede, já negativa) nesse ponto. Ausentes
  // (undefined) pra consumo_direto, que não tem como medir isso.
  exportada_kwh?: number;
  importada_kwh?: number;
}

export interface HistoricoResponse {
  cliente_id: string;
  periodo: PeriodoHistorico;
  tipo_medicao?: 'consumo_direto' | 'bidirecional';
  pontos: PontoHistorico[];
  totais: {
    geracao_kwh: number;
    consumo_kwh: number;
    saldo_kwh: number;
    exportada_kwh?: number;
    importada_kwh?: number;
  };
}

export const getHistorico = async (clienteId: string, periodo: PeriodoHistorico, hoje = false, mes?: number, ano?: number): Promise<HistoricoResponse> => {
  const params = new URLSearchParams();
  params.append('periodo', periodo);
  params.append('hoje', String(hoje));
  if (mes) params.append('mes', String(mes));
  if (ano) params.append('ano', String(ano));
  return getCache(`/historico/${clienteId}?${params.toString()}`);
};

// Irradiação acumulada (kWh/m²) - área sob a curva de irradiância.
export interface IrradiacaoResponse {
  cliente_id: string;
  periodo: PeriodoHistorico;
  pontos: { label: string; irradiacao_kwh_m2: number }[];
  total_kwh_m2: number;
}

// mes/ano opcionais: mês/ano específico (mesmo padrão do getHistorico) —
// usado no gráfico principal do Dashboard em Mês/Ano.
export const getIrradiacao = async (clienteId: string, periodo: PeriodoHistorico, hoje = false, mes?: number, ano?: number): Promise<IrradiacaoResponse> => {
  const params = new URLSearchParams();
  params.append('periodo', periodo);
  params.append('hoje', String(hoje));
  if (mes) params.append('mes', String(mes));
  if (ano) params.append('ano', String(ano));
  return getCache(`/irradiacao/${clienteId}?${params.toString()}`);
};

// Leitura mais recente por fase (A/B/C), já decomposta em autoconsumo/rede/
// injeção — base do diagrama animado de fluxo de elétrons do Dashboard.
export interface FluxoFase {
  geracao_kw: number;
  consumo_kw: number;
  autoconsumo_kw: number;
  rede_kw: number;
  injecao_kw: number;
}

export interface FluxoFasesResponse {
  cliente_id: string;
  tipo_medicao: 'consumo_direto' | 'bidirecional';
  timestamp: string | null;
  fases: { A: FluxoFase; B: FluxoFase; C: FluxoFase };
}

export const getFluxoFases = async (clienteId: string): Promise<FluxoFasesResponse> => {
  // Atualiza a cada 10s (mais rápido que o TTL do cache) — só deduplica.
  return getCache(`/fluxo-fases/${clienteId}`, 0);
};

// Dados de cadastro da usina (potência instalada, contagem de inversores)
export interface ClienteInfo {
  cliente_id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  potencia_kwp: number | null;
  total_inversores: number;
  tipo_medicao: 'consumo_direto' | 'bidirecional';
  telefone_whatsapp: string | null;
}

export const getClienteInfo = async (clienteId: string): Promise<ClienteInfo> => {
  return getCache(`/cliente/${clienteId}/info`);
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
  return getCache(`/inversor/${clienteId}?horas=${horas}`);
};

// data (YYYY-MM-DD) e janela (ex: '1m') opcionais — usados pela curva de
// irradiância do gráfico principal do Dashboard. Com janela, o backend usa
// o MÁXIMO de cada janela (descarta os zeros gravados por dispositivos sem
// sensor de irradiância).
export const getDadosIrradiancia = async (clienteId: string, horas = 24, hoje = false, data?: string, janela?: string) => {
  const params = new URLSearchParams();
  params.append('horas', String(horas));
  params.append('hoje', String(hoje));
  if (data) params.append('data', data);
  if (janela) params.append('janela', janela);
  return getCache(`/irradiancia/${clienteId}?${params.toString()}`);
};
export type PeriodoResumoGrupo = 'hoje' | 'mes' | 'ano';

export const getResumoGrupo = async (grupoId: number, periodo: PeriodoResumoGrupo = 'hoje', mes?: number, ano?: number) => {
  const params = new URLSearchParams();
  params.append('periodo', periodo);
  if (mes) params.append('mes', String(mes));
  if (ano) params.append('ano', String(ano));
  return getCache(`/grupos/${grupoId}/resumo?${params.toString()}`);
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
  email_cliente?: string;
  tipo_medicao?: 'consumo_direto' | 'bidirecional';
  telefone_whatsapp?: string;
}

export const criarMinhaUsina = async (dados: CriarUsinaPayload) => {
  const res = await api.post('/minhas-usinas', dados);
  return res.data;
};

interface EditarUsinaPayload {
  nome?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  tipo_instalacao?: string;
  potencia_kwp?: number;
  tipo_medicao?: 'consumo_direto' | 'bidirecional';
  telefone_whatsapp?: string;
  foto_base64?: string;
}

export const atualizarMinhaUsina = async (clienteId: string, dados: EditarUsinaPayload) => {
  const res = await api.patch(`/minhas-usinas/${clienteId}`, dados);
  return res.data;
};

// Exclusão lógica — a usina some das listagens, mas o histórico de dados
// permanece intacto no InfluxDB.
export const excluirMinhaUsina = async (clienteId: string) => {
  const res = await api.delete(`/minhas-usinas/${clienteId}`);
  return res.data;
};

// Lista de usinas muda raramente — cache mais longo (a Sidebar busca isso
// toda vez que se troca de aba).
export const getMinhasUsinas = async () => {
  return getCache('/minhas-usinas', 5 * 60 * 1000);
};

// Baixa o relatório diário em PDF (blob) — usado pelo botão "Exportar PDF"
// da Sidebar.
export const getRelatorioDiarioPDF = async (clienteId: string): Promise<Blob> => {
  const res = await api.get(`/relatorio-diario/${clienteId}/pdf`, {
    responseType: 'blob',
  });
  return res.data;
};

// Baixa o relatório mensal completo em PDF (blob) — usado pelo botão
// "Relatório Mensal" da Sidebar. Se ano/mes não forem passados, o backend
// usa o mês anterior completo automaticamente.
export const getRelatorioMensalCompletoPDF = async (
  clienteId: string,
  ano?: number,
  mes?: number
): Promise<Blob> => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', String(ano));
  if (mes) params.append('mes', String(mes));
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get(`/relatorio-mensal-completo/${clienteId}/pdf${query}`, {
    responseType: 'blob',
  });
  return res.data;
};

// --- Página Análise: gráfico de linha configurável (inversor/medidor,
// por dispositivo, campos escolhidos pelo usuário) ---
export type TipoAnalise = 'inversor' | 'medidor';

export const getDispositivosAnalise = async (clienteId: string, tipo: TipoAnalise): Promise<string[]> => {
  const data = await getCache(`/analise/${clienteId}/dispositivos?tipo=${tipo}`, 5 * 60 * 1000);
  return data.dispositivos;
};

export interface PontoSerieAnalise {
  ts: string;
  dispositivo_id: string;
  [campo: string]: string | number;
}

export interface SerieAnaliseResponse {
  cliente_id: string;
  tipo: TipoAnalise;
  dispositivo_id: string | null;
  data: string;
  campos: string[];
  pontos: PontoSerieAnalise[];
}

export const getSerieAnalise = async (
  clienteId: string,
  tipo: TipoAnalise,
  campos: string[],
  dispositivoId?: string,
  data?: string
): Promise<SerieAnaliseResponse> => {
  const params = new URLSearchParams();
  params.append('tipo', tipo);
  params.append('campos', campos.join(','));
  if (dispositivoId) params.append('dispositivo_id', dispositivoId);
  if (data) params.append('data', data);
  return getCache(`/analise/${clienteId}/serie?${params.toString()}`);
};
