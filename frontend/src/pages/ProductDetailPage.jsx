import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ShoppingBag, ChevronRight, Check, ShieldCheck, Truck, RotateCcw, Image as ImageIcon, Minus, Plus } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import productApi from '../api/productApi'
import { useCart } from '../context/CartContext'
import Spinner from '../components/ui/Spinner'

const ProductDetailPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Selection states
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  // Fetch product detail
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await productApi.getBySlug(slug)
        const prodData = res.data
        setProduct(prodData)

        // Initialize default selection if variants exist
        if (prodData.variants && prodData.variants.length > 0) {
          const firstInStock =
            prodData.variants.find((v) => v.stock_quantity > 0) || prodData.variants[0]
          setSelectedColor(firstInStock.color || '')
          setSelectedSize(firstInStock.size || '')
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', err)
        setError('Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  // Extract unique colors and sizes from variants
  const availableColors = useMemo(() => {
    if (!product?.variants) return []
    const colorsMap = new Map()
    product.variants.forEach((v) => {
      if (v.color && !colorsMap.has(v.color)) {
        colorsMap.set(v.color, {
          name: v.color,
          hex: v.color_hex || null,
        })
      }
    })
    return Array.from(colorsMap.values())
  }, [product])

  const availableSizes = useMemo(() => {
    if (!product?.variants) return []
    const sizes = []
    product.variants.forEach((v) => {
      if (v.size && !sizes.includes(v.size)) {
        sizes.push(v.size)
      }
    })
    return sizes
  }, [product])

  // Determine currently selected variant
  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null

    // If both color and size are present in variants
    if (selectedColor && selectedSize) {
      return (
        product.variants.find(
          (v) => v.color === selectedColor && v.size === selectedSize
        ) || null
      )
    }

    // If only color is selected
    if (selectedColor && !selectedSize) {
      return product.variants.find((v) => v.color === selectedColor) || null
    }

    // If only size is selected
    if (selectedSize && !selectedColor) {
      return product.variants.find((v) => v.size === selectedSize) || null
    }

    return product.variants[0] || null
  }, [product, selectedColor, selectedSize])

  // Calculate current price and stock
  const currentPrice = useMemo(() => {
    if (selectedVariant?.effective_price != null) {
      return Number(selectedVariant.effective_price)
    }
    if (selectedVariant?.price_override != null) {
      return Number(selectedVariant.price_override)
    }
    return Number(product?.base_price || 0)
  }, [product, selectedVariant])

  const stockQuantity = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.stock_quantity ?? 0
    }
    if (product?.variants && product.variants.length > 0) {
      return product.variants.reduce((acc, v) => acc + (v.stock_quantity || 0), 0)
    }
    return 0
  }, [product, selectedVariant])

  const isOutOfStock = stockQuantity <= 0

  // Display image based on selected variant or fallback to main product image
  const displayImage =
    selectedVariant?.image_url ||
    product?.image_url ||
    (product?.variants && product.variants.find((v) => v.image_url)?.image_url)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0)
  }

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!product) return

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast.error('Vui lòng chọn đầy đủ màu sắc và kích thước')
      return
    }

    if (isOutOfStock) {
      toast.error('Phiên bản sản phẩm này hiện đã hết hàng')
      return
    }

    if (quantity > stockQuantity) {
      toast.error(`Chỉ còn ${stockQuantity} sản phẩm trong kho`)
      return
    }

    setAddingToCart(true)

    try {
      addToCart(product, selectedVariant, quantity)
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`)
    } catch (err) {
      console.error('Lỗi thêm giỏ hàng:', err)
      toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-32">
          <Spinner />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
          <h2 className="font-display text-2xl text-gray-900 mb-2">
            Không tìm thấy sản phẩm
          </h2>
          <p className="text-sm text-neutral-500 max-w-md mb-8">
            {error || 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.'}
          </p>
          <Link to="/products" className="btn-primary">
            Quay lại cửa hàng
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-neutral-100 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-xs uppercase tracking-wider text-neutral-500">
            <Link to="/" className="hover:text-gray-900">
              Trang chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/products" className="hover:text-gray-900">
              Sản phẩm
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  to={`/products?category=${product.category.slug || product.category.id}`}
                  className="hover:text-gray-900"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content — 2 Columns */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column — Image Gallery */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-neutral-100">
                  <ImageIcon className="w-16 h-16 stroke-1 text-gray-300 mb-3" />
                  <span className="text-xs uppercase tracking-[0.25em] text-gray-400">
                    ATELIER STUDIO
                  </span>
                </div>
              )}

              {product.brand && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 text-[11px] uppercase tracking-widest font-semibold text-gray-900">
                  {product.brand}
                </div>
              )}
            </div>
          </div>

          {/* Right Column — Product Details */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Category & Title */}
              <div>
                {product.category && (
                  <span className="text-[11px] uppercase tracking-[0.25em] text-brand-600 font-semibold block mb-2">
                    {product.category.name}
                  </span>
                )}
                <h1 className="font-display text-3xl sm:text-4xl text-gray-900 font-normal leading-tight">
                  {product.title}
                </h1>
              </div>

              {/* Price */}
              <div className="text-2xl font-medium text-gray-900">
                {formatPrice(currentPrice)}
              </div>

              {/* Brand & Material specs */}
              <div className="py-4 border-y border-neutral-100 space-y-2 text-xs">
                {product.brand && (
                  <div className="flex">
                    <span className="w-28 text-neutral-400 uppercase tracking-wider">
                      Thương hiệu:
                    </span>
                    <span className="text-gray-900 font-medium">{product.brand}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex">
                    <span className="w-28 text-neutral-400 uppercase tracking-wider">
                      Chất liệu:
                    </span>
                    <span className="text-gray-900 font-medium">{product.material}</span>
                  </div>
                )}
                {product.gender && (
                  <div className="flex">
                    <span className="w-28 text-neutral-400 uppercase tracking-wider">
                      Dành cho:
                    </span>
                    <span className="text-gray-900 font-medium capitalize">
                      {product.gender === 'men' ? 'Nam' : product.gender === 'women' ? 'Nữ' : 'Unisex'}
                    </span>
                  </div>
                )}
              </div>

              {/* Color Selection */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-900">
                      Màu sắc:{' '}
                      <span className="font-normal text-neutral-600">{selectedColor}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((colorObj) => {
                      const isSelected = selectedColor === colorObj.name
                      return (
                        <button
                          key={colorObj.name}
                          type="button"
                          onClick={() => setSelectedColor(colorObj.name)}
                          className={`px-4 py-2 text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-gray-900 bg-gray-900 text-white font-medium'
                              : 'border-neutral-200 text-gray-700 hover:border-gray-900 bg-white'
                          }`}
                        >
                          {colorObj.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-900">
                      Kích thước:{' '}
                      <span className="font-normal text-neutral-600">{selectedSize}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((sizeStr) => {
                      const isSelected = selectedSize === sizeStr
                      // Check if this size has stock in current selected color
                      const variantForSize = product.variants?.find(
                        (v) =>
                          v.size === sizeStr &&
                          (!selectedColor || v.color === selectedColor)
                      )
                      const sizeOutOfStock =
                        variantForSize && variantForSize.stock_quantity <= 0

                      return (
                        <button
                          key={sizeStr}
                          type="button"
                          onClick={() => setSelectedSize(sizeStr)}
                          className={`min-w-[44px] px-3 py-2 text-xs uppercase font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : sizeOutOfStock
                              ? 'border-neutral-200 text-neutral-300 line-through'
                              : 'border-neutral-200 text-gray-800 hover:border-gray-900 bg-white'
                          }`}
                        >
                          {sizeStr}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator */}
              <div className="flex items-center gap-2 pt-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`text-xs uppercase tracking-wider font-medium ${
                    isOutOfStock ? 'text-red-600' : 'text-neutral-600'
                  }`}
                >
                  {isOutOfStock
                    ? 'Hết hàng'
                    : `Còn ${stockQuantity} sản phẩm trong kho`}
                </span>
              </div>

              {/* Quantity Picker & Add to Cart Button */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-neutral-300">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-3 text-gray-600 hover:text-black disabled:text-neutral-300 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-2 text-xs font-semibold text-gray-900 select-none min-w-[36px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= stockQuantity || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.min(stockQuantity, q + 1))}
                      className="p-3 text-gray-600 hover:text-black disabled:text-neutral-300 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock || addingToCart}
                    className="flex-1 btn-primary flex items-center justify-center gap-3 py-3.5 disabled:bg-neutral-300 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-6 border-t border-neutral-100 space-y-2">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-gray-900">
                    Mô tả sản phẩm
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-light whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Guarantees */}
              <div className="pt-6 border-t border-neutral-100 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <Truck className="w-5 h-5 mx-auto text-neutral-400 stroke-[1.2]" />
                  <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                    Giao hàng toàn quốc
                  </p>
                </div>
                <div className="space-y-1">
                  <RotateCcw className="w-5 h-5 mx-auto text-neutral-400 stroke-[1.2]" />
                  <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                    Đổi trả trong 30 ngày
                  </p>
                </div>
                <div className="space-y-1">
                  <ShieldCheck className="w-5 h-5 mx-auto text-neutral-400 stroke-[1.2]" />
                  <p className="text-[10px] uppercase tracking-wider text-neutral-600 font-medium">
                    Chính hãng 100%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ProductDetailPage
