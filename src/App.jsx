// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './utils/supabaseClient'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import DashboardScreen from './screens/HomeScreen'
import ProductDetailScreen from './screens/ProductDetailScreen'
import CartScreen from './screens/CartScreen'
import CheckoutScreen from './screens/CheckoutScreen'
import OrderSuccessScreen from './screens/OrderSuccessScreen'
import ProfileScreen from './screens/ProfileScreen'
import AboutScreen from './screens/AboutScreen'
import MenuScreen from './screens/MenuScreen' 

import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [cartCount, setCartCount] = useState(0)

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

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchCartCount(session.user.id)
      }
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchCartCount(session.user.id)
      } else {
        setCartCount(0)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLoginSuccess = (user) => {
    setSession(user)
    fetchCartCount(user.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCartCount(0)
  }

  const updateCartCount = (newCount) => {
    setCartCount(newCount)
  }

  return (
    <BrowserRouter>
      <Routes>
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
        
        {/* 2. TAMBAHKAN RUTE BARU UNTUK MENU DAN ABOUT DI SINI */}
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
          path="/order-success" 
          element={
            session ? <OrderSuccessScreen /> : <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            session ? <ProfileScreen user={session.user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />

        {/* Jalur Fallback: Jika rute acak diketik, kembalikan ke Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App