import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="apple-bg">
      <form className="apple-card" onSubmit={handleSubmit}>
        <h2 style={{fontWeight:700, fontSize:'2rem', marginBottom:'1.5rem', letterSpacing:'-1px'}}>Entrar</h2>
        <input
          className="apple-input"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="apple-input"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{marginTop:'1rem'}}
        />
        <button className="apple-btn" type="submit" style={{marginTop:'2rem'}}>Entrar</button>
        {error && <div className="apple-error">{error}</div>}
      </form>
    </div>
  );
};
