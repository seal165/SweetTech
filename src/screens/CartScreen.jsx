// src/screens/CartScreen.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import logoImg from '../assets/logo.png';

export default function CartScreen() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const PRICE_PER_TOPPING = 2000;

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // ─── 1. Ambil semua item keranjang ───
        const { data: cartData, error: cartError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (cartError) throw cartError;

        if (cartData && cartData.length > 0) {
          // ─── 2. Ambil semua product_id unik ───
          const productIds = cartData
            .map(item => item.product_id)
            .filter(id => id != null);

          let imageMap = {};
          if (productIds.length > 0) {
            // ─── 3. Query tabel products untuk ambil gambar ───
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select('id, image')
              .in('id', productIds);

            if (productsError) throw productsError;

            // ─── 4. Buat map id → image ───
            productsData.forEach(p => {
              imageMap[p.id] = p.image;
            });
          }

          // ─── 5. Gabungkan gambar ke cart items ───
          const mergedData = cartData.map(item => ({
            ...item,
            products: { image: imageMap[item.product_id] || null }
          }));

          setCartItems(mergedData);
          const totalItems = mergedData.reduce((sum, item) => sum + (item.quantity || 0), 0);
          setCartCount(totalItems);
        } else {
          setCartItems([]);
          setCartCount(0);
        }
      } catch (err) {
        console.error('Error fetching cart items:', err);
        // Biarkan cartItems kosong agar tidak error
        setCartItems([]);
        setCartCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, []);

  // ─── Fungsi hitung harga satuan ───
  const calculateSingleItemPrice = (item) => {
    const toppingCount = item.toppings ? item.toppings.length : 0;
    const toppingSubtotal = toppingCount * PRICE_PER_TOPPING;
    return item.product_price + toppingSubtotal;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const singlePrice = calculateSingleItemPrice(item);
      return sum + (singlePrice * item.quantity);
    }, 0);
  };

  // ─── Update & delete (tetap) ───
  const updateQuantity = async (id, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', id);
      if (error) throw error;
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === id ? { ...item, quantity: newQty } : item
        )
      );
      setCartCount(prevCount => prevCount + delta);
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('Gagal mengubah kuantitas barang.');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Apakah kamu yakin ingin menghapus item ini dari keranjang?')) return;
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      const targetItem = cartItems.find(item => item.id === id);
      const minusQty = targetItem ? targetItem.quantity : 0;
      setCartItems(prevItems => prevItems.filter(item => item.id !== id));
      setCartCount(prevCount => prevCount - minusQty);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Gagal menghapus item.');
    }
  };

  // ======================== CSS ========================
  const styles = `
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    :root {
      --brand-color: #704455;
      --primary-text: #2d2426;
      --bg-color: #faf8f6;
      --card-bg: #ffffff;
      --border-color: #ebe4e6;
      --text-muted: #7d6f73;
      --pink-accent: #f8c1d2;
      --pink-button: #f5b7d0;
      --danger-color: #e05d5d;
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
      padding: 1rem 0;
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
      display: flex;
      align-items: center;
      gap: 0.8rem;
      text-decoration: none;
    }

    .logo-image {
      height: 36px;
      width: 36px;
      object-fit: contain;
    }

    .logo-text {
      font-size: 1.3rem;
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
      align-items: center;
    }

    .nav-icons a {
      color: var(--primary-text);
      text-decoration: none;
      position: relative;
      font-size: 1.2rem;
      transition: color 0.2s;
    }

    .nav-icons a:hover {
      color: var(--brand-color);
    }

    .cart-badge-cart {
      position: absolute;
      top: -6px;
      right: -10px;
      background-color: var(--brand-color);
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
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

    /* --- CART CONTENT --- */
    .cart-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 3rem 0 2rem;
    }

    .cart-grid {
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      gap: 3rem;
      margin-bottom: 6rem;
      align-items: start;
    }

    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .cart-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      gap: 1.5rem;
      box-shadow: 0 4px 15px rgba(112, 68, 85, 0.03);
    }

    .cart-img-wrapper {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      background-color: #f7f3f4;
    }

    .cart-product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .item-name {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1a1a1a;
      line-height: 1.3;
    }

    .item-base-price {
      font-size: 0.9rem;
      color: var(--brand-color);
      font-weight: 600;
    }

    .item-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-top: 0.5rem;
    }

    .topping-badge {
      display: inline-block;
      background-color: #fdf2f5;
      color: var(--brand-color);
      border: 1px solid var(--pink-accent);
      padding: 0.3rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      width: fit-content;
    }

    .item-price-qty {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
      min-width: 160px;
      border-left: 1px dashed var(--border-color);
      padding-left: 1.5rem;
    }

    .item-total-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--brand-color);
    }

    .qty-control {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: 50px;
      background-color: #ffffff;
      padding: 0.2rem;
    }

    .qty-btn {
      background: #f7f3f4;
      border: none;
      cursor: pointer;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      transition: background 0.2s;
    }

    .qty-btn:hover {
      background: var(--pink-accent);
    }

    .qty-number {
      font-size: 0.95rem;
      font-weight: 600;
      width: 35px;
      text-align: center;
    }

    .delete-btn {
      background: none;
      border: none;
      color: #bfaab1;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.5rem;
      transition: color 0.2s;
    }

    .delete-btn:hover {
      color: var(--danger-color);
    }

    .summary-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      position: sticky;
      top: 6rem;
      box-shadow: 0 4px 20px rgba(112, 68, 85, 0.04);
    }

    .summary-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #f7f3f4;
      padding-bottom: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 1rem;
      color: var(--text-muted);
      margin-bottom: 1.2rem;
    }

    .summary-total {
      display: flex;
      justify-content: space-between;
      font-size: 1.3rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 1.5rem;
      border-top: 2px solid #f7f3f4;
      padding-top: 1.5rem;
      margin-bottom: 2rem;
    }

    .checkout-btn {
      width: 100%;
      background-color: var(--brand-color);
      color: #ffffff;
      border: none;
      padding: 1.2rem;
      border-radius: 50px;
      font-size: 1.05rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      transition: background-color 0.3s;
    }

    .checkout-btn:hover {
      background-color: #5c3745;
    }

    .empty-cart-state {
      text-align: center;
      padding: 6rem 0;
      color: var(--text-muted);
      background: var(--card-bg);
      border-radius: 16px;
      border: 1px dashed #d1c8cb;
    }

    .empty-cart-state i {
      font-size: 4rem;
      color: #e5d9dc;
      margin-bottom: 1.5rem;
    }

    .shop-now-btn {
      display: inline-block;
      margin-top: 2rem;
      background-color: var(--pink-button);
      color: var(--brand-color);
      text-decoration: none;
      padding: 1rem 2.5rem;
      border-radius: 50px;
      font-weight: 600;
    }

    .shop-now-btn:hover {
      background-color: #f19fb5;
    }

    footer {
      background-color: #fcfaf8;
      padding: 2.5rem 0;
      border-top: 1px solid var(--border-color);
      font-size: 0.95rem;
      color: var(--text-muted);
      margin-top: auto;
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 850px) {
      .cart-grid { grid-template-columns: 1fr; gap: 2rem; }
      .summary-card { position: static; }
      .nav-links { display: none; }
      .hamburger { display: flex; }
      .mobile-menu { display: none; }
      .mobile-menu.open { display: flex; }
    }

    @media (max-width: 650px) {
      .container { padding: 0 1.2rem; }
      .cart-title { font-size: 1.6rem; }
      .cart-card { flex-direction: column; }
      .cart-img-wrapper { width: 100%; height: 180px; }
      .item-price-qty { flex-direction: row; border-left: none; border-top: 1px dashed var(--border-color); padding-left: 0; padding-top: 1rem; width: 100%; }
      .footer-content { flex-direction: column; text-align: center; }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--brand-color)' }}></i>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Memuat keranjang...</p>
        </div>
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
              <Link to="/menu">Menu</Link>
              <Link to="/about">About Us</Link>
            </nav>
            <div className="nav-icons">
              <Link to="/cart" className="active">
                <i className="fa-solid fa-cart-shopping"></i>
                {cartCount > 0 && <span className="cart-badge-cart">{cartCount}</span>}
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
            <Link to="/menu" onClick={() => setIsMenuOpen(false)}>Menu</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link>
          </div>
        </header>

        <main className="container">
          <h1 className="cart-title">Keranjang Belanja</h1>

          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <i className="fa-solid fa-basket-shopping"></i>
              <h2>Keranjang belanjamu masih kosong</h2>
              <p>Yuk, isi dengan panna cotta atau dessert box favoritmu!</p>
              <Link to="/menu" className="shop-now-btn">Pesan Sekarang</Link>
            </div>
          ) : (
            <div className="cart-grid">
              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const singlePrice = calculateSingleItemPrice(item);
                  const totalPrice = singlePrice * item.quantity;
                  const hasToppings = item.toppings && item.toppings.length > 0;

                  // ─── Ambil gambar dari hasil gabungan ───
                  const imageSrc = item.products?.image ||
                                   item.product_image ||
                                   item.image_url ||
                                   'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=400&q=80';

                  return (
                    <div key={item.id} className="cart-card">
                      <div className="cart-img-wrapper">
                        <img src={imageSrc} alt={item.product_name} className="cart-product-img" />
                      </div>
                      <div className="item-info">
                        <h3 className="item-name">{item.product_name}</h3>
                        <span className="item-base-price">
                          Rp {item.product_price.toLocaleString('id-ID')}
                          {hasToppings && ` + Topping (Rp ${(item.toppings.length * PRICE_PER_TOPPING).toLocaleString('id-ID')})`}
                          <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}> / pcs</span>
                        </span>
                        <div className="item-meta">
                          <div>Sugar: {item.sugary_level}</div>
                          {item.custom_message && <div>Pesan: "{item.custom_message}"</div>}
                          {hasToppings && <div className="topping-badge">Topping: {item.toppings.join(', ')}</div>}
                        </div>
                      </div>
                      <div className="item-price-qty">
                        <span className="item-total-price">Rp {totalPrice.toLocaleString('id-ID')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <button className="delete-btn" onClick={() => deleteItem(item.id)}>
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity, -1)}>
                              <i className="fa-solid fa-minus"></i>
                            </button>
                            <span className="qty-number">{item.quantity}</span>
                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity, 1)}>
                              <i className="fa-solid fa-plus"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="summary-card">
                <h2 className="summary-title">Ringkasan Belanja</h2>
                <div className="summary-row">
                  <span>Total Barang ({cartCount} item)</span>
                  <span style={{ fontWeight: '500' }}>Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="summary-row">
                  <span>Ongkos Kirim</span>
                  <span style={{ color: '#20ba5a', fontWeight: '600' }}>Fasilitas Kampus / COD</span>
                </div>
                <div className="summary-total">
                  <span>Total Harga</span>
                  <span style={{ color: 'var(--brand-color)' }}>Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                </div>
                <button className="checkout-btn" onClick={() => navigate('/checkout')}>
                  <i className="fa-solid fa-credit-card"></i> Lanjut Pembayaran
                </button>
              </div>
            </div>
          )}
        </main>

        <footer>
          <div className="container footer-content">
            <span style={{ color: 'var(--brand-color)', fontWeight: '700', fontSize: '1.2rem' }}>SweetTech</span>
            <span>© 2026 SweetTech. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </>
  );
}