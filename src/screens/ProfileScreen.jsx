// src/screens/ProfileScreen.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import logoImg from '../assets/logo.png'

export default function ProfileScreen({ user, onLogout }) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar: '',
    phone: '',
    address: ''
  })

  const [showModal, setShowModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [cartCount, setCartCount] = useState(0)

  // Fetch profile and orders from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            name: profileData.full_name || '',
            email: user.email || '',
            avatar: profileData.avatar_url || '',
            phone: profileData.phone || '',
            address: profileData.address || ''
          })
        } else {
          setProfile({
            name: '',
            email: user.email || '',
            avatar: '',
            phone: '',
            address: ''
          })
        }

        const { data: ordersData } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              product_name,
              quantity,
              product_price,
              subtotal
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (ordersData) setOrders(ordersData)
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user])

  // Fetch cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return
        const { data, error } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', currentUser.id)
        if (!error && data) {
          const total = data.reduce((sum, item) => sum + (item.quantity || 0), 0)
          setCartCount(total)
        }
      } catch (err) {
        console.error('Error fetching cart count:', err)
      }
    }
    fetchCartCount()
  }, [])

  // Lock scroll saat modal terbuka
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [showModal])

  const openModal = () => {
    setEditName(profile.name)
    setEditAvatar(profile.avatar)
    setEditPhone(profile.phone)
    setEditAddress(profile.address)
    setShowModal(true)
  }
  const closeModal = () => setShowModal(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran file maksimal 2MB!'); return }
    if (!file.type.match('image.*')) { alert('Hanya file gambar yang diperbolehkan!'); return }
    const reader = new FileReader()
    reader.onloadend = () => setEditAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editName,
          avatar_url: editAvatar,
          phone: editPhone,
          address: editAddress,
          updated_at: new Date()
        })
      if (error) throw error
      setProfile({ ...profile, name: editName, avatar: editAvatar, phone: editPhone, address: editAddress })
      await supabase.auth.updateUser({ data: { full_name: editName, avatar_url: editAvatar } })
      alert('Profil berhasil diperbarui!')
      closeModal()
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Gagal memperbarui profil: ' + err.message)
    }
  }

  const handleLogout = async () => {
    if (onLogout) { await onLogout(); navigate('/login') }
  }

  const getStatusText = (status) => ({
    pending: 'Menunggu Konfirmasi',
    preparing: 'Sedang Disiapkan',
    ready: 'Siap Diambil/Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  }[status] || status)

  const getStatusDotColor = (status) => ({
    pending: '#f39c12',
    preparing: '#6d6480',
    ready: '#27ae60',
    completed: '#3498db',
    cancelled: '#d33c44'
  }[status] || '#6d6480')

  const toRupiah = (amount) => 'Rp ' + Number(amount).toLocaleString('id-ID')

  // ======================== CSS ========================
  const styles = `
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    :root {
      --brand-color: #704455;
      --primary-text: #2d2426;
      --bg-color: #faf8f6;
      --card-bg: #ffffff;
      --text-muted: #7d6f73;
      --border-color: #ebe4e6;
      --btn-dark: #8b5b6e;
      --pink-btn: #f8c0d2;
      --logout-red: #d33c44;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Poppins', sans-serif;
    }
    .profile-container {
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
    .user-icon-active {
      color: var(--brand-color);
    }
    .user-icon-active::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: var(--brand-color);
    }
    .cart-badge-profile {
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

    /* --- MAIN CONTENT --- */
    .profile-main {
      flex: 1;
      padding: 2rem 0;
    }
    .profile-header-card {
      background: linear-gradient(135deg, #fbf7f4 0%, #fbe8ee 100%);
      border-radius: 20px;
      padding: 3rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(112, 68, 85, 0.03);
      margin-bottom: 3rem;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .profile-info-left {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    .profile-avatar-wrap {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background-color: #f5f0f2;
      box-shadow: 0 0 0 6px #ffffff, 0 0 25px rgba(248, 192, 210, 0.6);
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .profile-avatar-wrap:hover {
      transform: scale(1.03);
    }
    .profile-avatar-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f0f2;
      border-radius: 50%;
      color: #b8a8ae;
      font-size: 4rem;
    }
    .profile-name {
      font-size: 2.2rem;
      font-weight: 700;
      color: #1a1a1a;
    }
    .profile-name.empty {
      color: #c4a8b2;
      font-style: italic;
      font-size: 1.4rem;
      font-weight: 400;
    }
    .btn-edit-profile {
      background-color: var(--btn-dark);
      color: #ffffff;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 25px;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background-color 0.3s;
      font-family: 'Poppins', sans-serif;
    }
    .btn-edit-profile:hover {
      background-color: var(--brand-color);
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 3rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.8rem;
    }
    .section-header h2 {
      font-size: 1.4rem;
      font-weight: 600;
      color: #1a1a1a;
    }
    .active-tab {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--brand-color);
      border-bottom: 2px solid var(--brand-color);
      padding-bottom: 0.7rem;
      margin-bottom: -0.9rem;
    }
    .order-card {
      background-color: var(--card-bg);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      gap: 1.5rem;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 15px rgba(0,0,0,0.01);
      margin-bottom: 1rem;
      transition: box-shadow 0.2s;
    }
    .order-card:hover {
      box-shadow: 0 6px 20px rgba(112, 68, 85, 0.08);
    }
    .order-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .order-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .order-title-row h3 {
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--primary-text);
      max-width: 75%;
    }
    .order-price {
      font-size: 1rem;
      font-weight: 700;
      color: var(--brand-color);
      white-space: nowrap;
    }
    .order-items-list {
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .order-item-line {
      font-size: 0.82rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .order-items-text {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      margin-bottom: 0.8rem;
    }
    .order-status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
      margin-top: 0.5rem;
    }
    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #5a5169;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .order-time {
      color: var(--text-muted);
    }
    .info-card {
      background-color: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      margin-bottom: 1rem;
    }
    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 0.5rem 0;
      color: var(--text-muted);
      font-size: 0.9rem;
      border-bottom: 1px solid #f5f0f2;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-row i {
      width: 20px;
      color: var(--brand-color);
      margin-top: 0.15rem;
      flex-shrink: 0;
    }
    .info-empty {
      color: #c4a8b2;
      font-style: italic;
    }
    .logout-card {
      background-color: #fdfaf9;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .logout-card:hover {
      background-color: #fbeded;
    }
    .logout-icon {
      width: 40px;
      height: 40px;
      background-color: #fceded;
      color: var(--logout-red);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .logout-card span {
      color: var(--logout-red);
      font-weight: 500;
      font-size: 0.95rem;
    }
    .empty-orders {
      text-align: center;
      padding: 3rem;
      background-color: var(--card-bg);
      border-radius: 16px;
      border: 1px solid var(--border-color);
    }
    .empty-orders p {
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .btn-order-now {
      display: inline-block;
      padding: 0.6rem 1.5rem;
      background-color: var(--pink-btn);
      color: var(--brand-color);
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }
    .btn-order-now:hover {
      background-color: #f19fb5;
    }
    .loading-screen {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      font-size: 1rem;
      color: var(--text-muted);
    }

    /* ── MODAL (diperbaiki) ── */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(250, 246, 245, 0.85);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      pointer-events: none;
    }
    .modal-overlay.show {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
    .modal-content {
      background-color: var(--card-bg);
      width: 100%;
      max-width: 450px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 2.5rem 2rem;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(112, 68, 85, 0.15);
      transform: translateY(20px) scale(0.98);
      transition: transform 0.3s ease;
      text-align: center;
      pointer-events: auto;
      position: relative;
      z-index: 10000;
    }
    .modal-overlay.show .modal-content {
      transform: translateY(0) scale(1);
    }
    .modal-content::-webkit-scrollbar {
      width: 4px;
    }
    .modal-content::-webkit-scrollbar-thumb {
      background-color: var(--border-color);
      border-radius: 4px;
    }
    .modal-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .modal-content h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary-text);
      margin-bottom: 1.5rem;
    }
    .modal-avatar-preview {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      box-shadow: 0 0 0 4px #ffffff, 0 0 15px rgba(248, 192, 210, 0.5);
      object-fit: cover;
      display: block;
      background-color: #f5f0f2;
    }
    .modal-avatar-placeholder {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      background-color: #f5f0f2;
      box-shadow: 0 0 0 4px #ffffff, 0 0 15px rgba(248, 192, 210, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #b8a8ae;
      font-size: 3.5rem;
    }
    .modal-form-group {
      text-align: left;
      margin-bottom: 1.25rem;
    }
    .modal-form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .upload-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .btn-upload {
      background-color: #e0d4f5;
      color: #6a4c9c;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: 'Poppins', sans-serif;
      transition: background-color 0.2s;
    }
    .btn-upload:hover {
      background-color: #d0c0e8;
    }
    .upload-hint {
      font-size: 0.75rem;
      color: #a09398;
    }
    .modal-input {
      width: 100%;
      padding: 0.9rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      font-size: 0.95rem;
      color: var(--primary-text);
      outline: none;
      transition: border-color 0.3s;
      font-family: 'Poppins', sans-serif;
      background-color: var(--bg-color);
      resize: none;
      pointer-events: auto;
      cursor: text;
    }
    .modal-input:focus {
      border-color: var(--brand-color);
    }
    .btn-save {
      width: 100%;
      background-color: var(--pink-btn);
      color: var(--brand-color);
      border: none;
      padding: 1rem;
      border-radius: 30px;
      font-size: 1.05rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.3s, transform 0.1s;
      font-family: 'Poppins', sans-serif;
      pointer-events: auto;
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-save:hover {
      background-color: #f19fb5;
      transform: scale(1.02);
    }
    .btn-cancel {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 1rem;
      cursor: pointer;
      font-family: 'Poppins', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      pointer-events: auto;
      transition: color 0.2s;
    }
    .btn-cancel:hover {
      color: var(--brand-color);
    }

    /* --- FOOTER --- */
    .profile-footer {
      margin-top: 3rem;
      background-color: #f4efed;
      padding: 2.5rem 0;
    }
    .footer-content-custom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem;
      width: 100%;
      box-sizing: border-box;
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .footer-links {
      display: flex;
      gap: 2rem;
    }
    .footer-links a {
      text-decoration: none;
      color: var(--text-muted);
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    .footer-links a:hover {
      color: var(--brand-color);
    }

    /* --- RESPONSIVE --- */
    @media (max-width: 850px) {
      .nav-links { display: none; }
      .hamburger { display: flex; }
      .mobile-menu { display: none; }
      .mobile-menu.open { display: flex; }
      .dashboard-grid { grid-template-columns: 1fr; }
      .profile-header-card {
        flex-direction: column;
        text-align: center;
        gap: 2rem;
        padding: 2rem;
      }
      .profile-info-left {
        flex-direction: column;
        align-items: center;
      }
      .container { padding: 0 1rem; }
      .footer-content-custom {
        flex-direction: column;
        text-align: center;
        padding: 0 1rem;
      }
      .footer-links {
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
      }
    }
    @media (max-width: 500px) {
      .order-card { flex-direction: column; }
      .modal-content { padding: 1.5rem 1rem; margin: 0.5rem; }
      .profile-name { font-size: 1.5rem; }
      .profile-header-card { padding: 1.5rem; }
      .profile-avatar-wrap { width: 90px; height: 90px; }
      .avatar-placeholder { font-size: 3rem; }
    }
  `;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="profile-container">
          <div className="loading-screen">Loading profile...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>
      <div className="profile-container">

        {/* HEADER */}
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
              <Link to="/cart">
                <i className="fa-solid fa-cart-shopping"></i>
                {cartCount > 0 && <span className="cart-badge-profile">{cartCount}</span>}
              </Link>
              <Link to="/profile" className="user-icon-active">
                <i className="fa-regular fa-user"></i>
              </Link>
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

        {/* MAIN */}
        <main className="profile-main container">

          {/* Profile Banner */}
          <section className="profile-header-card">
            <div className="profile-info-left">
              <div className="profile-avatar-wrap" onClick={openModal}>
                {profile.avatar
                  ? <img src={profile.avatar} alt={profile.name || 'Avatar'} />
                  : <div className="avatar-placeholder">
                      <i className="fa-regular fa-user-circle"></i>
                    </div>
                }
              </div>
              <div>
                {profile.name
                  ? <h1 className="profile-name">{profile.name}</h1>
                  : <h1 className="profile-name empty">Belum Diisi</h1>
                }
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  {profile.email}
                </p>
              </div>
            </div>
            <button className="btn-edit-profile" onClick={openModal}>
              <i className="fa-solid fa-pen"></i> Edit Profile
            </button>
          </section>

          <div className="dashboard-grid">

            {/* MY ORDERS */}
            <div className="orders-section">
              <div className="section-header">
                <h2>My Orders</h2>
              </div>
              {orders.length === 0 ? (
                <div className="empty-orders">
                  <p>Belum ada pesanan</p>
                  <Link to="/menu" className="btn-order-now">Mulai Belanja</Link>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-details">
                      <div>
                        <div className="order-title-row">
                          <h3>Order #{order.order_number || order.id.slice(0, 8)}</h3>
                          <span className="order-price">{toRupiah(order.total)}</span>
                        </div>
                        {order.order_items?.length > 0 && (
                          <div className="order-items-list">
                            {order.order_items.map((item, idx) => (
                              <span key={item.id || idx} className="order-item-line">
                                • {item.product_name} x{item.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="order-items-text">
                          {order.delivery_method === 'pickup' ? 'Ambil Sendiri' : 'Delivery'}
                        </p>
                      </div>
                      <div className="order-status-row">
                        <div className="status-badge">
                          <span className="status-dot" style={{ backgroundColor: getStatusDotColor(order.status) }}></span>
                          {getStatusText(order.status)}
                        </div>
                        <span className="order-time">
                          {new Date(order.created_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ACCOUNT */}
            <div className="account-section">
              <div className="section-header">
                <h2>Account</h2>
                <span className="active-tab">Active</span>
              </div>
              <div className="info-card">
                <div className="info-row">
                  <i className="fa-regular fa-envelope"></i>
                  <span>{profile.email || '-'}</span>
                </div>
                <div className="info-row">
                  <i className="fa-solid fa-phone"></i>
                  <span>{profile.phone || <span className="info-empty">Belum diisi</span>}</span>
                </div>
                <div className="info-row">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>{profile.address || <span className="info-empty">Belum diisi</span>}</span>
                </div>
                <div className="info-row">
                  <i className="fa-regular fa-calendar"></i>
                  <span>Member since {user?.created_at ? new Date(user.created_at).getFullYear() : 2026}</span>
                </div>
              </div>
              <div className="logout-card" onClick={handleLogout}>
                <div className="logout-icon"><i className="fa-solid fa-arrow-right-from-bracket"></i></div>
                <span>Log Out</span>
              </div>
            </div>

          </div>
        </main>

        {/* FOOTER */}
        <footer className="profile-footer">
          <div className="footer-content-custom">
            <div className="logo-container" style={{ gap: '0.5rem' }}>
              <span className="logo-text" style={{ fontSize: '1.1rem' }}>SweetTech</span>
            </div>
            <div className="footer-links">
              <Link to="/about">About Us</Link>
              <Link to="#">Contact</Link>
              <Link to="#">FAQs</Link>
              <Link to="#">Privacy Policy</Link>
            </div>
            <span>© 2026 SweetTech. All rights reserved.</span>
          </div>
        </footer>

        {/* ── MODAL EDIT PROFILE (sudah diperbaiki) ── */}
        <div className={`modal-overlay ${showModal ? 'show' : ''}`} onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profil</h2>

            {editAvatar
              ? <img src={editAvatar} alt="Preview" className="modal-avatar-preview" />
              : (
                <div className="modal-avatar-placeholder">
                  <i className="fa-regular fa-user-circle"></i>
                </div>
              )
            }

            <div className="modal-form-group">
              <label>Upload Foto Profil</label>
              <div className="upload-row">
                <label className="btn-upload">
                  <i className="fa-solid fa-arrow-up-from-bracket"></i> Pilih Foto
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
                <span className="upload-hint">Maksimal 2MB (JPG, PNG)</span>
              </div>
            </div>

            <div className="modal-form-group">
              <label>Nama / Username</label>
              <input type="text" className="modal-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Masukkan nama lengkap" />
            </div>
            <div className="modal-form-group">
              <label>Nomor Telepon</label>
              <input type="tel" className="modal-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Masukkan nomor telepon" />
            </div>
            <div className="modal-form-group">
              <label>Alamat</label>
              <textarea className="modal-input" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Masukkan alamat lengkap" rows="3" />
            </div>

            <button className="btn-save" onClick={saveProfile}>
              <i className="fa-solid fa-check"></i> Simpan Perubahan
            </button>
            <button className="btn-cancel" onClick={closeModal}>
              <i className="fa-solid fa-xmark"></i> Batalkan
            </button>
          </div>
        </div>

      </div>
    </>
  )
}