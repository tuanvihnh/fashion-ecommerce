import React, { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  User,
  MapPin,
  Package,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminSidebar from '../../components/layout/AdminSidebar'
import orderApi from '../../api/orderApi'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao hàng' },
  { value: 'delivered', label: 'Đã giao hàng' },
  { value: 'cancelled', label: 'Đã hủy đơn' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thanh toán thất bại' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
]

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // View details modal
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize,
      }
      const res = await orderApi.getAllOrders(params)
      const data = res.data || res
      setOrders(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Lỗi khi tải danh sách đơn hàng:', error)
      toast.error('Không thể tải danh sách đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page])

  // Update order status or payment status
  const handleUpdateStatus = async (orderId, newStatus, newPaymentStatus) => {
    setUpdatingId(orderId)
    const updatePayload = {}
    if (newStatus !== undefined) updatePayload.status = newStatus
    if (newPaymentStatus !== undefined) updatePayload.payment_status = newPaymentStatus

    const toastId = toast.loading('Đang cập nhật trạng thái...')
    try {
      await orderApi.updateStatus(orderId, updatePayload)
      toast.success('Cập nhật trạng thái thành công!', { id: toastId })
      
      // Update local state reactive
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          if (ord.id === orderId) {
            return {
              ...ord,
              ...(newStatus && { status: newStatus }),
              ...(newPaymentStatus && { payment_status: newPaymentStatus }),
            }
          }
          return ord
        })
      )

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          ...(newStatus && { status: newStatus }),
          ...(newPaymentStatus && { payment_status: newPaymentStatus }),
        }))
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error)
      toast.error(
        error.response?.data?.detail || 'Cập nhật trạng thái thất bại',
        { id: toastId }
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  // Filter orders on client side if search or status filter active
  const filteredOrders = orders.filter((order) => {
    const matchStatus = statusFilter ? order.status === statusFilter : true
    const searchLower = searchTerm.toLowerCase().trim()
    const matchSearch = searchLower
      ? (order.order_number || '').toLowerCase().includes(searchLower) ||
        (order.shipping_address_json?.full_name || '').toLowerCase().includes(searchLower) ||
        (order.shipping_address_json?.phone || '').includes(searchLower)
      : true

    return matchStatus && matchSearch
  })

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
              Quản lý bán hàng
            </span>
            <h1 className="text-2xl font-display font-semibold text-gray-900 mt-0.5">
              Danh sách đơn hàng
            </h1>
          </div>

          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            Tổng cộng: <strong className="text-gray-900">{total} đơn</strong>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center w-full md:w-80 relative">
              <input
                type="text"
                placeholder="Tìm mã đơn, tên, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pr-10 text-xs py-2"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 pointer-events-none" />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Lọc trạng thái:
                </span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 text-xs px-3 py-2 bg-white focus:outline-none focus:border-gray-900"
              >
                <option value="">Tất cả trạng thái</option>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-gray-900">
                Toàn bộ đơn hàng ({filteredOrders.length})
              </h2>
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Trang {page} / {totalPages}
              </span>
            </div>

            {loading ? (
              <Spinner center size="lg" label="Đang tải danh sách đơn hàng..." />
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Không tìm thấy đơn hàng nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5 font-medium">Mã đơn</th>
                      <th className="px-6 py-3.5 font-medium">Khách hàng</th>
                      <th className="px-6 py-3.5 font-medium">Tổng tiền</th>
                      <th className="px-6 py-3.5 font-medium">Trạng thái đơn</th>
                      <th className="px-6 py-3.5 font-medium">Trạng thái thanh toán</th>
                      <th className="px-6 py-3.5 font-medium">Ngày đặt</th>
                      <th className="px-6 py-3.5 font-medium text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => {
                      const customer = order.shipping_address_json || {}
                      const orderDate = new Date(order.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      const isUpdating = updatingId === order.id

                      return (
                        <tr key={order.id} className="hover:bg-gray-50/75 transition-colors">
                          {/* Order Number */}
                          <td className="px-6 py-4">
                            <div className="font-mono text-xs font-bold text-gray-900">
                              {order.order_number || order.id?.substring(0, 8)}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {order.items?.length || 1} món
                            </span>
                          </td>

                          {/* Customer Info */}
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 text-sm">
                              {customer.full_name || 'Khách hàng'}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                              {customer.phone || '—'}
                            </div>
                          </td>

                          {/* Total Amount */}
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </td>

                          {/* Order Status Dropdown & Badge */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              <Badge status={order.status} />
                              <select
                                value={order.status}
                                disabled={isUpdating}
                                onChange={(e) =>
                                  handleUpdateStatus(order.id, e.target.value, undefined)
                                }
                                className="text-xs border border-gray-300 bg-white px-2 py-1 focus:outline-none focus:border-gray-900 disabled:opacity-50"
                              >
                                {ORDER_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Payment Status Dropdown & Badge */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              <Badge status={order.payment_status} />
                              <select
                                value={order.payment_status}
                                disabled={isUpdating}
                                onChange={(e) =>
                                  handleUpdateStatus(order.id, undefined, e.target.value)
                                }
                                className="text-xs border border-gray-300 bg-white px-2 py-1 focus:outline-none focus:border-gray-900 disabled:opacity-50"
                              >
                                {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Order Date */}
                          <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                            {orderDate}
                          </td>

                          {/* Detail Action */}
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                              title="Xem chi tiết đơn hàng"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
                <div className="text-xs text-gray-500">
                  Hiển thị {(page - 1) * pageSize + 1} -{' '}
                  {Math.min(page * pageSize, total)} trên tổng số {total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1}
                    className="p-2 border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`w-8 h-8 text-xs font-medium border transition-colors ${
                        page === num
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="p-2 border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Xem chi tiết đơn hàng */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-900 p-6 space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                    Chi tiết đơn hàng
                  </span>
                  <h3 className="font-display text-xl font-bold text-gray-900 mt-0.5 font-mono">
                    #{selectedOrder.order_number || selectedOrder.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Section */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
                    Trạng thái đơn
                  </span>
                  <Badge status={selectedOrder.status} />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
                    Thanh toán
                  </span>
                  <Badge status={selectedOrder.payment_status} />
                </div>
              </div>

              {/* Customer & Shipping Details */}
              <div className="space-y-3">
                <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#a87040]" />
                  <span>Thông tin người nhận</span>
                </h4>
                <div className="text-xs space-y-1 text-gray-700 bg-gray-50 p-4 border border-gray-200">
                  <p>
                    <strong className="text-gray-900">Họ và tên:</strong>{' '}
                    {selectedOrder.shipping_address_json?.full_name || '—'}
                  </p>
                  <p>
                    <strong className="text-gray-900">Số điện thoại:</strong>{' '}
                    {selectedOrder.shipping_address_json?.phone || '—'}
                  </p>
                  <p>
                    <strong className="text-gray-900">Địa chỉ giao hàng:</strong>{' '}
                    {selectedOrder.shipping_address_json?.address_line1},{' '}
                    {selectedOrder.shipping_address_json?.city}
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-amber-800 pt-1">
                      <strong className="text-amber-900">Ghi chú:</strong> {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items Snapshot */}
              <div className="space-y-3">
                <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#a87040]" />
                  <span>Sản phẩm trong đơn ({selectedOrder.items?.length || 0})</span>
                </h4>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="divide-y divide-gray-200 border border-gray-200">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.product_title_snapshot}
                          </p>
                          <p className="text-gray-500 mt-0.5">{item.variant_info_snapshot}</p>
                          <p className="text-gray-400 mt-0.5">Số lượng: {item.quantity}</p>
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatCurrency(item.subtotal || item.unit_price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Không có chi tiết sản phẩm.</p>
                )}
              </div>

              {/* Order Summary Calculations */}
              <div className="border-t border-gray-200 pt-4 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span>{formatCurrency(selectedOrder.shipping_fee || 0)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-base text-gray-900">
                    {formatCurrency(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn-primary text-xs py-2.5 px-6"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminOrders
