// src/screens/MenuScreen.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function MenuScreen() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Ambil data produk murni langsung dari Supabase (tabel 'products')
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('category', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Error fetching products dari database:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // PERBAIKAN FILTER: Menyelaraskan teks kebab-case dengan format penulisan database Supabase
  const filteredProducts = filter === 'all' 
    ? products 
    : products.filter(p => {
        if (!p.category) return false;
        // Mengubah "Dessert Box" -> "dessert-box" dan "Panna Cotta" -> "panna-cotta" agar cocok dengan state filter
        const formattedCategory = p.category.toLowerCase().replace(/\s+/g, '-');
        return formattedCategory === filter;
      });

  // CSS asli dari menu.html (Tetap utuh tanpa ada perubahan)
  const styles = `
    :root {
      --brand-color: #704455;
      --primary-text: #2d2426;
      --bg-color: #faf8f6;
      --card-bg: #ffffff;
      --border-color: #ebe4e6;
      --text-muted: #7d6f73;
      --pink-accent: #f8c1d2;
      --pink-button: #f5b7d0;
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
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem;
      width: 100%;
    }

    header {
      padding: 1.5rem 0;
      background-color: #fcfaf8;
      border-bottom: 1px solid var(--border-color);
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
    }

    .nav-links {
      display: flex;
      gap: 2rem;
    }

    .nav-links a {
      text-decoration: none;
      color: var(--primary-text);
      font-weight: 500;
      font-size: 0.95rem;
    }

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
    }

    .menu-header {
      text-align: center;
      margin: 4rem 0 2rem;
    }

    .menu-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.5rem;
    }

    .menu-header p {
      color: var(--text-muted);
      font-size: 1rem;
    }

    .filter-container {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 3rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      background-color: #ffffff;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      padding: 0.6rem 1.5rem;
      border-radius: 50px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
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
    }

    .footer-links {
      display: flex;
      gap: 2rem;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
    }

    @media (max-width: 850px) {
      .footer-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
      .footer-links {
        flex-wrap: wrap;
        justify-content: center;
      }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
          Loading menu...
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <header>
        <div className="container navbar">
          <Link to="/" className="logo">SweetTech</Link>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/menu" className="active">Menu</Link>
            <Link to="/about">About Us</Link>
          </nav>
          <div className="nav-icons">
            <Link to="/cart"><i className="fa-solid fa-shopping-bag"></i></Link>
            <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="menu-header">
          <h1>Our Sweet Masterpieces</h1>
          <p>Dibuat secara higienis menggunakan bahan-bahan premium pilihan untuk menemani hari manismu.</p>
        </div>

        <div className="filter-container">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Sweets
          </button>
          <button 
            className={`filter-btn ${filter === 'panna-cotta' ? 'active' : ''}`}
            onClick={() => setFilter('panna-cotta')}
          >
            Panna Cotta
          </button>
          <button 
            className={`filter-btn ${filter === 'dessert-box' ? 'active' : ''}`}
            onClick={() => setFilter('dessert-box')}
          >
            Dessert Box
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{ padding: '3rem 0', color: 'var(--text-muted)', textAlign: 'center' }}>
            Belum ada menu manis yang tersedia untuk kategori ini.
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
                    {/* PERBAIKAN BADGE: Menggunakan kolom boolean 'is_bestseller' dari database Supabase */}
                    {product.is_bestseller && (
                      <span className="card-badge best-seller">
                        Best Seller
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-content">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="card-footer">
                    {/* Mengamankan nilai price jika terlempar dalam bentuk number atau string dari Supabase */}
                    <span className="card-price">${Number(product.price).toFixed(2)}</span>
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