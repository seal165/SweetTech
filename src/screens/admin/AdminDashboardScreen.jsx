// src/screens/admin/AdminDashboardScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

// ─── IMPORT KOMPONEN HALAMAN LAIN ───
import MenuManagementScreen from './MenuManagementScreen';
import OrderManagementScreen from './OrdersManagementScreen';
import CustomerManagementScreen from './CustomerManagementScreen';

const AdminDashboardScreen = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0 });
  const [chartData, setChartData] = useState([]); // hanya daily
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const barChartRef = useRef(null);

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const formatCurrency = (value) => 
    'Rp ' + Number(value).toLocaleString('id-ID', { minimumFractionDigits: 0 });
  const formatNumber = (value) => value.toLocaleString('id-ID');

  const navItems = [
    { path: '/admin/dashboard', icon: 'fa-solid fa-table-columns', label: 'Dashboard' },
    { path: '/admin/menu', icon: 'fa-solid fa-utensils', label: 'Menu' },
    { path: '/admin/orders', icon: 'fa-solid fa-file-invoice', label: 'Orders' },
    { path: '/admin/customers', icon: 'fa-solid fa-users', label: 'Customers' },
  ];

  // ─── FETCH DASHBOARD STATS & CHART DATA ───
  const fetchDashboardStats = useCallback(async (start, end) => {
    setIsLoading(true);
    setErrorMsg('');
    setDebugInfo('⏳ Mengambil data...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setDebugInfo('👤 User: ' + session.user.email);
      else setDebugInfo('⚠️ Tidak ada session');

      // ─── 1. TOTAL ORDERS (FILTER TANGGAL) ───
      let ordersCountQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (start && end) {
        ordersCountQuery = ordersCountQuery
          .gte('created_at', start)
          .lte('created_at', end + 'T23:59:59');
      }

      const { count: ordersCount, error: ordersError } = await ordersCountQuery;

      if (ordersError) throw new Error('Orders: ' + ordersError.message);
      setDebugInfo(prev => prev + ` | Orders: ${ordersCount}`);

      // ─── 2. TOTAL CUSTOMERS ───
      let customersQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (session?.user?.id) {
        customersQuery = customersQuery.neq('id', session.user.id);
      }

      const { count: customersCount, error: customersError } = await customersQuery;
      if (customersError) console.warn('Customers error:', customersError);
      setDebugInfo(prev => prev + ` | Customers: ${customersCount || 0}`);

      // ─── 3. AMBIL ORDERS DENGAN FILTER TANGGAL ───
      let ordersQuery = supabase
        .from('orders')
        .select('id, total, created_at')
        .order('created_at', { ascending: true });

      if (start && end) {
        ordersQuery = ordersQuery
          .gte('created_at', start)
          .lte('created_at', end + 'T23:59:59');
      }

      const { data: ordersData, error: ordersFetchError } = await ordersQuery;
      if (ordersFetchError) throw new Error('Orders fetch: ' + ordersFetchError.message);

      const totalRevenue = ordersData?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
      setDebugInfo(prev => prev + ` | Revenue: Rp${totalRevenue.toLocaleString('id-ID')}`);

      // ─── 4. PROCESS DAILY SALES ───
      const dailyMap = {};
      if (ordersData) {
        ordersData.forEach(order => {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          if (!dailyMap[date]) dailyMap[date] = 0;
          dailyMap[date] += 1;
        });
      }

      const dailyArray = Object.keys(dailyMap)
        .sort((a, b) => a.localeCompare(b))
        .map(date => ({ date, total: dailyMap[date] }));

      setChartData(dailyArray);

      setStats({
        revenue: totalRevenue,
        orders: ordersCount || 0,
        customers: customersCount || 0
      });

      setDebugInfo(prev => prev + ` | Days: ${dailyArray.length} ✅ Selesai!`);
    } catch (err) {
      console.error('Dashboard error:', err);
      setErrorMsg('❌ ' + err.message);
      setStats({ revenue: 0, orders: 0, customers: 0 });
      setChartData([]);
      setDebugInfo('❌ Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── EFFECT: FETCH SAAT TANGGAL BERUBAH ───
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardStats(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // ─── INIT CHART.JS ───
  useEffect(() => {
    if (chartData.length === 0) return;
    if (isLoading) return;

    const loadCharts = () => {
      const Chart = window.Chart;
      if (!Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        script.onload = () => setTimeout(loadCharts, 100);
        document.head.appendChild(script);
        return;
      }

      if (barChartRef.current) { barChartRef.current.destroy(); barChartRef.current = null; }

      // ─── BAR CHART ───
      const barCtx = document.getElementById('barChart')?.getContext('2d');
      if (barCtx && chartData.length > 0) {
        const labels = chartData.map(d => {
          const dt = new Date(d.date);
          return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        });
        const data = chartData.map(d => d.total);

        barChartRef.current = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Total Pesanan',
              data,
              backgroundColor: 'rgba(112, 45, 67, 0.7)',
              borderColor: '#702D43',
              borderWidth: 1,
              borderRadius: 8,
              barThickness: Math.min(40, Math.max(20, 400 / labels.length))
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500, easing: 'easeOutQuart' },
            scales: {
              y: { 
                beginAtZero: true, 
                grid: { borderDash: [5, 5], color: '#e2e8f0' },
                ticks: { stepSize: 1 }
              },
              x: { grid: { display: false } }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `Total: ${context.raw} Pesanan`;
                  }
                }
              }
            }
          }
        });
      }
    };

    loadCharts();

    return () => {
      if (barChartRef.current) { barChartRef.current.destroy(); barChartRef.current = null; }
    };
  }, [chartData, isLoading]);

  // ─── EXPORT CSV ───
  const exportToCSV = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, customer_name, customer_phone, total,
          status, delivery_method, created_at,
          order_items ( product_name, quantity, product_price, subtotal )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!orders || orders.length === 0) {
        alert('Tidak ada data orders.');
        return;
      }

      let rows = [['Order ID', 'Order Number', 'Customer', 'Phone', 'Total (Rp)', 'Status', 'Delivery', 'Date', 'Items']];
      orders.forEach(o => {
        const items = o.order_items?.map(i => 
          `${i.product_name} x${i.quantity} (Rp${i.subtotal?.toLocaleString('id-ID')})`
        ).join('; ') || '-';
        rows.push([
          o.id, o.order_number || '-', o.customer_name || '-', o.customer_phone || '-',
          o.total || 0, o.status || '-', o.delivery_method || '-',
          new Date(o.created_at).toLocaleDateString('id-ID'), items
        ]);
      });

      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_${startDate}_to_${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Gagal export: ' + err.message);
    }
  };

  // ─── CSS ─── 
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    :root {
      --bg-main: #f8f5f3;
      --bg-sidebar: #ffffff;
      --text-dark: #1e1b18;
      --text-muted: #888888;
      --brand: #702D43;
      --brand-light: #fce8ed;
      --pink-light: #fde8ed;
      --pink-dark: #d44d70;
      --purple-light: #efe8fc;
      --purple-dark: #7a49d4;
      --orange-light: #fcece3;
      --orange-dark: #d4662a;
      --border: #efefef;
      --shadow: 0 2px 16px rgba(0,0,0,0.04);
      --radius: 16px;
      --sidebar-width: 260px;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg-main); }

    .admin-wrap {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 24px 16px 20px;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 200;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
    }
    .sidebar-brand {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px 32px 4px;
    }
    .sidebar-brand h2 {
      color: var(--brand);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .sidebar-close {
      display: none;
      background: none;
      border: none;
      font-size: 22px;
      color: var(--text-muted);
      cursor: pointer;
    }

    .sidebar-menu {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      transition: all 0.2s;
      text-decoration: none;
      cursor: pointer;
    }
    .menu-item i { width: 20px; font-size: 17px; text-align: center; }
    .menu-item:hover { background: #f3efeb; color: var(--text-dark); }
    .menu-item.active {
      background: var(--brand-light);
      color: var(--brand);
      font-weight: 700;
    }

    .sidebar-footer {
      border-top: 1px solid var(--border);
      margin-top: 20px;
      padding-top: 20px;
    }
    .profile-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 6px 12px 6px;
    }
    .profile-box img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .profile-box h4 { font-size: 14px; font-weight: 700; }
    .profile-box p { font-size: 12px; color: var(--text-muted); }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: 10px;
      width: 100%;
      text-decoration: none;
      transition: all 0.2s;
    }
    .logout-btn:hover { background: #fde8ed; color: var(--brand); }

    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.25);
      z-index: 150;
      backdrop-filter: blur(2px);
    }

    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      padding: 24px 32px 40px;
      min-height: 100vh;
    }

    .top-nav {
      display: none;
      justify-content: space-between;
      align-items: center;
      height: 64px;
      margin-bottom: 20px;
      position: sticky;
      top: 0;
      background: var(--bg-main);
      z-index: 50;
    }
    .hamburger-btn {
      display: none;
      background: none;
      border: none;
      font-size: 22px;
      color: var(--text-dark);
      cursor: pointer;
      padding: 8px;
    }
    .hamburger-fixed {
      display: none;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 300;
      background: white;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 20px;
      cursor: pointer;
      box-shadow: var(--shadow);
    }

    .view-section {
      animation: fade 0.3s ease;
    }
    @keyframes fade {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 28px;
    }
    .header-title h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text-dark);
    }
    .header-title p {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 3px;
    }
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .date-range {
      display: flex;
      align-items: center;
      gap: 6px;
      background: white;
      padding: 4px 12px;
      border-radius: 30px;
      border: 1px solid #dcd8d3;
      flex-wrap: wrap;
    }
    .date-range label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .date-range input[type="date"] {
      border: none;
      padding: 6px 0;
      font-size: 13px;
      font-family: inherit;
      background: transparent;
      color: var(--text-dark);
      outline: none;
      cursor: pointer;
      width: 130px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 30px;
      font-weight: 700;
      font-size: 13px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      white-space: nowrap;
    }
    .btn-primary {
      background: var(--brand);
      color: white;
    }
    .btn-primary:hover {
      background: #5a2336;
      transform: translateY(-1px);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: white;
      border-radius: var(--radius);
      padding: 22px;
      border: 1px solid var(--border);
      transition: all 0.25s;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow);
    }
    .stat-card .icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      margin-bottom: 16px;
    }
    .stat-card .label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 4px;
    }
    .stat-card .value {
      font-size: 30px;
      font-weight: 800;
      color: var(--text-dark);
      letter-spacing: -0.3px;
    }
    .bg-pink   { background: var(--pink-light); color: var(--pink-dark); }
    .bg-purple { background: var(--purple-light); color: var(--purple-dark); }
    .bg-orange { background: var(--orange-light); color: var(--orange-dark); }

    /* ─── CHART ─── */
    .chart-card {
      background: white;
      border-radius: var(--radius);
      padding: 24px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      margin-bottom: 40px;
      max-width: 100%;
    }
    .chart-header {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 16px;
    }
    .chart-wrapper {
      position: relative;
      min-height: 350px;
      width: 100%;
    }

    .debug-box {
      background: #f0ece8;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 16px;
      border: 1px solid #e0dad5;
      font-family: monospace;
      overflow-x: auto;
      white-space: nowrap;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 13px;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 40px;
    }
    .footer-links {
      display: flex;
      gap: 20px;
    }
    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer-links a:hover { color: var(--brand); }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        box-shadow: 4px 0 24px rgba(0,0,0,0.08);
      }
      .sidebar.open { transform: translateX(0); }
      .sidebar-close { display: block; }
      .sidebar-overlay { display: block; }

      .main-content {
        margin-left: 0;
        padding: 70px 16px 20px;
      }
      .top-nav { display: flex; }
      .hamburger-btn { display: flex; align-items: center; justify-content: center; }
      .hamburger-fixed { display: flex; }

      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
      }
      .header-title h1 { font-size: 22px; }
      .header-actions { justify-content: stretch; }
      .date-range {
        flex: 1;
        justify-content: center;
        padding: 6px 10px;
      }
      .date-range input[type="date"] { width: 100px; font-size: 12px; }
      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .stat-card { padding: 18px; }
      .stat-card .value { font-size: 24px; }
      .chart-card { padding: 18px; }
      .chart-wrapper { min-height: 250px; }
      .footer {
        flex-direction: column;
        text-align: center;
      }
      .footer-links { justify-content: center; }
      .debug-box { font-size: 10px; white-space: normal; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .btn span { display: none; }
      .btn { padding: 10px 14px; }
      .date-range input[type="date"] { width: 90px; font-size: 11px; }
      .header-title h1 { font-size: 20px; }
      .chart-wrapper { min-height: 200px; }
    }
  `;

  // ─── RENDER KONTEN ───
  const renderContent = () => {
    const path = location.pathname;

    if (path === '/admin/dashboard') {
      return (
        <div className="view-section">
          <div className="dashboard-header">
            <div className="header-title">
              <h1>Dashboard</h1>
              <p>
                {isLoading ? '⏳ Memuat...' : errorMsg ? `⚠️ ${errorMsg}` : `📊 Data ${startDate} - ${endDate}`}
              </p>
            </div>
            <div className="header-actions">
              <div className="date-range">
                <label>Dari</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <label>s/d</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={exportToCSV}>
                <i className="fa-solid fa-download"></i> <span>Export</span>
              </button>
            </div>
          </div>

          {debugInfo && <div className="debug-box"><i className="fa-solid fa-bug"></i> {debugInfo}</div>}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="icon bg-pink"><i className="fa-solid fa-money-bill-wave"></i></div>
              <span className="label">Total Revenue</span>
              <div className="value">{formatCurrency(stats.revenue)}</div>
            </div>
            <div className="stat-card">
              <div className="icon bg-purple"><i className="fa-solid fa-basket-shopping"></i></div>
              <span className="label">Total Orders</span>
              <div className="value">{formatNumber(stats.orders)}</div>
            </div>
            <div className="stat-card">
              <div className="icon bg-orange"><i className="fa-solid fa-user-plus"></i></div>
              <span className="label">Total Customers</span>
              <div className="value">{formatNumber(stats.customers)}</div>
            </div>
          </div>

          {/* ─── CHART ─── */}
          <div className="chart-card">
            <div className="chart-header">📊 Performa Penjualan Harian</div>
            <div className="chart-wrapper">
              <canvas id="barChart"></canvas>
            </div>
          </div>

          <footer className="footer">
            <span>© 2026 SweetTech. Crafted with digital comfort.</span>
            <div className="footer-links"><a href="#about">About</a><a href="#privacy">Privacy</a><a href="#contact">Contact</a></div>
          </footer>
        </div>
      );
    }

    if (path === '/admin/menu') return <MenuManagementScreen />;
    if (path === '/admin/orders') return <OrderManagementScreen />;
    if (path === '/admin/customers') return <CustomerManagementScreen />;
    return <div>Halaman tidak ditemukan</div>;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="admin-wrap">

        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <h2>SweetTech</h2>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <nav className="sidebar-menu">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="profile-box">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Admin" />
              <div>
                <h4>Admin Sweet</h4>
                <p>Owner</p>
              </div>
            </div>
            <Link to="/admin/login" className="logout-btn">
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </Link>
          </div>
        </aside>

        <div className="main-content">
          <div className="top-nav">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>

          {renderContent()}
        </div>

        <button className="hamburger-fixed" onClick={() => setSidebarOpen(true)}>
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>
    </>
  );
};

export default AdminDashboardScreen;