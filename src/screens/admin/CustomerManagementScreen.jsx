// src/screens/admin/CustomerManagementScreen.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

// ─── Skeleton ───
function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <tr key={i} className="skeleton-row">
          <td><div className="skel skel-circle"></div></td>
          <td>
            <div className="skel skel-line"></div>
            <div className="skel skel-line short"></div>
          </td>
          <td><div className="skel skel-pill"></div></td>
          <td><div className="skel skel-pill" style={{ width: '60px' }}></div></td>
          <td><div className="skel skel-btn" style={{ margin: '0 auto' }}></div></td>
        </tr>
      ))}
    </>
  );
}

function MobileSkeletonCards() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="customer-card-mobile">
          <div className="skel skel-circle" style={{ width: '46px', height: '46px' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skel skel-line" style={{ marginBottom: '6px' }}></div>
            <div className="skel skel-line short"></div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function CustomerManagementScreen() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customersData, setCustomersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const navItems = [
    { path: '/admin/dashboard', icon: 'fa-solid fa-chart-pie', label: 'Dashboard' },
    { path: '/admin/menu', icon: 'fa-solid fa-utensils', label: 'Menu' },
    { path: '/admin/orders', icon: 'fa-solid fa-receipt', label: 'Orders' },
    { path: '/admin/customers', icon: 'fa-solid fa-user-group', label: 'Customers' },
  ];

  // ─── FETCH CUSTOMERS ───
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        setErrorMsg('');

        // Ambil semua profiles, filter admin di frontend
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) throw profilesError;

        if (!profiles || profiles.length === 0) {
          setCustomersData([]);
          setIsLoading(false);
          return;
        }

        // Filter: hanya user biasa (bukan admin)
        const usersOnly = profiles.filter(p => p.role !== 'admin');

        if (usersOnly.length === 0) {
          setCustomersData([]);
          setIsLoading(false);
          return;
        }

        // Ambil total orders per user
        const userIds = usersOnly.map(p => p.id);
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('user_id, total')
          .in('user_id', userIds);

        if (ordersError) console.warn('Gagal ambil orders:', ordersError);

        const orderMap = {};
        if (orders) {
          orders.forEach(o => {
            if (!orderMap[o.user_id]) {
              orderMap[o.user_id] = { count: 0, total: 0 };
            }
            orderMap[o.user_id].count += 1;
            orderMap[o.user_id].total += Number(o.total) || 0;
          });
        }

        const formatted = usersOnly.map(user => {
          const orderData = orderMap[user.id] || { count: 0, total: 0 };
          const displayName = user.full_name || user.username || user.name || 'Customer';

          return {
            id: user.id,
            name: displayName,
            orders: orderData.count,
            total_spent: orderData.total,
            avatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F3B5CD&color=702D43`,
            created_at: user.created_at,
            role: user.role || 'user'
          };
        });

        setCustomersData(formatted);
      } catch (error) {
        console.error('Gagal mengambil data pelanggan:', error);
        setErrorMsg('Gagal memuat data: ' + error.message);
        setCustomersData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // ─── STATS ───
  const stats = useMemo(() => {
    const total = customersData.length;
    const totalOrders = customersData.reduce((sum, c) => sum + c.orders, 0);
    return { total, totalOrders };
  }, [customersData]);

  // ─── FILTER ───
  const filteredCustomers = useMemo(() => {
    return customersData.filter(user =>
      user.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [customersData, searchText]);

  // ─── MODAL ───
  const openDeleteModal = (customer) => {
    setCustomerToDelete(customer);
    setIsModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsModalOpen(false);
    setCustomerToDelete(null);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      setCustomersData(prev => prev.filter(c => c.id !== customerToDelete.id));
      closeDeleteModal();
    } catch (error) {
      console.error('Gagal menghapus pelanggan:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
  };

  // ─── CSS ───
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
      --danger-color: #D03B2E;
      --danger-bg: #FEF3F2;
      --trend-green: #1E8A5E;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--primary-bg); }

    .cms-root { display: flex; min-height: 100vh; }

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

    /* ─── STATS ─── (hanya 2 card) */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
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
    .sc-total .stat-icon-box { background: #FDF2F4; color: #A34867; }
    .sc-orders .stat-icon-box { background: #FEF8EC; color: #B16643; }
    .trend-green { background: #EEF9F1; color: #2A855C; }
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
    .showing-text {
      font-size: 14px;
      color: var(--text-muted);
    }

    .customers-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .customers-table th {
      padding: 14px 12px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      letter-spacing: 0.5px;
    }
    .customers-table td {
      padding: 14px 12px;
      border-bottom: 1px solid var(--border-color);
      font-size: 14px;
      vertical-align: middle;
    }
    .customers-table tr:last-child td { border-bottom: none; }
    .customers-table tr:hover td { background: #FFFBFA; }

    .customer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(243,181,205,0.5);
    }
    .customer-name { font-weight: 700; color: var(--text-main); }

    .order-badge {
      background: rgba(243,181,205,0.25);
      color: #8B3352;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12.5px;
      font-weight: 700;
      display: inline-block;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--trend-green);
      background: rgba(30,138,94,0.09);
      padding: 4px 10px;
      border-radius: 20px;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--trend-green);
    }

    .btn-delete-action {
      background: var(--danger-bg);
      color: var(--danger-color);
      border: 1px solid rgba(208,59,46,0.1);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 14px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn-delete-action:hover {
      background: var(--danger-color);
      border-color: var(--danger-color);
      color: #fff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(208,59,46,0.25);
    }

    /* ─── MOBILE ─── */
    .mobile-cards-list { display: none; }
    .customer-card-mobile {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }
    .customer-card-mobile:last-child { border-bottom: none; }
    .ccard-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(243,181,205,0.5);
      flex-shrink: 0;
    }
    .ccard-body { flex: 1; min-width: 0; }
    .ccard-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ccard-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .ccard-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .btn-delete-sm {
      background: var(--danger-bg);
      color: var(--danger-color);
      border: none;
      padding: 7px 12px;
      border-radius: 9px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: inherit;
      transition: all 0.2s;
    }
    .btn-delete-sm:hover {
      background: var(--danger-color);
      color: #fff;
    }

    .table-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 12px;
    }
    .showing-text {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* ─── SKELETON ─── */
    .skeleton-row td { padding: 18px 16px; }
    .skel {
      border-radius: 8px;
      background: linear-gradient(90deg, #F0EDE9 25%, #E8E4E0 50%, #F0EDE9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    .skel-circle { width: 40px; height: 40px; border-radius: 50%; }
    .skel-line   { height: 12px; width: 80%; }
    .skel-line.short { width: 55%; margin-top: 6px; }
    .skel-pill   { height: 24px; width: 70px; border-radius: 20px; }
    .skel-btn    { height: 30px; width: 72px; border-radius: 10px; }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ─── MODAL ─── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: var(--modal-overlay);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      padding: 16px;
    }
    .modal-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }
    .modal-box {
      background: var(--card-bg);
      width: 100%;
      max-width: 400px;
      border-radius: 24px;
      padding: 32px 28px;
      text-align: center;
      box-shadow: 0 24px 64px rgba(0,0,0,0.12);
      transform: scale(0.92);
      transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-overlay.active .modal-box { transform: scale(1); }
    .warning-icon-box {
      width: 58px;
      height: 58px;
      background: var(--danger-bg);
      color: var(--danger-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      margin: 0 auto 18px;
      border: 3px solid rgba(208,59,46,0.12);
    }
    .modal-box h3 {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 8px;
    }
    .modal-box p {
      font-size: 13.5px;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .target-customer-info {
      font-weight: 700;
      color: var(--text-main);
      display: block;
      margin-top: 8px;
      font-size: 14px;
    }
    .modal-footer-btns { display: flex; gap: 10px; }
    .btn-modal-cancel {
      flex: 1;
      background: #F5F4F2;
      border: none;
      padding: 13px;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
      border-radius: 14px;
      cursor: pointer;
      transition: background 0.2s;
      font-family: inherit;
    }
    .btn-modal-cancel:hover { background: #EAEAEA; }
    .btn-modal-confirm-delete {
      flex: 1;
      background: linear-gradient(135deg, #D03B2E, #E8503F);
      color: #FFFFFF;
      border: none;
      padding: 13px;
      font-weight: 700;
      font-size: 14px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(208,59,46,0.3);
      font-family: inherit;
    }
    .btn-modal-confirm-delete:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(208,59,46,0.38);
    }

    /* ─── BOTTOM NAV ─── */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0; left: 0; right: 0;
      height: 62px;
      background: var(--card-bg);
      border-top: 1px solid var(--border-color);
      box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
      z-index: 90;
      justify-content: space-around;
      align-items: center;
      padding: 0 4px;
    }
    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 14px;
      border-radius: 12px;
      text-decoration: none;
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .bottom-nav-item i { font-size: 17px; }
    .bottom-nav-item.active {
      color: var(--btn-dark);
      background: rgba(243,181,205,0.25);
    }

    /* ─── RESPONSIVE ─── */
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

      .stats-grid { grid-template-columns: 1fr; gap: 14px; }
      .stat-card { padding: 16px; }
      .stat-value { font-size: 22px; }

      .table-section { padding: 16px; }
      .table-filters-row { flex-direction: column; align-items: stretch; }
      .showing-text { text-align: center; }

      .customers-table { display: none; }
      .mobile-cards-list { display: block; }

      .table-footer {
        justify-content: center;
        padding: 14px 16px;
      }
      .showing-text { display: none; }
    }

    @media (max-width: 480px) {
      .stat-card { padding: 14px; }
      .stat-value { font-size: 20px; }
      .modal-box { padding: 20px; }
      .bottom-nav { display: flex; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="cms-root">

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
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Admin"
              />
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
                <h1>👥 Customer Management</h1>
                <p>Manage and monitor all registered customers</p>
              </div>
              <div className="header-actions">
                <div className="search-wrapper">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {errorMsg && <div className="error-box">⚠️ {errorMsg}</div>}

            {/* STATS */}
            <div className="stats-grid">
              <div className="stat-card sc-total">
                <div className="stat-header">
                  <span className="stat-title">Total Customers</span>
                  <div className="stat-icon-box"><i className="fa-solid fa-users"></i></div>
                </div>
                <div className="stat-value">{stats.total}</div>
                <span className="stat-badge trend-green">Real-time</span>
              </div>
              <div className="stat-card sc-orders">
                <div className="stat-header">
                  <span className="stat-title">Total Orders</span>
                  <div className="stat-icon-box"><i className="fa-solid fa-shopping-bag"></i></div>
                </div>
                <div className="stat-value">{stats.totalOrders}</div>
                <span className="stat-badge badge-text-only">All time</span>
              </div>
            </div>

            {/* TABLE */}
            <div className="table-section">
              <div className="table-filters-row">
                <div className="showing-text">
                  Showing {filteredCustomers.length} of {customersData.length} customers
                </div>
              </div>

              {/* DESKTOP TABLE */}
              <table className="customers-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Photo</th>
                    <th>Name</th>
                    <th>Orders</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: '110px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonRows />
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map(user => (
                      <tr key={user.id}>
                        <td>
                          <img src={user.avatar} className="customer-avatar" alt={user.name} />
                        </td>
                        <td>
                          <div className="customer-name">{user.name}</div>
                        </td>
                        <td>
                          <span className="order-badge">{user.orders} Orders</span>
                        </td>
                        <td>
                          <span className="status-pill">
                            <span className="status-dot"></span>
                            Active
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-delete-action"
                            onClick={() => openDeleteModal(user)}
                          >
                            <i className="fa-regular fa-trash-can"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-user-slash" style={{ fontSize: '28px', marginBottom: '10px', display: 'block', opacity: 0.4 }}></i>
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* MOBILE CARDS */}
              <div className="mobile-cards-list">
                {isLoading ? (
                  <MobileSkeletonCards />
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map(user => (
                    <div key={user.id} className="customer-card-mobile">
                      <img src={user.avatar} className="ccard-avatar" alt={user.name} />
                      <div className="ccard-body">
                        <div className="ccard-name">{user.name}</div>
                        <div className="ccard-badges">
                          <span className="order-badge">{user.orders} Orders</span>
                          <span className="status-pill">
                            <span className="status-dot"></span>
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="ccard-actions">
                        <button
                          className="btn-delete-sm"
                          onClick={() => openDeleteModal(user)}
                        >
                          <i className="fa-regular fa-trash-can"></i> Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '3rem 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <i className="fa-solid fa-user-slash" style={{ fontSize: '28px', marginBottom: '10px', display: 'block', opacity: 0.4 }}></i>
                    No customers found.
                  </div>
                )}
              </div>

              {/* TABLE FOOTER (tanpa pagination) */}
              <div className="table-footer">
                <div className="showing-text">
                  Showing {filteredCustomers.length} of {customersData.length} customers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HAMBURGER FIXED */}
        <button className="hamburger-fixed" onClick={() => setSidebarOpen(true)}>
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      {/* ─── MODAL DELETE ─── */}
      <div
        className={`modal-overlay ${isModalOpen ? 'active' : ''}`}
        onClick={handleOverlayClick}
      >
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="warning-icon-box">
            <i className="fa-solid fa-trash-can"></i>
          </div>
          <h3>Delete Customer Account?</h3>
          <p>
            This action is permanent and cannot be undone.
            {customerToDelete && (
              <span className="target-customer-info">
                {customerToDelete.name}
              </span>
            )}
          </p>
          <div className="modal-footer-btns">
            <button className="btn-modal-cancel" onClick={closeDeleteModal}>Cancel</button>
            <button className="btn-modal-confirm-delete" onClick={confirmDelete}>
              <i className="fa-regular fa-trash-can" style={{ marginRight: '6px' }}></i>
              Yes, Delete
            </button>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM NAV (mobile) ─── */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}