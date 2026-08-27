import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react'

const AdminSidebar = () => {
  const location = useLocation()

  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: 'Sản phẩm',
      path: '/admin/products',
      icon: Package,
      exact: false,
    },
    {
      name: 'Danh mục',
      path: '/admin/categories',
      icon: FolderTree,
      exact: false,
    },
    {
      name: 'Đơn hàng',
      path: '/admin/orders',
      icon: ShoppingCart,
      exact: false,
    },
  ]

  // Hàm kiểm tra active state dựa vào useLocation()
  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path)
  }

  return (
    <aside className="w-64 h-screen sticky top-0 bg-gray-900 text-white flex flex-col justify-between shrink-0 border-r border-gray-800 select-none z-40">
      {/* Header & Logo */}
      <div>
        <div className="p-6 border-b border-gray-800">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded bg-[#a87040]/20 flex items-center justify-center border border-[#a87040]/40 group-hover:bg-[#a87040]/30 transition-colors">
              <ShieldCheck className="w-5 h-5 text-[#a87040]" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-[0.2em] uppercase text-white block leading-tight">
                LUXE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#a87040] font-semibold">
                ADMIN PANEL
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Quản trị hệ thống
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isItemActive(item)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 text-xs uppercase tracking-wider font-medium rounded-sm transition-colors duration-150 ${
                  active
                    ? 'bg-white text-gray-900 font-bold shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    active ? 'text-gray-900' : 'text-gray-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer / Back to Store button */}
      <div className="p-4 border-t border-gray-800">
        <Link
          to="/"
          className="flex items-center justify-between w-full px-4 py-3 text-xs uppercase tracking-wider font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-sm transition-colors border border-gray-800/80"
        >
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại cửa hàng</span>
          </div>
        </Link>
      </div>
    </aside>
  )
}

export default AdminSidebar
