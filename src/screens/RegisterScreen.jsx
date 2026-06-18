// src/screens/RegisterScreen.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import logoImg from '../assets/logo.png'; 

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok!');
      return;
    }
    
    if (password.length < 6) {
      setError('Password harus memiliki minimal 6 karakter!');
      return;
    }
    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username, 
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      alert('Pendaftaran berhasil! Silakan login.');
      navigate('/login');
    }
  };

  const styles = `
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    :root {
      --primary-text: #1a1a1a;
      --brand-color: #845366;
      --bg-color: #fcf9fa;
      --card-bg: #ffffff;
      --btn-bg: #fac0d2;
      --btn-text: #704455;
      --text-muted: #666666;
      --border-color: #e6e0e2;
      --error-color: #e74c3c;
      --success-color: #27ae60;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Poppins', sans-serif;
    }

    .register-container {
      background-color: var(--bg-color);
      background-image: 
        radial-gradient(circle at 5% 15%, #fdf2f6 0%, transparent 15%),
        radial-gradient(circle at 90% 70%, #faeef3 0%, transparent 20%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .register-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .register-header {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--brand-color);
      margin-bottom: 3rem;
    }

    .header-logo-img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .header-logo {
      font-weight: 700;
    }

    /* Main Layout */
    .register-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4rem;
      flex: 1;
    }

    /* Left Section */
    .register-left {
      flex: 1;
      max-width: 550px;
    }

    .register-left h1 {
      font-size: 3.2rem;
      font-weight: 700;
      line-height: 1.2;
      color: var(--primary-text);
      margin-bottom: 1.5rem;
    }

    .register-left h1 .highlight {
      color: var(--brand-color);
    }

    .register-left p {
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 2.5rem;
      font-size: 1.05rem;
      max-width: 90%;
    }

    .feature-cards {
      display: flex;
      gap: 1.5rem;
    }

    .feature-card {
      background-color: #f6f1f2;
      padding: 1.5rem;
      border-radius: 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      border: 1px solid #f0e9ec;
    }

    .feature-card i {
      font-size: 1.5rem;
      color: var(--brand-color);
    }

    .feature-card span {
      font-weight: 500;
      color: var(--primary-text);
      font-size: 0.95rem;
    }

    /* Right Section - Form */
    .register-right {
      flex: 1;
      max-width: 450px;
      width: 100%;
    }

    .form-card {
      background-color: var(--card-bg);
      padding: 3rem 2.5rem;
      border-radius: 16px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.03);
    }

    .form-card h2 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--primary-text);
    }

    .form-card > p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.2rem;
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      width: 100%;
    }

    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 0.85rem;
      color: #444;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .input-wrapper {
      position: relative;
      width: 100%;
    }

    .input-wrapper i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #a09398;
      font-size: 0.9rem;
      z-index: 2;
    }

    /* Penyeragaman struktur kolom input */
    .input-wrapper input {
      width: 100%;
      height: 46px;
      padding: 0 1rem 0 2.5rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 0.9rem;
      color: var(--primary-text);
      outline: none;
      transition: all 0.3s ease;
      background-color: #ffffff;
    }

    .input-wrapper input:focus {
      border-color: var(--btn-bg);
      box-shadow: 0 0 0 3px rgba(250, 192, 210, 0.2);
    }

    .input-wrapper input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .btn-submit {
      width: 100%;
      height: 48px;
      padding: 0 1rem;
      background-color: var(--btn-bg);
      color: var(--btn-text);
      border: none;
      border-radius: 30px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.3s;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: #f5a8bf;
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .form-footer a.login-link {
      color: var(--brand-color);
      font-weight: 700;
      text-decoration: none;
    }

    .help-links {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1.5rem;
      font-size: 0.8rem;
    }

    .help-links a {
      color: #999;
      text-decoration: none;
    }

    /* Alert */
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }

    .alert-error {
      background-color: #fee2e2;
      color: var(--error-color);
      border: 1px solid #fecaca;
    }

    /* Footer */
    .register-footer {
      background-color: #f5f1f2;
      padding: 2rem 4rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-top: 4rem;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .footer-logo {
      font-weight: 700;
      font-size: 1.2rem;
      color: #bfaab1;
    }

    .footer-right {
      display: flex;
      gap: 2rem;
      font-weight: 600;
      color: #555;
    }

    /* Responsive untuk Tablet dan Laptop Kecil */
    @media (max-width: 992px) {
      .register-main {
        flex-direction: column;
        gap: 3rem;
      }
      
      .register-left {
        text-align: center;
        max-width: 100%;
      }
      
      .register-left p {
        margin: 0 auto 2.5rem;
      }
      
      .feature-cards {
        justify-content: center;
      }
      
      .register-right {
        max-width: 500px;
        margin: 0 auto;
      }
      
      .register-footer {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        padding: 2rem;
      }
    }

    /* Responsive untuk HP / Layar Kecil */
    @media (max-width: 576px) {
      .register-wrapper {
        padding: 1.5rem 1rem;
      }

      .register-header {
        margin-bottom: 2rem;
      }

      .register-left h1 {
        font-size: 2.2rem;
      }
      
      .form-card {
        padding: 2rem 1.5rem;
      }
      
      /* Penyeragaman form row saat di HP agar berjarak rapi secara vertikal */
      .form-row {
        flex-direction: column;
        gap: 1.2rem; 
      }

      .form-row .form-group {
        flex: none;
      }
      
      .register-footer {
        padding: 1.5rem;
        margin-top: 2.5rem;
      }
      
      .footer-right {
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="register-container">
        <div className="register-wrapper">
          
          {/* HEADER LOGO KIRI ATAS */}
          <header className="register-header">
            <img src={logoImg} alt="SweetTech Logo" className="header-logo-img" />
            <span className="header-logo">SweetTech</span>
          </header>

          <main className="register-main">
            
            {/* BAGIAN KIRI: TEKS BESAR & FITUR */}
            <div className="register-left">
              <h1>
                Bergabunglah<br />dengan <span className="highlight">Kenyamanan<br />Digital</span> Kami.
              </h1>
              <p>Dapatkan akses eksklusif ke koleksi dessert premium kami dan nikmati kemudahan pre-order hanya dalam beberapa sentuhan.</p>
              
              <div className="feature-cards">
                <div className="feature-card">
                  <i className="fa-solid fa-hand-holding-heart"></i>
                  <span>Digital Comfort</span>
                </div>
                <div className="feature-card">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Sugar Modernism</span>
                </div>
              </div>
            </div>

            {/* BAGIAN KANAN: FORM CARD */}
            <div className="register-right">
              <div className="form-card">
                <h2>Daftar Sekarang</h2>
                <p>Mulai perjalanan manismu bersama SweetTech.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label htmlFor="username">Nama Lengkap</label>
                    <div className="input-wrapper">
                      <i className="fa-regular fa-user"></i>
                      <input
                        type="text"
                        id="username"
                        placeholder="Masukkan nama lengkap"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-wrapper">
                      <i className="fa-regular fa-envelope"></i>
                      <input
                        type="email"
                        id="email"
                        placeholder="contoh@univ.ac.id"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* FORM ROW: UNTUK PASSWORD & KONFIRMASI BERSEBELAHAN DI LAPTOP, MENUMPUK RAPI DI HP */}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <div className="input-wrapper">
                        <i className="fa-solid fa-lock"></i>
                        <input
                          type="password"
                          id="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Konfirmasi</label>
                      <div className="input-wrapper">
                        <i className="fa-solid fa-key"></i>
                        <input
                          type="password"
                          id="confirmPassword"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Memproses...' : <>Daftar <i className="fa-solid fa-arrow-right"></i></>}
                  </button>
                </form>

                <div className="form-footer">
                  Sudah punya akun? <Link to="/login" className="login-link">Masuk</Link>
                  <div className="help-links">
                    <Link to="#">Bantuan</Link>
                    <Link to="#">Syarat & Ketentuan</Link>
                  </div>
                </div>
              </div>
            </div>

          </main>
        </div>

        {/* FOOTER PALING BAWAH */}
        <footer className="register-footer">
          <div className="footer-left">
            <span className="footer-logo">SweetTech</span>
            <span>© 2026 Crafted with digital comfort.</span>
          </div>
          <div className="footer-right">
            <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="#" style={{ color: 'inherit', textDecoration: 'none' }}>Sustainability</Link>
          </div>
        </footer>
      </div>
    </>
  );
}