import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const navigate = useNavigate();
  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (user && pass) navigate('/dashboard'); };
  return (
    <div style={{ minHeight:'100vh', background:'#0F1117', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#181C27', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'2.5rem', width:380 }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:36, fontWeight:700, color:'#F97316' }}>FLEX<span style={{color:'#F8FAFC', fontWeight:300}}> Energy</span></div>
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
          <button type="submit" style={{ width:'100%', background:'#F97316', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600 }}>Entrar</button>
        </form>
        <p style={{ textAlign:'center', fontSize:11, color:'#64748B', marginTop:'1.5rem' }}>Flex Energy © 2026</p>
      </div>
    </div>
  );
};
export default Login;