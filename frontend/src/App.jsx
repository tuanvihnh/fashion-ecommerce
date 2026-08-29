import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import MyOrdersPage from './pages/MyOrdersPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import ProtectedRoute from './components/ProtectedRoute'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/products" element={<ProductListPage />} />
      <Route path="/products/:slug" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* Protected Routes — Cần đăng nhập */}
      <Route path="/checkout" element={
        <ProtectedRoute><CheckoutPage /></ProtectedRoute>
      } />
      <Route path="/my-orders" element={
        <ProtectedRoute><MyOrdersPage /></ProtectedRoute>
      } />

      {/* Admin Routes — Cần quyền Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>
      } />
      <Route path="/admin/categories" element={
        <ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>
      } />

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
