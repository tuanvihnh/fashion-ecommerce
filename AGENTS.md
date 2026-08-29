# 🛡️ NYXOS E-Commerce — AGENTS.md & Core Engineering Rules

Tài liệu này tổng hợp toàn bộ các **quy tắc kiến trúc cốt lõi**, **tiêu chuẩn code**, các **lỗi kinh điển đã giải quyết** và **hướng dẫn vận hành** dành cho các AI Agent và Developer khi làm việc trên codebase NYXOS E-Commerce.

---

## 📌 1. Tổng quan Dự án (Project Overview & Tech Stack)

- **Thương hiệu**: **NYXOS** (Thời trang cao cấp Minimalist & Neo-Gothic).
- **Cấu trúc Monorepo**:
  - `backend/`: FastAPI (Async), SQLAlchemy 2.0 (AsyncSession), PostgreSQL 16, Redis 7 (Caching), Alembic (Migration), Uvicorn.
  - `frontend/`: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v6.
- **Docker Compose Services**:
  - `fashion_frontend` (Port `3000`)
  - `fashion_backend` (Port `8000`)
  - `fashion_db` (Port `5432`)
  - `fashion_redis` (Port `6379`)
  - `fashion_pgadmin` (Port `5050`)

---

## ⚡ 2. Quy tắc Cốt lõi Backend (FastAPI & SQLAlchemy)

### 2.1. Tránh lỗi `MissingGreenlet` trong Async SQLAlchemy (CRITICAL)
- **Vấn đề**: Trong môi trường AsyncSession, sau khi `await db.commit()`, nếu chỉ gọi `await db.refresh(item)` thì SQLAlchemy **KHÔNG** tự động load các quan hệ (`variants`, `category`, etc.). Khi Pydantic model chuyển đổi dữ liệu (serialization) để trả về response, việc truy cập các attribute chưa load sẽ kích hoạt lazy-loading và ném lỗi `sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called`.
- **Quy tắc bắt buộc**: Khi tạo hoặc sửa entity có trả về dữ liệu quan hệ (ví dụ: `ProductRead`), **LUÔN re-fetch entity tường minh với `selectinload` / `joinedload`** trước khi return:
  ```python
  # ✅ ĐÚNG:
  await db.commit()
  stmt_refetch = (
      select(Product)
      .options(selectinload(Product.variants), joinedload(Product.category))
      .where(Product.id == product_id)
  )
  result = await db.execute(stmt_refetch)
  return result.scalar_one()
  ```

### 2.2. Xóa Cache Redis khi thao tác Thay đổi dữ liệu (Cache Invalidation)
- **Quy tắc**: Mọi API làm biến đổi dữ liệu (POST, PUT, DELETE) phải xóa cache đúng `namespace` đã định nghĩa trong `@cache(namespace=...)`:
  - Products: `await FastAPICache.clear(namespace="products")`
  - Categories: `await FastAPICache.clear(namespace="categories")`
- **Cảnh báo**: Tên `namespace` trong `FastAPICache.clear()` phải trùng khớp 100% với tên trong decorator, không dùng namespace chung chung vì sẽ không có tác dụng.

### 2.3. Tránh 307 Redirect (Trailing Slash Bug)
- **Quy tắc**: Khai báo router endpoint không dùng trailing slash nếu Axios phía Frontend gọi không có slash, ví dụ: `@router.post("")` thay vì `@router.post("/")`.
- **Lý do**: Axios gửi POST request tới `/api/v1/categories/` nếu thiếu dấu `/` có thể nhận HTTP 307 Temporary Redirect từ FastAPI, làm mất payload body trên một số client.

### 2.4. Chuẩn hóa Enum & Validation (Pydantic)
- Các enum gửi từ Frontend lên Backend (như `GenderEnum`: `'men'`, `'women'`, `'unisex'`) phải là **chữ thường (lowercase)**.
- Backend schemas dùng Pydantic v2 với `model_validate(from_attributes=True)`.

### 2.5. Soft Delete & Query Filtering
- Các thực thể hỗ trợ xóa mềm (như `Product`) dùng trường `deleted_at: datetime | None` và `is_active: bool`.
- Tất cả các câu lệnh query lấy sản phẩm phải có điều kiện: `.where(Product.deleted_at.is_(None))`.

### 2.6. Đồng bộ Realtime qua WebSocket
- Sau khi thực hiện CRUD thành công, Backend broadcast event qua `ws_manager`:
  - `ws_manager.broadcast({"type": "PRODUCT_CREATED"}, group="admin")`
  - `ws_manager.broadcast({"type": "PRODUCT_UPDATED"}, group="admin")`
  - `ws_manager.broadcast({"type": "PRODUCT_DELETED"}, group="admin")`
  - `ws_manager.broadcast({"type": "ORDER_CREATED"}, group="admin")`

---

## 🎨 3. Quy tắc Cốt lõi Frontend (React & UI/UX)

### 3.1. Quy tắc Cập nhật State Tức thì (Direct State Mutation — KHÔNG phụ thuộc Fetch lại)
- **Vấn đề cốt lõi**: Do Backend có Redis Caching (120s - 300s) và độ trễ mạng, nếu sau khi Thêm/Sửa/Xóa Frontend chỉ gọi `fetchProducts()` / `fetchCategories()`, API có thể trả về cache cũ khiến UI không thay đổi, gây ức chế cho người dùng.
- **Quy tắc bắt buộc**: Phải cập nhật trực tiếp vào React State ngay khi API trả về response:
  - **Tạo mới (Create)**: Chèn ngay object mới vào đầu mảng:
    ```javascript
    const res = await productApi.create(payload)
    const newProduct = res.data || res
    setProducts((prev) => [newProduct, ...prev])
    setTotal((prev) => prev + 1)
    ```
  - **Sửa (Edit)**: Dùng `map` tìm đúng ID và cập nhật tại chỗ:
    ```javascript
    const res = await productApi.update(id, payload)
    const updated = res.data || res
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)))
    ```
  - **Xóa (Delete)**: Dùng `filter` loại bỏ ngay khỏi mảng:
    ```javascript
    await productApi.delete(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setTotal((prev) => prev - 1)
    ```

### 3.2. Chống Double-Click Submit trên toàn bộ Form
- Mọi thao tác submit form (Đăng nhập, Đăng ký, Thanh toán, Lưu sản phẩm, Thêm danh mục) phải có state `isSubmitting` hoặc `submitting`.
- Nút submit phải:
  - Có thuộc tính `disabled={isSubmitting}`
  - Áp dụng class `disabled:opacity-50 disabled:cursor-not-allowed`
  - Hiển thị spinner và đổi nhãn text (ví dụ: "Đang xử lý...", "Đang lưu...").

### 3.3. Thông báo Lỗi Inline & Trải nghiệm Đăng nhập
- Form Đăng nhập & Đăng ký **bắt buộc** phải có:
  - Thông báo lỗi **inline** dạng khung viền đỏ nổi bật trên form kèm icon cảnh báo khi nhập sai tài khoản/mật khẩu, không chỉ dựa vào Toast.
  - Link **"Quên mật khẩu?"** được bố trí rõ ràng bên cạnh nhãn mật khẩu.
  - Tự động xóa thông báo lỗi khi người dùng bắt đầu gõ lại vào ô input.

### 3.4. Chuẩn hóa Logo Thương hiệu & Khử Viền Nền
- Toàn bộ logo hiển thị trên website phải là file **PNG trong suốt (Transparent PNG)**:
  - Navbar: `/logos/logo-nav.png`
  - Favicon: `/logos/logo-icon.png`
  - Admin Panel: `/logos/logo-icon.png`
  - Trang 404: `/logos/logo-404.png`
- **Lý do**: Tránh lỗi lộ hộp viền màu trắng khi thanh điều hướng sử dụng hiệu ứng kính mờ (*glassmorphism* / `backdrop-blur`) khi cuộn trang hoặc khi hiển thị trên nền tối.

---

## 🛠️ 4. Quy trình Môi trường & DevOps

### 4.1. Khởi chạy & Vận hành Docker
- Khởi động hệ thống:
  ```powershell
  docker compose up -d
  ```
- Khởi động lại service sau khi sửa file cấu hình hoặc backend:
  ```powershell
  docker compose restart backend
  docker compose restart frontend
  ```
- Xem logs kiểm tra lỗi:
  ```powershell
  docker logs fashion_backend --tail 50
  docker logs fashion_frontend --tail 50
  ```

### 4.2. Database Migration với Alembic
- Khi thay đổi Model trong `backend/app/models/`:
  ```powershell
  docker exec fashion_backend alembic revision --autogenerate -m "Mô tả thay đổi"
  docker exec fashion_backend alembic upgrade head
  ```

### 4.3. Lưu ý trên Windows & PowerShell
- Tránh chạy lệnh multiline `python -c "..."` có chứa từ khóa `from` hoặc dấu ngoặc kép lồng nhau trực tiếp trên PowerShell vì dễ bị lỗi cú pháp PowerShell.
- **Giải pháp**: Tạo file script tạm (`.ps1` hoặc `.py`) trong thư mục `scratch/` rồi thực thi.

---

## 📋 5. Checklist Trước Khi Hoàn Thành Nhiệm Vụ

Mỗi khi Agent chỉnh sửa tính năng, hãy đối chiếu danh sách sau:

- [ ] **Backend**: Có bị lỗi lazy-loading `MissingGreenlet` không? (Đã eagerly load quan hệ trước khi trả về chưa?)
- [ ] **Backend**: Đã gọi `FastAPICache.clear()` với đúng namespace sau mutation chưa?
- [ ] **Backend**: Có kiểm tra `deleted_at.is_(None)` với các model soft delete không?
- [ ] **Frontend**: State trên giao diện có cập nhật **ngay lập tức** không (dùng unshift/map/filter)?
- [ ] **Frontend**: Nút bấm có trạng thái `disabled` khi đang submit để chống bấm nhiều lần không?
- [ ] **Frontend**: Có link/route hợp lệ và hiển thị thông báo lỗi rõ ràng cho người dùng không?
- [ ] **Assets**: Logo có bị lộ viền hộp trắng khi cuộn trang không (đã dùng transparent PNG chưa)?
- [ ] **Docker**: Logs của `fashion_backend` và `fashion_frontend` có sạch sẽ, không có Exception 500 không?
