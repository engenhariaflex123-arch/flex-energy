import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResumoGrupo, criarMinhaUsina, atualizarMinhaUsina, excluirMinhaUsina, getClienteInfo, PeriodoResumoGrupo } from '../services/api';
import { useTheme, Cores } from '../contexts/ThemeContext';

interface Usina {
  cliente_id: string;
  nome: string;
  cidade: string;
  estado: string;
  status: string;
  geracao_kw: number;
  consumo_kw: number;
  ultima_leitura: string | null;
  geracao_hoje_kwh: number;
  consumo_hoje_kwh: number;
  saldo_hoje_kwh: number;
  potencia_kwp: number;
  kwh_por_kwp: number | null;
}

interface Resumo {
  grupo_id: number;
  nome_grupo: string;
  total_usinas: number;
  total_geracao_kw: number;
  total_consumo_kw: number;
  periodo: PeriodoResumoGrupo;
  periodo_label: string;
  total_geracao_hoje_kwh: number;
  total_consumo_hoje_kwh: number;
  total_saldo_hoje_kwh: number;
  total_potencia_kwp: number;
  total_kwh_por_kwp: number | null;
  usinas: Usina[];
}

interface StringForm {
  kwp: string;
}

interface InversorForm {
  marca: string;
  modelo: string;
  potencia_kw: string;
  mppts: string;
  strings: StringForm[];
}

const getStatusCor = (cores: Cores): Record<string, string> => ({
  produzindo: cores.verde,
  online: cores.azul,
  offline: cores.vermelho,
});

const statusLabel: Record<string, string> = {
  produzindo: 'Produzindo',
  online: 'Online',
  offline: 'Offline',
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1E2436', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '10px 14px', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = { fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 };

const novoInversorVazio = (): InversorForm => ({
  marca: '', modelo: '', potencia_kw: '', mppts: '2', strings: [{ kwp: '' }],
});

const VisaoGeral: React.FC = () => {
  const { mode, cores, toggleTheme } = useTheme();
  const statusCor = getStatusCor(cores);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  const [modalAberto, setModalAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaCidade, setNovaCidade] = useState('');
  const [novoEstado, setNovoEstado] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [novoTipoInstalacao, setNovoTipoInstalacao] = useState('solo');
  const [novaPotenciaKwp, setNovaPotenciaKwp] = useState('');
  const [novoTipoMedicao, setNovoTipoMedicao] = useState<'consumo_direto' | 'bidirecional'>('consumo_direto');
  const [novoTelefoneWhatsapp, setNovoTelefoneWhatsapp] = useState('');
  const [fotoBase64, setFotoBase64] = useState('');
  const [fotoNomeArquivo, setFotoNomeArquivo] = useState('');
  const [inversores, setInversores] = useState<InversorForm[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  // --- Filtro de período (Hoje / Mês / Ano) ---
  const agora = new Date();
  const [periodo, setPeriodo] = useState<PeriodoResumoGrupo>('hoje');
  const [mesSelecionado, setMesSelecionado] = useState(agora.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(agora.getFullYear());

  // --- Editar usina ---
  const [usinaEditando, setUsinaEditando] = useState<Usina | null>(null);
  const [edNome, setEdNome] = useState('');
  const [edCidade, setEdCidade] = useState('');
  const [edEstado, setEdEstado] = useState('');
  const [edPotenciaKwp, setEdPotenciaKwp] = useState('');
  const [edTipoMedicao, setEdTipoMedicao] = useState<'consumo_direto' | 'bidirecional'>('consumo_direto');
  const [edTelefoneWhatsapp, setEdTelefoneWhatsapp] = useState('');
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState('');

  // --- Excluir usina ---
  const [usinaExcluindo, setUsinaExcluindo] = useState<Usina | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const grupoIdAtual = () => Number(localStorage.getItem('grupo_id'));

  const carregar = async (grupoId: number, periodoAtual = periodo, mesAtual = mesSelecionado, anoAtual = anoSelecionado) => {
    try {
      const dados = await getResumoGrupo(grupoId, periodoAtual, mesAtual, anoAtual);
      setResumo(dados);
      setErro('');
    } catch (e) {
      setErro('Erro ao carregar dados do grupo');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const grupoId = localStorage.getItem('grupo_id');
    if (!grupoId) {
      navigate('/dashboard');
      return;
    }
    setCarregando(true);
    carregar(Number(grupoId), periodo, mesSelecionado, anoSelecionado);
    // Só faz sentido reatualizar automaticamente a cada 30s quando o
    // período é "hoje" (que muda em tempo real). Mês/ano selecionados
    // não mudam sozinhos, então não precisa ficar batendo na API à toa.
    if (periodo !== 'hoje') return;
    const interval = setInterval(() => carregar(Number(grupoId), periodo, mesSelecionado, anoSelecionado), 30000);
    return () => clearInterval(interval);
  }, [periodo, mesSelecionado, anoSelecionado]);

  const resetForm = () => {
    setNovoNome('');
    setNovaCidade('');
    setNovoEstado('');
    setNovoEndereco('');
    setNovoTipoInstalacao('solo');
    setNovaPotenciaKwp('');
    setNovoTipoMedicao('consumo_direto');
    setNovoTelefoneWhatsapp('');
    setFotoBase64('');
    setFotoNomeArquivo('');
    setInversores([]);
    setErroForm('');
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoNomeArquivo(file.name);
    const reader = new FileReader();
    reader.onload = () => setFotoBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addInversor = () => setInversores([...inversores, novoInversorVazio()]);
  const removeInversor = (idx: number) => setInversores(inversores.filter((_, i) => i !== idx));
  const updateInversor = (idx: number, campo: keyof InversorForm, valor: string) => {
    const copia = [...inversores];
    (copia[idx] as any)[campo] = valor;
    setInversores(copia);
  };
  const addString = (invIdx: number) => {
    const copia = [...inversores];
    copia[invIdx].strings.push({ kwp: '' });
    setInversores(copia);
  };
  const removeString = (invIdx: number, strIdx: number) => {
    const copia = [...inversores];
    copia[invIdx].strings = copia[invIdx].strings.filter((_, i) => i !== strIdx);
    setInversores(copia);
  };
  const updateString = (invIdx: number, strIdx: number, valor: string) => {
    const copia = [...inversores];
    copia[invIdx].strings[strIdx].kwp = valor;
    setInversores(copia);
  };

  const handleCriarUsina = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm('');
    setSalvando(true);
    try {
      await criarMinhaUsina({
        nome: novoNome,
        cidade: novaCidade,
        estado: novoEstado,
        endereco: novoEndereco,
        tipo_instalacao: novoTipoInstalacao,
        potencia_kwp: novaPotenciaKwp ? Number(novaPotenciaKwp) : undefined,
        tipo_medicao: novoTipoMedicao,
        telefone_whatsapp: novoTelefoneWhatsapp || undefined,
        foto_base64: fotoBase64 || undefined,
        inversores: inversores.map((inv) => ({
          marca: inv.marca,
          modelo: inv.modelo,
          potencia_kw: Number(inv.potencia_kw) || 0,
          mppts: Number(inv.mppts) || 1,
          strings: inv.strings
            .filter((s) => s.kwp !== '')
            .map((s) => ({ kwp: Number(s.kwp) })),
        })),
      });
      setModalAberto(false);
      resetForm();
      await carregar(grupoIdAtual());
    } catch (err) {
      setErroForm('Erro ao criar usina. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  // --- Editar usina ---
  const abrirEdicao = async (usina: Usina) => {
    setUsinaEditando(usina);
    setErroEdicao('');
    setCarregandoEdicao(true);
    // Pré-preenche com o que já temos da linha da tabela...
    setEdNome(usina.nome);
    setEdCidade(usina.cidade);
    setEdEstado(usina.estado);
    setEdPotenciaKwp('');
    setEdTipoMedicao('consumo_direto');
    setEdTelefoneWhatsapp('');
    try {
      // ...e completa com os campos que só vêm no cadastro detalhado
      // (o resumo do grupo não traz potência, tipo de medição, WhatsApp).
      const info = await getClienteInfo(usina.cliente_id);
      setEdNome(info.nome);
      setEdCidade(info.cidade || '');
      setEdEstado(info.estado || '');
      setEdPotenciaKwp(info.potencia_kwp != null ? String(info.potencia_kwp) : '');
      setEdTipoMedicao(info.tipo_medicao || 'consumo_direto');
      setEdTelefoneWhatsapp(info.telefone_whatsapp || '');
    } catch (e) {
      setErroEdicao('Não foi possível carregar todos os dados da usina. Você ainda pode editar os campos abaixo.');
    } finally {
      setCarregandoEdicao(false);
    }
  };

  const fecharEdicao = () => {
    setUsinaEditando(null);
    setErroEdicao('');
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usinaEditando) return;
    setErroEdicao('');
    setSalvandoEdicao(true);
    try {
      await atualizarMinhaUsina(usinaEditando.cliente_id, {
        nome: edNome,
        cidade: edCidade || undefined,
        estado: edEstado || undefined,
        potencia_kwp: edPotenciaKwp ? Number(edPotenciaKwp) : undefined,
        tipo_medicao: edTipoMedicao,
        telefone_whatsapp: edTelefoneWhatsapp || undefined,
      });
      fecharEdicao();
      await carregar(grupoIdAtual());
    } catch (err) {
      setErroEdicao('Erro ao salvar as alterações. Tente novamente.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // --- Excluir usina ---
  const handleConfirmarExclusao = async () => {
    if (!usinaExcluindo) return;
    setErroExclusao('');
    setExcluindo(true);
    try {
      await excluirMinhaUsina(usinaExcluindo.cliente_id);
      setUsinaExcluindo(null);
      await carregar(grupoIdAtual());
    } catch (err) {
      setErroExclusao('Erro ao excluir a usina. Tente novamente.');
    } finally {
      setExcluindo(false);
    }
  };

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', background: cores.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cores.text2 }}>
        Carregando...
      </div>
    );
  }

  if (erro || !resumo) {
    return (
      <div style={{ minHeight: '100vh', background: cores.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cores.vermelho }}>
        {erro || 'Nenhum dado encontrado'}
      </div>
    );
  }

  const saldo = resumo.total_geracao_kw - resumo.total_consumo_kw;
  const saldoHoje = resumo.total_saldo_hoje_kwh;
  const usinasOnline = resumo.usinas.filter((u) => u.status !== 'offline').length;

  return (
    <div className="visaogeral-content" style={{ minHeight: '100vh', background: cores.bg, fontFamily: 'system-ui, sans-serif' }}>
      <div className="visaogeral-header">
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700, color: cores.laranja }}>
            {resumo.nome_grupo}
          </div>
          <div style={{ fontSize: 13, color: cores.text3 }}>Visão Geral das Usinas</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={toggleTheme}
            title={mode === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: cores.text2, border: `1px solid ${cores.border}`,
              borderRadius: 8, padding: '10px 14px', fontSize: 13, cursor: 'pointer',
            }}
          >
            <span>{mode === 'dark' ? '☀️' : '🌙'}</span>
            <span>{mode === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
          </button>
          <button
            onClick={() => setModalAberto(true)}
            style={{ background: cores.laranja, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Nova Usina
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
        {(['hoje', 'mes', 'ano'] as PeriodoResumoGrupo[]).map((opcao) => (
          <button
            key={opcao}
            onClick={() => setPeriodo(opcao)}
            style={{
              background: periodo === opcao ? cores.laranja : 'transparent',
              color: periodo === opcao ? '#fff' : cores.text2,
              border: `1px solid ${periodo === opcao ? cores.laranja : cores.border}`,
              borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {opcao === 'hoje' ? 'Hoje' : opcao === 'mes' ? 'Mês' : 'Ano'}
          </button>
        ))}

        {periodo === 'mes' && (
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(Number(e.target.value))}
            style={{ background: cores.bg2, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
          >
            {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((nomeMes, idx) => (
              <option key={idx} value={idx + 1}>{nomeMes}</option>
            ))}
          </select>
        )}

        {(periodo === 'mes' || periodo === 'ano') && (
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            style={{ background: cores.bg2, color: cores.text, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13 }}
          >
            {Array.from({ length: 6 }, (_, i) => agora.getFullYear() - i).map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '1rem' }}>
        <Card cores={cores} titulo="TOTAL DE USINAS" valor={String(resumo.total_usinas)} sub={`${usinasOnline} ativas`} cor={cores.laranja} />
        <Card cores={cores} titulo="POTÊNCIA INSTALADA" valor={`${resumo.total_potencia_kwp.toFixed(2)} kWp`} sub="Soma de todas as usinas cadastradas" cor={cores.laranja} />
        <Card cores={cores} titulo="GERAÇÃO ATUAL" valor={`${resumo.total_geracao_kw.toFixed(2)} kW`} sub="Soma de todas as usinas" cor={cores.verde} />
        <Card cores={cores} titulo="CONSUMO ATUAL" valor={`${resumo.total_consumo_kw.toFixed(2)} kW`} sub="Soma de todas as usinas" cor={cores.vermelho} />
        <Card
          cores={cores}
          titulo="SALDO ENERGÉTICO"
          valor={`${saldo >= 0 ? '+' : ''}${saldo.toFixed(2)} kW`}
          sub={saldo >= 0 ? 'Exportando energia' : 'Importando energia'}
          cor={saldo >= 0 ? cores.verde : cores.vermelho}
        />
      </div>

      <div style={{ fontSize: 11, color: cores.text3, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
        Acumulado — {resumo.periodo_label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '2rem' }}>
        <Card cores={cores} titulo="GERAÇÃO" valor={`${resumo.total_geracao_hoje_kwh.toFixed(2)} kWh`} sub={`Acumulado — ${resumo.periodo_label} — todas as usinas`} cor={cores.verde} />
        <Card cores={cores} titulo="CONSUMO" valor={`${resumo.total_consumo_hoje_kwh.toFixed(2)} kWh`} sub={`Acumulado — ${resumo.periodo_label} — todas as usinas`} cor={cores.vermelho} />
        <Card
          cores={cores}
          titulo="SALDO"
          valor={`${saldoHoje >= 0 ? '+' : ''}${saldoHoje.toFixed(2)} kWh`}
          sub={saldoHoje >= 0 ? 'Exportou mais do que consumiu' : 'Consumiu mais do que exportou'}
          cor={saldoHoje >= 0 ? cores.verde : cores.vermelho}
        />
        <Card
          cores={cores}
          titulo="PRODUTIVIDADE"
          valor={resumo.total_kwh_por_kwp != null ? `${resumo.total_kwh_por_kwp.toFixed(2)} kWh/kWp` : '—'}
          sub={resumo.total_kwh_por_kwp != null ? `Geração ÷ potência instalada — ${resumo.periodo_label}` : 'Nenhuma usina com potência (kWp) cadastrada'}
          cor={cores.azul}
        />
      </div>

      <div style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 16, padding: '1.5rem' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: cores.text, marginBottom: '1rem' }}>Usinas</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${cores.border}` }}>
                <Th cores={cores}>Usina</Th>
                <Th cores={cores}>Localização</Th>
                <Th cores={cores}>Status</Th>
                <Th cores={cores}>Geração</Th>
                <Th cores={cores}>Consumo</Th>
                <Th cores={cores}>Saldo — {resumo.periodo_label}</Th>
                <Th cores={cores}>Última leitura</Th>
                <Th cores={cores}>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {resumo.usinas.map((usina) => (
                <tr
                  key={usina.cliente_id}
                  onClick={() => navigate(`/dashboard?cliente=${usina.cliente_id}`)}
                  style={{ borderBottom: `1px solid ${cores.border}`, cursor: 'pointer' }}
                >
                  <Td cores={cores}>{usina.nome}</Td>
                  <Td cores={cores}>{usina.cidade}, {usina.estado}</Td>
                  <Td cores={cores}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: `${statusCor[usina.status]}22`, color: statusCor[usina.status],
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusCor[usina.status] }} />
                      {statusLabel[usina.status] ?? usina.status}
                    </span>
                  </Td>
                  <Td cores={cores}>{usina.geracao_kw.toFixed(2)} kW</Td>
                  <Td cores={cores}>{usina.consumo_kw.toFixed(2)} kW</Td>
                  <Td cores={cores}>
                    <span style={{ color: usina.saldo_hoje_kwh >= 0 ? cores.verde : cores.vermelho }}>
                      {usina.saldo_hoje_kwh >= 0 ? '+' : ''}{usina.saldo_hoje_kwh.toFixed(2)} kWh
                    </span>
                  </Td>
                  <Td cores={cores}>{usina.ultima_leitura ? new Date(usina.ultima_leitura).toLocaleString('pt-BR') : '—'}</Td>
                  <Td cores={cores}>
                    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => abrirEdicao(usina)}
                        title="Editar usina"
                        style={{ background: 'transparent', color: cores.text2, border: `1px solid ${cores.border}`, borderRadius: 6, padding: '5px 9px', fontSize: 12, cursor: 'pointer' }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setUsinaExcluindo(usina)}
                        title="Excluir usina"
                        style={{ background: 'transparent', color: cores.vermelho, border: `1px solid ${cores.vermelho}55`, borderRadius: 6, padding: '5px 9px', fontSize: 12, cursor: 'pointer' }}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}
          onClick={() => setModalAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="usina-modal"
            style={{ background: '#181C27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 480, maxWidth: '100%' }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: '1.5rem' }}>Nova Usina</div>
            <form onSubmit={handleCriarUsina}>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Nome da usina</label>
                <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex: GTJ-Flex Nova Lima" required style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Cidade</label>
                  <input value={novaCidade} onChange={(e) => setNovaCidade(e.target.value)} placeholder="Ex: Nova Lima" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Estado</label>
                  <input value={novoEstado} onChange={(e) => setNovoEstado(e.target.value)} placeholder="MG" maxLength={2} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Endereço</label>
                <input value={novoEndereco} onChange={(e) => setNovoEndereco(e.target.value)} placeholder="Rua, número, bairro" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Tipo de instalação</label>
                  <select value={novoTipoInstalacao} onChange={(e) => setNovoTipoInstalacao(e.target.value)} style={inputStyle}>
                    <option value="solo">Solo</option>
                    <option value="telhado">Telhado</option>
                    <option value="carport">Carport</option>
                    <option value="fachada">Fachada</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Potência (kWp)</label>
                  <input value={novaPotenciaKwp} onChange={(e) => setNovaPotenciaKwp(e.target.value)} placeholder="Ex: 75.5" type="number" step="0.01" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Tipo de medição do consumo</label>
                <select value={novoTipoMedicao} onChange={(e) => setNovoTipoMedicao(e.target.value as 'consumo_direto' | 'bidirecional')} style={inputStyle}>
                  <option value="consumo_direto">Medidor no ramal de cargas (consumo direto)</option>
                  <option value="bidirecional">Medidor no padrão de entrada (bidirecional)</option>
                </select>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  {novoTipoMedicao === 'consumo_direto'
                    ? 'O medidor mede o consumo total diretamente no ramal de cargas.'
                    : 'O medidor mede a energia importada/exportada no ponto de conexão com a rede.'}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>WhatsApp para relatórios (com DDI+DDD)</label>
                <input
                  value={novoTelefoneWhatsapp}
                  onChange={(e) => setNovoTelefoneWhatsapp(e.target.value)}
                  placeholder="Ex: 5537999998888"
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  Número que receberá os relatórios diários e mensais automáticos.
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Foto da usina</label>
                <input type="file" accept="image/*" onChange={handleFotoChange} style={{ ...inputStyle, padding: '8px 14px' }} />
                {fotoNomeArquivo && <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Selecionado: {fotoNomeArquivo}</div>}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>Inversores</div>
                  <button type="button" onClick={addInversor} style={{ background: 'transparent', color: '#F97316', border: '1px solid #F97316', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                    + Adicionar inversor
                  </button>
                </div>

                {inversores.length === 0 && (
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>Nenhum inversor adicionado ainda.</div>
                )}

                {inversores.map((inv, invIdx) => (
                  <div key={invIdx} style={{ background: '#1E2436', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1rem', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>Inversor {invIdx + 1}</div>
                      <button type="button" onClick={() => removeInversor(invIdx)} style={{ background: 'transparent', color: '#F87171', border: 'none', fontSize: 12, cursor: 'pointer' }}>
                        Remover
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <input value={inv.marca} onChange={(e) => updateInversor(invIdx, 'marca', e.target.value)} placeholder="Marca" style={inputStyle} />
                      <input value={inv.modelo} onChange={(e) => updateInversor(invIdx, 'modelo', e.target.value)} placeholder="Modelo" style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <input value={inv.potencia_kw} onChange={(e) => updateInversor(invIdx, 'potencia_kw', e.target.value)} placeholder="Potência (kW)" type="number" step="0.01" style={inputStyle} />
                      <input value={inv.mppts} onChange={(e) => updateInversor(invIdx, 'mppts', e.target.value)} placeholder="Nº de MPPTs" type="number" style={inputStyle} />
                    </div>

                    <div style={{ paddingLeft: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Strings</div>
                        <button type="button" onClick={() => addString(invIdx)} style={{ background: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>
                          + String
                        </button>
                      </div>
                      {inv.strings.map((s, strIdx) => (
                        <div key={strIdx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <input
                            value={s.kwp}
                            onChange={(e) => updateString(invIdx, strIdx, e.target.value)}
                            placeholder={`kWp da string ${strIdx + 1}`}
                            type="number" step="0.01"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button type="button" onClick={() => removeString(invIdx, strIdx)} style={{ background: 'transparent', color: '#F87171', border: 'none', fontSize: 12, cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {erroForm && <div style={{ color: '#F87171', fontSize: 12, marginBottom: '1rem' }}>{erroForm}</div>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setModalAberto(false); resetForm(); }}
                  style={{ flex: 1, background: 'transparent', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  style={{ flex: 1, background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {salvando ? 'Criando...' : 'Criar Usina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {usinaEditando && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}
          onClick={fecharEdicao}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 16, width: 440, maxWidth: '100%', padding: '1.5rem' }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: cores.text, marginBottom: '1.25rem' }}>
              Editar Usina
            </div>

            {carregandoEdicao ? (
              <div style={{ color: cores.text2, fontSize: 13, padding: '1rem 0' }}>Carregando dados da usina...</div>
            ) : (
              <form onSubmit={handleSalvarEdicao}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ ...labelStyle, color: cores.text2 }}>Nome da usina</label>
                  <input
                    value={edNome}
                    onChange={(e) => setEdNome(e.target.value)}
                    required
                    style={{ ...inputStyle, background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}` }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: '1rem' }}>
                  <div>
                    <label style={{ ...labelStyle, color: cores.text2 }}>Cidade</label>
                    <input
                      value={edCidade}
                      onChange={(e) => setEdCidade(e.target.value)}
                      style={{ ...inputStyle, background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}` }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: cores.text2 }}>Estado</label>
                    <input
                      value={edEstado}
                      onChange={(e) => setEdEstado(e.target.value)}
                      maxLength={2}
                      style={{ ...inputStyle, background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}` }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ ...labelStyle, color: cores.text2 }}>Potência (kWp)</label>
                  <input
                    value={edPotenciaKwp}
                    onChange={(e) => setEdPotenciaKwp(e.target.value)}
                    type="number" step="0.01"
                    style={{ ...inputStyle, background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}` }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ ...labelStyle, color: cores.text2 }}>Tipo de medição do consumo</label>
                  <select
                    value={edTipoMedicao}
                    onChange={(e) => setEdTipoMedicao(e.target.value as 'consumo_direto' | 'bidirecional')}
                    style={{ ...inputStyle, background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}` }}
                  >
                    <option value="consumo_direto">Medidor no ramal de cargas (consumo direto)</option>
                    <option value="bidirecional">Medidor no padrão de entrada (bidirecional)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ ...labelStyle, color: cores.text2 }}>WhatsApp para relatórios (com DDI+DDD)</label>
                  <input
                    value={edTelefoneWhatsapp}
                    onChange={(e) => setEdTelefoneWhatsapp(e.target.value)}
                    placeholder="Ex: 5537999998888"
                    style={{ ...inputStyle, background: cores.bg3, color: cores.text, border: `1px solid ${cores.border}` }}
                  />
                </div>

                {erroEdicao && <div style={{ color: cores.vermelho, fontSize: 12, marginBottom: '1rem' }}>{erroEdicao}</div>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={fecharEdicao}
                    style={{ flex: 1, background: 'transparent', color: cores.text2, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoEdicao}
                    style={{ flex: 1, background: cores.laranja, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {usinaExcluindo && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          onClick={() => { if (!excluindo) { setUsinaExcluindo(null); setErroExclusao(''); } }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: cores.bg2, border: `1px solid ${cores.border}`, borderRadius: 16, width: 400, maxWidth: '100%', padding: '1.5rem' }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: cores.text, marginBottom: 10 }}>Excluir usina?</div>
            <div style={{ fontSize: 13, color: cores.text2, marginBottom: '1.5rem' }}>
              Tem certeza que deseja excluir <strong style={{ color: cores.text }}>{usinaExcluindo.nome}</strong>?
              Ela deixará de aparecer nas listagens, mas o histórico de dados já registrado é preservado.
            </div>

            {erroExclusao && <div style={{ color: cores.vermelho, fontSize: 12, marginBottom: '1rem' }}>{erroExclusao}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={excluindo}
                onClick={() => { setUsinaExcluindo(null); setErroExclusao(''); }}
                style={{ flex: 1, background: 'transparent', color: cores.text2, border: `1px solid ${cores.border}`, borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExclusao}
                style={{ flex: 1, background: cores.vermelho, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Card: React.FC<{ titulo: string; valor: string; sub: string; cor: string; cores: Cores }> = ({ titulo, valor, sub, cor, cores }) => (
  <div style={{ background: cores.bg2, border: `1px solid ${cor}55`, borderRadius: 12, padding: '1.25rem' }}>
    <div style={{ fontSize: 11, color: cores.text2, marginBottom: 8, letterSpacing: 0.5 }}>{titulo}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: cor }}>{valor}</div>
    <div style={{ fontSize: 12, color: cores.text3, marginTop: 4 }}>{sub}</div>
  </div>
);

const Th: React.FC<{ children: React.ReactNode; cores: Cores }> = ({ children, cores }) => (
  <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: cores.text2, fontWeight: 600, letterSpacing: 0.5 }}>{children}</th>
);

const Td: React.FC<{ children: React.ReactNode; cores: Cores }> = ({ children, cores }) => (
  <td style={{ padding: '12px', fontSize: 13, color: cores.text }}>{children}</td>
);

export default VisaoGeral;