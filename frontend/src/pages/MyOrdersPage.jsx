import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Package,
  Clock,
  CreditCard,
  XCircle,
  ChevronRight,
  Eye,
  ShoppingBag,
  Calendar,
  MapPin,
  RefreshCw,
  X,
  AlertTriangle,
  FileText,
  Truck
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import orderApi from '../api/orderApi'
import paymentApi from '../api/paymentApi'

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateString
  }
}

const MyOrdersPage = () => {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  // Cancel Confirmation Modal
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    order: null,
    isProcessing: false,
  })

  // Payment Processing State
  const [payingOrderId, setPayingOrderId] = useState(null)

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const response = await orderApi.getMyOrders()
      const data = response.data
      // In case backend returns array directly or paginated object
      const ordersList = Array.isArray(data) ? data : data?.items || []
      setOrders(ordersList)
    } catch (error) {
      console.error('Lỗi khi tải danh sách đơn hàng:', error)
      toast.error('Không thể tải danh sách đơn hàng. Vui lòng thử lại!')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleOpenDetail = async (orderSummary) => {
    setIsDetailLoading(true)
    setSelectedOrder(orderSummary) // set preview initially

    try {
      const res = await orderApi.getById(orderSummary.id)
      setSelectedOrder(res.data)
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', err)
      toast.error('Không thể lấy đầy đủ chi tiết đơn hàng.')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setSelectedOrder(null)
  }

  const handleOpenCancelModal = (order, e) => {
    if (e) e.stopPropagation()
    setCancelModal({
      isOpen: true,
      order,
      isProcessing: false,
    })
  }

  const handleConfirmCancel = async () => {
    if (!cancelModal.order) return
    setCancelModal((prev) => ({ ...prev, isProcessing: true }))

    try {
      await orderApi.cancel(cancelModal.order.id)
      toast.success(`Đã hủy thành công đơn hàng #${cancelModal.order.order_number || cancelModal.order.id.slice(0, 8)}`)
      
      // Update selected order if open
      if (selectedOrder && selectedOrder.id === cancelModal.order.id) {
        setSelectedOrder((prev) => ({ ...prev, status: 'CANCELLED' }))
      }

      // Refresh orders list
      await fetchOrders(true)
      setCancelModal({ isOpen: false, order: null, isProcessing: false })
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error)
      const errorMsg = error.response?.data?.detail || 'Hủy đơn hàng thất bại. Đơn hàng có thể đã được giao.'
      toast.error(errorMsg)
      setCancelModal((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const handlePayNow = async (orderId, e) => {
    if (e) e.stopPropagation()
    setPayingOrderId(orderId)

    try {
      const res = await paymentApi.createUrl(orderId)
      if (res.data?.payment_url) {
        toast.success('Đang chuyển hướng đến cổng thanh toán VNPay...')
        window.location.href = res.data.payment_url
      } else {
        toast.error('Không thể tạo liên kết thanh toán. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Lỗi khi tạo URL thanh toán:', error)
      const msg = error.response?.data?.detail || 'Không thể tạo phiên thanh toán'
      toast.error(msg)
    } finally {
      setPayingOrderId(null)
    }
  }

  const isCancelable = (status) => {
    const s = String(status || '').toUpperCase()
    return s === 'PENDING' || s === 'CONFIRMED'
  }

  const isPayable = (paymentStatus, orderStatus) => {
    const p = String(paymentStatus || '').toUpperCase()
    const o = String(orderStatus || '').toUpperCase()
    return (p === 'UNPAID' || p === 'FAILED') && o !== 'CANCELLED'
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb & Header */}
        <div className="border-b border-gray-200 pb-6 mb-8 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div>
            <nav className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
              <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
              <span>/</span>
              <span className="text-black font-semibold">Tài khoản</span>
              <span>/</span>
              <span className="text-black font-semibold">Đơn hàng của tôi</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-wider text-gray-900">
              Lịch sử đơn hàng
            </h1>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing || loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-gray-600 hover:text-black transition-colors py-2 px-3 border border-gray-200 hover:border-gray-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Content State */}
        {loading ? (
          <div className="py-24">
            <Spinner size="lg" center label="Đang tải danh sách đơn hàng..." />
          </div>
        ) : orders.length === 0 ? (
          /* Empty Orders */
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
              <Package className="w-9 h-9 stroke-1" />
            </div>
            <h2 className="text-xl font-display uppercase tracking-wider text-gray-900 mb-2">
              Bạn chưa có đơn hàng nào
            </h2>
            <p className="text-sm text-gray-500 mb-8 font-light leading-relaxed">
              Bạn chưa thực hiện giao dịch nào trên hệ thống. Khám phá các mẫu thời trang mới nhất của chúng tôi ngay hôm nay.
            </p>
            <Link
              to="/products"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-xs font-semibold uppercase tracking-widest shadow-sm hover:shadow"
            >
              <ShoppingBag className="w-4 h-4" />
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          /* Orders Table & Cards */
          <div className="space-y-6">
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                    <th className="py-4 px-6">Mã đơn</th>
                    <th className="py-4 px-6">Ngày đặt</th>
                    <th className="py-4 px-6 text-center">Số lượng</th>
                    <th className="py-4 px-6 text-right">Tổng tiền</th>
                    <th className="py-4 px-6 text-center">Trạng thái đơn</th>
                    <th className="py-4 px-6 text-center">Thanh toán</th>
                    <th className="py-4 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order)}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Order number */}
                      <td className="py-5 px-6 font-mono text-xs font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-[#a87040] transition-colors">
                            #{order.order_number || order.id.slice(0, 8)}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-5 px-6 text-xs text-gray-600 font-light">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Item count */}
                      <td className="py-5 px-6 text-center text-xs text-gray-700">
                        {order.item_count ?? (order.items?.length || 1)} sp
                      </td>

                      {/* Total amount */}
                      <td className="py-5 px-6 text-right font-medium text-gray-900">
                        {formatPrice(order.total_amount)}
                      </td>

                      {/* Status */}
                      <td className="py-5 px-6 text-center">
                        <Badge status={order.status} />
                      </td>

                      {/* Payment Status */}
                      <td className="py-5 px-6 text-center">
                        <Badge status={order.payment_status} />
                      </td>

                      {/* Actions */}
                      <td className="py-5 px-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        {/* Pay button */}
                        {isPayable(order.payment_status, order.status) && (
                          <button
                            type="button"
                            onClick={(e) => handlePayNow(order.id, e)}
                            disabled={payingOrderId === order.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 transition-colors disabled:opacity-50"
                          >
                            {payingOrderId === order.id ? (
                              <Spinner size="sm" className="border-t-white" />
                            ) : (
                              <>
                                <CreditCard className="w-3 h-3" />
                                <span>Thanh toán</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Cancel button */}
                        {isCancelable(order.status) && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenCancelModal(order, e)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Hủy đơn</span>
                          </button>
                        )}

                        {/* View detail button */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(order)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gray-600 hover:text-black border border-gray-300 hover:border-gray-900 px-3 py-1.5 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleOpenDetail(order)}
                  className="p-5 border border-gray-200 bg-white hover:border-gray-400 transition-all space-y-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-900">
                        #{order.order_number || order.id.slice(0, 8)}
                      </span>
                      <p className="text-[11px] text-gray-500 font-light mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge status={order.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y border-gray-100">
                    <span className="text-gray-500">Thanh toán:</span>
                    <Badge status={order.payment_status} />
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Tổng cộng:</span>
                    <span className="text-base font-semibold text-gray-900">{formatPrice(order.total_amount)}</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isPayable(order.payment_status, order.status) && (
                      <button
                        type="button"
                        onClick={(e) => handlePayNow(order.id, e)}
                        disabled={payingOrderId === order.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-gray-900 py-2.5 px-3 transition-colors"
                      >
                        {payingOrderId === order.id ? (
                          <Spinner size="sm" className="border-t-white" />
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Thanh toán</span>
                          </>
                        )}
                      </button>
                    )}

                    {isCancelable(order.status) && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenCancelModal(order, e)}
                        className="inline-flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider text-red-600 border border-red-200 py-2.5 px-3 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hủy đơn</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenDetail(order)}
                      className="inline-flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-700 border border-gray-300 py-2.5 px-3 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200 shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-display uppercase tracking-wider text-gray-900">
                    Chi tiết đơn hàng
                  </h2>
                  <span className="font-mono text-sm font-semibold text-[#a87040]">
                    #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Đặt lúc: {formatDate(selectedOrder.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-light">
              {isDetailLoading ? (
                <div className="py-12">
                  <Spinner size="md" center label="Đang tải chi tiết..." />
                </div>
              ) : (
                <>
                  {/* Status Badges Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Trạng thái:</span>
                      <Badge status={selectedOrder.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Thanh toán:</span>
                      <Badge status={selectedOrder.payment_status} />
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-gray-700" />
                      Danh sách sản phẩm ({selectedOrder.items?.length || selectedOrder.item_count || 0})
                    </h3>

                    <div className="divide-y divide-gray-100 border border-gray-200">
                      {(selectedOrder.items || []).map((item) => (
                        <div key={item.id || item.product_variant_id} className="p-4 flex items-center gap-4">
                          <div className="w-14 h-18 bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400">
                            <ShoppingBag className="w-5 h-5 stroke-1" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium uppercase tracking-wider text-gray-900">
                              {item.product_title_snapshot || item.product_title || 'Sản phẩm thời trang'}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Phân loại: <span className="text-gray-800">{item.variant_info_snapshot || item.variant_info || 'Tiêu chuẩn'}</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1 font-mono">
                              {formatPrice(item.unit_price)} × {item.quantity}
                            </p>
                          </div>

                          <div className="text-right text-xs font-semibold text-gray-900">
                            {formatPrice(item.subtotal || Number(item.unit_price) * Number(item.quantity))}
                          </div>
                        </div>
                      ))}

                      {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                        <div className="p-4 text-xs text-gray-500 italic text-center">
                          Số lượng: {selectedOrder.item_count} món
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping & Payment Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Address */}
                    <div className="border border-gray-200 p-4 bg-gray-50/40">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-700" />
                        Địa chỉ nhận hàng
                      </h3>
                      {selectedOrder.shipping_address_json ? (
                        <div className="text-xs text-gray-600 space-y-1">
                          <p className="font-medium text-gray-900">{selectedOrder.shipping_address_json.full_name}</p>
                          <p>SĐT: {selectedOrder.shipping_address_json.phone}</p>
                          <p>{selectedOrder.shipping_address_json.address_line1}</p>
                          {selectedOrder.shipping_address_json.address_line2 && (
                            <p>{selectedOrder.shipping_address_json.address_line2}</p>
                          )}
                          <p>
                            {selectedOrder.shipping_address_json.city}
                            {selectedOrder.shipping_address_json.postal_code ? ` - ${selectedOrder.shipping_address_json.postal_code}` : ''}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Chưa có thông tin chi tiết địa chỉ</p>
                      )}
                    </div>

                    {/* Order & Payment Summary */}
                    <div className="border border-gray-200 p-4 bg-gray-50/40 space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-900 mb-3 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-gray-700" />
                        Tổng kết thanh toán
                      </h3>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Phương thức:</span>
                        <span className="font-medium text-gray-900 uppercase">
                          {selectedOrder.payment_method || 'COD'}
                        </span>
                      </div>
                      {selectedOrder.subtotal !== undefined && (
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Tạm tính:</span>
                          <span>{formatPrice(selectedOrder.subtotal)}</span>
                        </div>
                      )}
                      {selectedOrder.shipping_fee !== undefined && (
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Phí vận chuyển:</span>
                          <span>{formatPrice(selectedOrder.shipping_fee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Tổng tiền:</span>
                        <span className="text-base text-gray-900">{formatPrice(selectedOrder.total_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {selectedOrder.notes && (
                    <div className="p-3 bg-amber-50/50 border border-amber-200 text-xs text-amber-900">
                      <span className="font-semibold uppercase tracking-wider mr-2">Ghi chú:</span>
                      {selectedOrder.notes}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-end gap-3">
              {isPayable(selectedOrder.payment_status, selectedOrder.status) && (
                <button
                  type="button"
                  onClick={(e) => handlePayNow(selectedOrder.id, e)}
                  disabled={payingOrderId === selectedOrder.id}
                  className="btn-primary py-2.5 px-6 text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
                >
                  {payingOrderId === selectedOrder.id ? (
                    <Spinner size="sm" className="border-t-white" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Thanh toán đơn hàng</span>
                    </>
                  )}
                </button>
              )}

              {isCancelable(selectedOrder.status) && (
                <button
                  type="button"
                  onClick={(e) => handleOpenCancelModal(selectedOrder, e)}
                  className="btn-outline py-2.5 px-6 text-xs font-semibold uppercase tracking-widest text-red-600 border-red-300 hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Hủy đơn hàng</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseDetail}
                className="py-2.5 px-6 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:text-black border border-gray-300 hover:border-black transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Dialog */}
      {cancelModal.isOpen && cancelModal.order && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-display uppercase tracking-wider text-gray-900">
                Xác nhận hủy đơn hàng
              </h3>
              <p className="text-xs text-gray-500 mt-2 font-light leading-relaxed">
                Bạn có chắc chắn muốn hủy đơn hàng <span className="font-semibold text-black">#{cancelModal.order.order_number || cancelModal.order.id.slice(0, 8)}</span>? Thao tác này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                disabled={cancelModal.isProcessing}
                onClick={() => setCancelModal({ isOpen: false, order: null, isProcessing: false })}
                className="flex-1 py-3 border border-gray-300 text-xs font-semibold uppercase tracking-wider text-gray-700 hover:border-black transition-colors"
              >
                Không, giữ lại
              </button>
              <button
                type="button"
                disabled={cancelModal.isProcessing}
                onClick={handleConfirmCancel}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                {cancelModal.isProcessing ? (
                  <Spinner size="sm" className="border-t-white" />
                ) : (
                  <span>Xác nhận hủy</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default MyOrdersPage
