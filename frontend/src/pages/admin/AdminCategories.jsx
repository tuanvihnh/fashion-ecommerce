import React, { useState, useEffect } from 'react'
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  FolderPlus,
  ArrowUpDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminSidebar from '../../components/layout/AdminSidebar'
import categoryApi from '../../api/categoryApi'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

const AdminCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Add category form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [autoSlug, setAutoSlug] = useState(true)
  const initialCategoryState = {
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
  }
  const [formData, setFormData] = useState(initialCategoryState)

  // Editing state
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
  })

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Slug generator
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

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await categoryApi.getAll()
      const data = res.data || res
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error)
      toast.error('Không thể tải danh sách danh mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Handle Add Category Form
  const handleNameChange = (e) => {
    const val = e.target.value
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: autoSlug ? generateSlug(val) : prev.slug,
    }))
  }

  const handleSlugChange = (e) => {
    setAutoSlug(false)
    setFormData((prev) => ({ ...prev, slug: e.target.value }))
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục')
      return
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      description: formData.description.trim() || null,
      sort_order: Number(formData.sort_order) || 0,
    }

    setSubmitting(true)
    const toastId = toast.loading('Đang thêm danh mục...')
    try {
      const res = await categoryApi.create(payload)
      const newCategory = res.data || res
      toast.success('Thêm danh mục thành công!', { id: toastId })
      // Chèn danh mục mới vào đầu mảng ngay lập tức
      setCategories((prev) => [newCategory, ...prev])
      setFormData(initialCategoryState)
      setAutoSlug(true)
      setShowAddForm(false)
    } catch (error) {
      console.error('Lỗi khi thêm danh mục:', error)
      toast.error(
        error.response?.data?.detail || 'Thêm danh mục thất bại. Vui lòng kiểm tra lại.',
        { id: toastId }
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Edit Category
  const startEditing = (category) => {
    setEditingId(category.id)
    setEditFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order ?? 0,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditFormData({ name: '', slug: '', description: '', sort_order: 0 })
  }

  const handleSaveEdit = async (categoryId) => {
    if (!editFormData.name.trim()) {
      toast.error('Tên danh mục không được để trống')
      return
    }

    const payload = {
      name: editFormData.name.trim(),
      slug: editFormData.slug.trim() || generateSlug(editFormData.name),
      description: editFormData.description.trim() || null,
      sort_order: Number(editFormData.sort_order) || 0,
    }

    const toastId = toast.loading('Đang lưu thay đổi...')
    try {
      const res = await categoryApi.update(categoryId, payload)
      const updatedCategory = res.data || res
      toast.success('Cập nhật danh mục thành công!', { id: toastId })
      // Cập nhật trực tiếp danh mục trong mảng
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, ...updatedCategory } : c))
      )
      setEditingId(null)
    } catch (error) {
      console.error('Lỗi khi cập nhật danh mục:', error)
      toast.error(
        error.response?.data?.detail || 'Cập nhật thất bại. Vui lòng kiểm tra tên/slug.',
        { id: toastId }
      )
    }
  }

  // Handle Delete Category
  const confirmDelete = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    const toastId = toast.loading('Đang xóa danh mục...')
    try {
      await categoryApi.remove(deleteTarget.id)
      toast.success(`Đã xóa danh mục "${deleteTarget.name}"`, { id: toastId })
      // Loại bỏ danh mục khỏi mảng ngay lập tức
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      console.error('Lỗi khi xóa danh mục:', error)
      toast.error(
        error.response?.data?.detail || 'Không thể xóa danh mục này.',
        { id: toastId }
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">
              Cấu trúc sản phẩm
            </span>
            <h1 className="text-2xl font-display font-semibold text-gray-900 mt-0.5">
              Quản lý danh mục
            </h1>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
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
                <span>Thêm danh mục mới</span>
              </>
            )}
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Form Thêm danh mục nhỏ gọn (Toggleable) */}
          {showAddForm && (
            <div className="bg-white border border-gray-900 p-6 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-[#a87040]" />
                  <h2 className="font-display text-lg font-semibold text-gray-900">
                    Thêm danh mục mới
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-1.5">
                      Tên danh mục <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Áo Sơ Mi"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="input-field text-sm py-2"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-1.5">
                      Slug URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ao-so-mi"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className="input-field text-sm font-mono py-2 bg-gray-50/50"
                    />
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-1.5">
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sort_order}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sort_order: e.target.value }))
                      }
                      className="input-field text-sm py-2"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-gray-700 mb-1.5">
                    Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    placeholder="Mô tả tóm tắt cho nhóm sản phẩm này..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="input-field text-sm py-2"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-outline text-xs py-2 px-4"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-2 px-6 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Đang tạo...' : 'Tạo danh mục'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-gray-900">
                  Tất cả danh mục ({categories.length})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Danh mục dùng để phân loại và điều hướng sản phẩm trên website
                </p>
              </div>
            </div>

            {loading ? (
              <Spinner center size="lg" label="Đang tải danh mục..." />
            ) : categories.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <FolderTree className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Chưa có danh mục nào. Hãy tạo danh mục đầu tiên.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-3.5 font-medium">Tên danh mục</th>
                      <th className="px-6 py-3.5 font-medium">Slug</th>
                      <th className="px-6 py-3.5 font-medium">Mô tả</th>
                      <th className="px-6 py-3.5 font-medium text-center">Thứ tự</th>
                      <th className="px-6 py-3.5 font-medium">Trạng thái</th>
                      <th className="px-6 py-3.5 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categories.map((category) => {
                      const isEditing = editingId === category.id

                      if (isEditing) {
                        return (
                          <tr key={category.id} className="bg-amber-50/40">
                            {/* Edit Name */}
                            <td className="px-6 py-3">
                              <input
                                type="text"
                                value={editFormData.name}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="input-field text-xs py-1.5"
                              />
                            </td>
                            {/* Edit Slug */}
                            <td className="px-6 py-3">
                              <input
                                type="text"
                                value={editFormData.slug}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    slug: e.target.value,
                                  }))
                                }
                                className="input-field text-xs py-1.5 font-mono"
                              />
                            </td>
                            {/* Edit Description */}
                            <td className="px-6 py-3">
                              <input
                                type="text"
                                value={editFormData.description}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                className="input-field text-xs py-1.5"
                              />
                            </td>
                            {/* Edit Sort Order */}
                            <td className="px-6 py-3 text-center">
                              <input
                                type="number"
                                value={editFormData.sort_order}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    sort_order: e.target.value,
                                  }))
                                }
                                className="input-field text-xs py-1.5 text-center w-20 mx-auto"
                              />
                            </td>
                            {/* Status */}
                            <td className="px-6 py-3">
                              <Badge status={category.is_active ? 'active' : 'inactive'} />
                            </td>
                            {/* Edit Actions */}
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleSaveEdit(category.id)}
                                  className="p-1.5 bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                                  title="Lưu"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                                  title="Hủy"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={category.id} className="hover:bg-gray-50/75 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {category.name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">
                            {category.slug}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                            {category.description || '—'}
                          </td>
                          <td className="px-6 py-4 text-xs text-center font-semibold text-gray-700">
                            {category.sort_order ?? 0}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={category.is_active ? 'active' : 'inactive'} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => startEditing(category)}
                                className="text-gray-500 hover:text-gray-900 transition-colors p-1"
                                title="Sửa danh mục"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(category)}
                                className="text-gray-400 hover:text-rose-600 transition-colors p-1"
                                title="Xóa danh mục"
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
          </div>
        </div>

        {/* Modal Xác nhận xóa danh mục */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white max-w-md w-full p-6 border border-gray-900 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-gray-900">
                    Xác nhận xóa danh mục
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Bạn có chắc chắn muốn xóa danh mục{' '}
                    <strong className="text-gray-900 font-semibold">
                      "{deleteTarget.name}"
                    </strong>
                    ? Thao tác này không thể hoàn tác.
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

export default AdminCategories
