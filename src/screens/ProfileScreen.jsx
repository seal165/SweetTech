// src/screens/ProfileScreen.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import './ProfileScreen.css'

export default function ProfileScreen({ user, onLogout }) {
  const navigate = useNavigate()
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
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

  // Fetch profile and orders from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile({
            name: profileData.full_name || user.email?.split('@')[0] || 'SweetTech User',
            email: user.email || '',
            avatar: profileData.avatar_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
            phone: profileData.phone || '',
            address: profileData.address || ''
          })
        } else {
          setProfile({
            name: user.email?.split('@')[0] || 'SweetTech User',
            email: user.email || '',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
            phone: '',
            address: ''
          })
        }
        
        // Fetch orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (ordersData) {
          setOrders(ordersData)
        }
        
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user])

  // Menangani penguncian scroll bodi secara aman lewat siklus hidup React
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    // Fungsi pembersihan jika komponen mendadak unmount saat modal aktif
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [showModal])

  const openModal = () => {
    setEditName(profile.name)
    setEditAvatar(profile.avatar)
    setEditPhone(profile.phone)
    setEditAddress(profile.address)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB!')
        return
      }
      if (!file.type.match('image.*')) {
        alert('Hanya file gambar yang diperbolehkan!')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditAvatar(reader.result)
      }
      reader.readAsDataURL(file)
    }
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
      
      setProfile({
        ...profile,
        name: editName,
        avatar: editAvatar,
        phone: editPhone,
        address: editAddress
      })
      
      await supabase.auth.updateUser({
        data: { full_name: editName, avatar_url: editAvatar }
      })
      
      alert('Profil berhasil diperbarui!')
      closeModal()
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Gagal memperbarui profil: ' + err.message)
    }
  }

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout()
      navigate('/login')
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Menunggu Konfirmasi',
      preparing: 'Sedang Disiapkan',
      ready: 'Siap Diambil/Dikirim',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    }
    return statusMap[status] || status
  }

  const getStatusDotColor = (status) => {
    const colors = {
      pending: '#f39c12',
      preparing: '#6d6480',
      ready: '#27ae60',
      completed: '#3498db',
      cancelled: '#d33c44'
    }
    return colors[status] || '#6d6480'
  }

  if (loading) {
    return <div className="profile-container"><div className="loading-screen">Loading profile...</div></div>
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="container navbar">
          <Link to="/" className="logo">SweetTech</Link>
          <div className="nav-icons">
            <Link to="/cart"><i className="fa-solid fa-cart-shopping"></i></Link>
            <Link to="/profile" className="user-icon-active"><i className="fa-regular fa-user"></i></Link>
          </div>
        </div>
      </header>

      <main className="profile-main container">
        <section className="profile-header-card">
          <div className="profile-info-left">
            <div className="profile-avatar-wrap">
              <img src={profile.avatar} alt={profile.name} />
            </div>
            <h1 className="profile-name">{profile.name}</h1>
          </div>
          <button className="btn-edit-profile" onClick={openModal}>
            <i className="fa-solid fa-pen"></i> Edit Profile
          </button>
        </section>

        <div className="dashboard-grid">
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
                  <div className="order-details" style={{ width: '100%' }}>
                    <div>
                      <div className="order-title-row">
                        <h3>Order #{order.order_number || order.id}</h3>
                        <span className="order-price">${order.total.toFixed(2)}</span>
                      </div>
                      <p className="order-items-text">
                        {(order.delivery_method || order.fulfillment_method) === 'pickup' ? 'Ambil Sendiri' : 'Delivery'}
                      </p>
                    </div>
                    <div className="order-status-row">
                      <div className="status-badge">
                        <span className="status-dot" style={{ backgroundColor: getStatusDotColor(order.status) }}></span>
                        {getStatusText(order.status)}
                      </div>
                      <span className="order-time">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="account-section">
            <div className="section-header">
              <h2>Account</h2>
              <span className="active-tab">Active</span>
            </div>
            <div className="info-card">
              <div className="info-row"><i className="fa-regular fa-envelope"></i><span>{profile.email}</span></div>
              {profile.phone && <div className="info-row"><i className="fa-solid fa-phone"></i><span>{profile.phone}</span></div>}
              {profile.address && <div className="info-row"><i className="fa-solid fa-location-dot"></i><span>{profile.address}</span></div>}
              <div className="info-row"><i className="fa-regular fa-calendar"></i><span>Member since {user?.created_at ? new Date(user.created_at).getFullYear() : 2026}</span></div>
            </div>
            <div className="logout-card" onClick={handleLogout}>
              <div className="logout-icon"><i className="fa-solid fa-arrow-right-from-bracket"></i></div>
              <span>Log Out</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="profile-footer">
        <div className="container footer-content">
          <span className="footer-logo">SweetTech</span>
          <div className="footer-links">
            <Link to="#">About Us</Link>
            <Link to="#">Contact</Link>
            <Link to="#">FAQs</Link>
            <Link to="#">Privacy Policy</Link>
          </div>
          <span>© 2026 SweetTech. All rights reserved.</span>
        </div>
      </footer>

      {/* Modal Edit Profile */}
      <div className={`modal-overlay ${showModal ? 'show' : ''}`} onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>Edit Profil</h2>
          <img src={editAvatar || profile.avatar} alt="Profile Preview" className="modal-avatar-preview" />
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
            <input type="text" className="modal-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <div className="modal-form-group">
            <label>Nomor Telepon</label>
            <input type="tel" className="modal-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Masukkan nomor telepon" />
          </div>
          <div className="modal-form-group">
            <label>Alamat</label>
            <textarea className="modal-input" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Masukkan alamat lengkap" rows="3" />
          </div>
          <button className="btn-save" onClick={saveProfile}>Simpan Perubahan</button>
          <button className="btn-cancel" onClick={closeModal}>Batalkan Perubahan</button>
        </div>
      </div>
    </div>
  )
}