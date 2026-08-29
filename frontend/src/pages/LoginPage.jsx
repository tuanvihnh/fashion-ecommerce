import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu')
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
      setErrorMessage(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f5]">
      {/* Minimal top bar */}
      <div className="w-full py-4 px-6">
        <Link to="/" className="hover:opacity-70 transition-opacity inline-block">
          <img src="/logos/logo-nav.png" alt="NYXOS" className="h-8 w-auto object-contain" />
        </Link>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card with logo-centric design */}
          <div className="bg-white border border-gray-200 shadow-lg">
            {/* Logo Area — trung tâm, nổi bật */}
            <div className="flex justify-center pt-10 pb-6 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
              <Link to="/">
                <img
                  src="/logos/logo-login.jpg"
                  alt="NYXOS"
                  className="h-28 w-auto object-contain"
                />
              </Link>
            </div>

            <div className="px-8 sm:px-10 py-8">
              {/* Header text */}
              <div className="text-center mb-6">
                <h1 className="font-display text-xl text-gray-900 font-semibold tracking-wide">
                  Đăng nhập tài khoản
                </h1>
                <p className="text-xs text-gray-500 mt-1.5 font-light">
                  Nhập thông tin để tiếp tục trải nghiệm mua sắm
                </p>
              </div>

              {/* Inline Error Message */}
              {errorMessage && (
                <div className="flex items-start gap-3 p-3.5 mb-5 bg-rose-50 border border-rose-200 text-rose-700 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] uppercase tracking-widest font-semibold text-gray-600 mb-2"
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
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage('') }}
                    placeholder="name@example.com"
                    className={`w-full border px-4 py-3 text-sm focus:outline-none transition-colors ${
                      errorMessage
                        ? 'border-rose-300 focus:border-rose-500'
                        : 'border-gray-300 focus:border-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-[11px] uppercase tracking-widest font-semibold text-gray-600"
                    >
                      Mật khẩu
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] text-gray-500 hover:text-gray-900 font-medium transition-colors underline underline-offset-2"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage('') }}
                    placeholder="••••••••"
                    className={`w-full border px-4 py-3 text-sm focus:outline-none transition-colors ${
                      errorMessage
                        ? 'border-rose-300 focus:border-rose-500'
                        : 'border-gray-300 focus:border-gray-900'
                    }`}
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 text-white py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            {/* Footer link */}
            <div className="text-center py-5 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Chưa có tài khoản?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-gray-900 hover:text-gray-700 underline underline-offset-4 transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
