import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Banknote, 
  ArrowLeft, 
  ShoppingBag, 
  Check, 
  Lock,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'
import orderApi from '../api/orderApi'
import paymentApi from '../api/paymentApi'

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0)
}

const CheckoutPage = () => {
  const { cartItems, getTotal, clearCart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '700000',
    notes: '',
    payment_method: 'COD', // 'COD' or 'VNPAY'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  // Prefill data from user profile if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.full_name || prev.full_name,
        phone: user.phone || prev.phone,
      }))
    }
  }, [user])

  const subtotal = getTotal()
  const shippingFee = subtotal > 1000000 || subtotal === 0 ? 0 : 30000
  const grandTotal = subtotal + (subtotal > 0 ? shippingFee : 0)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.full_name.trim()) errors.full_name = 'Vui lòng nhập họ và tên'
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^[0-9+ ]{9,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ'
    }
    if (!formData.address_line1.trim()) errors.address_line1 = 'Vui lòng nhập địa chỉ cụ thể'
    if (!formData.city.trim()) errors.city = 'Vui lòng nhập Tỉnh / Thành phố'
    if (!formData.postal_code.trim()) errors.postal_code = 'Vui lòng nhập mã bưu chính'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()

    if (cartItems.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống')
      return
    }

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin giao hàng')
      return
    }

    setIsSubmitting(true)

    try {
      // Map cart items to OrderCreate format
      const payload = {
        items: cartItems.map((item) => ({
          product_variant_id: item.product_variant_id,
          quantity: Number(item.quantity),
        })),
        shipping_address: {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          address_line1: formData.address_line1.trim(),
          address_line2: formData.address_line2.trim() || undefined,
          city: formData.city.trim(),
          postal_code: formData.postal_code.trim() || '700000',
          country: 'VN',
        },
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || undefined,
      }

      const response = await orderApi.create(payload)
      const createdOrder = response.data

      // Nếu thanh toán VNPay
      if (formData.payment_method === 'VNPAY') {
        try {
          const paymentRes = await paymentApi.createUrl(createdOrder.id)
          clearCart()
          toast.success('Đơn hàng đã tạo. Đang chuyển đến cổng thanh toán VNPay...')
          if (paymentRes.data?.payment_url) {
            window.location.href = paymentRes.data.payment_url
            return
          }
        } catch (paymentErr) {
          console.error('Lỗi khởi tạo thanh toán VNPay:', paymentErr)
          toast.error('Đơn hàng đã được tạo nhưng chưa tạo được liên kết VNPay. Bạn có thể thanh toán lại trong mục Đơn hàng của tôi.')
          clearCart()
          navigate('/my-orders')
          return
        }
      }

      // Thanh toán COD hoặc thành công
      clearCart()
      toast.success('Đặt hàng thành công! Đơn hàng của bạn đang được xử lý.')
      navigate('/my-orders')
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error)
      const errorDetail = error.response?.data?.detail
      if (typeof errorDetail === 'string') {
        toast.error(errorDetail)
      } else if (Array.isArray(errorDetail)) {
        toast.error(errorDetail.map((d) => d.msg).join(', ') || 'Thông tin đơn hàng không hợp lệ.')
      } else {
        toast.error('Đặt hàng thất bại. Vui lòng kiểm tra lại thông tin!')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" label="Đang tải dữ liệu..." />
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header & Steps */}
        <div className="border-b border-gray-200 pb-6 mb-8">
          <nav className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
            <Link to="/cart" className="hover:text-black transition-colors">Giỏ hàng</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-black font-semibold">Thanh toán & Đặt hàng</span>
          </nav>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-wider text-gray-900">
              Thanh toán đơn hàng
            </h1>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Bảo mật 256-bit SSL</span>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
              <ShoppingBag className="w-7 h-7 stroke-1" />
            </div>
            <h2 className="text-xl font-display uppercase tracking-wider text-gray-900 mb-2">
              Không có sản phẩm để thanh toán
            </h2>
            <p className="text-sm text-gray-500 mb-6 font-light">
              Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi tiến hành thanh toán.
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-xs font-semibold uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" />
              Quay lại cửa hàng
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left Column: Form Info & Payment */}
            <div className="lg:col-span-7 space-y-10">
              {/* Section 1: Shipping Address */}
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[11px] flex items-center justify-center font-mono">1</span>
                    Thông tin giao hàng
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-2">
                      Họ và tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className={`input-field ${formErrors.full_name ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {formErrors.full_name && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.full_name}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-2">
                      Số điện thoại liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0912 345 678"
                      className={`input-field ${formErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-2">
                      Tỉnh / Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: TP. Hồ Chí Minh"
                      className={`input-field ${formErrors.city ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {formErrors.city && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.city}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-2">
                      Địa chỉ chi tiết (Số nhà, tên đường) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleInputChange}
                      placeholder="Số 123 Đường Lê Lợi, Phường Bến Nghé, Quận 1"
                      className={`input-field ${formErrors.address_line1 ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {formErrors.address_line1 && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.address_line1}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-2">
                      Địa chỉ bổ sung (Căn hộ / Tòa nhà / Ghi chú vị trí)
                    </label>
                    <input
                      type="text"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleInputChange}
                      placeholder="Tòa Landmark 81, Căn 12.04"
                      className="input-field"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-2">
                      Mã bưu chính (Postal Code) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      placeholder="700000"
                      className={`input-field ${formErrors.postal_code ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {formErrors.postal_code && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.postal_code}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-2">
                      Ghi chú đơn hàng (Tùy chọn)
                    </label>
                    <textarea
                      name="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Lưu ý cho shipper khi giao hàng (giờ giấc, gọi trước khi giao...)"
                      className="input-field resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Payment Method */}
              <div>
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[11px] flex items-center justify-center font-mono">2</span>
                    Phương thức thanh toán
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* COD */}
                  <label
                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                      formData.payment_method === 'COD'
                        ? 'border-gray-900 bg-gray-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="COD"
                      checked={formData.payment_method === 'COD'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-gray-800" />
                        <span className="text-sm font-medium uppercase tracking-wider text-gray-900">
                          Thanh toán khi nhận hàng (COD)
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-light">
                        Bạn sẽ thanh toán bằng tiền mặt khi shipper giao hàng tận nơi.
                      </p>
                    </div>
                  </label>

                  {/* VNPay */}
                  <label
                    className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                      formData.payment_method === 'VNPAY'
                        ? 'border-gray-900 bg-gray-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="VNPAY"
                      checked={formData.payment_method === 'VNPAY'}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-800" />
                        <span className="text-sm font-medium uppercase tracking-wider text-gray-900">
                          Thanh toán trực tuyến qua VNPay (ATM / QR Code / Visa / Master)
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-light">
                        Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán VNPay Sandbox an toàn tuyệt đối.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-gray-50 p-6 sm:p-8 border border-gray-200 sticky top-24">
                <h2 className="text-base font-semibold uppercase tracking-widest text-gray-900 pb-4 mb-6 border-b border-gray-200">
                  Tóm tắt đơn hàng ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                </h2>

                {/* Items preview list */}
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-200 pr-1 space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.product_variant_id} className="pt-4 first:pt-0 flex items-center gap-3">
                      <div className="w-14 h-18 bg-gray-100 flex-shrink-0 relative overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingBag className="w-5 h-5 stroke-1" />
                          </div>
                        )}
                        <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 font-mono">
                          x{item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-900 truncate">
                          {item.product_title}
                        </p>
                        {item.variant_info && (
                          <p className="text-[11px] text-gray-500 uppercase tracking-wider truncate">
                            {item.variant_info}
                          </p>
                        )}
                        <p className="text-xs font-medium text-gray-900 mt-1">
                          {formatPrice(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing Calculation */}
                <div className="space-y-3 pt-4 border-t border-gray-200 text-xs font-light text-gray-600">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-gray-900">
                      {shippingFee === 0 ? <span className="text-emerald-700 font-medium">Miễn phí</span> : formatPrice(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 text-sm font-semibold uppercase tracking-widest text-gray-900 items-baseline">
                    <span>Tổng thanh toán</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <div className="mt-8 space-y-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full py-4 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="border-t-white" />
                        <span>Đang xử lý đơn hàng...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác nhận đặt hàng</span>
                      </>
                    )}
                  </button>

                  <Link
                    to="/cart"
                    className="w-full text-center block text-xs font-semibold uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
                  >
                    Quay lại chỉnh sửa giỏ hàng
                  </Link>
                </div>

                {/* Security Guarantee */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-[11px] text-gray-500">
                  <p className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    Cam kết sản phẩm chính hãng 100%
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    Hỗ trợ đổi trả miễn phí trong 30 ngày
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default CheckoutPage
