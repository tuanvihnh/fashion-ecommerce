import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

const CART_STORAGE_KEY = 'cart'

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      return savedCart ? JSON.parse(savedCart) : []
    } catch (error) {
      console.error('Lỗi khi đọc giỏ hàng từ localStorage:', error)
      return []
    }
  })

  // Đồng bộ giỏ hàng vào localStorage mỗi khi cartItems thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch (error) {
      console.error('Lỗi khi lưu giỏ hàng vào localStorage:', error)
    }
  }, [cartItems])

  /**
   * Thêm sản phẩm và biến thể vào giỏ hàng
   * @param {Object} product - Thông tin sản phẩm
   * @param {Object} variant - Thông tin biến thể
   * @param {number} quantity - Số lượng cần thêm
   */
  const addToCart = (product, variant, quantity = 1) => {
    const variantId = variant?.id || variant?.product_variant_id
    if (!variantId) {
      console.error('Không tìm thấy variant ID hợp lệ')
      return
    }

    const qtyToAdd = Number(quantity) > 0 ? Number(quantity) : 1
    const unitPrice = Number(
      variant?.effective_price ??
      variant?.price_override ??
      variant?.price ??
      product?.base_price ??
      product?.price ??
      0
    )

    const variantInfo =
      variant?.variant_info ||
      [variant?.size, variant?.color].filter(Boolean).join(' - ') ||
      'Tiêu chuẩn'

    const imageUrl =
      variant?.image_url ||
      product?.image_url ||
      product?.thumbnail ||
      (Array.isArray(product?.images) ? product.images[0] : '') ||
      ''

    const productTitle = product?.title || product?.name || 'Sản phẩm'

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.product_variant_id === variantId
      )

      if (existingIndex > -1) {
        return prevItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        )
      }

      const newItem = {
        product_variant_id: variantId,
        product_title: productTitle,
        variant_info: variantInfo,
        unit_price: unitPrice,
        quantity: qtyToAdd,
        image_url: imageUrl,
      }

      return [...prevItems, newItem]
    })
  }

  /**
   * Cập nhật số lượng của một biến thể trong giỏ
   * @param {string|number} variantId 
   * @param {number} quantity 
   */
  const updateQuantity = (variantId, quantity) => {
    const newQty = Number(quantity)
    if (newQty <= 0) {
      removeFromCart(variantId)
      return
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product_variant_id === variantId
          ? { ...item, quantity: newQty }
          : item
      )
    )
  }

  /**
   * Xóa một biến thể khỏi giỏ hàng
   * @param {string|number} variantId 
   */
  const removeFromCart = (variantId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_variant_id !== variantId)
    )
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  const clearCart = () => {
    setCartItems([])
  }

  /**
   * Tính tổng tiền giỏ hàng
   * @returns {number}
   */
  const getTotal = () => {
    return cartItems.reduce(
      (total, item) => total + Number(item.unit_price || 0) * Number(item.quantity || 0),
      0
    )
  }

  /**
   * Đếm tổng số lượng sản phẩm trong giỏ
   * @returns {number}
   */
  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0)
  }

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotal,
    getItemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export default CartContext
