// src/screens/CheckoutScreen.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Import standar Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Konstanta di luar komponen
const TOKO_LAT = -7.8712;
const TOKO_LNG = 112.5269;
const RATE_PER_KM = 0.50;

export default function CheckoutScreen() {
  const navigate = useNavigate();
  
  // Inisialisasi cartItems langsung dari localStorage
  const getInitialCart = () => {
    return JSON.parse(localStorage.getItem('sweettech_cart')) || [];
  };
  
  const [cartItems] = useState(getInitialCart);
  const [fulfillmentMethod, setFulfillmentMethod] = useState('pickup');
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wa');
  const [shippingCost, setShippingCost] = useState(0);
  const [distance, setDistance] = useState(0);
  
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Hitung subtotal dan tax langsung
  const subtotal = cartItems.reduce((sum, item) => {
    const toppingCost = (item.toppings?.length || 0) * 1.50;
    const finalPrice = item.price + toppingCost;
    return sum + (finalPrice * item.quantity);
  }, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax + (fulfillmentMethod === 'delivery' ? shippingCost : 0);

  const calculateDistance = useCallback((userLat, userLng) => {
    const R = 6371;
    const dLat = (userLat - TOKO_LAT) * Math.PI / 180;
    const dLng = (userLng - TOKO_LNG) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(TOKO_LAT * Math.PI/180) * Math.cos(userLat * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const dist = R * c;
    setDistance(dist);
    setShippingCost(dist * RATE_PER_KM);
  }, []);

  useEffect(() => {
  if (fulfillmentMethod !== 'delivery') {
    // Jika pengguna memilih pickup, cukup bersihkan instansi peta jika ada
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      userMarkerRef.current = null;
    }
    return; // Hapus setShippingCost dan setDistance dari sini
  }

  if (!mapRef.current || mapInstanceRef.current || !L) return;

    // Inisialisasi peta Leaflet
    const map = L.map(mapRef.current).setView([TOKO_LAT, TOKO_LNG], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.marker([TOKO_LAT, TOKO_LNG]).addTo(map)
      .bindPopup('<b>SweetTech Store</b><br>Batu, Jawa Timur.')
      .openPopup();

    mapInstanceRef.current = map;
    
    // Handler klik pada peta
    const onMapClick = async (e) => {
      const { lat, lng } = e.latlng;
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      } else {
        userMarkerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        userMarkerRef.current.on('dragend', () => {
          const newPos = userMarkerRef.current.getLatLng();
          calculateDistance(newPos.lat, newPos.lng);
        });
      }
      calculateDistance(lat, lng);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await response.json();
        if (data.display_name) setAddress(data.display_name);
      } catch (err) {
        console.error("Reverse geocoding error", err);
      }
    };

    map.on('click', onMapClick);

    // Fungsi cleanup saat komponen unmount atau efek dijalankan ulang
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, [fulfillmentMethod, calculateDistance]);

  const handleFulfillmentChange = (e) => {
    const method = e.target.value;
    setFulfillmentMethod(method);
    
    // Jika pengguna beralih ke pickup, reset jarak dan ongkir saat itu juga
    if (method !== 'delivery') {
      setShippingCost(0);
      setDistance(0);
    }
  };

  const submitOrder = useCallback(() => {
    if (!fullName || !phoneNumber) {
      alert('Tolong lengkapi form data nama & nomor telepon terlebih dahulu!');
      return;
    }
    if (fulfillmentMethod === 'delivery' && !address) {
      alert('Silakan pilih lokasi di peta atau isi alamat pengiriman.');
      return;
    }
    
    const orderHistory = JSON.parse(localStorage.getItem('sweettech_order_history')) || [];
    const newOrder = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: cartItems,
      fulfillmentMethod,
      address: fulfillmentMethod === 'delivery' ? address : null,
      distance: fulfillmentMethod === 'delivery' ? distance : null,
      shippingCost: fulfillmentMethod === 'delivery' ? shippingCost : 0,
      subtotal,
      tax,
      total: grandTotal,
      customerName: fullName,
      customerPhone: phoneNumber,
      paymentMethod
    };
    orderHistory.push(newOrder);
    localStorage.setItem('sweettech_order_history', JSON.stringify(orderHistory));
    localStorage.removeItem('sweettech_cart');
    alert('Pemesanan Berhasil Disimpan!');
    navigate('/profile');
  }, [fullName, phoneNumber, fulfillmentMethod, address, cartItems, distance, shippingCost, subtotal, tax, grandTotal, paymentMethod, navigate]);

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
    .checkout-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 3rem;
      margin: 4rem 0 6rem;
      align-items: start;
    }
    h2 {
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: #1a1a1a;
    }
    .checkout-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 0.85rem 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      outline: none;
      background-color: var(--bg-color);
    }
    #map-container {
      display: ${fulfillmentMethod === 'delivery' ? 'block' : 'none'};
      margin-top: 1rem;
    }
    #map {
      width: 100%;
      height: 250px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }
    .map-info {
      font-size: 0.85rem;
      color: var(--brand-color);
      margin-top: 0.5rem;
      font-weight: 500;
    }
    .summary-item-row {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .summary-item-img {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
    }
    .summary-item-info {
      flex: 1;
    }
    .summary-item-info h4 {
      font-size: 0.95rem;
      font-weight: 600;
    }
    .summary-item-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.4;
      margin-top: 0.25rem;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .calc-row.total {
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      font-size: 1.2rem;
      font-weight: 700;
      color: #1a1a1a;
    }
    .custom-badge {
      background-color: #f5f0f2;
      color: var(--brand-color);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .pay-btn {
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
      .checkout-grid { grid-template-columns: 1fr; gap: 2rem; }
      .footer-content { flex-direction: column; text-align: center; gap: 1rem; }
    }
  `;

  const renderOrderItems = () => {
    if (cartItems.length === 0) return <p>Tidak ada pesanan.</p>;
    return cartItems.map((item, idx) => {
      const toppingCost = (item.toppings?.length || 0) * 1.50;
      const finalPrice = item.price + toppingCost;
      const totalItem = finalPrice * item.quantity;
      const toppingsText = item.toppings?.length ? `Toppings: ${item.toppings.join(', ')}` : 'No Toppings';
      return (
        <div key={idx} className="summary-item-row">
          <img src={item.image} className="summary-item-img" alt={item.name} />
          <div className="summary-item-info">
            <h4>{item.name} (x{item.quantity})</h4>
            <div className="summary-item-meta">
              Sugar: {item.sugar || 'Normal'} <br />
              {toppingsText}
              {item.customMessage && <br />}
              {item.customMessage && <span className="custom-badge">"{item.customMessage}"</span>}
            </div>
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>${totalItem.toFixed(2)}</span>
        </div>
      );
    });
  };

  return (
    <>
      <style>{styles}</style>
      <div>
        <header>
          <div className="container navbar">
            <Link to="/" className="logo">SweetTech</Link>
            <span style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-muted)' }}>Secure Checkout</span>
          </div>
        </header>

        <main className="container">
          <div className="checkout-grid">
            <div>
              <h2>Shipping & Fulfillment</h2>
              <div className="checkout-card">
                <div className="form-group">
                  <label htmlFor="full-name">Nama Lengkap Penerima</label>
                  <input type="text" id="full-name" placeholder="Masukkan nama lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone-number">Nomor Telepon/WhatsApp</label>
                  <input type="tel" id="phone-number" placeholder="Contoh: 08123456xxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="fulfillment-method">Metode Pengambilan</label>
                  <select id="fulfillment-method" value={fulfillmentMethod} onChange={handleFulfillmentChange}>
                    <option value="pickup">Pick Up (Ambil di Toko Batu)</option>
                    <option value="delivery">Delivery (Kirim ke Alamat)</option>
                  </select>
                </div>
                <div id="map-container">
                  <div className="form-group">
                    <label htmlFor="address">Alamat Lengkap Pengiriman</label>
                    <textarea id="address" rows="2" placeholder="Ketik alamat lengkap rumah Anda..." value={address} onChange={(e) => setAddress(e.target.value)}></textarea>
                  </div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Pinpoint Lokasi Anda di Peta (Untuk Hitung Jarak)</label>
                  <div id="map" ref={mapRef}></div>
                  <div className="map-info">
                    Jarak ke toko: {distance.toFixed(2)} km (Ongkir: ${shippingCost.toFixed(2)})
                  </div>
                </div>
              </div>

              <h2>Payment Method</h2>
              <div className="checkout-card">
                <div className="form-group">
                  <select id="payment-method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="wa">Konfirmasi Manual via WhatsApp</option>
                    <option value="qris">QRIS / Digital Wallet</option>
                    <option value="transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2>Order Summary</h2>
              <div className="checkout-card">
                <div id="summary-items-list">
                  {renderOrderItems()}
                </div>
                <div className="calc-row">
                  <span>Subtotal Produk</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="calc-row">
                  <span>Biaya Kirim (Delivery)</span>
                  <span>${fulfillmentMethod === 'delivery' ? shippingCost.toFixed(2) : '0.00'}</span>
                </div>
                <div className="calc-row">
                  <span>Pajak (10%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="calc-row total">
                  <span>Total Pembayaran</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                <button type="button" className="pay-btn" onClick={submitOrder}>
                  <i className="fa-solid fa-lock"></i> Place Order Now
                </button>
              </div>
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