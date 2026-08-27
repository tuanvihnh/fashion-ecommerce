import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, ChevronLeft, ChevronRight, X, SlidersHorizontal, RotateCcw } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ProductCard from '../components/ProductCard'
import categoryApi from '../api/categoryApi'
import productApi from '../api/productApi'
import Spinner from '../components/ui/Spinner'

const GENDER_OPTIONS = [
  { label: 'Tất cả giới tính', value: '' },
  { label: 'Nam', value: 'men' },
  { label: 'Nữ', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
]

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE = 12

  // Read search params
  const categoryParam = searchParams.get('category') || ''
  const genderParam = searchParams.get('gender') || ''
  const searchParam = searchParams.get('search') || ''

  // Selected filters in local state
  const [selectedCategory, setSelectedCategory] = useState(categoryParam)
  const [selectedGender, setSelectedGender] = useState(genderParam)

  // Sync state when URL searchParams change
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '')
    setSelectedGender(searchParams.get('gender') || '')
    setCurrentPage(1)
  }, [searchParams])

  // Fetch categories once
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
    fetchCategories()
  }, [])

  // Fetch products when filters or page change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        const params = {
          page: currentPage,
          page_size: PAGE_SIZE,
        }

        // Map category slug / id to category_id
        if (selectedCategory && categories.length > 0) {
          const foundCategory = categories.find(
            (c) => c.slug === selectedCategory || c.id === selectedCategory
          )
          if (foundCategory) {
            params.category_id = foundCategory.id
          } else {
            // maybe it is already a UUID
            params.category_id = selectedCategory
          }
        }

        if (selectedGender) {
          params.gender = selectedGender
        }

        if (searchParam) {
          params.search = searchParam
        }

        const res = await productApi.getAll(params)
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : [])
        const total = res.data?.total ?? items.length
        
        setProducts(items)
        setTotalCount(total)
        setTotalPages(Math.ceil(total / PAGE_SIZE) || 1)
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error)
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }

    if (!loadingCategories) {
      fetchProducts()
    }
  }, [currentPage, selectedCategory, selectedGender, searchParam, categories, loadingCategories])

  // Update query params on filter change
  const handleCategoryChange = (catSlugOrId) => {
    const newParams = new URLSearchParams(searchParams)
    if (catSlugOrId) {
      newParams.set('category', catSlugOrId)
    } else {
      newParams.delete('category')
    }
    setSearchParams(newParams)
    setMobileFilterOpen(false)
  }

  const handleGenderChange = (genderVal) => {
    const newParams = new URLSearchParams(searchParams)
    if (genderVal) {
      newParams.set('gender', genderVal)
    } else {
      newParams.delete('gender')
    }
    setSearchParams(newParams)
    setMobileFilterOpen(false)
  }

  const handleResetFilters = () => {
    setSearchParams({})
    setMobileFilterOpen(false)
  }

  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedGender ? 1 : 0) + (searchParam ? 1 : 0)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Page Header */}
        <div className="border-b border-neutral-100 pb-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-brand-600 font-semibold block mb-2">
                Bộ sưu tập
              </span>
              <h1 className="font-display text-3xl sm:text-4xl text-gray-900 font-normal">
                {searchParam
                  ? `Kết quả cho "${searchParam}"`
                  : selectedCategory
                  ? categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.name || 'Sản phẩm'
                  : selectedGender
                  ? `Thời trang ${selectedGender === 'men' ? 'Nam' : selectedGender === 'women' ? 'Nữ' : 'Unisex'}`
                  : 'Tất cả sản phẩm'}
              </h1>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4">
              <span className="text-xs uppercase tracking-wider text-neutral-400">
                {totalCount} sản phẩm
              </span>

              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="md:hidden inline-flex items-center gap-2 border border-gray-900 px-4 py-2 text-xs uppercase tracking-wider font-medium text-gray-900"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Bộ lọc {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </button>
            </div>
          </div>

          {/* Active filter badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-neutral-100">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 mr-2">
                Đang lọc:
              </span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 text-xs">
                  <span>
                    {categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.name || selectedCategory}
                  </span>
                  <button
                    onClick={() => handleCategoryChange('')}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {selectedGender && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 text-xs">
                  <span>{GENDER_OPTIONS.find((g) => g.value === selectedGender)?.label}</span>
                  <button
                    onClick={() => handleGenderChange('')}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {searchParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-800 text-xs">
                  <span>Từ khóa: {searchParam}</span>
                  <button
                    onClick={() => {
                      const newP = new URLSearchParams(searchParams)
                      newP.delete('search')
                      setSearchParams(newP)
                    }}
                    className="hover:text-black cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-xs uppercase tracking-wider text-neutral-500 hover:text-gray-900 underline underline-offset-2 ml-2 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa tất cả</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block col-span-1 space-y-8 pr-6 border-r border-neutral-100">
            {/* Category Filter */}
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-gray-900 mb-4">
                Danh mục
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`w-full text-left text-xs uppercase tracking-wider py-1.5 transition-colors ${
                    !selectedCategory
                      ? 'font-bold text-gray-950 underline underline-offset-4'
                      : 'text-neutral-500 hover:text-gray-900'
                  }`}
                >
                  Tất cả danh mục
                </button>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug || cat.id)}
                      className={`w-full text-left text-xs tracking-wider py-1.5 transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'font-bold text-gray-950 underline underline-offset-4'
                          : 'text-neutral-600 hover:text-gray-900'
                      }`}
                    >
                      <span>{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Gender Filter */}
            <div className="pt-6 border-t border-neutral-100">
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-gray-900 mb-4">
                Giới tính
              </h3>
              <div className="space-y-2">
                {GENDER_OPTIONS.map((opt) => {
                  const isSelected = selectedGender === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleGenderChange(opt.value)}
                      className={`w-full text-left text-xs uppercase tracking-wider py-1.5 transition-colors ${
                        isSelected
                          ? 'font-bold text-gray-950 underline underline-offset-4'
                          : 'text-neutral-500 hover:text-gray-900'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <section className="col-span-1 md:col-span-3">
            {loadingProducts ? (
              <div className="py-24 flex justify-center items-center">
                <Spinner />
              </div>
            ) : products.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <p className="text-gray-500 text-sm font-light">
                  Không tìm thấy sản phẩm nào phù hợp với bộ lọc đã chọn.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn-outline text-xs px-6 py-2.5"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-16 pt-8 border-t border-neutral-100 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-gray-900 disabled:text-neutral-300 disabled:cursor-not-allowed hover:text-brand-600 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Trước</span>
                    </button>

                    <div className="text-xs uppercase tracking-wider text-neutral-500">
                      Trang <span className="font-semibold text-gray-900">{currentPage}</span> / {totalPages}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-gray-900 disabled:text-neutral-300 disabled:cursor-not-allowed hover:text-brand-600 transition-colors"
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />

          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-gray-900">
                  Bộ lọc sản phẩm
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Category List */}
              <div className="py-6 border-b border-neutral-100">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-700 mb-3">
                  Danh mục
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`block w-full text-left text-xs py-1.5 ${
                      !selectedCategory ? 'font-bold text-gray-950' : 'text-neutral-600'
                    }`}
                  >
                    Tất cả danh mục
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug || cat.id)}
                      className={`block w-full text-left text-xs py-1.5 ${
                        selectedCategory === cat.slug || selectedCategory === cat.id
                          ? 'font-bold text-gray-950'
                          : 'text-neutral-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Gender List */}
              <div className="py-6 border-b border-neutral-100">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-700 mb-3">
                  Giới tính
                </h4>
                <div className="space-y-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleGenderChange(opt.value)}
                      className={`block w-full text-left text-xs uppercase py-1.5 ${
                        selectedGender === opt.value ? 'font-bold text-gray-950' : 'text-neutral-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleResetFilters}
                className="w-full btn-outline text-xs py-3 mb-2"
              >
                Đặt lại bộ lọc
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full btn-primary text-xs py-3"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ProductListPage
