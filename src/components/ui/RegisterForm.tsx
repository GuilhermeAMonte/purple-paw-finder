import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const RegisterForm = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'client' | 'clinic'>('client');
  const [plan, setPlan] = useState<'free' | 'basic' | 'intermediary' | 'experience'>('free');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password, userType, userType === 'clinic' ? plan : undefined);
      setSuccess('Cadastro realizado com sucesso!');
      setError('');
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    }
  };

  return (
    <div className="apple-bg">
      <form className="apple-card" onSubmit={handleSubmit}>
        <h2 style={{fontWeight:700, fontSize:'2rem', marginBottom:'1.5rem', letterSpacing:'-1px'}}>Cadastrar</h2>
        <input
          className="apple-input"
          type="text"
          placeholder="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="apple-input"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{marginTop:'1rem'}}
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
        <select
          className="apple-input"
          value={userType}
          onChange={e => setUserType(e.target.value as 'client' | 'clinic')}
          style={{marginTop:'1rem'}}
        >
          <option value="client">Cliente</option>
          <option value="clinic">Clínica</option>
        </select>
        {userType === 'clinic' && (
          <select
            className="apple-input"
            value={plan}
            onChange={e => setPlan(e.target.value as 'free' | 'basic' | 'intermediary' | 'experience')}
            style={{marginTop:'1rem'}}
          >
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="intermediary">Intermediary</option>
            <option value="experience">Experience</option>
          </select>
        )}
        <button className="apple-btn" type="submit" style={{marginTop:'2rem'}}>Cadastrar</button>
        {error && <div className="apple-error">{error}</div>}
        {success && <div className="apple-success">{success}</div>}
      </form>
    </div>
  );
};
