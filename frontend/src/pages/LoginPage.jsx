import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu')
      return
    }

    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      toast.success('Đăng nhập thành công')
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Lỗi đăng nhập:', error)
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.'
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
              Chào mừng trở lại
            </span>
            <h1 className="font-display text-3xl text-gray-900 font-normal">
              Đăng nhập
            </h1>
            <p className="text-xs text-neutral-500 font-light">
              Nhập thông tin tài khoản của bạn để tiếp tục mua sắm
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-field text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-wider font-medium text-gray-700"
                >
                  Mật khẩu
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field text-sm"
              />
            </div>

            <div className="pt-2">
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
                  <span>Đăng nhập</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer link */}
          <div className="text-center pt-4 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-medium text-gray-900 hover:text-brand-600 underline underline-offset-4 transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
