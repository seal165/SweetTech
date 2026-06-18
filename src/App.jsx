// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient'

// User Screens
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import DashboardScreen from './screens/HomeScreen'
import ProductDetailScreen from './screens/ProductDetailScreen'
import CartScreen from './screens/CartScreen'
import CheckoutScreen from './screens/CheckoutScreen'
import ProfileScreen from './screens/ProfileScreen'
import AboutScreen from './screens/AboutScreen'
import MenuScreen from './screens/MenuScreen'

// Admin Screens
import AdminLoginScreen from './screens/admin/AdminLoginScreen'
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen'
import MenuManagementScreen from './screens/admin/MenuManagementScreen'
import OrderManagementScreen from './screens/admin/OrdersManagementScreen'
import CustomerManagementScreen from './screens/admin/CustomerManagementScreen'

import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false) // 🔥 state buat cek admin

  const fetchCartCount = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId)
      
      if (!error && data) {
        const total = data.reduce((sum, item) => sum + (item.quantity || 0), 0)
        setCartCount(total)
      }
    } catch (err) {
      console.error('Error fetching cart count:', err)
    }
  }

  // ─── CEK ROLE ADMIN ───
  const checkAdminRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data?.role === 'admin'
    } catch {
      return false
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchCartCount(session.user.id)
        const admin = await checkAdminRole(session.user.id)
        setIsAdmin(admin)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        fetchCartCount(session.user.id)
        const admin = await checkAdminRole(session.user.id)
        setIsAdmin(admin)
      } else {
        setCartCount(0)
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLoginSuccess = (user) => {
    setSession(user)
    fetchCartCount(user.id)
    // role admin akan di-update otomatis oleh onAuthStateChange
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCartCount(0)
    setIsAdmin(false)
  }

  const updateCartCount = (newCount) => {
    setCartCount(newCount)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ─── RUTE ADMIN ─── */}
        <Route 
          path="/admin/login" 
          element={<AdminLoginScreen onLoginSuccess={handleLoginSuccess} />} 
        />
        
        {/* 🔥 ROUTE ADMIN DILINDUNGI: harus session && isAdmin */}
        <Route 
          path="/admin/dashboard" 
          element={
            session && isAdmin ? <AdminDashboardScreen /> : <Navigate to="/admin/login" />
          } 
        />
        <Route 
          path="/admin/menu" 
          element={
            session && isAdmin ? <MenuManagementScreen /> : <Navigate to="/admin/login" />
          } 
        />
        <Route 
          path="/admin/orders" 
          element={
            session && isAdmin ? <OrderManagementScreen /> : <Navigate to="/admin/login" />
          } 
        />
        <Route 
          path="/admin/customers" 
          element={
            session && isAdmin ? <CustomerManagementScreen /> : <Navigate to="/admin/login" />
          } 
        />

        {/* ─── RUTE PELANGGAN ─── */}
        <Route 
          path="/login" 
          element={
            !session ? (
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            ) : (
              <Navigate to="/" />
            )
          } 
        />
        
        <Route 
          path="/register" 
          element={
            !session ? <RegisterScreen /> : <Navigate to="/" />
          } 
        />
        
        <Route 
          path="/" 
          element={
            session ? (
              <DashboardScreen 
                user={session.user} 
                onLogout={handleLogout}
                cartCount={cartCount}
                updateCartCount={updateCartCount}
              />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/menu" 
          element={
            session ? (
              <MenuScreen 
                user={session.user} 
                cartCount={cartCount} 
                updateCartCount={updateCartCount} 
              />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/about" 
          element={
            session ? <AboutScreen /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/product/:productId" 
          element={
            session ? <ProductDetailScreen user={session.user} updateCartCount={updateCartCount} /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/cart" 
          element={
            session ? <CartScreen user={session.user} updateCartCount={updateCartCount} /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/checkout" 
          element={
            session ? <CheckoutScreen user={session.user} updateCartCount={updateCartCount} /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            session ? <ProfileScreen user={session.user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App