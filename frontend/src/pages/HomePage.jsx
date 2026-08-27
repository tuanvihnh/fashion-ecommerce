import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Layers } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ProductCard from '../components/ProductCard'
import categoryApi from '../api/categoryApi'
import productApi from '../api/productApi'
import Spinner from '../components/ui/Spinner'

const HomePage = () => {
  const [categories, setCategories] = useState([])
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getAll()
        setCategories(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    const fetchFeaturedProducts = async () => {
      try {
        const res = await productApi.getAll({ page_size: 8 })
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : [])
        setFeaturedProducts(items)
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm nổi bật:', error)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchCategories()
    fetchFeaturedProducts()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-neutral-900 text-white overflow-hidden">
        {/* Subtle background overlay */}
        <div className="absolute inset-0 bg-radial from-neutral-800/40 via-neutral-900 to-black pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-800/80 border border-neutral-700 text-[11px] uppercase tracking-[0.25em] text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Autumn / Winter Collection 2026</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white leading-tight">
            Bộ sưu tập mới nhất
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
            Sự giao thoa hoàn hảo giữa thiết kế kiến trúc và chất liệu cao cấp. Tối giản trong kiểu dáng, tinh tế trong từng đường kim mũi chỉ.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-gray-950 px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors duration-200"
            >
              <span>Khám phá ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/products?gender=women"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white border border-neutral-700 hover:border-white transition-colors duration-200"
            >
              Bộ sưu tập Nữ
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-neutral-100">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-brand-600 font-semibold block mb-2">
              Danh mục nổi bật
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-gray-900 font-normal">
              Danh mục sản phẩm
            </h2>
          </div>
          <Link
            to="/products"
            className="mt-4 md:mt-0 text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-1 group"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loadingCategories ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Chưa có danh mục nào được hiển thị.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug || cat.id}`}
                className="group relative overflow-hidden bg-neutral-50 border border-neutral-100 p-8 flex flex-col justify-between min-h-[160px] hover:border-gray-900 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium">
                    Category
                  </span>
                  <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                </div>

                <div>
                  <h3 className="font-display text-lg sm:text-xl text-gray-900 group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-1 font-light">
                      {cat.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-neutral-50/50 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] uppercase tracking-[0.25em] text-brand-600 font-semibold block mb-2">
              Lựa chọn hàng đầu
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-gray-900 font-normal">
              Sản phẩm nổi bật
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-3 font-light">
              Những thiết kế đặc sắc thể hiện tinh thần tối giản và chất lượng vượt trội.
            </p>
          </div>

          {loadingProducts ? (
            <div className="py-16 flex justify-center">
              <Spinner />
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Hiện chưa có sản phẩm nổi bật nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link
              to="/products"
              className="btn-outline inline-block px-10 py-3.5"
            >
              Xem toàn bộ sản phẩm
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Philosophy Banner */}
      <section className="py-20 bg-white border-t border-neutral-100">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <Layers className="w-8 h-8 mx-auto text-brand-500 stroke-[1.2]" />
          <h2 className="font-display text-2xl sm:text-3xl text-gray-900 font-normal">
            Triết lý thiết kế ATELIER
          </h2>
          <p className="text-neutral-600 text-sm leading-relaxed max-w-2xl mx-auto font-light">
            Chúng tôi tin rằng sự sang trọng thực sự bắt nguồn từ sự giản lược những chi tiết thừa. Từng sản phẩm của Atelier là sự cân nhắc kỹ lưỡng về phom dáng, đường cắt may tỉ mỉ và độ bền vượt thời gian.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HomePage
