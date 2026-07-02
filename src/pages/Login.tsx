import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Login: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      params.append('username', user);
      params.append('password', pass);

      const res = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('cliente_id', res.data.cliente_id ?? '');
      localStorage.setItem('grupo_id', res.data.grupo_id ?? '');
      localStorage.setItem('nome', res.data.nome);

      if (res.data.grupo_id) {
        navigate('/visao-geral');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErro('Email ou senha incorretos');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0F1117', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'2.5rem', width:380 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:700, color:'#F97316' }}>FLEX Energy</div>
          <div style={{ fontSize:12, color:'#64748B', marginTop:4 }}>Plataforma de Monitoramento Solar</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ fontSize:12, color:'#94A3B8', display:'block', marginBottom:6 }}>Usuário</label>
            <input value={user} onChange={e=>setUser(e.target.value)} placeholder="seu@email.com" type="email" required
              style={{ width:'100%', background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#F8FAFC', fontSize:14, outline:'none' }} />
          </div>
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ fontSize:12, color:'#94A3B8', display:'block', marginBottom:6 }}>Senha</label>
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password" required
              style={{ width:'100%', background:'#1E2436', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', color:'#F8FAFC', fontSize:14, outline:'none' }} />
          </div>
          {erro && <div style={{ color:'#F87171', fontSize:12, marginBottom:'1rem', textAlign:'center' }}>{erro}</div>}
          <button type="submit" disabled={carregando} style={{ width:'100%', background:'#F97316', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600 }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ textAlign:'center', fontSize:11, color:'#64748B', marginTop:'1.5rem' }}>Flex Energy © 2026</p>
      </div>
    </div>
  );
};

export default Login;