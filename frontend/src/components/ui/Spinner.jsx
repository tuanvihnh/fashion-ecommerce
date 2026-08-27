import React from 'react'

const Spinner = ({ size = 'md', className = '', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
    xl: 'w-16 h-16 border-4',
  }

  const spinnerElement = (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-gray-900 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      role="status"
      aria-label="Đang tải..."
    >
      <span className="sr-only">Đang tải...</span>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinnerElement}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinnerElement}
    </div>
  )
}

export default Spinner
