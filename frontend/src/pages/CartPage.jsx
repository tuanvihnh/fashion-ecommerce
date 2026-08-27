import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useCart } from '../context/CartContext'

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0)
}

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotal, clearCart } = useCart()
  const navigate = useNavigate()

  const subtotal = getTotal()
  const shippingFee = subtotal > 1000000 || subtotal === 0 ? 0 : 30000
  const grandTotal = subtotal + (subtotal > 0 ? shippingFee : 0)

  const handleQuantityChange = (variantId, currentQty, delta) => {
    const nextQty = currentQty + delta
    if (nextQty <= 0) {
      removeFromCart(variantId)
    } else {
      updateQuantity(variantId, nextQty)
    }
  }

  const handleDirectInput = (variantId, e) => {
    const val = parseInt(e.target.value, 10)
    if (isNaN(val) || val <= 0) {
      updateQuantity(variantId, 1)
    } else {
      updateQuantity(variantId, val)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb & Header */}
        <div className="border-b border-gray-200 pb-6 mb-8">
          <nav className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
            <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-black font-semibold">Giỏ hàng</span>
          </nav>
          <div className="flex items-baseline justify-between">
            <h1 className="text-2xl sm:text-3xl font-display uppercase tracking-wider text-gray-900">
              Giỏ hàng của bạn
            </h1>
            {cartItems.length > 0 && (
              <span className="text-xs uppercase tracking-widest text-gray-500">
                ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)
              </span>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
              <ShoppingBag className="w-9 h-9 stroke-1" />
            </div>
            <h2 className="text-xl font-display uppercase tracking-wider text-gray-900 mb-2">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-sm text-gray-500 mb-8 font-light leading-relaxed">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các thiết kế mới nhất trong bộ sưu tập của chúng tôi.
            </p>
            <Link
              to="/products"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-xs font-semibold uppercase tracking-widest shadow-sm hover:shadow transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          /* Cart Items & Summary Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Items List (Left Column) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="hidden sm:grid grid-cols-12 text-xs font-semibold uppercase tracking-widest text-gray-500 pb-3 border-b border-gray-200">
                <span className="col-span-6">Sản phẩm</span>
                <span className="col-span-2 text-center">Đơn giá</span>
                <span className="col-span-2 text-center">Số lượng</span>
                <span className="col-span-2 text-right">Tổng</span>
              </div>

              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const itemSubtotal = Number(item.unit_price || 0) * Number(item.quantity || 0)

                  return (
                    <div
                      key={item.product_variant_id}
                      className="py-6 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-4 sm:gap-2 group transition-colors"
                    >
                      {/* Product details */}
                      <div className="sm:col-span-6 flex items-center gap-4">
                        <div className="w-20 h-24 sm:w-24 sm:h-32 bg-gray-100 flex-shrink-0 overflow-hidden relative">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_title}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              <ShoppingBag className="w-6 h-6 stroke-1" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-sm font-medium uppercase tracking-wider text-gray-900 line-clamp-2 mb-1">
                            {item.product_title}
                          </h3>
                          {item.variant_info && (
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                              Phân loại: <span className="text-gray-800 font-normal">{item.variant_info}</span>
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_variant_id)}
                            className="text-xs text-gray-400 hover:text-red-600 transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider group/del pt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover/del:text-red-600 transition-colors" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>

                      {/* Unit price */}
                      <div className="sm:col-span-2 sm:text-center text-sm font-light text-gray-800">
                        <span className="sm:hidden text-xs text-gray-500 mr-2 uppercase">Đơn giá:</span>
                        {formatPrice(item.unit_price)}
                      </div>

                      {/* Quantity Controller */}
                      <div className="sm:col-span-2 flex sm:justify-center items-center">
                        <div className="inline-flex items-center border border-gray-300">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.product_variant_id, item.quantity, -1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleDirectInput(item.product_variant_id, e)}
                            className="w-10 h-8 text-center text-xs font-medium border-x border-gray-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.product_variant_id, item.quantity, 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="sm:col-span-2 text-left sm:text-right font-medium text-sm text-gray-900">
                        <span className="sm:hidden text-xs text-gray-500 mr-2 uppercase font-normal">Thành tiền:</span>
                        {formatPrice(itemSubtotal)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Tiếp tục mua sắm
                </Link>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                >
                  Xóa tất cả
                </button>
              </div>
            </div>

            {/* Order Summary (Right Column) */}
            <div className="lg:col-span-4 bg-gray-50 p-6 sm:p-8 border border-gray-200">
              <h2 className="text-base font-semibold uppercase tracking-widest text-gray-900 pb-4 mb-6 border-b border-gray-200">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-4 text-sm font-light">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-normal text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-normal text-gray-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-medium">Miễn phí</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>

                {subtotal > 0 && subtotal < 1000000 && (
                  <p className="text-xs text-gray-500 italic bg-white p-3 border border-gray-200">
                    Mua thêm <span className="font-medium text-black">{formatPrice(1000000 - subtotal)}</span> để được miễn phí giao hàng toàn quốc.
                  </p>
                )}

                <div className="pt-4 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="text-sm font-semibold uppercase tracking-widest text-gray-900">Tổng thanh toán</span>
                  <span className="text-xl font-semibold text-gray-900">{formatPrice(grandTotal)}</span>
                </div>
                <p className="text-[11px] text-gray-500 text-right italic">(Đã bao gồm thuế GTGT)</p>
              </div>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="btn-primary w-full py-4 text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Service Badges */}
              <div className="mt-8 pt-6 border-t border-gray-200 space-y-3 text-xs text-gray-600">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-gray-800 flex-shrink-0" />
                  <span>Giao hàng tiêu chuẩn 2-4 ngày làm việc</span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-gray-800 flex-shrink-0" />
                  <span>Đổi trả miễn phí trong vòng 30 ngày</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-gray-800 flex-shrink-0" />
                  <span>Thanh toán an toàn & bảo mật 100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default CartPage
