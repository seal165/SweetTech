// src/screens/LoginScreen.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Ini sudah benar langsung menembak database auth Supabase
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  // CSS asli dari login.html (Tetap utuh tanpa ada yang diubah)
  const styles = `
    :root {
      --brand-color: #704455;
      --primary-text: #2d2426;
      --bg-color: #faf8f6;
      --card-bg: #ffffff;
      --pink-accent: #f8c1d2;
      --pink-hover: #f19fb5;
      --text-muted: #7d6f73;
      --border-color: #ebe4e6;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Poppins', sans-serif;
    }
    body {
      background-color: var(--bg-color);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem;
      position: relative;
      overflow-x: hidden;
    }
    .bg-glow {
      position: absolute;
      width: 400px;
      height: 400px;
      background-color: #fbe8ee;
      filter: blur(80px);
      border-radius: 50%;
      z-index: -1;
      animation: floatingGlow 6s ease-in-out infinite alternate;
    }
    .glow-1 { top: -10%; left: -10%; }
    .glow-2 { bottom: -10%; right: -10%; background-color: #e8e2f4; }
    @keyframes floatingGlow {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(20px, 30px) scale(1.1); }
    }
    .login-card {
      background-color: var(--card-bg);
      width: 100%;
      max-width: 450px;
      padding: 3rem 2.5rem;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(112,68,85,0.05);
      border: 1px solid var(--border-color);
      text-align: center;
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
    }
    @keyframes fadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }
    .logo {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--brand-color);
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .logo i { color: #ea6c75; }
    .subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 2.5rem;
    }
    .form-group {
      text-align: left;
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
      color: var(--primary-text);
    }
    .input-wrapper {
      position: relative;
    }
    .input-wrapper i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #b8b0b3;
      font-size: 0.95rem;
    }
    .form-control {
      width: 100%;
      padding: 0.9rem 1rem 0.9rem 2.8rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-size: 0.95rem;
      outline: none;
      background-color: #fdfcfc;
      transition: all 0.3s;
    }
    .form-control:focus {
      border-color: #d8b8c2;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(248,193,210,0.2);
    }
    .btn-login {
      width: 100%;
      background-color: var(--pink-accent);
      color: var(--brand-color);
      border: none;
      padding: 1rem;
      border-radius: 30px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.3s, transform 0.1s;
    }
    .btn-login:hover {
      background-color: var(--pink-hover);
    }
    .btn-login:active {
      transform: scale(0.98);
    }
    .switch-text {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 2rem;
    }
    .switch-text a {
      color: var(--brand-color);
      text-decoration: none;
      font-weight: 600;
    }
    .switch-text a:hover {
      text-decoration: underline;
    }
    .error-message {
      color: #d33c44;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      {/* Fragment di bawah ini sengaja dikosongkan tanpa membungkus div tambahan 
        agar CSS selector body {} dari layout aslimu bekerja dengan sempurna.
      */}
      <div className="bg-glow glow-1"></div>
      <div className="bg-glow glow-2"></div>
      <div className="login-card">
        <div className="logo">
          <i className="fa-solid fa-cake-candles"></i> SweetTech
        </div>
        <p className="subtitle">Selamat datang kembali! Silakan masuk ke akun Anda</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <i className="fa-regular fa-envelope"></i>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-lock"></i>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <p className="switch-text">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </div>
    </>
  );
}