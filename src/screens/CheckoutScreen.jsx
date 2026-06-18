// src/screens/CheckoutScreen.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
// Import standar Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Memperbaiki isu marker Leaflet yang tidak muncul di React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Konstanta lokasi toko dan tarif ongkir
const TOKO_LAT = -7.8712;
const TOKO_LNG = 112.5269;
const RATE_PER_KM = 500;
const PRICE_PER_TOPPING = 2000;

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [fulfillmentMethod, setFulfillmentMethod] = useState('pickup');
  const [delivery_address, setDeliveryAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ── State untuk Pickup Date & Time ──
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('16:00-18:00');

  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // ── Ambil cart dari Supabase + gambar dari tabel products ──────────────
  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: cartData, error: cartError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (cartError) throw cartError;

        if (cartData && cartData.length > 0) {
          const productIds = cartData
            .map(item => item.product_id)
            .filter(id => id != null);

          let imageMap = {};
          if (productIds.length > 0) {
            const { data: productsData, error: productsError } = await supabase
              .from('products')
              .select('id, image')
              .in('id', productIds);

            if (productsError) throw productsError;
            productsData.forEach(p => {
              imageMap[p.id] = p.image;
            });
          }

          const mergedData = cartData.map(item => ({
            ...item,
            product_image: imageMap[item.product_id] || null
          }));

          setCartItems(mergedData);
        } else {
          setCartItems([]);
        }
      } catch (err) {
        console.error('Gagal mengambil data keranjang:', err);
        setCartItems([]);
      }
    };
    fetchCartData();
  }, []);

  // ── Hitung subtotal, tax, grand total ────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => {
    const toppingCount = item.toppings ? item.toppings.length : 0;
    const toppingCost = toppingCount * PRICE_PER_TOPPING;
    const finalPrice = item.product_price + toppingCost;
    return sum + (finalPrice * item.quantity);
  }, 0);
  const tax = subtotal * 0.1;
  const grandTotal = subtotal + tax + (fulfillmentMethod === 'delivery' ? shippingCost : 0);

  // ── Hitung jarak Haversine ──────────────────────────────────────────────
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
    setShippingCost(Math.round(dist * RATE_PER_KM));
  }, []);

  // ── Inisialisasi / destroy peta Leaflet ──────────────────────────────────
  useEffect(() => {
    if (fulfillmentMethod !== 'delivery') {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        userMarkerRef.current = null;
      }
      return;
    }
    if (!mapRef.current || mapInstanceRef.current || !L) return;
    const map = L.map(mapRef.current).setView([TOKO_LAT, TOKO_LNG], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    L.marker([TOKO_LAT, TOKO_LNG]).addTo(map)
      .bindPopup('<b>SweetTech Store</b><br>Batu, Jawa Timur.')
      .openPopup();
    mapInstanceRef.current = map;
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
        if (data.display_name) setDeliveryAddress(data.display_name);
      } catch (err) {
        console.error("Reverse geocoding error", err);
      }
    };
    map.on('click', onMapClick);
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
    if (method !== 'delivery') {
      setShippingCost(0);
      setDistance(0);
    }
  };

  // ── Submit order ke Supabase ─────────────────────────────────────────────
  const submitOrder = async () => {
    if (!fullName || !phoneNumber) {
      alert('Tolong lengkapi nama dan nomor telepon!');
      return;
    }
    if (fulfillmentMethod === 'delivery' && !delivery_address) {
      alert('Silakan pilih lokasi di peta atau isi alamat pengiriman.');
      return;
    }
    if (fulfillmentMethod === 'pickup' && (!pickupDate || !pickupTime)) {
      alert('Silakan pilih tanggal dan jam pengambilan.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Anda harus login terlebih dahulu!');
      return;
    }
    try {
      const orderNumber = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      
      // ── Catatan untuk metode pembayaran via WA ──
      const notesValue = `Pembayaran: Konfirmasi Manual via WhatsApp
Pickup: ${pickupDate} ${pickupTime || 'Tidak ditentukan'}`;

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          order_number: orderNumber,
          customer_name: fullName,
          customer_phone: phoneNumber,
          delivery_method: fulfillmentMethod,
          delivery_address: fulfillmentMethod === 'delivery' ? delivery_address : null,
          distance_km: fulfillmentMethod === 'delivery' ? parseFloat(distance.toFixed(2)) : null,
          delivery_fee: fulfillmentMethod === 'delivery' ? shippingCost : 0,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          total: parseFloat(grandTotal.toFixed(2)),
          status: 'pending',
          notes: notesValue,
        }])
        .select()
        .single();
      if (orderError) throw orderError;

      const itemsToInsert = cartItems.map(item => {
        const toppingCount = item.toppings ? item.toppings.length : 0;
        const toppingCost = toppingCount * PRICE_PER_TOPPING;
        const itemSubtotal = (item.product_price + toppingCost) * item.quantity;
        return {
          order_id: newOrder.id,
          product_id: item.product_id ? parseInt(item.product_id, 10) : 0,
          product_name: item.product_name,
          product_price: parseFloat(item.product_price.toFixed(2)),
          quantity: item.quantity,
          toppings: item.toppings || [],
          sugary_level: item.sugary_level || 'Normal (50gr)',
          custom_message: item.custom_message || null,
          subtotal: parseFloat(itemSubtotal.toFixed(2)),
        };
      });
      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (deleteError) console.error('Gagal hapus cart:', deleteError);

      alert(`Pesanan Berhasil Disimpan!\nNo. Order: ${orderNumber}\n\n📱 Silakan screenshot halaman Profile dan kirim ke WhatsApp kami untuk konfirmasi pembayaran.`);
      navigate('/profile');
    } catch (err) {
      console.error('Gagal memproses pesanan:', err);
      alert('Terjadi kesalahan: ' + err.message);
    }
  };

  // ================== CSS ==========================
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');

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
      --whatsapp-color: #25D366;
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

    /* --- HEADER --- */
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

    .cart-badge-checkout {
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

    /* ── Konten Checkout ── */
    .checkout-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 3rem;
      margin: 3rem 0 5rem;
      align-items: start;
    }
    h2 {
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: #1a1a1a;
      text-align: center;
    }
    .checkout-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
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
      text-align: left;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.85rem 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      font-size: 0.95rem;
      outline: none;
      background-color: var(--bg-color);
      transition: border 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      border-color: var(--brand-color);
      box-shadow: 0 0 0 3px rgba(112, 68, 85, 0.1);
    }

    /* ── Perbaikan input date di HP ── */
    .form-group input[type="date"] {
      background-color: var(--bg-color);
      color: var(--primary-text);
      appearance: none;
      -webkit-appearance: none;
    }
    .form-group input[type="date"]:focus {
      background-color: #ffffff;
    }
    .form-group input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.3);
      cursor: pointer;
    }

    /* ── Input nomor telepon (tidak putih) ── */
    #phone-number {
      background-color: #f5f0f2 !important;
      border: 2px solid #d0c5c8 !important;
      font-weight: 500;
      color: var(--primary-text);
    }
    #phone-number:focus {
      border-color: var(--brand-color) !important;
      box-shadow: 0 0 0 4px rgba(112, 68, 85, 0.15);
      background-color: #ffffff !important;
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
      text-align: center;
    }

    /* ── Pickup Date & Time ── */
    .pickup-fields {
      display: ${fulfillmentMethod === 'pickup' ? 'block' : 'none'};
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .pickup-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* ── Payment Info Box (bukan dropdown) ── */
    .payment-info-box {
      background-color: #f5f0f2;
      border-radius: 12px;
      padding: 1.5rem;
      border: 2px solid var(--whatsapp-color);
      text-align: center;
    }
    .payment-info-box .wa-icon {
      font-size: 2.5rem;
      color: var(--whatsapp-color);
      margin-bottom: 0.5rem;
      display: block;
    }
    .payment-info-box h4 {
      color: var(--brand-color);
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
    }
    .payment-info-box p {
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .payment-info-box .highlight {
      color: var(--brand-color);
      font-weight: 600;
    }
    .payment-info-box .wa-number {
      display: inline-block;
      background-color: var(--whatsapp-color);
      color: white;
      padding: 0.4rem 1.2rem;
      border-radius: 50px;
      font-weight: 600;
      margin-top: 0.5rem;
      font-size: 0.9rem;
      text-decoration: none;
    }
    .payment-info-box .wa-number:hover {
      background-color: #20ba5a;
    }

    /* ── Summary Items ── */
    .summary-item-row {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
      align-items: center;
    }
    .summary-item-img {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
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
    .summary-item-price {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--primary-text);
      white-space: nowrap;
    }
    .custom-badge {
      background-color: #f5f0f2;
      color: var(--brand-color);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
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
      margin-bottom: 1.5rem;
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
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background-color 0.25s, transform 0.1s;
    }
    .pay-btn:hover {
      background-color: var(--pink-hover);
      transform: scale(1.01);
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
      flex-wrap: wrap;
    }
    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
    }
    .footer-links a:hover {
      color: var(--brand-color);
    }

    /* ================== RESPONSIVE ================== */
    @media (max-width: 850px) {
      .nav-links { display: none; }
      .hamburger { display: flex; }
      .mobile-menu { display: none; }
      .mobile-menu.open { display: flex; }
      .checkout-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
        margin: 2rem 0 3rem;
      }
      .container { padding: 0 1.2rem; }
      .checkout-card { padding: 1.5rem; }
      .pickup-row { grid-template-columns: 1fr; }
    }
    @media (max-width: 576px) {
      .container { padding: 0 0.8rem; }
      header { padding: 1rem 0; }
      .logo-text { font-size: 1.1rem; }
      .logo-image { height: 30px; width: 30px; }
      .nav-icons { gap: 1rem; }
      h2 { font-size: 1.2rem; margin-bottom: 1rem; }
      .checkout-card { padding: 1.2rem; border-radius: 16px; }
      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 0.7rem 1rem;
        font-size: 0.9rem;
      }
      /* Perbaikan date input di HP agar tidak putih */
      .form-group input[type="date"] {
        background-color: #f5f0f2 !important;
      }
      .form-group input[type="date"]:focus {
        background-color: #ffffff !important;
      }
      .summary-item-row { flex-wrap: wrap; gap: 0.8rem; }
      .summary-item-img { width: 50px; height: 50px; }
      .summary-item-info h4 { font-size: 0.9rem; }
      .summary-item-price { font-size: 0.9rem; }
      .calc-row { font-size: 0.9rem; }
      .calc-row.total { font-size: 1.1rem; }
      .pay-btn { padding: 0.8rem; font-size: 0.95rem; }
      footer { padding: 1.5rem 0; }
      .footer-content { flex-direction: column; text-align: center; }
      .footer-links { justify-content: center; gap: 1rem; }
      #map { height: 200px; }
      .payment-info-box { padding: 1rem; }
    }
  `;

  // ── Render item summary ──────────────────────────────────────────────────
  const renderOrderItems = () => {
    if (cartItems.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada pesanan.</p>;
    return cartItems.map((item, idx) => {
      const toppingCount = item.toppings ? item.toppings.length : 0;
      const toppingCost = toppingCount * PRICE_PER_TOPPING;
      const finalPrice = item.product_price + toppingCost;
      const totalItem = finalPrice * item.quantity;
      const toppingsText = item.toppings?.length ? `Toppings: ${item.toppings.join(', ')}` : 'Tanpa Topping';

      const imageSrc = item.product_image || 
                       item.image_url || 
                       'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=150&q=80';

      return (
        <div key={item.id || idx} className="summary-item-row">
          <img src={imageSrc} className="summary-item-img" alt={item.product_name} />
          <div className="summary-item-info">
            <h4>{item.product_name} (x{item.quantity})</h4>
            <div className="summary-item-meta">
              Sugar: {item.sugary_level || 'Normal'} <br />
              {toppingsText}
              {item.custom_message && <br />}
              {item.custom_message && <span className="custom-badge">"{item.custom_message}"</span>}
            </div>
          </div>
          <span className="summary-item-price">Rp {totalItem.toLocaleString('id-ID')}</span>
        </div>
      );
    });
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <>
      <style>{styles}</style>
      <div>
        {/* HEADER */}
        <header>
          <div className="container navbar">
            <Link to="/" className="logo-container">
              <img src="/logo.png" alt="SweetTech Logo" className="logo-image" />
              <span className="logo-text">SweetTech</span>
            </Link>
            <nav className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/menu">Menu</Link>
              <Link to="/about">About Us</Link>
            </nav>
            <div className="nav-icons">
              <Link to="/cart">
                <i className="fa-solid fa-cart-shopping"></i>
                {totalCartItems > 0 && <span className="cart-badge-checkout">{totalCartItems}</span>}
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
          <div className="checkout-grid">
            {/* ── KOLOM KIRI ────────────────────────────────────────────── */}
            <div>
              <h2>Shipping & Fulfillment</h2>
              <div className="checkout-card">
                <div className="form-group">
                  <label htmlFor="full-name">Nama Lengkap Penerima</label>
                  <input
                    type="text"
                    id="full-name"
                    placeholder="Masukkan nama lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone-number">Nomor Telepon/WhatsApp</label>
                  <input
                    type="tel"
                    id="phone-number"
                    placeholder="Contoh: 08123456xxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fulfillment-method">Metode Pengambilan</label>
                  <select id="fulfillment-method" value={fulfillmentMethod} onChange={handleFulfillmentChange}>
                    <option value="pickup">Pick Up (Ambil di Toko Batu)</option>
                    <option value="delivery">Delivery (Kirim ke Alamat)</option>
                  </select>
                </div>

                {/* ── PICKUP DATE & TIME ── */}
                <div className="pickup-fields">
                  <div className="pickup-row">
                    <div className="form-group">
                      <label htmlFor="pickup-date">Tanggal Pengambilan</label>
                      <input
                        type="date"
                        id="pickup-date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required={fulfillmentMethod === 'pickup'}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="pickup-time">Jam Pengambilan</label>
                      <select
                        id="pickup-time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required={fulfillmentMethod === 'pickup'}
                      >
                        <option value="16:00-18:00">16:00 - 18:00</option>
                        <option value="19:00-20:00">19:00 - 20:00</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* ── MAP (untuk delivery) ── */}
                <div id="map-container">
                  <div className="form-group">
                    <label htmlFor="delivery_address">Alamat Lengkap Pengiriman</label>
                    <textarea
                      id="delivery_address"
                      rows="2"
                      placeholder="Ketik alamat lengkap rumah Anda..."
                      value={delivery_address}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'center', display: 'block', marginBottom: '0.5rem' }}>
                    Pinpoint Lokasi Anda di Peta (Untuk Hitung Jarak)
                  </label>
                  <div id="map" ref={mapRef}></div>
                  <div className="map-info">
                    Jarak ke toko: {distance.toFixed(2)} km (Ongkir: Rp {shippingCost.toLocaleString('id-ID')})
                  </div>
                </div>
              </div>

              {/* ── PAYMENT METHOD (INFO BOX, bukan dropdown) ── */}
              <h2>Payment Method</h2>
              <div className="checkout-card">
                <div className="payment-info-box">
                  <i className="fa-brands fa-whatsapp wa-icon"></i>
                  <h4>💳 Konfirmasi Manual via WhatsApp</h4>
                  <p>
                    Setelah pesanan berhasil dibuat, silakan <span className="highlight">screenshot halaman Profile</span> 
                    yang berisi <span className="highlight">nomor order</span> Anda, lalu kirimkan ke WhatsApp kami untuk 
                    konfirmasi pembayaran.
                  </p>
                  <a 
                    href="https://wa.me/6289651588072?text=Halo%20SweetTech,%20saya%20ingin%20konfirmasi%20pembayaran%20untuk%20order%20saya" 
                    className="wa-number"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fa-brands fa-whatsapp"></i> Hubungi Kami
                  </a>
                </div>
              </div>
            </div>

            {/* ── KOLOM KANAN ────────────────────────────────────────────── */}
            <div>
              <h2>Order Summary</h2>
              <div className="checkout-card">
                <div id="summary-items-list">
                  {renderOrderItems()}
                </div>
                <div className="calc-row" style={{ marginTop: '1.5rem' }}>
                  <span>Subtotal Produk</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="calc-row">
                  <span>Biaya Kirim (Delivery)</span>
                  <span>Rp {fulfillmentMethod === 'delivery' ? shippingCost.toLocaleString('id-ID') : '0'}</span>
                </div>
                <div className="calc-row">
                  <span>Pajak (10%)</span>
                  <span>Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="calc-row total">
                  <span>Total Pembayaran</span>
                  <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
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