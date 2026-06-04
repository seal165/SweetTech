// src/screens/CartScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function CartScreen() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem('sweettech_cart')) || [];
  });

  const updateCartBadge = useCallback(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const badgeElement = document.querySelector('.cart-badge-number');
    if (badgeElement) {
      if (totalItems > 0) {
        badgeElement.textContent = totalItems;
        badgeElement.style.display = 'inline-block';
      } else {
        badgeElement.style.display = 'none';
      }
    }
  }, [cartItems]); // Berubah jika isi cartItems berubah

  // Fungsi untuk menghapus item dari keranjang
  const removeItem = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    localStorage.setItem('sweettech_cart', JSON.stringify(newCart));
    setCartItems(newCart);
  };

  // Fungsi untuk memproses ke halaman checkout
  const processCheckout = () => {
    if (cartItems.length === 0) {
      alert('Keranjang Anda masih kosong!');
      return;
    }
    navigate('/checkout');
  };

  useEffect(() => {
    updateCartBadge();
  }, [updateCartBadge]);

  // Perhitungan Biaya
  const subtotal = cartItems.reduce((sum, item) => {
    const toppingCost = (item.toppings?.length || 0) * 1.50;
    const finalPrice = item.price + toppingCost;
    return sum + (finalPrice * item.quantity);
  }, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax;

  // CSS Asli dari detail/cart.html
  const styles = `
    :root {
      --brand-color: #704455;
      --primary-text: #2d2426;
      --bg-color: #faf8f6;
      --card-bg: #ffffff;
      --border-color: #ebe4e6;
      --text-muted: #7d6f73;
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
      align-self: center;
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
    .cart-section {
      margin: 4rem 0 6rem;
    }
    .cart-section h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 2rem;
      color: #1a1a1a;
    }
    .cart-container {
      display: grid;
      grid-template-columns: 1.7fr 1fr;
      gap: 3rem;
      align-items: start;
    }
    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .cart-item-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.5rem;
      display: flex;
      gap: 1.5rem;
      position: relative;
    }
    .cart-item-img {
      width: 110px;
      height: 110px;
      border-radius: 14px;
      object-fit: cover;
    }
    .cart-item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .item-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .item-title-row h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a1a;
      max-width: 80%;
    }
    .item-price {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--brand-color);
    }
    .item-customizations {
      margin: 0.5rem 0;
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .custom-badge {
      background-color: #f5f0f2;
      color: var(--brand-color);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
      display: inline-block;
      margin-top: 0.25rem;
    }
    .item-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
    }
    .delete-item-btn {
      background: none;
      border: none;
      color: #ea6c75;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .item-qty-display {
      font-size: 0.95rem;
      font-weight: 600;
      background-color: var(--bg-color);
      padding: 0.4rem 1rem;
      border-radius: 50px;
      border: 1px solid var(--border-color);
    }
    .summary-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
    }
    .summary-card h2 {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .summary-row.total {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      margin-top: 1rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #1a1a1a;
    }
    .checkout-btn {
      width: 100%;
      background-color: var(--pink-button);
      color: var(--brand-color);
      border: none;
      padding: 1rem;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s;
    }
    .checkout-btn:hover {
      opacity: 0.9;
    }
    .empty-cart-message {
      text-align: center;
      padding: 4rem 2rem;
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      grid-column: span 2;
    }
    .empty-cart-message i {
      font-size: 3.5rem;
      color: var(--border-color);
      margin-bottom: 1rem;
    }
    .empty-cart-message h3 {
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
    }
    .empty-cart-message p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
    .shop-now-btn {
      display: inline-block;
      background-color: var(--brand-color);
      color: white;
      text-decoration: none;
      padding: 0.75rem 2rem;
      border-radius: 50px;
      font-size: 0.95rem;
      font-weight: 500;
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
      .cart-container { grid-template-columns: 1fr; gap: 2.5rem; }
      .footer-content { flex-direction: column; gap: 1rem; text-align: center; }
      .footer-links { flex-wrap: wrap; justify-content: center; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div>
        <header>
          <div className="container navbar">
            <Link to="/" className="logo">SweetTech</Link>
            <nav className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/menu">Menu</Link>
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

        <main className="container cart-section">
          <h1>Shopping Cart</h1>
          <div className="cart-container">
            {cartItems.length === 0 ? (
              <div className="empty-cart-message">
                <i className="fa-solid fa-basket-shopping"></i>
                <h3>Keranjang belanjaanmu kosong</h3>
                <p>Yuk, lihat menu dessert spesial kami dan mulai isi keranjangmu!</p>
                <Link to="/menu" className="shop-now-btn">Lihat Menu</Link>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cartItems.map((item, idx) => {
                    const toppingCost = (item.toppings?.length || 0) * 1.50;
                    const finalPrice = item.price + toppingCost;
                    const itemTotal = finalPrice * item.quantity;

                    return (
                      <div key={idx} className="cart-item-card">
                        <img src={item.image} alt={item.name} className="cart-item-img" />
                        <div className="cart-item-details">
                          <div className="item-title-row">
                            <h3>{item.name}</h3>
                            <span className="item-price">${itemTotal.toFixed(2)}</span>
                          </div>
                          
                          <div className="item-customizations">
                            <strong>Sugar Level:</strong> {item.sugar || 'Normal'} <br />
                            <strong>Toppings:</strong> {item.toppings && item.toppings.length > 0 ? (
                              <>
                                {item.toppings.join(', ')} (+${toppingCost.toFixed(2)})
                              </>
                            ) : (
                              'No Extra Toppings'
                            )}
                            {item.customMessage && (
                              <>
                                <br />
                                <span className="custom-badge">
                                  <i className="fa-regular fa-comment-dots"></i> "{item.customMessage}"
                                </span>
                              </>
                            )}
                          </div>

                          <div className="item-actions-row">
                            <button className="delete-item-btn" onClick={() => removeItem(idx)}>
                              <i className="fa-regular fa-trash-can"></i> Remove
                            </button>
                            <span className="item-qty-display">Qty: {item.quantity} (at ${finalPrice.toFixed(2)}/each)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="summary-card">
                  <h2>Order Summary</h2>
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Estimated Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                  <button className="checkout-btn" onClick={processCheckout}>
                    <i className="fa-solid fa-credit-card"></i> Proceed to Checkout
                  </button>
                </div>
              </>
            )}
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