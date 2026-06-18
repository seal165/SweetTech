// src/screens/admin/OrdersManagementScreen.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const statusOptions = [
  { value: 'pending', label: 'Pending', optClass: 'opt-pending' },
  { value: 'preparing', label: 'Preparing', optClass: 'opt-progress' },
  { value: 'ready', label: 'Ready', optClass: 'opt-delivery' },
  { value: 'completed', label: 'Completed', optClass: 'opt-completed' },
  { value: 'cancelled', label: 'Cancelled', optClass: 'opt-cancelled' }
];

const statusDisplayMap = {
  'pending': 'Pending',
  'preparing': 'Preparing',
  'ready': 'Ready',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
};

export default function OrdersManagementScreen() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchText, setSearchText] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const navItems = [
    { path: '/admin/dashboard', icon: 'fa-solid fa-chart-pie', label: 'Dashboard' },
    { path: '/admin/menu', icon: 'fa-solid fa-utensils', label: 'Menu' },
    { path: '/admin/orders', icon: 'fa-solid fa-receipt', label: 'Orders' },
    { path: '/admin/customers', icon: 'fa-solid fa-user-group', label: 'Customers' },
  ];

  // ─── FETCH ORDERS ───
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setErrorMsg('');
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(order => {
            const nameParts = (order.customer_name || 'Unknown').split(' ');
            const initial = nameParts.length > 1 
              ? nameParts[0][0] + nameParts[1][0] 
              : nameParts[0].substring(0, 2);

            const colorClasses = ['av-jd', 'av-mr', 'av-sk', 'av-lc', 'av-aw'];
            const randClass = colorClasses[(order.customer_name || '').length % colorClasses.length];

            return {
              id: order.id,
              order_number: order.order_number || `#${String(order.id).slice(0, 8)}`,
              customer: order.customer_name || 'Unknown',
              initialClass: randClass,
              initial: initial.toUpperCase(),
              product: order.notes || 'Order items',
              total: order.total || 0,
              status: statusDisplayMap[order.status] || order.status || 'Pending',
              raw_status: order.status || 'pending',
              created_at: order.created_at
            };
          });
          setOrders(formatted);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Gagal fetch orders:", error);
        setErrorMsg('Gagal memuat data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // ─── STATS ───
  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.raw_status === 'pending').length,
      completed: orders.filter(o => o.raw_status === 'completed').length,
      cancelled: orders.filter(o => o.raw_status === 'cancelled').length,
    };
  }, [orders]);

  // ─── FILTER ───
  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.customer.toLowerCase().includes(searchText.toLowerCase()) || 
      o.order_number.toLowerCase().includes(searchText.toLowerCase()) ||
      o.product.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [orders, searchText]);

  // ─── MODAL ───
  const handleOpenModal = (order) => {
    setActiveOrderId(order.id);
    setSelectedStatus(order.raw_status);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveOrderId(null);
    setSelectedStatus(null);
  };

  const handleSaveStatus = async () => {
    if (!activeOrderId || !selectedStatus) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: selectedStatus })
        .eq('id', activeOrderId);
      if (error) throw error;

      setOrders(prev => prev.map(o => 
        o.id === activeOrderId 
          ? { ...o, status: statusDisplayMap[selectedStatus], raw_status: selectedStatus } 
          : o
      ));
      handleCloseModal();
    } catch (error) {
      alert('Gagal update status: ' + error.message);
    }
  };

  const getStatusClass = (status) => {
    const map = {
      'Pending': 'pending',
      'Preparing': 'in-progress',
      'Ready': 'on-delivery',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
    };
    return map[status] || status.toLowerCase().replace(' ', '-');
  };

  // ─── CSS (SATU BLOK, konsisten dengan MenuManagementScreen) ───
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    :root {
      --primary-bg: #f8f5f3;
      --sidebar-bg: #ffffff;
      --card-bg: #FFFFFF;
      --text-main: #1A1A1A;
      --text-muted: #666666;
      --accent-pink: #F3B5CD;
      --btn-dark: #702D43;
      --border-color: #EAEAEA;
      --shadow: 0px 4px 20px rgba(0, 0, 0, 0.02);
      --modal-overlay: rgba(26, 26, 26, 0.4);
      --sidebar-width: 260px;

      --bg-pending: #FDF2F4; --text-pending: #A34867;
      --bg-progress: #FFF7ED; --text-progress: #C2410C;
      --bg-delivery: #EFF6FF; --text-delivery: #1D4ED8;
      --bg-completed: #EEF9F1; --text-completed: #2A855C;
      --bg-cancelled: #FDF3F2; --text-cancelled: #D34537;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--primary-bg); }

    .orders-wrap { display: flex; min-height: 100vh; }

    /* ─── SIDEBAR ─── */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
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
      color: var(--btn-dark);
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
    .menu-item:hover { background: #f3efeb; color: var(--text-main); }
    .menu-item.active {
      background: var(--accent-pink);
      color: var(--btn-dark);
      font-weight: 700;
    }

    .sidebar-footer {
      border-top: 1px solid var(--border-color);
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
    .logout-btn:hover { background: #fde8ed; color: var(--btn-dark); }

    .sidebar-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.25);
      z-index: 150;
      backdrop-filter: blur(2px);
    }

    /* ─── MAIN ─── */
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
      background: var(--primary-bg);
      z-index: 50;
    }
    .hamburger-btn {
      display: none;
      background: none;
      border: none;
      font-size: 22px;
      color: var(--text-main);
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
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 20px;
      cursor: pointer;
      box-shadow: var(--shadow);
    }

    .view-section { animation: fade 0.3s ease; }
    @keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    .error-box {
      background: #FEF3F2;
      color: #D34537;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      font-weight: 600;
      font-size: 13px;
      border: 1px solid #fcd3cf;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .title-area h1 {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.5px;
    }
    .title-area p {
      font-size: 14px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-wrapper { position: relative; }
    .search-wrapper i {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 15px;
    }
    .search-input {
      padding: 10px 16px 10px 38px;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 14px;
      width: 220px;
      outline: none;
      background-color: #FFFFFF;
    }
    .search-input:focus {
      border-color: var(--btn-dark);
      box-shadow: 0 0 0 3px rgba(112,45,67,0.1);
    }

    /* ─── STATS ─── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 30px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: var(--shadow);
      position: relative;
      transition: transform 0.2s;
    }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .stat-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
    }
    .stat-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--text-main);
    }
    .stat-badge {
      position: absolute;
      top: 20px;
      right: 24px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }
    .sc-orders .stat-icon-box { background: #FDF2F4; color: #A34867; }
    .sc-pending .stat-icon-box { background: #FEF8EC; color: #B16643; }
    .sc-completed .stat-icon-box { background: #EEF9F1; color: #2A855C; }
    .sc-cancelled .stat-icon-box { background: #FDF3F2; color: #D34537; }
    .trend-green { background: #EEF9F1; color: #2A855C; }
    .trend-red { background: #FDF3F2; color: #D34537; }
    .badge-text-only { font-size: 12px; color: var(--text-muted); font-weight: 600; }

    /* ─── TABLE ─── */
    .table-section {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      box-shadow: var(--shadow);
    }
    .table-filters-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .filter-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .btn-filter {
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-main);
      transition: all 0.2s;
    }
    .btn-filter:hover { background: #f5f0ee; }
    .showing-text {
      font-size: 14px;
      color: var(--text-muted);
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .orders-table th {
      padding: 14px 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      letter-spacing: 0.5px;
    }
    .orders-table td {
      padding: 14px 12px;
      border-bottom: 1px solid var(--border-color);
      font-size: 14px;
      vertical-align: middle;
    }
    .orders-table tr:last-child td { border-bottom: none; }
    .orders-table tr:hover td { background: #FFFBFA; }

    .order-id-link {
      color: var(--btn-dark);
      font-weight: 700;
      text-decoration: none;
    }
    .customer-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }
    .av-jd { background: #EBF3FF; color: #2B6CB0; }
    .av-mr { background: #FDF2F4; color: #A34867; }
    .av-sk { background: #FAF0EC; color: #B16643; }
    .av-lc { background: #F3EFF7; color: #6C5A89; }
    .av-aw { background: #EBFDF5; color: #22543D; }

    .customer-name { font-weight: 600; color: var(--text-main); }
    .product-title { color: var(--text-main); font-weight: 500; }
    .total-amount { font-weight: 700; color: var(--text-main); }

    .status-pill {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }
    .status-pill.pending { background: var(--bg-pending); color: var(--text-pending); }
    .status-pill.in-progress { background: var(--bg-progress); color: var(--text-progress); }
    .status-pill.on-delivery { background: var(--bg-delivery); color: var(--text-delivery); }
    .status-pill.completed { background: var(--bg-completed); color: var(--text-completed); }
    .status-pill.cancelled { background: var(--bg-cancelled); color: var(--text-cancelled); }

    /* ─── ACTION BUTTON ─── */
    .btn-action-edit {
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff !important;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }
    .btn-action-edit:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99,102,241,0.4);
    }
    .btn-action-edit i { color: #fff; }

    /* ─── PAGINATION ─── */
    .pagination-row {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 24px;
      gap: 8px;
    }
    .page-btn {
      height: 36px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: #FFFFFF;
      cursor: pointer;
      color: var(--text-main);
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s;
    }
    .page-btn.num-box { width: 36px; padding: 0; }
    .page-btn.active {
      background: var(--btn-dark);
      border-color: var(--btn-dark);
      color: #FFFFFF;
    }
    .page-btn:hover:not(.active) { border-color: var(--accent-pink); }

    /* ─── MODAL ─── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: var(--modal-overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      padding: 16px;
    }
    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-box {
      background: var(--card-bg);
      width: 100%;
      max-width: 420px;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0px 10px 40px rgba(0,0,0,0.08);
      transform: translateY(20px);
      transition: transform 0.3s ease;
    }
    .modal-overlay.active .modal-box { transform: translateY(0); }
    .modal-box h3 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 6px;
    }
    .modal-box .label-select {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 500;
      margin-bottom: 16px;
      display: block;
    }

    .status-options-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .status-option-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-radius: 12px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
      font-weight: 600;
    }
    .status-option-item.opt-pending { background: var(--bg-pending); color: var(--text-pending); }
    .status-option-item.opt-progress { background: var(--bg-progress); color: var(--text-progress); }
    .status-option-item.opt-delivery { background: var(--bg-delivery); color: var(--text-delivery); }
    .status-option-item.opt-completed { background: var(--bg-completed); color: var(--text-completed); }
    .status-option-item.opt-cancelled { background: var(--bg-cancelled); color: var(--text-cancelled); }

    .status-option-item.selected.opt-pending { border-color: #A34867; }
    .status-option-item.selected.opt-progress { border-color: #C2410C; }
    .status-option-item.selected.opt-delivery { border-color: #1D4ED8; }
    .status-option-item.selected.opt-completed { border-color: #2A855C; }
    .status-option-item.selected.opt-cancelled { border-color: #D34537; }

    .check-icon { font-size: 16px; display: none; }
    .status-option-item.selected .check-icon { display: block; }

    .modal-footer-btns {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-modal-cancel {
      background: none;
      border: none;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.2s;
    }
    .btn-modal-cancel:hover { color: var(--text-main); }
    .btn-modal-save {
      background: var(--btn-dark);
      color: #FFFFFF;
      border: none;
      padding: 12px 24px;
      font-weight: 600;
      font-size: 14px;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-modal-save:hover { opacity: 0.9; transform: translateY(-1px); }

    /* ─── RESPONSIVE ─── */
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

      .header-top { flex-direction: column; align-items: stretch; gap: 12px; }
      .title-area h1 { font-size: 22px; }
      .header-actions { justify-content: stretch; }
      .search-input { width: 100%; }

      .stats-grid { grid-template-columns: 1fr 1fr; gap: 14px; }
      .stat-card { padding: 16px; }
      .stat-value { font-size: 22px; }

      .table-section { padding: 16px; }
      .table-filters-row { flex-direction: column; align-items: stretch; }
      .filter-buttons { justify-content: center; }
      .showing-text { text-align: center; }

      .orders-table th { padding: 10px 8px; font-size: 11px; }
      .orders-table td { padding: 12px 8px; font-size: 13px; }
      .orders-table .hide-mobile { display: none; }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .stat-card { padding: 14px; }
      .stat-value { font-size: 20px; }
      .modal-box { padding: 20px; }
      .btn-filter span { display: none; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="orders-wrap">

        {/* OVERLAY */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* SIDEBAR */}
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

        {/* MAIN CONTENT */}
        <div className="main-content">

          {/* TOP NAV (mobile) */}
          <div className="top-nav">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>

          <div className="view-section">
            {/* HEADER */}
            <div className="header-top">
              <div className="title-area">
                <h1>📦 Orders Management</h1>
                <p>Review and process recent customer requests</p>
              </div>
              <div className="header-actions">
                <div className="search-wrapper">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input 
                    type="text" 
                    className="search-input" 
                    placeholder="Search orders..." 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {errorMsg && <div className="error-box">⚠️ {errorMsg}</div>}

            {/* STATS */}
            <div className="stats-grid">
              <div className="stat-card sc-orders">
                <div className="stat-header">
                  <span className="stat-title">Total Orders</span>
                  <div className="stat-icon-box"><i className="fa-solid fa-shopping-bag"></i></div>
                </div>
                <div className="stat-value">{stats.total}</div>
                <span className="stat-badge trend-green">Real-time</span>
              </div>
              <div className="stat-card sc-pending">
                <div className="stat-header">
                  <span className="stat-title">Pending</span>
                  <div className="stat-icon-box"><i className="fa-solid fa-clock-rotate-left"></i></div>
                </div>
                <div className="stat-value">{stats.pending}</div>
                <span className="stat-badge badge-text-only">Action Required</span>
              </div>
              <div className="stat-card sc-completed">
                <div className="stat-header">
                  <span className="stat-title">Completed</span>
                  <div className="stat-icon-box"><i className="fa-solid fa-circle-check"></i></div>
                </div>
                <div className="stat-value">{stats.completed}</div>
                <span className="stat-badge badge-text-only">All time</span>
              </div>
              <div className="stat-card sc-cancelled">
                <div className="stat-header">
                  <span className="stat-title">Cancelled</span>
                  <div className="stat-icon-box"><i className="fa-solid fa-circle-xmark"></i></div>
                </div>
                <div className="stat-value">{stats.cancelled}</div>
                <span className="stat-badge trend-red">Reviewed</span>
              </div>
            </div>

            {/* TABLE */}
            <div className="table-section">
              <div className="table-filters-row">
                <div className="filter-buttons">
                  <button className="btn-filter"><i className="fa-solid fa-sliders"></i> <span>Filter By</span></button>
                  <button className="btn-filter">
                    <i className="fa-solid fa-calendar-days"></i> <span>All Time</span> <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px' }}></i>
                  </button>
                </div>
                <div className="showing-text">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
              </div>

              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th className="hide-mobile">Product</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>⏳ Memuat data...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Tidak ada pesanan ditemukan</td></tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className="order-id-link">
                            {order.order_number}
                          </span>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <div className={`avatar-circle ${order.initialClass}`}>{order.initial}</div>
                            <span className="customer-name">{order.customer}</span>
                          </div>
                        </td>
                        <td className="product-title hide-mobile">
                          {order.product.length > 40 ? order.product.substring(0, 40) + '...' : order.product}
                        </td>
                        <td className="total-amount">Rp {order.total.toLocaleString('id-ID')}</td>
                        <td>
                          <span className={`status-pill ${getStatusClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className="btn-action-edit" 
                            onClick={() => handleOpenModal(order)}
                            title="Edit Status"
                          >
                            <i className="fa-regular fa-pen-to-square"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pagination-row">
                <button className="page-btn"><i className="fa-solid fa-chevron-left"></i> Previous</button>
                <button className="page-btn num-box active">1</button>
                <button className="page-btn">Next <i className="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
        </div>

        {/* HAMBURGER FIXED */}
        <button className="hamburger-fixed" onClick={() => setSidebarOpen(true)}>
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      {/* ─── MODAL ─── */}
      <div 
        className={`modal-overlay ${isModalOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target.classList.contains('modal-overlay')) handleCloseModal();
        }}
      >
        <div className="modal-box">
          <h3>✏️ Edit Status Pesanan</h3>
          <span className="label-select">Pilih status baru:</span>

          <div className="status-options-list">
            {statusOptions.map((opt) => (
              <div 
                key={opt.value}
                className={`status-option-item ${opt.optClass} ${selectedStatus === opt.value ? 'selected' : ''}`}
                onClick={() => setSelectedStatus(opt.value)}
              >
                <span>{opt.label}</span>
                <i className="fa-solid fa-circle-check check-icon"></i>
              </div>
            ))}
          </div>

          <div className="modal-footer-btns">
            <button className="btn-modal-cancel" onClick={handleCloseModal}>Batal</button>
            <button className="btn-modal-save" onClick={handleSaveStatus}>Simpan</button>
          </div>
        </div>
      </div>
    </>
  );
}