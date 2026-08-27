import React, { useState, useEffect, useRef } from 'react'
import {
  Package,
  Plus,
  Search,
  Upload,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminSidebar from '../../components/layout/AdminSidebar'
import uploadApi from '../../api/uploadApi'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Pagination & Filtering
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('')

  // Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)
  const fileInputRef = useRef(null)
  const saveBtnRef = useRef(null)

  // Edit State
  const [editingProduct, setEditingProduct] = useState(null) // product object being edited

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const initialFormState = {
    title: '',
    slug: '',
    description: '',
    base_price: '',
    brand: '',
    material: '',
    gender: 'unisex',
    category_id: '',
    image_url: '',
  }
  const [formData, setFormData] = useState(initialFormState)

  // Utility to generate slug
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll()
      const data = res.data || res
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error)
    }
  }

  // Fetch products
  const fetchProducts = async (targetPage = page) => {
    setLoading(true)
    try {
      const params = {
        page: targetPage,
        page_size: pageSize,
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      if (selectedCategoryFilter) {
        params.category_id = selectedCategoryFilter
      }

      const res = await productApi.getAll(params)
      const data = res.data || res
      setProducts(data.items || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error)
      toast.error('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, selectedCategoryFilter])

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProducts(1)
  }

  // Handle title input and auto slug
  const handleTitleChange = (e) => {
    const val = e.target.value
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: autoSlug ? generateSlug(val) : prev.slug,
    }))
  }

  const handleSlugChange = (e) => {
    setAutoSlug(false)
    setFormData((prev) => ({
      ...prev,
      slug: e.target.value,
    }))
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle image upload
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      toast.error('Vui lòng chọn ảnh định dạng JPEG, PNG hoặc WebP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setUploadingImage(true)
    const toastId = toast.loading('Đang tải ảnh lên máy chủ...')
    try {
      const res = await uploadApi.uploadImage(file)
      const data = res.data || res
      const uploadedUrl = data.url || data.image_url

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image_url: uploadedUrl }))
        toast.success('Upload ảnh thành công!', { id: toastId })
      } else {
        toast.error('Không nhận được URL ảnh từ máy chủ', { id: toastId })
      }
    } catch (error) {
      console.error('Lỗi khi upload ảnh:', error)
      toast.error(
        error.response?.data?.detail || 'Upload ảnh thất bại. Vui lòng thử lại.',
        { id: toastId }
      )
    } finally {
      setUploadingImage(false)
    }
  }

  // ==================== CREATE ====================
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm')
      return
    }
    if (!formData.base_price || Number(formData.base_price) <= 0) {
      toast.error('Vui lòng nhập giá sản phẩm hợp lệ (> 0)')
      return
    }

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim() || generateSlug(formData.title),
      description: formData.description.trim() || null,
      base_price: Number(formData.base_price),
      brand: formData.brand.trim() || null,
      material: formData.material.trim() || null,
      gender: formData.gender || 'unisex',
      category_id: formData.category_id || null,
      image_url: formData.image_url.trim() || null,
    }

    setSubmitting(true)
    const toastId = toast.loading('Đang tạo sản phẩm...')
    try {
      const res = await productApi.create(payload)
      const newProduct = res.data || res
      toast.success('Thêm sản phẩm mới thành công!', { id: toastId })
      // Chèn sản phẩm mới lên ĐẦU danh sách ngay lập tức
      setProducts((prev) => [newProduct, ...prev])
      setTotal((prev) => prev + 1)
      setFormData(initialFormState)
      setAutoSlug(true)
      setShowAddForm(false)
      setPage(1)
    } catch (error) {
      console.error('Lỗi khi tạo sản phẩm:', error)
      const detail = error.response?.data?.detail
      let errorMsg = 'Không thể tạo sản phẩm'
      if (typeof detail === 'string') errorMsg = detail
      else if (Array.isArray(detail)) errorMsg = detail.map((d) => d.msg).join(', ')
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  // ==================== EDIT ====================
  const startEditing = (product) => {
    setEditingProduct(product)
    setFormData({
      title: product.title || '',
      slug: product.slug || '',
      description: product.description || '',
      base_price: product.base_price || '',
      brand: product.brand || '',
      material: product.material || '',
      gender: product.gender?.toLowerCase() || 'unisex',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
    })
    setAutoSlug(false)
    setShowAddForm(true)
    setTimeout(() => {
      saveBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm')
      return
    }
    if (!formData.base_price || Number(formData.base_price) <= 0) {
      toast.error('Vui lòng nhập giá sản phẩm hợp lệ (> 0)')
      return
    }

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim() || generateSlug(formData.title),
      description: formData.description.trim() || null,
      base_price: Number(formData.base_price),
      brand: formData.brand.trim() || null,
      material: formData.material.trim() || null,
      gender: formData.gender || 'unisex',
      category_id: formData.category_id || null,
      image_url: formData.image_url.trim() || null,
    }

    setSubmitting(true)
    const toastId = toast.loading('Đang cập nhật sản phẩm...')
    try {
      const res = await productApi.update(editingProduct.id, payload)
      const updatedProduct = res.data || res
      toast.success('Cập nhật sản phẩm thành công!', { id: toastId })
      // Cập nhật trực tiếp sản phẩm trong mảng
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updatedProduct } : p))
      )
      setFormData(initialFormState)
      setAutoSlug(true)
      setEditingProduct(null)
      setShowAddForm(false)
    } catch (error) {
      console.error('Lỗi khi cập nhật sản phẩm:', error)
      const detail = error.response?.data?.detail
      let errorMsg = 'Không thể cập nhật sản phẩm'
      if (typeof detail === 'string') errorMsg = detail
      else if (Array.isArray(detail)) errorMsg = detail.map((d) => d.msg).join(', ')
      toast.error(errorMsg, { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  const cancelEditing = () => {
    setEditingProduct(null)
    setFormData(initialFormState)
    setAutoSlug(true)
    setShowAddForm(false)
  }

  // ==================== DELETE ====================
  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    const toastId = toast.loading('Đang xóa sản phẩm...')
    try {
      await productApi.delete(deleteTarget.id)
      toast.success(`Đã xóa sản phẩm "${deleteTarget.title}"`, { id: toastId })
      // Loại bỏ sản phẩm khỏi mảng ngay lập tức
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
      setDeleteTarget(null)
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error)
      toast.error(
        error.response?.data?.detail || 'Không thể xóa sản phẩm này.',
        { id: toastId }
      )
    } finally {
      setDeleting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount)
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  // Determine if we are in create or edit mode
  const isEditing = !!editingProduct
  const formTitle = isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'
  const formSubtitle = isEditing
    ? `Đang sửa: ${editingProduct.title}`
    : 'Điền đầy đủ thông tin chi tiết và tải ảnh minh họa cho sản phẩm.'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
              Quản lý kho hàng
            </span>
            <h1 className="text-2xl font-display font-semibold text-gray-900 mt-0.5">
              Danh sách sản phẩm
            </h1>
          </div>

          <button
            onClick={() => {
              if (showAddForm) {
                cancelEditing()
              } else {
                setEditingProduct(null)
                setFormData(initialFormState)
                setAutoSlug(true)
                setShowAddForm(true)
                setTimeout(() => {
                  saveBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 150)
              }
            }}
            className="btn-primary inline-flex items-center gap-2 text-xs py-2.5 px-5 shrink-0"
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4" />
                <span>Đóng Form</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Thêm sản phẩm mới</span>
              </>
            )}
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center w-full md:w-96 relative"
            >
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pr-10 text-xs py-2"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3 text-gray-400 hover:text-gray-900 transition-colors"
                title="Tìm kiếm"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Danh mục:
                </span>
              </div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => {
                  setSelectedCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="border border-gray-300 text-xs px-3 py-2 bg-white focus:outline-none focus:border-gray-900"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Table Container */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-gray-900">
                Tất cả sản phẩm ({total})
              </h2>
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Trang {page} / {totalPages}
              </span>
            </div>

            {loading ? (
              <Spinner center size="lg" label="Đang tải danh sách sản phẩm..." />
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Không tìm thấy sản phẩm nào phù hợp</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5 font-medium">Ảnh</th>
                      <th className="px-6 py-3.5 font-medium">Tên sản phẩm</th>
                      <th className="px-6 py-3.5 font-medium">Giá gốc</th>
                      <th className="px-6 py-3.5 font-medium">Danh mục</th>
                      <th className="px-6 py-3.5 font-medium">Giới tính</th>
                      <th className="px-6 py-3.5 font-medium">Trạng thái</th>
                      <th className="px-6 py-3.5 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => {
                      const categoryName =
                        product.category?.name ||
                        categories.find((c) => c.id === product.category_id)?.name ||
                        'Chưa phân loại'

                      return (
                        <tr key={product.id} className="hover:bg-gray-50/75 transition-colors">
                          <td className="px-6 py-3.5">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-12 h-14 object-cover border border-gray-200 bg-gray-100"
                              />
                            ) : (
                              <div className="w-12 h-14 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="font-medium text-gray-900 max-w-xs truncate">
                              {product.title}
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                              {product.slug}
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-medium text-gray-900">
                            {formatCurrency(product.base_price)}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-gray-600">
                            {categoryName}
                          </td>
                          <td className="px-6 py-3.5 text-xs font-medium text-gray-700">
                            {product.gender || 'UNISEX'}
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge status={product.is_active ? 'active' : 'inactive'} />
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => startEditing(product)}
                                className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                                title="Sửa sản phẩm"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(product)}
                                className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {total > 0 && (
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

          {/* ==================== FORM Thêm / Sửa Sản Phẩm ==================== */}
          {showAddForm && (
            <div className={`bg-white border p-8 shadow-sm transition-all animate-fadeIn ${isEditing ? 'border-amber-400' : 'border-gray-900'}`}>
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-gray-900">
                    {formTitle}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {formSubtitle}
                  </p>
                </div>
                <button
                  onClick={cancelEditing}
                  className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={isEditing ? handleEditSubmit : handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Tên sản phẩm <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="VD: Áo Sơ Mi Linen Cổ Trụ"
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Slug URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      required
                      placeholder="ao-so-mi-linen-co-tru"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className="input-field text-sm font-mono text-gray-700 bg-gray-50/50"
                    />
                  </div>

                  {/* Base Price */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Giá gốc (VNĐ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="base_price"
                      required
                      min="0"
                      step="1000"
                      placeholder="VD: 850000"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Danh mục sản phẩm
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="input-field text-sm bg-white"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Thương hiệu / Nhãn hàng
                    </label>
                    <input
                      type="text"
                      name="brand"
                      placeholder="VD: Atelier Studio"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Material */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Chất liệu
                    </label>
                    <input
                      type="text"
                      name="material"
                      placeholder="VD: 100% Linen hữu cơ"
                      value={formData.material}
                      onChange={handleInputChange}
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Phân loại giới tính
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input-field text-sm bg-white"
                    >
                      <option value="unisex">UNISEX (Nam & Nữ)</option>
                      <option value="men">MEN (Nam)</option>
                      <option value="women">WOMEN (Nữ)</option>
                    </select>
                  </div>

                  {/* Image Upload & URL */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                      Hình ảnh sản phẩm
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        name="image_url"
                        placeholder="https://... hoặc tải ảnh lên"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        className="input-field text-sm flex-1"
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-3 border border-gray-900 bg-gray-900 text-white text-xs uppercase tracking-wider font-medium hover:bg-gray-800 transition-colors shrink-0 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        <Upload className={`w-4 h-4 ${uploadingImage ? 'animate-bounce' : ''}`} />
                        <span>{uploadingImage ? 'Đang tải...' : 'Tải ảnh'}</span>
                      </button>
                    </div>

                    {/* Image Preview */}
                    {formData.image_url && (
                      <div className="mt-3 flex items-center gap-3 p-2 border border-gray-200 bg-gray-50">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-14 h-16 object-cover border border-gray-300"
                        />
                        <div className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                          <span className="font-semibold text-gray-700 block">Xem trước ảnh:</span>
                          {formData.image_url}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, image_url: '' }))}
                          className="p-1 text-gray-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-2">
                    Mô tả chi tiết sản phẩm
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    placeholder="Mô tả phong cách, form dáng, cách bảo quản..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input-field text-sm"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="btn-outline text-xs py-3 px-6"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    ref={saveBtnRef}
                    type="submit"
                    disabled={submitting}
                    className={`text-xs py-3 px-8 inline-flex items-center gap-2 disabled:opacity-50 ${
                      isEditing
                        ? 'bg-amber-600 text-white hover:bg-amber-700 border border-amber-600 font-semibold uppercase tracking-wider transition-colors'
                        : 'btn-primary'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {submitting
                        ? (isEditing ? 'Đang cập nhật...' : 'Đang tạo...')
                        : (isEditing ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm')
                      }
                    </span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ==================== MODAL XÁC NHẬN XÓA ==================== */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white max-w-md w-full p-6 border border-gray-900 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-gray-900">
                    Xác nhận xóa sản phẩm
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Bạn có chắc chắn muốn xóa sản phẩm{' '}
                    <strong className="text-gray-900 font-semibold">
                      "{deleteTarget.title}"
                    </strong>
                    ? Thao tác này sẽ ẩn sản phẩm khỏi danh sách.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="btn-outline text-xs py-2.5 px-4"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-rose-600 text-white text-xs uppercase tracking-wider font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminProducts
