// src/screens/ProductDetailScreen.jsx
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function ProductDetailScreen() {
  // SINKRONISASI: Ubah 'item' menjadi 'productId' agar sama dengan :productId di App.jsx
  const { productId } = useParams(); 
  
  // State produk
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State interaksi
  const [quantity, setQuantity] = useState(1);
  const [sugar, setSugar] = useState('normal');
  const [customMessage, setCustomMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  
  // Fungsi update cart badge di navbar
  const updateCartBadge = () => {
    const cart = JSON.parse(localStorage.getItem('sweettech_cart')) || [];
    const totalItems = cart.reduce((sum, currentItem) => sum + currentItem.quantity, 0);
    const cartIcon = document.querySelector('.cart-badge-number');
    if (cartIcon) {
      if (totalItems > 0) {
        cartIcon.textContent = totalItems;
        cartIcon.style.display = 'inline-block';
      } else {
        cartIcon.style.display = 'none';
      }
    }
  };

  // Ambil data produk spesifik langsung dari Supabase
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        // Cek parameter productId yang masuk dari URL
        if (!productId) {
          setLoading(false);
          return;
        }

        // Konversi productId string menjadi Integer (int4) sesuai database Supabase kamu
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', parseInt(productId, 10))
          .single();

        if (error) throw error;

        if (data) {
          setProduct({
            id: data.id,
            name: data.name,
            price: data.price,
            description: data.description,
            image: data.image,
            // SINKRONISASI DATABASE: Sesuaikan kolom is_bestseller dari screenshot kamu
            badges: data.is_bestseller ? ['Best Seller'] : []
          });
        }
      } catch (err) {
        console.error('Error fetching detail produk dari database:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
    updateCartBadge();
  }, [productId]); // Jalankan ulang effect jika productId berubah

  // Fungsi add to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    const selectedToppings = [];
    if (document.getElementById('top1')?.checked) selectedToppings.push('Crushed Oreos');
    if (document.getElementById('top2')?.checked) selectedToppings.push('Toasted Almonds');
    if (document.getElementById('top3')?.checked) selectedToppings.push('Cream Cheese Drizzle');
    if (document.getElementById('top4')?.checked) selectedToppings.push('Fresh Berries');
    
    const sugarText = sugar === 'normal' ? 'Normal (50gr)' : 'Less (20gr)';
    
    const orderItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      toppings: selectedToppings,
      sugar: sugarText,
      customMessage: customMessage.trim(),
      quantity: quantity
    };
    
    let cart = JSON.parse(localStorage.getItem('sweettech_cart')) || [];
    const existingIndex = cart.findIndex(cartItem =>
      cartItem.id === orderItem.id &&
      JSON.stringify(cartItem.toppings) === JSON.stringify(orderItem.toppings) &&
      cartItem.sugar === orderItem.sugar &&
      cartItem.customMessage === orderItem.customMessage
    );
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += orderItem.quantity;
    } else {
      cart.push(orderItem);
    }
    
    localStorage.setItem('sweettech_cart', JSON.stringify(cart));
    updateCartBadge();
    alert(`Berhasil memasukkan ${quantity}x ${product.name} ke keranjang!`);
  };
  
  // CSS asli dari detail.html (Tetap utuh tanpa ada perubahan)
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
    .nav-icons {
      display: flex;
      gap: 1.5rem;
      font-size: 1.2rem;
      align-items: center;
    }
    .nav-icons a {
      color: var(--primary-text);
      text-decoration: none;
      position: relative;
    }
    .cart-badge-number {
      background-color: var(--brand-color);
      color: white;
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 50%;
      position: absolute;
      top: -8px;
      right: -12px;
      display: none;
    }
    .product-detail-section {
      margin: 4rem 0 6rem;
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 4rem;
      align-items: start;
    }
    .image-container {
      position: relative;
      width: 100%;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(112,68,85,0.03);
    }
    .product-large-img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }
    .badge-wrapper {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      display: flex;
      gap: 0.5rem;
    }
    .badge {
      padding: 0.4rem 1rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      background-color: #ffffff;
      border: 1px solid var(--border-color);
    }
    .badge.best-seller {
      background-color: #f1a7c4;
      color: #ffffff;
      border: none;
    }
    .details-container h1 {
      font-size: 2.8rem;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.2;
      margin-bottom: 0.5rem;
    }
    .price-tag {
      font-size: 1.6rem;
      font-weight: 600;
      color: var(--brand-color);
      margin-bottom: 1.5rem;
    }
    .description {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.7;
      margin-bottom: 2rem;
    }
    .option-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.75rem;
      color: #1a1a1a;
    }
    .option-section {
      margin-bottom: 2rem;
    }
    .toppings-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .topping-checkbox {
      display: none;
    }
    .topping-label {
      padding: 0.6rem 1.2rem;
      border: 1px solid var(--border-color);
      border-radius: 50px;
      font-size: 0.85rem;
      background-color: #ffffff;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--primary-text);
    }
    .topping-checkbox:checked + .topping-label {
      border-color: var(--brand-color);
      background-color: #fcf6f7;
      color: var(--brand-color);
      font-weight: 500;
    }
    .dropdown-container {
      position: relative;
      width: 100%;
    }
    .dropdown-select {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      background-color: #fffbfb;
      color: var(--primary-text);
      cursor: pointer;
      appearance: none;
      outline: none;
    }
    .dropdown-container::after {
      content: '\\f107';
      font-family: 'Font Awesome 6 Free';
      font-weight: 900;
      position: absolute;
      right: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .message-area {
      width: 100%;
      height: 90px;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      resize: none;
      outline: none;
      background-color: #ffffff;
    }
    .message-counter {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.4rem;
    }
    .action-row {
      display: flex;
      gap: 1.5rem;
      align-items: center;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
    }
    .quantity-counter {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: 50px;
      padding: 0.5rem 1rem;
      background-color: #ffffff;
    }
    .counter-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      color: var(--primary-text);
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .quantity-value {
      font-size: 1rem;
      font-weight: 500;
      width: 40px;
      text-align: center;
    }
    .preorder-btn {
      flex: 1;
      background-color: var(--pink-button);
      color: var(--brand-color);
      border: none;
      padding: 1rem 2rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .notice-info {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
      .product-detail-section { grid-template-columns: 1fr; gap: 2rem; }
      .footer-content { flex-direction: column; gap: 1rem; text-align: center; }
      .footer-links { flex-wrap: wrap; justify-content: center; }
    }
  `;
  
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
          Loading detail produk...
        </div>
      </>
    );
  }

  if (!product) {
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
              <Link to="/cart">
                <i className="fa-solid fa-shopping-bag"></i>
                <span className="cart-badge-number">0</span>
              </Link>
              <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
            </div>
          </div>
        </header>
        <main className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h2>Waduh, produk tidak ditemukan!</h2>
          <p style={{ marginTop: '1rem' }}>Silakan periksa kembali tautan Anda atau kembali ke halaman menu.</p>
          <Link to="/menu" className="view-detail-btn" style={{ display: 'inline-block', marginTop: '1.5rem', textDecoration: 'none' }}>
            Kembali ke Menu
          </Link>
        </main>
      </>
    );
  }
  
  return (
    <>
      <style>{styles}</style>
      <div>
        <header>
          <div className="container navbar">
            <Link to="/" className="logo">SweetTech</Link>
            <nav className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/menu" className="active">Menu</Link>
              <Link to="/about">About Us</Link>
            </nav>
            <div className="nav-icons">
              <Link to="/cart">
                <i className="fa-solid fa-shopping-bag"></i>
                <span className="cart-badge-number" id="cart-badge">0</span>
              </Link>
              <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
            </div>
          </div>
        </header>
        
        <main className="container product-detail-section">
          <div className="image-container">
            <img src={product.image} alt={product.name} className="product-large-img" />
            <div className="badge-wrapper">
              {product.badges && product.badges.map((badge, idx) => (
                <span key={idx} className={`badge ${badge === 'Best Seller' ? 'best-seller' : ''}`}>
                  {badge}
                </span>
              ))}
            </div>
          </div>
          
          <div className="details-container">
            <h1>{product.name}</h1>
            <div className="price-tag">${product.price.toFixed(2)}</div>
            <p className="description">{product.description}</p>
            
            <div className="option-section">
              <div className="option-title">Add Toppings (+$1.50 Each)</div>
              <div className="toppings-grid">
                <input type="checkbox" id="top1" className="topping-checkbox" />
                <label htmlFor="top1" className="topping-label">Crushed Oreos</label>
                <input type="checkbox" id="top2" className="topping-checkbox" />
                <label htmlFor="top2" className="topping-label">Toasted Almonds</label>
                <input type="checkbox" id="top3" className="topping-checkbox" />
                <label htmlFor="top3" className="topping-label">Cream Cheese Drizzle</label>
                <input type="checkbox" id="top4" className="topping-checkbox" />
                <label htmlFor="top4" className="topping-label">Fresh Berries</label>
              </div>
            </div>
            
            <div className="option-section">
              <div className="option-title">Sugary</div>
              <div className="dropdown-container">
                <select className="dropdown-select" value={sugar} onChange={(e) => setSugar(e.target.value)}>
                  <option value="normal">Normal (50gr)</option>
                  <option value="less">Less (20gr)</option>
                </select>
              </div>
            </div>
            
            <div className="option-section">
              <div className="option-title">Custom Message (Optional)</div>
              <textarea 
                className="message-area" 
                maxLength="30" 
                placeholder="E.g., Happy Birthday!" 
                value={customMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                  setCharCount(e.target.value.length);
                }}
              />
              <div className="message-counter">
                <span>Piped in white chocolate</span>
                <span>{charCount}/30</span>
              </div>
            </div>
            
            <div className="action-row">
              <div className="quantity-counter">
                <button className="counter-btn" onClick={() => setQuantity(q => Math.max(1, q-1))}>
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="quantity-value">{quantity}</span>
                <button className="counter-btn" onClick={() => setQuantity(q => q+1)}>
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
              <button className="preorder-btn" onClick={handleAddToCart}>
                <i className="fa-solid fa-basket-shopping"></i> Pre-Order Now
              </button>
            </div>
            
            <div className="notice-info">
              <i className="fa-solid fa-circle-info"></i> Requires 24-hour notice for preparation.
            </div>
          </div>
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
      </div>
    </>
  );
}