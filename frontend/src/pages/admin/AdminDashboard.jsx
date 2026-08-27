import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingCart,
  Clock,
  DollarSign,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminSidebar from '../../components/layout/AdminSidebar'
import productApi from '../../api/productApi'
import orderApi from '../../api/orderApi'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // 1. Lấy thông tin sản phẩm
      const productsRes = await productApi.getAll({ page: 1, page_size: 1 })
      const productsData = productsRes.data || productsRes
      const totalProducts = productsData.total ?? (productsData.items ? productsData.items.length : 0)

      // 2. Lấy thông tin đơn hàng
      const ordersRes = await orderApi.getAllOrders({ page: 1, page_size: 50 })
      const ordersData = ordersRes.data || ordersRes
      const orderList = ordersData.items || []
      const totalOrders = ordersData.total ?? orderList.length

      // Đếm đơn chờ xử lý
      const pendingCount = orderList.filter(
        (order) => order.status === 'pending' || order.status === 'processing'
      ).length

      // Tính tổng doanh thu từ các đơn đã thanh toán hoặc đã giao
      const revenue = orderList.reduce((acc, order) => {
        if (order.payment_status === 'paid' || order.status === 'delivered') {
          return acc + Number(order.total_amount || 0)
        }
        return acc
      }, 0)

      setStats({
        totalProducts,
        totalOrders,
        pendingOrders: pendingCount,
        totalRevenue: revenue,
      })

      setRecentOrders(orderList.slice(0, 6))

      if (isManualRefresh) {
        toast.success('Dữ liệu đã được cập nhật')
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error)
      toast.error('Không thể tải dữ liệu tổng quan')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Khởi tạo WebSocket cho real-time updates
    const ws = new WebSocket('ws://localhost:8000/ws/admin')
    
    ws.onopen = () => {
      console.log('Admin WebSocket Connected')
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'ORDER_CREATED' || data.type === 'ORDER_UPDATED' || data.type === 'PRODUCT_CREATED') {
          // Báo Notification nhẹ thay vì toast ầm ĩ (tùy chọn)
          if (data.type === 'ORDER_CREATED') toast('Đơn hàng mới vừa được đặt!', { icon: '📦' })
          
          // Refresh dữ liệu Dashboard ngầm
          fetchDashboardData(false)
        }
      } catch (err) {
        console.error('Lỗi parse WS data:', err)
      }
    }
    
    ws.onerror = (err) => {
      console.error('WebSocket Error:', err)
    }
    
    return () => {
      ws.close()
    }
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const statCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats.totalProducts,
      icon: Package,
      desc: 'Sản phẩm trong kho',
      link: '/admin/products',
      linkText: 'Quản lý kho',
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.totalOrders,
      icon: ShoppingCart,
      desc: 'Tất cả các đơn đã tạo',
      link: '/admin/orders',
      linkText: 'Xem đơn hàng',
    },
    {
      title: 'Đơn chờ xử lý',
      value: stats.pendingOrders,
      icon: Clock,
      desc: 'Cần xác nhận & đóng gói',
      link: '/admin/orders',
      linkText: 'Xử lý ngay',
      highlight: stats.pendingOrders > 0,
    },
    {
      title: 'Doanh thu',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      desc: 'Từ đơn đã thanh toán',
      link: '/admin/orders',
      linkText: 'Chi tiết doanh thu',
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar bên trái w-64 */}
      <AdminSidebar />

      {/* Nội dung bên phải flex-1 */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
              Hệ thống quản trị
            </span>
            <h1 className="text-2xl font-display font-semibold text-gray-900 mt-0.5">
              Tổng quan kinh doanh
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-xs uppercase tracking-wider text-gray-700 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>
            <Link
              to="/admin/products"
              className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Thêm sản phẩm</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {loading ? (
            <Spinner center size="lg" label="Đang tải dữ liệu tổng quan..." />
          ) : (
            <>
              {/* 4 Cards Thống kê */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => {
                  const Icon = card.icon
                  return (
                    <div
                      key={idx}
                      className={`bg-white p-6 border transition-all duration-200 hover:shadow-sm ${
                        card.highlight
                          ? 'border-amber-400 ring-1 ring-amber-400/20'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                          {card.title}
                        </span>
                        <div
                          className={`p-2 rounded-none ${
                            card.highlight
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-2xl font-display font-semibold text-gray-900 tracking-tight">
                          {card.value}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <Link
                          to={card.link}
                          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-gray-900 hover:text-[#a87040] transition-colors"
                        >
                          <span>{card.linkText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick Insights Banner */}
              <div className="bg-gray-900 text-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 text-[#a87040]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-medium text-white">
                      Trạng thái đơn hàng thời gian thực
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Hiện có {stats.pendingOrders} đơn hàng cần xử lý xác nhận và giao kho vận.
                    </p>
                  </div>
                </div>
                <Link
                  to="/admin/orders"
                  className="px-5 py-2.5 bg-white text-gray-900 text-xs font-semibold uppercase tracking-wider hover:bg-gray-100 transition-colors shrink-0"
                >
                  Xử lý đơn hàng
                </Link>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-white border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-gray-900">
                      Đơn hàng gần đây
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Danh sách các giao dịch phát sinh mới nhất
                    </p>
                  </div>
                  <Link
                    to="/admin/orders"
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-gray-700 hover:text-gray-900 font-medium"
                  >
                    <span>Xem tất cả</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">Chưa có đơn hàng nào được ghi nhận</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                        <tr>
                          <th className="px-6 py-3 font-medium">Mã đơn</th>
                          <th className="px-6 py-3 font-medium">Khách hàng</th>
                          <th className="px-6 py-3 font-medium">Tổng tiền</th>
                          <th className="px-6 py-3 font-medium">Trạng thái đơn</th>
                          <th className="px-6 py-3 font-medium">Thanh toán</th>
                          <th className="px-6 py-3 font-medium">Ngày đặt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentOrders.map((order) => {
                          const customerName =
                            order.shipping_address_json?.full_name || 'Khách hàng vãng lai'
                          const orderDate = new Date(order.created_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })

                          return (
                            <tr key={order.id} className="hover:bg-gray-50/75 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-900">
                                {order.order_number || order.id?.substring(0, 8)}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {customerName}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900">
                                {formatCurrency(order.total_amount)}
                              </td>
                              <td className="px-6 py-4">
                                <Badge status={order.status} />
                              </td>
                              <td className="px-6 py-4">
                                <Badge status={order.payment_status} />
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500">
                                {orderDate}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
