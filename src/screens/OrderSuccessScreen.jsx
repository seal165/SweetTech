// src/screens/OrderSuccessScreen.jsx
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './OrderSuccessScreen.css';

export default function OrderSuccessScreen() {
  const location = useLocation();
  const orderData = location.state?.orderData || null;
  
  // Ambil item dari orderData, jika tidak ada gunakan data dummy statis
  const orderItems = orderData?.items || [
    { id: 1, name: 'Vanilla Bean Panna Cotta', quantity: 2, icon: 'fa-solid fa-cake-candles' },
    { id: 2, name: 'Chocolate Dessert Box', quantity: 1, icon: 'fa-solid fa-ice-cream' }
  ];
  
  // Selaraskan properti ID dari CheckoutScreen (id vs orderId)
  const orderId = orderData?.id ? `#ST-${orderData.id}` : (orderData?.orderId || '#ST-000001');
  
  // Selaraskan properti metode pengiriman (fulfillmentMethod vs deliveryMethod)
  const isDelivery = (orderData?.fulfillmentMethod || orderData?.deliveryMethod) === 'delivery';
  
  // Bungkus estimasi waktu dengan useMemo agar tidak berubah-ubah saat render ulang
  const estimatedTime = useMemo(() => {
    const now = new Date();
    const startHour = now.getHours();
    const startMinute = now.getMinutes() + 30;
    
    let startHourAdjusted = startHour;
    let startMinuteAdjusted = startMinute;
    if (startMinuteAdjusted >= 60) {
      startHourAdjusted += Math.floor(startMinuteAdjusted / 60);
      startMinuteAdjusted = startMinuteAdjusted % 60;
    }
    
    let endHour = startHourAdjusted;
    let endMinuteValue = startMinuteAdjusted + 30;
    if (endMinuteValue >= 60) {
      endHour += Math.floor(endMinuteValue / 60);
      endMinuteValue = endMinuteValue % 60;
    }
    
    const formatTime = (hour, minute) => `${hour % 24}:${minute.toString().padStart(2, '0')}`;
    return `${formatTime(startHourAdjusted, startMinuteAdjusted)} - ${formatTime(endHour, endMinuteValue)}`;
  }, []);

  return (
    <div className="success-page">
      <div className="blur-glow-left"></div>
      <div className="blur-glow-right"></div>

      <main className="success-container">
        <div className="success-icon-wrap">
          <div className="success-icon-inner">
            <div className="success-icon-center">
              <i className="fa-solid fa-check"></i>
            </div>
          </div>
        </div>
        <h1>Pesanan Berhasil!</h1>
        <p>Your sweet treats are being prepared.</p>

        <div className="order-card">
          <div className="order-header">
            <span>Order ID</span>
            <strong>{orderId}</strong>
          </div>
          {orderItems.map((item, idx) => (
            <div key={item.id || idx} className="order-item">
              <div className="item-icon">
                {/* Menggunakan ikon dinamis jika ada, atau fallback ke gambar produk/ikon default */}
                <i className={item.icon || 'fa-solid fa-cake-candles'}></i>
              </div>
              <div className="item-name">{item.name}</div>
              <div className="item-qty">x{item.quantity}</div>
            </div>
          ))}
          <div className="pickup-info">
            <i className={`fa-solid ${isDelivery ? 'fa-truck' : 'fa-clock'}`}></i>
            <div className="pickup-text">
              <strong>{isDelivery ? 'Estimated Delivery Time' : 'Estimated Pickup Time'}</strong>
              <span>Today, {estimatedTime}</span>
            </div>
          </div>
        </div>

        <div className="btn-group">
          <Link to="/" className="btn btn-primary">Back to Home</Link>
          <Link to="/profile" className="btn btn-secondary">View Profile & History</Link>
        </div>
      </main>
    </div>
  );
}