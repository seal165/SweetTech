// src/screens/HomeScreen.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
// Silakan sesuaikan path import ini dengan lokasi file logo SweetTech kamu
import logoImg from '../assets/logo.png'; 

export default function HomeScreen() {
  const [userName, setUserName] = useState('Selamat Datang');
  const [loading, setLoading] = useState(true);
  // State untuk menyimpan total item keranjang dari tabel cart_items
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const initializeHomeData = async () => {
      try {
        setLoading(true);
        
        // 1. Ambil data user yang sedang login
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;

        if (user) {
          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna Manis';
          setUserName(`Halo, ${fullName}! ✨`);

          // 2. AMBIL DATA KERANJANG DARI TABEL cart_items
          // Menghitung total quantity dari semua item keranjang milik user yang sedang login
          const { data: cartData, error: cartError } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id);

          if (cartError) {
            console.error('Error fetching cart items from database:', cartError);
          } else if (cartData) {
            const totalItems = cartData.reduce((sum, item) => sum + (item.quantity || 0), 0);
            setCartCount(totalItems);
          }

        } else {
          setUserName('Halo, Selamat Datang di SweetTech! ✨');
          setCartCount(0); // Jika belum login, pastikan badge bernilai 0
        }
      } catch (error) {
        console.error('Unexpected error during initialization:', error);
        setUserName('Halo, Selamat Datang di SweetTech! ✨');
      } finally {
        setLoading(false);
      }
    };

    initializeHomeData();
  }, []);

  const styles = `
    /* SOLUSI ICON: Mengimport Font Awesome langsung ke dalam komponen */
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

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

    /* MENYESUAIKAN JARAK KANAN KIRI KONTEN */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 3rem; /* Dinaikkan dari 2rem agar lebih lega di kanan-kiri */
      width: 100%;
    }

    /* PEMBARUAN HEADER: Meniru gaya rapi di mock-up asli */
    header {
      padding: 1.2rem 0;
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

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }

    .logo-image {
      height: 42px;
      width: 42px;
      object-fit: contain;
      border-radius: 8px;
    }

    .logo-text {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--brand-color);
    }

    .nav-links {
      display: flex;
      gap: 2.5rem;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--primary-text);
      font-weight: 500;
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }

    .nav-links a:hover, .nav-links a.active {
      color: var(--brand-color);
      font-weight: 600;
    }

    .nav-icons {
      display: flex;
      gap: 1.5rem;
      font-size: 1.2rem;
      align-items: center;
    }

    .nav-icons a {
      color: var(--primary-text);
      text-decoration: none;
      transition: color 0.3s;
      position: relative; /* Agar posisi badge angka bisa pas melayang diatasnya */
    }

    .nav-icons a:hover {
      color: var(--brand-color);
    }

    /* Styling Badge Angka Keranjang yang Melayang Indah */
    .cart-badge-home {
      position: absolute;
      top: -6px;
      right: -10px;
      background-color: var(--brand-color);
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 5px rgba(112, 68, 85, 0.3);
      font-family: 'Poppins', sans-serif;
    }

    /* MENYESUAIKAN RUANG HERO */
    .hero {
      flex: 1;
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      align-items: center;
      position: relative;
      gap: 4rem;
      padding-top: 8rem;
      padding-bottom: 8rem;
      padding-left: 3rem;
      padding-right: 3rem;
    }

    .hero-bg-radial {
      position: absolute;
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, rgba(248,193,210,0.25) 0%, rgba(250,248,246,0) 70%);
      top: 50%;
      right: -100px;
      transform: translateY(-50%);
      z-index: -2;
      pointer-events: none;
    }

    .hero-content {
      opacity: 0;
      transform: translateY(20px);
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fadeInUp {
      to { opacity: 1; transform: translateY(0); }
    }

    .welcome-badge {
      display: inline-block;
      background-color: #f5eaed;
      color: var(--brand-color);
      padding: 0.4rem 1.2rem;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      letter-spacing: 0.3px;
    }

    .hero h1 {
      font-size: 3.2rem;
      font-weight: 700;
      line-height: 1.2;
      color: #1a1a1a;
      margin-bottom: 1.5rem;
      letter-spacing: -0.5px;
    }

    .hero h1 span {
      color: var(--brand-color);
    }

    .hero p {
      font-size: 1.05rem;
      color: var(--text-muted);
      margin-bottom: 2.5rem;
      line-height: 1.6;
      max-width: 540px;
    }

    .btn-order {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      background-color: var(--pink-accent);
      color: var(--brand-color);
      text-decoration: none;
      padding: 1rem 2.5rem;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.05rem;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 8px 25px rgba(248, 193, 210, 0.3);
    }

    .btn-order:hover {
      background-color: var(--pink-hover);
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(241, 159, 181, 0.45);
    }

    .hero-image-side {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      position: relative;
      opacity: 0;
      animation: fadeIn 1s ease forwards 0.3s;
    }

    @keyframes fadeIn {
      to { opacity: 1; }
    }

    .aesthetic-circle-wrapper {
      position: relative;
      width: 440px;
      height: 440px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fcebee 0%, #f3d1dc 100%);
      box-shadow: 0 25px 50px rgba(112, 68, 85, 0.08);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: floatGraphic 6s ease-in-out infinite;
    }

    .aesthetic-circle-wrapper img {
      width: 105%;
      height: 105%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .aesthetic-circle-wrapper:hover img {
      transform: scale(1.05);
    }

    .deco-dot {
      position: absolute;
      border-radius: 50%;
      background-color: var(--pink-accent);
      opacity: 0.5;
      z-index: -1;
    }
    .dot-1 { width: 50px; height: 50px; top: 5%; left: 15%; background-color: #fbe8ee; animation: floatGraphic 8s ease-in-out infinite alternate; }
    .dot-2 { width: 25px; height: 25px; bottom: 10%; right: 0%; animation: floatGraphic 5s ease-in-out infinite alternate-reverse; }

    @keyframes floatGraphic {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(2deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }

    footer {
      background-color: #f4efed;
      padding: 1.5rem 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-color);
      margin-top: auto;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 992px) {
      .container { padding: 0 2rem; }
      .hero { grid-template-columns: 1fr; text-align: center; padding: 4rem 0; gap: 3rem; }
      .nav-links { display: none; }
      .hero h1 { font-size: 2.6rem; }
      .hero p { margin: 0 auto 2rem; }
      .hero-image-side { justify-content: center; order: -1; }
      .aesthetic-circle-wrapper { width: 340px; height: 340px; }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="container" style={{ padding: '8rem 0', textAlign: 'center', color: 'var(--brand-color)' }}>
          Memuat halaman...
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      
      <header>
        <div className="container navbar">
          {/* Logo dengan File Gambar SweetTech */}
          <Link to="/" className="logo-container">
            <img src={logoImg} alt="SweetTech Logo" className="logo-image" />
            <span className="logo-text">SweetTech</span>
          </Link>
          
          <nav className="nav-links">
            <Link to="/" className="active">Home</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/about">About Us</Link>
          </nav>
          
          <div className="nav-icons">
            <Link to="/cart">
              <i className="fa-solid fa-cart-shopping"></i>
              {/* Badge dinamis mengambil total kuantitas dari tabel cart_items */}
              {cartCount > 0 && <span className="cart-badge-home">{cartCount}</span>}
            </Link>
            <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
          </div>
        </div>
      </header>

      <main className="container hero">
        <div className="hero-bg-radial"></div>
        
        <div className="hero-content">
          <div className="welcome-badge">{userName}</div>
          <h1>Nikmati Kelezatan Hidangan <span>Manis Terbaik</span></h1>
          <p>Dibuat dengan bahan-bahan premium pilihan dan sentuhan kasih sayang penuh kehangatan, menghadirkan kebahagiaan sejati di setiap gigitan panna cotta dan dessert box favorit Anda.</p>
          <Link to="/menu" className="btn-order">
            Order Now <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <div className="hero-image-side">
          <div className="deco-dot dot-1"></div>
          <div className="deco-dot dot-2"></div>
          <div className="aesthetic-circle-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=600&q=80" 
              alt="Sweet Dessert Box" 
            />
          </div>
        </div>
      </main>

      <footer>
        <div className="container footer-content">
          <span>© 2026 SweetTech. All rights reserved.</span>
          <span>Made with ❤️ for sweet lovers</span>
        </div>
      </footer>
    </>
  );
}