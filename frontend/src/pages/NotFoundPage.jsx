import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col items-center justify-center px-4 text-center">
      {/* Logo 404 — click chuyển về trang chủ */}
      <Link
        to="/"
        className="group cursor-pointer mb-8 hover:opacity-80 transition-opacity"
        title="Quay về trang chủ"
      >
        <img
          src="/logos/logo-404.png"
          alt="NYXOS — Trang không tồn tại"
          className="h-32 sm:h-40 w-auto object-contain mx-auto"
        />
      </Link>

      {/* Error Code */}
      <h1 className="font-display text-7xl sm:text-8xl font-bold text-gray-900 tracking-tight mb-2">
        404
      </h1>

      <p className="text-lg text-gray-600 font-light mb-2">
        Trang bạn tìm kiếm không tồn tại
      </p>

      <p className="text-sm text-gray-400 max-w-md mb-8 font-light">
        Rất tiếc, đường dẫn này không khả dụng hoặc đã bị xóa.
        Bấm vào logo phía trên hoặc nút bên dưới để trở về trang chủ.
      </p>

      {/* Back to Home Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay về trang chủ</span>
      </Link>
    </div>
  )
}

export default NotFoundPage
