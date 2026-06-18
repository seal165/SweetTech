// src/screens/admin/AdminLoginScreen.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

export default function AdminLoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      console.log('🔄 Admin login attempt:', email.trim());

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('❌ SignIn error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Login success:', data.user.email);

      // Ambil profile untuk cek role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw new Error('Gagal mengambil data profile');
      }

      console.log('📋 Profile role:', profile?.role);

      // 🔥 CEK APAKAH ADMIN
      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setErrorMsg('Access denied. Admin only.');
        setLoading(false);
        return;
      }

      // 🔥 UPDATE SESSION DI APP
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }

      // Navigasi ke dashboard admin
      navigate('/admin/dashboard');

    } catch (error) {
      console.error('❌ Login error:', error);
      setErrorMsg(error.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  const styles = `
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
    }

    .admin-login-wrapper {
      --primary-bg: #FDF8F5;
      --card-bg: #FFFFFF;
      --text-main: #1A1A1A;
      --text-muted: #888888;
      --accent-pink: #F3B5CD;
      --btn-dark: #702D43;
      --btn-dark-hover: #5A2135;
      --border-color: #EEEEEE;
      --shadow-card: 0px 20px 60px rgba(112, 45, 67, 0.08), 0px 4px 16px rgba(0,0,0,0.04);
      --shadow-btn: 0px 6px 20px rgba(112, 45, 67, 0.30);

      background: linear-gradient(145deg, #FDF8F5 0%, #FCF0F5 50%, #FDF8F5 100%);
      color: var(--text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Subtle decorative blobs in background */
    .admin-login-wrapper::before,
    .admin-login-wrapper::after {
      content: '';
      position: fixed;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
    }
    .admin-login-wrapper::before {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(243, 181, 205, 0.18) 0%, transparent 70%);
      top: -80px;
      right: -80px;
    }
    .admin-login-wrapper::after {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(112, 45, 67, 0.06) 0%, transparent 70%);
      bottom: -60px;
      left: -60px;
    }

    .login-container {
      position: relative;
      z-index: 1;
      background-color: var(--card-bg);
      width: 100%;
      max-width: 440px;
      border-radius: 28px;
      padding: 48px 40px 36px;
      box-shadow: var(--shadow-card);
      border: 1px solid rgba(243, 181, 205, 0.25);
      text-align: center;
    }

    /* ── Brand Header ── */
    .brand-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 6px;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, var(--btn-dark), #A0405E);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(112, 45, 67, 0.25);
    }

    .brand-logo {
      font-size: 26px;
      font-weight: 800;
      color: var(--btn-dark);
      letter-spacing: -0.8px;
    }

    .login-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-main);
      margin: 20px 0 6px;
    }

    .login-subtitle {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-bottom: 28px;
      line-height: 1.5;
    }

    /* ── Divider ── */
    .section-divider {
      height: 1px;
      background: var(--border-color);
      margin-bottom: 28px;
    }

    /* ── Error Alert ── */
    .error-alert {
      background: linear-gradient(135deg, #FDF3F2, #FFF0EE);
      color: #C0392B;
      border: 1px solid rgba(192, 57, 43, 0.15);
      border-radius: 12px;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      text-align: left;
      max-height: 0;
      overflow: hidden;
      opacity: 0;
      margin-bottom: 0;
      transition: max-height 0.35s ease, opacity 0.3s ease, margin-bottom 0.3s ease, padding 0.3s ease;
    }

    .error-alert.show {
      max-height: 80px;
      opacity: 1;
      padding: 12px 14px;
      margin-bottom: 20px;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%       { transform: translateX(-6px); }
      40%       { transform: translateX(6px); }
      60%       { transform: translateX(-4px); }
      80%       { transform: translateX(4px); }
    }

    /* ── Form ── */
    .form-group {
      margin-bottom: 18px;
      text-align: left;
    }

    .form-group label {
      display: block;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }

    .input-wrapper {
      position: relative;
    }

    .input-wrapper .input-icon {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #C0C0C0;
      font-size: 15px;
      pointer-events: none;
      transition: color 0.2s ease;
    }

    .form-input {
      width: 100%;
      padding: 13px 44px 13px 42px;
      border: 1.5px solid var(--border-color);
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      outline: none;
      background-color: #FAFAFA;
      color: var(--text-main);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-appearance: none;
    }

    .form-input::placeholder {
      color: #C8C8C8;
      font-weight: 400;
    }

    .form-input:focus {
      background-color: #FFFFFF;
      border-color: var(--btn-dark);
      box-shadow: 0 0 0 4px rgba(112, 45, 67, 0.07);
    }

    .form-input:focus + .input-icon,
    .input-wrapper:focus-within .input-icon {
      color: var(--btn-dark);
    }

    .toggle-password {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #C0C0C0;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
      transition: color 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }

    .toggle-password:hover {
      color: var(--btn-dark);
    }

    /* ── Login Button ── */
    .btn-login {
      position: relative;
      width: 100%;
      background: linear-gradient(135deg, var(--btn-dark) 0%, #A0405E 100%);
      color: #FFFFFF;
      border: none;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: var(--shadow-btn);
      transition: all 0.25s ease;
      margin-top: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      letter-spacing: 0.2px;
      overflow: hidden;
    }

    .btn-login::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
      border-radius: inherit;
      pointer-events: none;
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0px 10px 28px rgba(112, 45, 67, 0.38);
    }

    .btn-login:active:not(:disabled) {
      transform: translateY(0px);
      box-shadow: var(--shadow-btn);
    }

    .btn-login:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .btn-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Footer ── */
    .login-footer {
      margin-top: 28px;
      font-size: 12px;
      color: #BBBBBB;
      border-top: 1px solid var(--border-color);
      padding-top: 18px;
      line-height: 1.6;
    }

    .login-footer span {
      font-size: 11px;
      color: #D0D0D0;
    }

    /* ── Mobile Responsive ── */
    @media (max-width: 480px) {
      .admin-login-wrapper {
        padding: 12px;
        align-items: flex-start;
        padding-top: 40px;
      }

      .login-container {
        border-radius: 24px;
        padding: 36px 24px 28px;
        box-shadow: 0px 8px 32px rgba(112, 45, 67, 0.10);
      }

      .brand-logo {
        font-size: 23px;
      }

      .brand-icon {
        width: 32px;
        height: 32px;
        font-size: 15px;
      }

      .login-title {
        font-size: 18px;
        margin-top: 16px;
      }

      .login-subtitle {
        font-size: 13px;
        margin-bottom: 24px;
      }

      .form-input {
        font-size: 16px; /* prevent iOS zoom on focus */
        padding: 13px 44px 13px 42px;
      }

      .btn-login {
        padding: 15px 20px;
        font-size: 15px;
      }
    }

    /* ── Very small phones ── */
    @media (max-width: 360px) {
      .login-container {
        padding: 28px 18px 24px;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="admin-login-wrapper">
        <div className="login-container">

          {/* Brand */}
          <div className="brand-header">
            <div className="brand-icon">
              <i className="fa-solid fa-store-slash" style={{ fontSize: '16px' }}></i>
            </div>
            <div className="brand-logo">SweetTech</div>
          </div>

          <h2 className="login-title">Welcome Back, Admin!</h2>
          <p className="login-subtitle">Sign in to manage your bakery store portal</p>

          <div className="section-divider"></div>

          {/* Error Alert */}
          <div id="errorAlert" className={`error-alert ${errorMsg ? 'show' : ''}`}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="adminEmail">Email Address</label>
              <div className="input-wrapper">
                <i className="fa-regular fa-envelope input-icon"></i>
                <input
                  type="email"
                  id="adminEmail"
                  className="form-input"
                  placeholder="admin@sweettech.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adminPassword">Password</label>
              <div className="input-wrapper">
                <i className="fa-solid fa-lock input-icon"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="adminPassword"
                  className="form-input"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                />
                <i
                  className={`fa-regular ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                ></i>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading && <span className="btn-spinner"></span>}
              {loading ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p>&copy; 2026 SweetTech Dashboard System.</p>
            <span>Protected access only.</span>
          </div>

        </div>
      </div>
    </>
  );
}