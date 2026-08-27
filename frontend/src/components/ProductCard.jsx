import React from 'react'
import { Link } from 'react-router-dom'
import { Image as ImageIcon } from 'lucide-react'

const ProductCard = ({ product }) => {
  if (!product) return null

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0)
  }

  const imageUrl = product.image_url || (product.variants && product.variants.find(v => v.image_url)?.image_url)

  return (
    <Link
      to={`/products/${product.slug || product.id}`}
      className="group block text-left"
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
            <ImageIcon className="w-10 h-10 stroke-1 mb-2 text-gray-300" />
            <span className="text-xs uppercase tracking-widest text-gray-400">Atelier</span>
          </div>
        )}

        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        {/* Brand Tag if available */}
        {product.brand && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] uppercase tracking-widest px-2 py-1 text-gray-700 font-medium">
            {product.brand}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-1">
        <h3 className="text-sm font-normal text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm font-medium text-gray-900">
          {formatPrice(product.base_price)}
        </p>
        {product.category?.name && (
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {product.category.name}
          </p>
        )}
      </div>
    </Link>
  )
}

export default ProductCard
