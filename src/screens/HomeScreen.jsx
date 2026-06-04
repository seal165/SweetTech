// src/screens/HomeScreen.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function HomeScreen() {
  const [userName, setUserName] = useState('Selamat Datang');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        const user = data?.user;
        if (error) {
          console.error('Error fetching user:', error);
        }
        if (user) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna Manis';
          setUserName(`Halo, ${fullName}! ✨`);
        } else {
          setUserName('Halo, Selamat Datang!');
        }
      } catch (error) {
        console.error('Unexpected error fetching user:', error);
        setUserName('Halo, Selamat Datang!');
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  // CSS asli dari home.html (Tetap utuh tanpa ada perubahan)
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
      color: var(--primary-text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem;
      width: 100%;
    }

    header {
      padding: 1.5rem 0;
      background-color: #fcfaf8;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--brand-color);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .logo i { color: #ea6c75; }

    .nav-links {
      display: flex;
      gap: 2.5rem;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--primary-text);
      font-weight: 500;
      font-size: 0.95rem;
      transition: color 0.3s;
    }

    .nav-links a:hover, .nav-links a.active {
      color: var(--brand-color);
      font-weight: 600;
    }

    .nav-icons {
      display: flex;
      gap: 1.5rem;
      font-size: 1.2rem;
    }

    .nav-icons a {
      color: var(--primary-text);
      text-decoration: none;
      transition: color 0.3s;
    }

    .nav-icons a:hover {
      color: var(--brand-color);
    }

    .hero {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 5rem 0;
      position: relative;
    }

    .hero-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      background-color: #fbe8ee;
      filter: blur(100px);
      border-radius: 50%;
      top: 50%;
      right: -10%;
      transform: translateY(-50%);
      z-index: -1;
      animation: pulseGlow 8s ease-in-out infinite alternate;
    }

    @keyframes pulseGlow {
      0% { opacity: 0.6; transform: translateY(-50%) scale(1); }
      100% { opacity: 0.9; transform: translateY(-45%) scale(1.15); }
    }

    .hero-content {
      max-width: 600px;
      opacity: 0;
      transform: translateX(-30px);
      animation: fadeInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeInLeft {
      to { opacity: 1; transform: translateX(0); }
    }

    .welcome-badge {
      display: inline-block;
      background-color: #f7ebee;
      color: var(--brand-color);
      padding: 0.4rem 1.2rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 700;
      line-height: 1.2;
      color: #1a1a1a;
      margin-bottom: 1.5rem;
    }

    .hero h1 span {
      color: var(--brand-color);
    }

    .hero p {
      font-size: 1.05rem;
      color: var(--text-muted);
      margin-bottom: 2.5rem;
      line-height: 1.6;
    }

    .btn-order {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      background-color: var(--pink-accent);
      color: var(--brand-color);
      text-decoration: none;
      padding: 1rem 2.5rem;
      border-radius: 30px;
      font-weight: 600;
      font-size: 1.05rem;
      box-shadow: 0 8px 25px rgba(248, 193, 210, 0.4);
      transition: all 0.3s;
    }

    .btn-order:hover {
      background-color: var(--pink-hover);
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(241, 159, 181, 0.5);
    }

    footer {
      background-color: #f4efed;
      padding: 2rem 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-color);
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .hero h1 { font-size: 2.3rem; }
      .hero { padding: 3rem 0; text-align: center; }
      .welcome-badge { margin: 0 auto 1.5rem; }
      .hero-glow { right: 50%; transform: translate(50%, -50%); width: 300px; height: 300px; }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
          Memuat halaman...
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      {/* Fragment murni digunakan di sini untuk membiarkan susunan 
          header, main, dan footer mengalir langsung sesuai skema CSS body */}
      <header>
        <div className="container navbar">
          <Link to="/" className="logo">
            <i className="fa-solid fa-cake-candles"></i> SweetTech
          </Link>
          <nav className="nav-links">
            <Link to="/" className="active">Home</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/about">About Us</Link>
          </nav>
          <div className="nav-icons">
            <Link to="/cart"><i className="fa-solid fa-cart-shopping"></i></Link>
            <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
          </div>
        </div>
      </header>

      <main className="container hero">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="welcome-badge">{userName}</div>
          <h1>Nikmati Kelezatan Hidangan <span>Manis Terbaik</span></h1>
          <p>Dibuat dengan bahan-bahan premium pilihan dan sentuhan kasih sayang penuh kehangatan, menghadirkan kebahagiaan sejati di setiap gigitan panna cotta dan dessert box favorit Anda.</p>
          <Link to="/menu" className="btn-order">
            Order Now <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </main>

      <footer>
        <div className="container footer-content">
          <span>© 2024 SweetTech. All rights reserved.</span>
          <span>Made with ❤️ for sweet lovers</span>
        </div>
      </footer>
    </>
  );
}