import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  X,
  ShoppingBag,
  User,
  Search,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { user, logout, isAdmin } = useAuth()
  const { cartItems, getItemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  // Tính tổng số lượng trong giỏ hàng
  const totalCartCount = getItemCount
    ? getItemCount()
    : (cartItems || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0)

  // Kiểm tra quyền admin
  const userIsAdmin = typeof isAdmin === 'function' ? isAdmin() : user?.role?.toUpperCase() === 'ADMIN'

  // Đóng menu và search khi đổi route
  useEffect(() => {
    setIsMenuOpen(false)
    setIsUserDropdownOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname])

  // Focus ô tìm kiếm khi mở search bar
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Click ngoài dropdown user để đóng
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    setIsUserDropdownOpen(false)
    toast.success('Đã đăng xuất thành công')
    navigate('/')
  }

  const navLinks = [
    { label: 'Bộ sưu tập', path: '/products' },
    { label: 'Nam', path: '/products?gender=men' },
    { label: 'Nữ', path: '/products?gender=women' },
    ...(userIsAdmin ? [{ label: 'Admin', path: '/admin', isAdmin: true }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      {/* Top Banner */}
      <div className="bg-gray-900 text-white text-[11px] font-light py-1.5 px-4 text-center tracking-widest uppercase">
        Miễn phí giao hàng cho đơn từ 1.000.000đ • Đổi trả trong 30 ngày
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-800 hover:text-black transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo bên trái */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="font-display font-bold text-2xl sm:text-3xl tracking-[0.25em] text-gray-950 uppercase hover:opacity-80 transition-opacity"
            >
              LUXE
            </Link>
          </div>

          {/* Menu giữa */}
          <nav className="hidden lg:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs uppercase font-medium tracking-[0.18em] transition-colors duration-200 ${
                  link.isAdmin
                    ? 'text-[#a87040] hover:text-[#8a5a36] font-semibold flex items-center gap-1.5'
                    : location.pathname === link.path
                    ? 'text-gray-950 font-semibold'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                {link.isAdmin && <ShieldCheck className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bên phải: icon Search, icon User, icon ShoppingBag */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-gray-700 hover:text-gray-950 transition-colors focus:outline-none"
              title="Tìm kiếm"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="p-2 text-gray-700 hover:text-gray-950 transition-colors flex items-center gap-1 focus:outline-none"
                title="Tài khoản"
                aria-label="User Account"
              >
                <User className="w-5 h-5" />
                {user && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 hidden sm:inline-block ${
                      isUserDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {user ? (
                    <>
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70">
                        <p className="text-xs text-gray-500">Xin chào</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.full_name || user.name || user.email}
                        </p>
                        {userIsAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase bg-brand-100 text-brand-700 rounded">
                            Quản trị viên
                          </span>
                        )}
                      </div>

                      {/* Logged in links */}
                      <div className="py-1">
                        <Link
                          to="/my-orders"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-50 hover:text-gray-950 transition-colors"
                        >
                          <Package className="w-4 h-4 text-gray-500" />
                          <span>Đơn hàng của tôi</span>
                        </Link>

                        {userIsAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-wider text-brand-600 hover:bg-brand-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-brand-600" />
                            <span>Trang quản trị</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-600" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Guest links */
                    <div className="py-2 px-1">
                      <div className="px-3 py-2 mb-1 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Tài khoản LUXE</p>
                        <p className="text-xs text-gray-700 mt-0.5">
                          Đăng nhập để xem đơn hàng và nhận ưu đãi riêng
                        </p>
                      </div>
                      <Link
                        to="/login"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-3 py-2 text-xs uppercase tracking-wider font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-3 py-2 text-xs uppercase tracking-wider text-gray-600 hover:bg-gray-50 hover:text-gray-950 transition-colors"
                      >
                        Đăng ký tài khoản
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shopping Bag Button kèm badge số lượng */}
            <Link
              to="/cart"
              className="p-2 text-gray-700 hover:text-gray-950 transition-colors relative focus:outline-none"
              title="Giỏ hàng"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tracking-tight animate-in zoom-in duration-200">
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Expandable Search Overlay */}
      {isSearchOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6 shadow-md animate-in slide-in-from-top duration-200">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, bộ sưu tập..."
                className="w-full pl-12 pr-24 py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-900 tracking-wide font-sans placeholder-gray-400"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors"
                >
                  Tìm
                </button>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700"
                  aria-label="Đóng tìm kiếm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white animate-in slide-in-from-top duration-200">
          {/* Mobile Search Form */}
          <div className="p-4 border-b border-gray-100">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="input-field text-sm"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Mobile Navigation Links */}
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block py-2 text-sm uppercase tracking-widest font-medium border-b border-gray-50 ${
                  link.isAdmin
                    ? 'text-[#a87040] font-semibold flex items-center gap-2'
                    : location.pathname === link.path
                    ? 'text-gray-950 font-bold'
                    : 'text-gray-700 hover:text-gray-950'
                }`}
              >
                {link.isAdmin && <ShieldCheck className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile User Profile Section */}
          <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
            {user ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-600">
                  <span>Đăng nhập với tư cách: </span>
                  <span className="font-semibold text-gray-900 block truncate">
                    {user.full_name || user.name || user.email}
                  </span>
                </div>
                <Link
                  to="/my-orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-700 hover:text-black py-1"
                >
                  <Package className="w-4 h-4 text-gray-500" />
                  <span>Đơn hàng của tôi</span>
                </Link>
                {userIsAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-600 font-semibold py-1"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Trang quản trị Admin</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-red-600 font-medium pt-2 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-primary text-center py-2.5 text-xs"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="btn-outline text-center py-2.5 text-xs"
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
