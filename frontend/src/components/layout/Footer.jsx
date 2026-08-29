import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react'
import toast from 'react-hot-toast'

const Footer = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Vui lòng nhập địa chỉ email hợp lệ')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      toast.success('Cảm ơn bạn đã đăng ký nhận bản tin NYXOS!')
      setEmail('')
      setIsSubmitting(false)
    }, 600)
  }

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Cột 1: Về NYXOS */}
          <div className="space-y-4">
            <Link to="/">
              <img
                src="/logos/logo-footer.jpg"
                alt="NYXOS"
                className="h-20 w-auto object-contain rounded"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              Thương hiệu thời trang cao cấp với phong cách tối giản chuẩn mực. Từng đường may
              và chất liệu được tuyển chọn kỹ lưỡng, mang đến sự tinh tế vượt thời gian cho phong cách của bạn.
            </p>
            <div className="pt-2 space-y-2 text-xs text-gray-400">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#a87040] shrink-0" />
                <span>68 Đồng Khởi, Quận 1, TP. Hồ Chí Minh</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#a87040] shrink-0" />
                <span>Hotline: 1800 6868 (8:30 - 21:30)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#a87040] shrink-0" />
                <span>contact@luxe.vn</span>
              </p>
            </div>
          </div>

          {/* Cột 2: Hỗ trợ */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 mb-5">
              Hỗ trợ khách hàng
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/products"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Chính sách đổi trả & hoàn tiền
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Hướng dẫn chọn kích cỡ (Size Guide)
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Liên hệ & Hỗ trợ
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Theo dõi */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 mb-5">
              Theo dõi chúng tôi
            </h4>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed font-light">
              Khám phá những chiến dịch thời trang mới nhất và hậu trường sáng tạo cùng NYXOS.
            </p>
            <div className="space-y-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <Instagram className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                <span>Instagram @luxe.official</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <Facebook className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                <span>Facebook /luxefashion</span>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <svg
                  className="w-4 h-4 fill-current text-gray-400 group-hover:text-white transition-colors"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.46V10.7a8.16 8.16 0 0 0 5.73 2.29V9.54a4.85 4.85 0 0 1-.001-2.85z" />
                </svg>
                <span>TikTok @luxe.atelier</span>
              </a>
            </div>
          </div>

          {/* Cột 4: Newsletter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 mb-5">
              Đăng ký nhận tin
            </h4>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed font-light">
              Nhận thông tin sớm nhất về các bộ sưu tập giới hạn và đặc quyền mua sắm VIP.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 text-xs focus:outline-none focus:border-white transition-colors font-sans"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-gray-900 hover:bg-gray-100 px-4 py-3 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
            <p className="text-[11px] text-gray-500 mt-3">
              Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của NYXOS.
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} NYXOS. All rights reserved. Thiết kế thời trang tối giản & cao cấp.
          </p>
          <div className="flex items-center space-x-6 text-gray-400 text-xs">
            <span className="hover:text-white transition-colors cursor-pointer">Điều khoản</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Bảo mật</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
