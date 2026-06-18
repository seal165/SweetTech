// src/screens/ProductDetailScreen.jsx
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import logoImg from '../assets/logo.png'; 

export default function ProductDetailScreen() {
  const { productId } = useParams(); 
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [quantity, setQuantity] = useState(1);
  const [sugar, setSugar] = useState('normal');
  const [customMessage, setCustomMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  
  const [toppings, setToppings] = useState({
    top1: false,
    top2: false,
    top3: false,
    top4: false
  });
  
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchCartCount = async () => {
    try {
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
      console.error('Error fetching cart count:', err);
    }
  };

  useEffect(() => {
    const loadProductAndCart = async () => {
      setLoading(true);
      try {
        if (!productId) return;
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
            badges: data.is_bestseller ? ['Best Seller'] : []
          });
        }
        await fetchCartCount();
      } catch (err) {
        console.error('Error fetching detail produk:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    loadProductAndCart();
  }, [productId]);

  const handleToppingChange = (e) => {
    const { id, checked } = e.target;
    setToppings(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert('Silakan login terlebih dahulu untuk menambahkan item ke keranjang.');
        return;
      }

      const selectedToppings = [];
      if (toppings.top1) selectedToppings.push('Crushed Oreos');
      if (toppings.top2) selectedToppings.push('Toasted Almonds');
      if (toppings.top3) selectedToppings.push('Cream Cheese Drizzle');
      if (toppings.top4) selectedToppings.push('Fresh Berries');
      
      const sugarText = sugar === 'normal' ? 'Normal (50gr)' : 'Less (20gr)';
      const messageText = customMessage.trim() || null;

      const { data: cartList, error: fetchCartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);
      if (fetchCartError) throw fetchCartError;

      const exactMatch = cartList?.find(item => {
        const isSameProduct = Number(item.product_id) === Number(product.id);
        const isSameSugar = item.sugary_level === sugarText;
        const isSameMessage = item.custom_message === messageText;
        const currentToppingsStr = JSON.stringify(selectedToppings);
        const dbToppingsStr = typeof item.toppings === 'string' 
          ? item.toppings 
          : JSON.stringify(item.toppings || []);
        return isSameProduct && isSameSugar && isSameMessage && (currentToppingsStr === dbToppingsStr);
      });

      if (exactMatch) {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: exactMatch.quantity + quantity })
          .eq('id', exactMatch.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert([{
            user_id: user.id,
            product_id: parseInt(product.id, 10),
            product_name: product.name,
            product_price: parseFloat(product.price),
            quantity: quantity,
            sugary_level: sugarText,
            toppings: selectedToppings, 
            custom_message: messageText
          }]);
        if (insertError) throw insertError;
      }

      await fetchCartCount();
      alert(`Berhasil memasukkan ${quantity}x ${product.name} ke keranjang!`);
    } catch (err) {
      console.error('Error detail:', err);
      alert(`Gagal memasukkan item: ${err.message || 'Terjadi kesalahan pada database.'}`);
    }
  };
  
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

    /* --- HEADER (sama dengan About & Menu) --- */
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

    .cart-badge-detail {
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

    /* --- Product Detail Content --- */
    .product-detail-section {
      margin: 4rem auto 6rem;
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
      box-shadow: 0 8px 25px rgba(112, 68, 85, 0.03);
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
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    /* --- RESPONSIVE --- */
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
      .product-detail-section {
        grid-template-columns: 1fr;
        gap: 2.5rem;
        margin: 2rem auto 4rem;
      }
      .container {
        padding: 0 1.5rem;
      }
    }

    @media (max-width: 576px) {
      .container { padding: 0 1rem; }
      .details-container h1 { font-size: 2rem; }
      .action-row { flex-direction: column; }
      .quantity-counter { width: 100%; justify-content: center; }
      .preorder-btn { width: 100%; }
    }
  `;
  
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="container" style={{ padding: '8rem 0', textAlign: 'center', color: 'var(--brand-color)' }}>
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
                {cartCount > 0 && <span className="cart-badge-detail">{cartCount}</span>}
              </Link>
              <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
              <button 
                className={`hamburger ${isMenuOpen ? 'open' : ''}`} 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
          <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/menu" className="active" onClick={() => setIsMenuOpen(false)}>Menu</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link>
          </div>
        </header>
        <main className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <h2>Product Not Found</h2>
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
                {cartCount > 0 && <span className="cart-badge-detail">{cartCount}</span>}
              </Link>
              <Link to="/profile"><i className="fa-regular fa-user"></i></Link>
              <button 
                className={`hamburger ${isMenuOpen ? 'open' : ''}`} 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
          <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/menu" className="active" onClick={() => setIsMenuOpen(false)}>Menu</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link>
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
            <div className="price-tag">
              Rp {Number(product.price).toLocaleString('id-ID')}
            </div>
            <p className="description">{product.description}</p>
            
            <div className="option-section">
              <div className="option-title">Add Toppings (+Rp 5.000 Each)</div>
              <div className="toppings-grid">
                <input 
                  type="checkbox" 
                  id="top1" 
                  className="topping-checkbox" 
                  checked={toppings.top1} 
                  onChange={handleToppingChange} 
                />
                <label htmlFor="top1" className="topping-label">Crushed Oreos</label>
                
                <input 
                  type="checkbox" 
                  id="top2" 
                  className="topping-checkbox" 
                  checked={toppings.top2} 
                  onChange={handleToppingChange} 
                />
                <label htmlFor="top2" className="topping-label">Toasted Almonds</label>
                
                <input 
                  type="checkbox" 
                  id="top3" 
                  className="topping-checkbox" 
                  checked={toppings.top3} 
                  onChange={handleToppingChange} 
                />
                <label htmlFor="top3" className="topping-label">Cream Cheese Drizzle</label>
                
                <input 
                  type="checkbox" 
                  id="top4" 
                  className="topping-checkbox" 
                  checked={toppings.top4} 
                  onChange={handleToppingChange} 
                />
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
            <span style={{ color: 'var(--brand-color)', fontWeight: '700', fontSize: '1.2rem' }}>
              SweetTech
            </span>
            <span>© 2026 SweetTech. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </>
  );
}