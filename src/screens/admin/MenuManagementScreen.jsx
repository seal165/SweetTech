// src/screens/admin/MenuManagementScreen.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const MenuManagementScreen = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    price: '',
    description: '',
    image: ''
  });

  const [editId, setEditId] = useState(null);

  const navItems = [
    { path: '/admin/dashboard', icon: 'fa-solid fa-table-columns', label: 'Dashboard' },
    { path: '/admin/menu', icon: 'fa-solid fa-utensils', label: 'Menu' },
    { path: '/admin/orders', icon: 'fa-solid fa-file-invoice', label: 'Orders' },
    { path: '/admin/customers', icon: 'fa-solid fa-users', label: 'Customers' },
  ];

  // ─── FETCH DATA ───
  const fetchMenu = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      if (data) setMenuItems(data);
    } catch (error) {
      console.error('Gagal memuat data menu:', error);
      setErrorMsg('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMenu();
    // Note: fetchMenu has no external dependencies to include
  }, []);

  // ─── DAFTAR KATEGORI UNIK ───
  const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];

  // ─── Helper ───
  const getCategoryClass = (category) => {
    if (!category) return 'panna-cotta';
    const cat = category.toLowerCase();
    if (cat.includes('cupcake')) return 'cupcakes';
    if (cat.includes('dessert') || cat.includes('box')) return 'dessertbox';
    return 'panna-cotta';
  };

  // ─── MODAL ───
  const handleOpenAddModal = () => {
    setErrorMsg('');
    setFormData({ id: '', name: '', category: '', price: '', description: '', image: '' });
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setErrorMsg('');
    setFormData({
      id: item.id,
      name: item.name || '',
      category: item.category || '',
      price: item.price ?? '',
      description: item.description || '',
      image: item.image || item.img || ''
    });
    setEditId(item.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setErrorMsg('');
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ id: '', name: '', category: '', price: '', description: '', image: '' });
  };

  const handleInputChange = (e) => {
    const { id, value, name } = e.target;
    const field = id || name;
    const fieldMap = {
      productName: 'name',
      productCategory: 'category',
      productPrice: 'price',
      productDescription: 'description',
      productImage: 'image',
      name: 'name',
      category: 'category',
      price: 'price',
      description: 'description',
      image: 'image'
    };
    const key = fieldMap[field] || field;
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ─── SUBMIT (Create / Update) ───
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue < 0) {
      setErrorMsg('Harga harus berupa angka positif.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (!formData.category.trim()) {
      setErrorMsg('Kategori wajib diisi.');
      return;
    }

    try {
      if (editId) {
        // ─── UPDATE ───
        const productData = {
          name: formData.name.trim(),
          category: formData.category.trim(),
          price: priceValue,
          description: formData.description?.trim() || '',
          image: formData.image || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&auto=format&fit=crop&q=80'
        };

        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editId);

        if (error) throw error;

        setMenuItems(prev => prev.map(item =>
          item.id === editId
            ? { ...item, ...productData, id: editId }
            : item
        ));
      } else {
        // ─── CREATE ───
        // 1. Ambil max id
        const { data: maxData, error: maxError } = await supabase
          .from('products')
          .select('id')
          .order('id', { ascending: false })
          .limit(1);

        if (maxError) throw maxError;

        const newId = maxData && maxData.length > 0 ? maxData[0].id + 1 : 1;

        const productData = {
          id: newId,
          name: formData.name.trim(),
          category: formData.category.trim(),
          price: priceValue,
          description: formData.description?.trim() || '',
          image: formData.image || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&auto=format&fit=crop&q=80'
        };

        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;
        if (data) setMenuItems(prev => [data, ...prev]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Gagal menyimpan produk:', error);
      setErrorMsg('Gagal menyimpan produk: ' + error.message);
    }
  };

  // ─── DELETE ───
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus item ini?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Gagal menghapus produk:', error);
      alert('Gagal menghapus produk: ' + error.message);
    }
  };

  const totalRevenue = menuItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

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
      --danger-color: #D03B2E;
      --danger-bg: #FEF3F2;
      --trend-green: #1E8A5E;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg-main); }

    .admin-wrap {
      display: flex;
      min-height: 100vh;
    }

    /* ─── SIDEBAR ─── */
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

    /* ─── MAIN ─── */
    .main-content {
      margin-left: var(--sidebar-width);
      flex: 1;
      padding: 24px 32px 40px;
      min-height: 100vh;
    }

    /* ─── TOP NAV ─── */
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

    /* ─── MENU MANAGEMENT ─── */
    .mms-header {
      margin-bottom: 28px;
    }
    .mms-header h1 {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-dark);
      letter-spacing: -0.5px;
    }
    .mms-header p {
      font-size: 13.5px;
      color: var(--text-muted);
      margin-top: 3px;
    }

    .mms-summary {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .mms-stat {
      background: white;
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
      transition: transform 0.2s;
    }
    .mms-stat:hover { transform: translateY(-2px); }
    .mms-stat-info p {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .mms-stat-info h2 {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-dark);
      letter-spacing: -0.8px;
    }
    .mms-stat-info .trend {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--trend-green);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .mms-stat-icon {
      width: 44px;
      height: 44px;
      background: rgba(112,45,67,0.08);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brand);
      font-size: 18px;
      flex-shrink: 0;
    }

    .mms-section {
      background: white;
      border: 1px solid var(--border);
      border-radius: 20px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .mms-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 12px;
    }
    .mms-section-header h2 {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-dark);
    }
    .mms-section-header p {
      font-size: 13px;
      color: var(--text-muted);
    }

    .btn-add {
      background: linear-gradient(135deg, var(--brand), #A0405E);
      color: #fff;
      border: none;
      padding: 11px 20px;
      font-weight: 700;
      font-size: 13.5px;
      border-radius: 50px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      font-family: inherit;
      box-shadow: 0 4px 14px rgba(112,45,67,0.28);
    }
    .btn-add:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(112,45,67,0.36);
    }

    .mms-table {
      width: 100%;
      border-collapse: collapse;
    }
    .mms-table th {
      padding: 14px 16px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      background: #FAFAFA;
      border-bottom: 1px solid var(--border);
      letter-spacing: 0.5px;
      text-align: left;
    }
    .mms-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      font-size: 14px;
      color: #333;
      vertical-align: middle;
    }
    .mms-table tr:last-child td { border-bottom: none; }
    .mms-table tr:hover td { background: #FFFBFA; }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .product-img {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
      border: 1px solid var(--border);
      background: #f5f5f5;
    }
    .product-name { font-weight: 700; color: var(--text-dark); }

    .badge-cat {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12.5px;
      font-weight: 700;
      display: inline-block;
    }
    .badge-cat.cupcakes    { background: rgba(243,181,205,0.25); color: #8B3352; }
    .badge-cat.dessertbox  { background: #FAF0EC; color: #B16643; }
    .badge-cat.panna-cotta { background: #F3EFF7; color: #6C5A89; }

    .price-text { font-weight: 600; color: var(--text-dark); }

    .action-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 15px;
      transition: all 0.2s ease;
      color: #fff;
      text-decoration: none;
    }

    /* Tombol Edit */
    .action-btn.edit {
      background: linear-gradient(135deg, #6366f1, #818cf8);
      color: #fff;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .action-btn.edit:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }

    .action-btn.edit:active {
      transform: scale(0.95);
    }

    /* Tombol Delete */
    .action-btn.delete {
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: #fff;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    .action-btn.delete:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    }

    .action-btn.delete:active {
      transform: scale(0.95);
    }

    /* Responsive: ukuran lebih kecil di HP */
    @media (max-width: 768px) {
      .action-btn {
        width: 32px;
        height: 32px;
        font-size: 13px;
        border-radius: 8px;
      }
    }
  
    .action-btn:hover { background: #fde8ed; border-color: #fde8ed; color: var(--brand); }
    .action-btn.delete:hover { background: var(--danger-color); border-color: var(--danger-color); color: #fff; }

    .mms-table-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 12px;
    }
    .mms-table-footer span {
      font-size: 13px;
      color: var(--text-muted);
    }

    .error-box {
      background: var(--danger-bg);
      color: var(--danger-color);
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 16px;
      font-weight: 600;
      font-size: 13px;
      border: 1px solid #fcd3cf;
    }

    /* ─── MOBILE CARDS ─── */
    .mms-mobile-list { display: none; }
    .menu-card-mobile {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
    }
    .menu-card-mobile:last-child { border-bottom: none; }
    .mcm-img {
      width: 52px;
      height: 52px;
      border-radius: 10px;
      object-fit: cover;
      border: 1px solid var(--border);
      flex-shrink: 0;
    }
    .mcm-body { flex: 1; min-width: 0; }
    .mcm-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mcm-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .mcm-price { font-size: 13px; font-weight: 600; color: var(--brand); }
    .mcm-actions { display: flex; gap: 8px; flex-shrink: 0; }

    /* ─── MODAL ─── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(26,26,26,0.45);
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
    .modal-wrapper {
      background: white;
      width: 100%;
      max-width: 480px;
      border-radius: 24px;
      padding: 32px 28px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.12);
      transform: scale(0.92);
      transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-overlay.active .modal-wrapper { transform: scale(1); }

    .modal-header { margin-bottom: 24px; }
    .modal-header h3 {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-dark);
      letter-spacing: -0.3px;
    }
    .modal-header p {
      font-size: 13.5px;
      color: var(--text-muted);
    }

    .form-group { margin-bottom: 16px; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .form-group label {
      display: block;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid var(--border);
      border-radius: 11px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-dark);
      outline: none;
      background: #FAFAFA;
      transition: all 0.2s;
      font-family: inherit;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      border-color: var(--brand);
      background: #fff;
      box-shadow: 0 0 0 4px rgba(112,45,67,0.06);
    }
    .form-group textarea {
      resize: none;
      height: 80px;
      line-height: 1.5;
    }
    .price-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .price-wrap span {
      font-weight: 700;
      color: var(--text-muted);
    }
    .price-wrap input { flex: 1; }

    /* Datalist styling */
    input[list]::-webkit-calendar-picker-indicator {
      opacity: 0.5;
      cursor: pointer;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
    }
    .btn-cancel {
      background: #F5F4F2;
      border: none;
      padding: 11px 20px;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
      border-radius: 50px;
      cursor: pointer;
      transition: background 0.2s;
      font-family: inherit;
    }
    .btn-cancel:hover { background: #EAEAEA; }
    .btn-submit {
      background: linear-gradient(135deg, var(--brand), #A0405E);
      color: #fff;
      border: none;
      padding: 11px 24px;
      font-weight: 700;
      font-size: 14px;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      box-shadow: 0 4px 14px rgba(112,45,67,0.28);
    }
    .btn-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(112,45,67,0.36);
    }

    /* ─── RESPONSIVE ─── */
    @media (max-width: 1024px) {
      .mms-summary { grid-template-columns: 1fr 1fr; }
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

      .mms-header h1 { font-size: 22px; }
      .mms-summary { grid-template-columns: 1fr; gap: 12px; }
      .mms-stat-info h2 { font-size: 22px; }
      .mms-section-header { padding: 14px 16px; }

      .mms-table { display: none; }
      .mms-mobile-list { display: block; }

      .mms-table-footer {
        justify-content: center;
        padding: 14px 16px;
      }
      .mms-table-footer span { display: none; }

      .form-row { grid-template-columns: 1fr; }
      .modal-wrapper { padding: 24px 18px; }
    }

    @media (max-width: 480px) {
      .mms-stat { padding: 16px; }
      .mms-stat-info h2 { font-size: 20px; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="admin-wrap">

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
          <div className="top-nav">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>

          <div className="view-section">
            <div className="mms-header">
              <h1>🍽️ Menu Management</h1>
              <p>Kelola daftar produk manis dari database Supabase.</p>
            </div>

            {errorMsg && <div className="error-box">⚠️ {errorMsg}</div>}

            <div className="mms-summary">
              <div className="mms-stat">
                <div className="mms-stat-info">
                  <p>Total Menu Value</p>
                  <h2>Rp {totalRevenue.toLocaleString('id-ID')}</h2>
                  <span className="trend"><i className="fa-solid fa-arrow-trend-up"></i> Real-time</span>
                </div>
                <div className="mms-stat-icon"><i className="fa-solid fa-wallet"></i></div>
              </div>
              <div className="mms-stat">
                <div className="mms-stat-info">
                  <p>Total Items</p>
                  <h2>{menuItems.length}</h2>
                  <span className="trend"><i className="fa-solid fa-rotate"></i> Updated</span>
                </div>
                <div className="mms-stat-icon"><i className="fa-solid fa-box-open"></i></div>
              </div>
            </div>

            <section className="mms-section">
              <div className="mms-section-header">
                <div>
                  <h2>Daftar Menu</h2>
                  <p>Tambah, edit, atau hapus menu produk.</p>
                </div>
                <button className="btn-add" onClick={handleOpenAddModal}>
                  <i className="fa-solid fa-plus"></i> Tambah Menu
                </button>
              </div>

              {/* ─── DESKTOP TABLE ─── */}
              <table className="mms-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>⏳ Memuat...</td></tr>
                  ) : menuItems.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada menu. Tambahkan sekarang!</td></tr>
                  ) : (
                    menuItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="product-cell">
                            <img
                              src={item.image || item.img || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&auto=format&fit=crop&q=80'}
                              className="product-img"
                              alt={item.name}
                            />
                          </div>
                        </td>
                        <td className="product-name">{item.name}</td>
                        <td>
                          <span className={`badge-cat ${getCategoryClass(item.category)}`}>
                            {item.category || 'Panna Cotta'}
                          </span>
                        </td>
                        <td className="price-text">Rp {(Number(item.price) || 0).toLocaleString('id-ID')}</td>
                        <td>
                          <div className="action-actions">
                            <button 
                              className="action-btn edit" 
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit"
                            >
                              <i className="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDelete(item.id)}
                              title="Hapus"
                            >
                              <i className="fa-regular fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* ─── MOBILE CARDS ─── */}
              <div className="mms-mobile-list">
                {isLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>⏳ Memuat...</div>
                ) : menuItems.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada menu.</div>
                ) : (
                  menuItems.map(item => (
                    <div key={item.id} className="menu-card-mobile">
                      <img
                        src={item.image || item.img || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&auto=format&fit=crop&q=80'}
                        className="mcm-img"
                        alt={item.name}
                      />
                      <div className="mcm-body">
                        <div className="mcm-name">{item.name}</div>
                        <div className="mcm-meta">
                          <span className={`badge-cat ${getCategoryClass(item.category)}`}>
                            {item.category || 'Panna Cotta'}
                          </span>
                          <span className="mcm-price">Rp {(Number(item.price) || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="mcm-actions">
                        <button 
                          className="action-btn edit" 
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit"
                        >
                          <i className="fa-regular fa-pen-to-square"></i>
                        </button>
                        <button 
                          className="action-btn delete" 
                          onClick={() => handleDelete(item.id)}
                          title="Hapus"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mms-table-footer">
                <span>Menampilkan {menuItems.length} item</span>
              </div>
            </section>
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
        onClick={(e) => e.target.className.includes('modal-overlay') && handleCloseModal()}
      >
        <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{editId ? '✏️ Edit Menu' : '➕ Tambah Menu'}</h3>
            <p>{editId ? 'Ubah detail produk manis ini.' : 'Isi detail untuk menambahkan produk baru.'}</p>
          </div>

          {errorMsg && <div className="error-box" style={{ marginBottom: '16px' }}>⚠️ {errorMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nama Produk</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Contoh: Lavender Honey Cake"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Kategori</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  list="category-list"
                  placeholder="Ketik atau pilih kategori"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                />
                <datalist id="category-list">
                  {categories.map((cat, i) => (
                    <option key={i} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label htmlFor="price">Harga (Rp)</label>
                <div className="price-wrap">
                  <span>Rp</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="1"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Deskripsi</label>
              <textarea
                id="description"
                name="description"
                placeholder="Ceritakan tentang produk ini..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">URL Gambar (opsional)</label>
              <input
                type="text"
                id="image"
                name="image"
                placeholder="https://example.com/gambar.jpg"
                value={formData.image}
                onChange={handleInputChange}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={handleCloseModal}>Batal</button>
              <button type="submit" className="btn-submit">
                {editId ? 'Update' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default MenuManagementScreen;