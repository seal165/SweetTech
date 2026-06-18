// src/screens/MenuScreen.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import logoImg from '../assets/logo.png'; 

export default function MenuScreen() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // untuk hamburger

  useEffect(() => {
    const initializeMenuData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('category', { ascending: true });
        
        if (productsError) throw productsError;
        if (productsData) setProducts(productsData);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cartData, error: cartError } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id);
          if (!cartError && cartData) {
            const totalItems = cartData.reduce((sum, item) => sum + (item.quantity || 0), 0);
            setCartCount(totalItems);
          }
        }
      } catch (err) {
        console.error('Error initializing menu data:', err);
        setErrorMessage('Gagal memuat data dari database. Pastikan koneksi internet Anda aman.');
      } finally {
        setLoading(false);
      }
    };

    initializeMenuData();
  }, []);

  const categories = products.reduce((acc, current) => {
    if (current.category) {
      const trimmedCategory = current.category.trim();
      if (!acc.includes(trimmedCategory)) acc.push(trimmedCategory);
    }
    return acc;
  }, []);

  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => p.category && p.category.trim() === filter);

  // ================== CSS (header & hamburger sama persis dengan About) ==================
  const styles = `
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    :root {
      --brand-color: #704455;
      --primary-text: #2d2426;
      --bg-color: #faf8f6;
      --card-bg: #ffffff;
      --pink-accent: #f8c1d2;
      --pink-button: #f5b7d0;
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
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      width: 100%;
    }

    /* --- HEADER (sama persis dengan About) --- */
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
      position: relative;
    }

    .logo-container {
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-image {
      height: 32px;
      width: auto;
      object-fit: contain;
    }

    .logo-text {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--brand-color);
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--primary-text);
      font-weight: 500;
      font-size: 0.95rem;
      transition: color 0.2s;
    }

    .nav-links a:hover,
    .nav-links a.active {
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
      transition: color 0.2s;
      position: relative;
    }

    .nav-icons a:hover {
      color: var(--brand-color);
    }

    .cart-badge-menu {
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
    }

    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 5px;
    }

    .hamburger span {
      display: block;
      width: 25px;
      height: 3px;
      background-color: var(--primary-text);
      border-radius: 3px;
      transition: all 0.25s ease;
    }

    .hamburger.open span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 6px);
    }
    .hamburger.open span:nth-child(2) {
      opacity: 0;
    }
    .hamburger.open span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -6px);
    }

    .mobile-menu {
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem 0;
      background-color: #fcfaf8;
      border-bottom: 1px solid var(--border-color);
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      z-index: 99;
      box-shadow: 0 8px 20px rgba(0,0,0,0.02);
    }

    .mobile-menu.open {
      display: flex;
    }

    .mobile-menu a {
      text-decoration: none;
      color: var(--primary-text);
      font-weight: 500;
      font-size: 1.1rem;
      transition: color 0.2s;
    }

    .mobile-menu a:hover,
    .mobile-menu a.active {
      color: var(--brand-color);
      font-weight: 600;
    }

    /* --- Menu Content (tetap) --- */
    .menu-header-text {
      text-align: center;
      margin: 5rem 0 2rem;
    }

    .menu-header-text h1 {
      font-size: 2.6rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.6rem;
    }

    .menu-header-text p {
      color: var(--text-muted);
      font-size: 1.05rem;
    }

    .error-box {
      background-color: #f8d7da;
      color: #721c24;
      padding: 1rem;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 3rem;
      border: 1px solid #f5c6cb;
    }

    .filter-container {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 3.5rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      background-color: #ffffff;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      padding: 0.6rem 1.6rem;
      border-radius: 50px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-transform: capitalize;
    }

    .filter-btn:hover {
      border-color: var(--brand-color);
      color: var(--brand-color);
    }

    .filter-btn.active {
      background-color: var(--brand-color);
      color: #ffffff;
      border-color: var(--brand-color);
      box-shadow: 0 4px 12px rgba(112, 68, 85, 0.15);
    }

    .menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2.5rem;
      margin-bottom: 6rem;
    }

    .menu-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 6px 16px rgba(112, 68, 85, 0.02);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .menu-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(112, 68, 85, 0.06);
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      padding-top: 80%;
      overflow: hidden;
      background-color: #f0f0f0;
    }

    .menu-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .menu-card:hover .menu-img {
      transform: scale(1.05);
    }

    .card-badges {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      gap: 0.4rem;
    }

    .card-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 50px;
      font-size: 0.7rem;
      font-weight: 500;
      background-color: rgba(255, 255, 255, 0.95);
      color: var(--text-muted);
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    }

    .card-badge.best-seller {
      background-color: #f1a7c4;
      color: white;
    }

    .card-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .card-content h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }

    .card-content p {
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-price {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--brand-color);
    }

    .view-detail-btn {
      background-color: #fcf6f7;
      color: var(--brand-color);
      border: 1px solid var(--border-color);
      padding: 0.5rem 1.2rem;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .menu-card:hover .view-detail-btn {
      background-color: var(--pink-button);
      border-color: var(--pink-button);
    }

    footer {
      background-color: #fcfaf8;
      padding: 2.5rem 0;
      border-top: 1px solid var(--border-color);
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-top: auto;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .footer-links {
      display: flex;
      gap: 2rem;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
    }

    /* --- RESPONSIVE (sama dengan About) --- */
    @media (max-width: 850px) {
      .nav-links {
        display: none;
      }
      .hamburger {
        display: flex;
      }
      .mobile-menu {
        display: none;
      }
      .mobile-menu.open {
        display: flex;
      }
    }

    @media (max-width: 576px) {
      .container { padding: 0 1rem; }
      .menu-header-text h1 { font-size: 2rem; }
      .filter-container { gap: 0.5rem; }
      .filter-btn { padding: 0.4rem 1.2rem; font-size: 0.8rem; }
      .menu-grid { grid-template-columns: 1fr; }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="container" style={{ padding: '8rem 0', textAlign: 'center', color: 'var(--brand-color)' }}>
          Mencoba terhubung dengan database Supabase...
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      
      {/* HEADER (sama persis dengan About) */}
      <header>
        <div className="container navbar">
          <Link to="/" className="logo-container">
            <img src={logoImg} alt="SweetTech Logo" className="logo-image" />
            <span className="logo-text">SweetTech</span>
          </Link>
          
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/menu" className="active">Menu</Link>
            <Link to="/about">About Us</Link>
          </nav>
          
          <div className="nav-icons">
            <Link to="/cart">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && <span className="cart-badge-menu">{cartCount}</span>}
            </Link>
            <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
            <button 
              className={`hamburger ${isMenuOpen ? 'open' : ''}`} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/menu" className="active" onClick={() => setIsMenuOpen(false)}>Menu</Link>
          <Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link>
        </div>
      </header>

      <main className="container">
        <div className="menu-header-text">
          <h1>Our Sweet Masterpieces</h1>
          <p>Dibuat secara higienis menggunakan bahan-bahan premium pilihan untuk menemani hari manismu.</p>
        </div>

        {errorMessage && (
          <div className="error-box">
            <i className="fa-solid fa-circle-exclamation"></i> {errorMessage}
          </div>
        )}

        <div className="filter-container">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`} 
            onClick={() => setFilter('all')}
          >
            All Sweets
          </button>

          {categories.map((catName) => (
            <button
              key={catName}
              className={`filter-btn ${filter === catName ? 'active' : ''}`}
              onClick={() => setFilter(catName)}
            >
              {catName}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 && !errorMessage ? (
          <div style={{ padding: '5rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
            Tidak ada produk untuk kategori ini.
          </div>
        ) : (
          <div className="menu-grid">
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                className="menu-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="image-wrapper">
                  <img src={product.image} alt={product.name} className="menu-img" />
                  <div className="card-badges">
                    {product.is_bestseller && (
                      <span className="card-badge best-seller">Best Seller</span>
                    )}
                  </div>
                </div>
                <div className="card-content">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="card-footer">
                    <span className="card-price">
                      Rp {Number(product.price).toLocaleString('id-ID')}
                    </span>
                    <span className="view-detail-btn">Lihat Detail</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer>
        <div className="container footer-content">
          <strong style={{ color: 'var(--brand-color)', fontSize: '1.1rem' }}>SweetTech</strong>
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="#">Contact</Link>
            <Link to="#">FAQs</Link>
            <Link to="#">Privacy Policy</Link>
          </div>
          <span>© 2026 SweetTech. All rights reserved.</span>
        </div>
      </footer>
    </>
  );
}