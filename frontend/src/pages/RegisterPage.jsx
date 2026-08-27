import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import authApi from '../api/authApi'
import Spinner from '../components/ui/Spinner'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { full_name, email, password, phone } = formData

    if (!full_name.trim() || !email.trim() || !password) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc')
      return
    }

    if (password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.register({
        full_name: full_name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || null,
      })

      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (error) {
      console.error('Lỗi đăng ký:', error)
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Đăng ký thất bại. Vui lòng thử lại.'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 border border-neutral-100 shadow-xs">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-brand-600 font-semibold">
              Tạo tài khoản mới
            </span>
            <h1 className="font-display text-3xl text-gray-900 font-normal">
              Đăng ký
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Trở thành thành viên của Atelier để nhận nhiều ưu đãi độc quyền
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="full_name"
                className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-1.5"
              >
                Họ và tên *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-1.5"
              >
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-1.5"
              >
                Số điện thoại
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912 345 678"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-1.5"
              >
                Mật khẩu (tối thiểu 8 ký tự) *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field text-sm"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="border-white border-t-transparent" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Đăng ký tài khoản</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <div className="text-center pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-medium text-gray-900 hover:text-brand-600 underline underline-offset-4 transition-colors"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default RegisterPage
