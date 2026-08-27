<p align="center">
  <strong style="font-size: 2em; letter-spacing: 0.1em;">LUXE</strong>
</p>

<h1 align="center">Fashion E-commerce Platform</h1>

<p align="center">
  <em>Hệ thống E-commerce thời trang Full-Stack với kiến trúc sạch, bảo mật cao và sẵn sàng cho Production.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/VNPay-005BAA?style=for-the-badge&logoColor=white" alt="VNPay" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/python-3.12-blue.svg" alt="Python" />
  <img src="https://img.shields.io/badge/node-20-green.svg" alt="Node" />
</p>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Tech Stack](#-tech-stack)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Database Schema (ERD)](#-database-schema-erd)
- [API Endpoints](#-api-endpoints)
- [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [Điểm nổi bật kỹ thuật](#-điểm-nổi-bật-kỹ-thuật)
- [Biến môi trường](#-biến-môi-trường)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

---

## 🎯 Giới thiệu

**LUXE Fashion** là một dự án E-commerce thời trang full-stack được xây dựng với mục tiêu đạt tiêu chuẩn **production-ready**: bảo mật cao, xử lý giao dịch an toàn, code sạch theo nguyên tắc SOLID, dễ bảo trì và mở rộng.

Dự án mô phỏng đầy đủ luồng mua hàng thực tế: từ đăng ký tài khoản, duyệt sản phẩm, thêm giỏ hàng, đặt hàng, đến thanh toán trực tuyến qua VNPay và quản lý đơn hàng cho Admin.

### Tại sao dự án này nổi bật?

- 🔒 **Pessimistic Locking** chống bán vượt tồn kho (Overselling) khi hàng nghìn người mua cùng lúc
- 💳 **Tích hợp thanh toán VNPay** hoàn chỉnh với Webhook IPN xác thực chữ ký HMAC SHA512
- 📸 **Price Snapshot** — Bảo toàn lịch sử giá tại thời điểm đặt hàng
- 🏗️ **Clean Architecture** — Router → Service → Model, tách biệt rõ ràng từng layer

---

## ✨ Tính năng nổi bật

### 👤 Khách hàng
- Đăng ký / Đăng nhập (JWT Authentication)
- Duyệt sản phẩm theo danh mục, giới tính, giá
- Xem chi tiết sản phẩm, chọn size & màu sắc
- Giỏ hàng (lưu trữ localStorage, hoạt động khi chưa đăng nhập)
- Đặt hàng với form địa chỉ giao hàng
- Thanh toán qua VNPay (Sandbox) hoặc COD
- Xem lịch sử & hủy đơn hàng

### 🛠️ Quản trị viên (Admin)
- Dashboard thống kê tổng quan
- CRUD Sản phẩm (kèm upload hình ảnh)
- CRUD Danh mục (hỗ trợ phân cấp cha-con)
- Quản lý toàn bộ đơn hàng (cập nhật trạng thái)
- Nhập thêm hàng vào kho (Restock)
- Kiểm tra tồn kho

### 🔐 Bảo mật
- Mật khẩu băm bcrypt
- JWT Access Token với thời gian hết hạn
- Phân quyền Admin / Customer
- CORS Middleware
- Chữ ký HMAC SHA512 cho thanh toán

---

## 🛠 Tech Stack

### Backend
| Công nghệ | Phiên bản | Vai trò |
|-----------|----------|---------|
| **Python** | 3.12 | Ngôn ngữ chính |
| **FastAPI** | 0.115 | Web framework (async) |
| **SQLAlchemy** | 2.0 | ORM (async mode) |
| **PostgreSQL** | 16 | Database |
| **Alembic** | 1.13 | Database migration |
| **Pydantic** | 2.x | Data validation |
| **python-jose** | 3.3 | JWT token |
| **passlib + bcrypt** | 1.7 | Password hashing |

### Frontend
| Công nghệ | Phiên bản | Vai trò |
|-----------|----------|---------|
| **React** | 18.3 | UI library |
| **Vite** | 5.3 | Build tool |
| **TailwindCSS** | 3.4 | CSS framework |
| **React Router** | 6.x | Client-side routing |
| **Axios** | 1.7 | HTTP client |
| **Lucide React** | — | Icon library |
| **React Hot Toast** | 2.4 | Toast notifications |

### DevOps
| Công nghệ | Vai trò |
|-----------|---------|
| **Docker** + **Docker Compose** | Containerization |
| **pgAdmin 4** | Database management UI |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│                     │     │                      │     │                  │
│   React Frontend    │────▶│   FastAPI Backend     │────▶│   PostgreSQL     │
│   (Port 3000)       │     │   (Port 8000)        │     │   (Port 5432)    │
│                     │     │                      │     │                  │
│  • TailwindCSS      │     │  • JWT Auth          │     │  • 6 Tables      │
│  • React Router     │     │  • 25+ Endpoints     │     │  • CHECK Constr. │
│  • Axios + JWT      │     │  • Async SQLAlchemy  │     │  • Indexes       │
│  • Context API      │     │  • Pessimistic Lock  │     │  • FK Relations  │
│                     │     │  • VNPay Integration │     │                  │
└─────────────────────┘     └──────────────────────┘     └──────────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │    VNPay Sandbox      │
                            │    Payment Gateway    │
                            └──────────────────────┘
```

### Backend Architecture (Clean Architecture)

```
Request → Router (API Layer) → Service (Business Logic) → Model (ORM) → Database
              │                       │
              ▼                       ▼
         Pydantic Schema        Dependencies
         (Validation)           (Auth Guards)
```

---

## 📊 Database Schema (ERD)

```
┌──────────────┐       ┌──────────────────┐       ┌───────────────────┐
│    users     │       │    categories    │       │     products      │
├──────────────┤       ├──────────────────┤       ├───────────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)           │
│ email (UK)   │       │ name (UK)        │  ┌───▶│ category_id (FK)  │
│ hashed_pass  │       │ slug (UK)        │──┘    │ title             │
│ full_name    │       │ description      │       │ slug (UK)         │
│ phone        │       │ parent_id (FK)───│──┐    │ base_price        │
│ role (enum)  │       │ sort_order       │  │    │ image_url         │
│ is_active    │       │ is_active        │◀─┘    │ brand             │
│ deleted_at   │       └──────────────────┘       │ gender (enum)     │
└──────┬───────┘                                  └────────┬──────────┘
       │                                                   │
       │ 1:N                                          1:N  │
       ▼                                                   ▼
┌──────────────┐                              ┌────────────────────┐
│    orders    │                              │  product_variants  │
├──────────────┤                              ├────────────────────┤
│ id (PK)      │                              │ id (PK)            │
│ order_number │                              │ product_id (FK)    │
│ user_id (FK) │       ┌───────────────┐      │ sku (UK)           │
│ status       │       │  order_items  │      │ size               │
│ subtotal     │  1:N  ├───────────────┤ N:1  │ color              │
│ shipping_fee │──────▶│ order_id (FK) │◀─────│ stock_quantity     │
│ total_amount │       │ variant_id(FK)│      │ price_override     │
│ payment_stat │       │ quantity      │      │ image_url          │
│ payment_meth │       │ unit_price 📸 │      │ is_active          │
└──────────────┘       │ product_snap  │      └────────────────────┘
                       └───────────────┘        CHECK(stock >= 0)
```

> 📸 `unit_price` trong `order_items` là **Price Snapshot** — ghi nhận giá tại thời điểm mua, đảm bảo lịch sử giá không bị thay đổi khi Admin sửa giá sản phẩm.

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản | Public |
| `POST` | `/api/v1/auth/login` | Đăng nhập (JWT) | Public |

### Users
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `GET` | `/api/v1/users/me` | Thông tin cá nhân | User |

### Categories
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `GET` | `/api/v1/categories` | Danh sách danh mục | Public |
| `POST` | `/api/v1/categories` | Tạo danh mục | Admin |
| `PUT` | `/api/v1/categories/{id}` | Sửa danh mục | Admin |
| `DELETE` | `/api/v1/categories/{id}` | Xóa danh mục | Admin |

### Products
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `GET` | `/api/v1/products` | Tìm kiếm sản phẩm | Public |
| `GET` | `/api/v1/products/{slug}` | Chi tiết sản phẩm | Public |
| `POST` | `/api/v1/products` | Tạo sản phẩm | Admin |
| `PUT` | `/api/v1/products/{id}` | Sửa sản phẩm | Admin |

### Orders
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `POST` | `/api/v1/orders` | Đặt hàng | User |
| `GET` | `/api/v1/orders` | Đơn hàng của tôi | User |
| `GET` | `/api/v1/orders/{id}` | Chi tiết đơn hàng | User |
| `POST` | `/api/v1/orders/{id}/cancel` | Hủy đơn + hoàn kho | User |
| `GET` | `/api/v1/orders/admin/all` | Tất cả đơn hàng | Admin |
| `PATCH` | `/api/v1/orders/admin/{id}/status` | Cập nhật trạng thái | Admin |

### Inventory
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `POST` | `/api/v1/inventory/check` | Kiểm tra tồn kho | Public |
| `POST` | `/api/v1/inventory/restock` | Nhập thêm hàng | Admin |

### Uploads
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `POST` | `/api/v1/uploads/image` | Upload ảnh sản phẩm | Admin |

### Payments
| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| `POST` | `/api/v1/payments/create_url/{id}` | Tạo URL thanh toán VNPay | User |
| `GET` | `/api/v1/payments/vnpay_return` | Return URL sau thanh toán | VNPay |
| `GET` | `/api/v1/payments/vnpay_ipn` | Webhook xác nhận thanh toán | VNPay |

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài đặt và đang chạy
- Git

### Bước 1: Clone dự án

```bash
git clone https://github.com/tuanvihnh/fashion-ecommerce-portfolio.git
cd fashion-ecommerce
```

### Bước 2: Cấu hình biến môi trường

```bash
cp backend/.env.example backend/.env
```

Chỉnh sửa file `backend/.env` nếu cần (mặc định đã hoạt động cho môi trường dev).

### Bước 3: Khởi chạy toàn bộ hệ thống

```bash
docker compose up -d --build
```

Lệnh này sẽ tự động:
- 🐘 Khởi tạo PostgreSQL database
- ⚡ Build & chạy FastAPI backend
- ⚛️ Build & chạy React frontend
- 🔧 Khởi chạy pgAdmin 4

### Bước 4: Chạy Database Migration

```bash
docker exec fashion_backend alembic upgrade head
```

### Bước 5: Truy cập

| Dịch vụ | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:3000 |
| ⚡ API Docs (Swagger) | http://localhost:8000/docs |
| 🐘 pgAdmin 4 | http://localhost:5050 |
| ❤️ Health Check | http://localhost:8000/health |

### Tạo tài khoản Admin

```bash
# 1. Đăng ký tài khoản qua Frontend hoặc API
# 2. Cấp quyền Admin:
docker exec -it fashion_db psql -U postgres -d fashion_ecommerce \
  -c "UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';"
```

---

## 📁 Cấu trúc thư mục

```
fashion-ecommerce-portfolio/
│
├── docker-compose.yml              # Orchestration cho 4 services
│
├── backend/                        # ⚡ FastAPI Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env / .env.example
│   ├── alembic/                    # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   ├── uploads/                    # Ảnh sản phẩm (static files)
│   └── app/
│       ├── main.py                 # Entry point + Router registration
│       ├── core/                   # Cấu hình lõi
│       │   ├── config.py           # Pydantic Settings (.env)
│       │   ├── security.py         # JWT + bcrypt
│       │   └── dependencies.py     # Auth guards (get_current_user, require_admin)
│       ├── db/
│       │   └── database.py         # AsyncSession factory
│       ├── models/                 # SQLAlchemy ORM Models
│       │   ├── base.py             # Base + TimestampMixin + SoftDeleteMixin
│       │   ├── user.py
│       │   ├── category.py
│       │   ├── product.py
│       │   ├── product_variant.py
│       │   ├── order.py
│       │   └── order_item.py
│       ├── schemas/                # Pydantic v2 Schemas
│       │   ├── user.py
│       │   ├── category.py
│       │   ├── product.py
│       │   └── order.py
│       ├── services/               # Business Logic Layer
│       │   ├── auth_service.py     # Đăng ký, đăng nhập
│       │   ├── order_service.py    # Tạo/hủy đơn hàng
│       │   ├── inventory_service.py # Pessimistic Locking
│       │   └── vnpay_service.py    # Thanh toán VNPay
│       └── api/                    # API Routers
│           ├── auth.py
│           ├── users.py
│           ├── categories.py
│           ├── products.py
│           ├── orders.py
│           ├── inventory.py
│           ├── uploads.py
│           └── payments.py
│
└── frontend/                       # ⚛️ React Frontend
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx                # Entry point + Providers
        ├── App.jsx                 # React Router
        ├── index.css               # Tailwind + Custom classes
        ├── api/                    # Axios API modules
        │   ├── axiosClient.js      # Base instance + JWT interceptor
        │   ├── authApi.js
        │   ├── productApi.js
        │   ├── categoryApi.js
        │   ├── orderApi.js
        │   ├── uploadApi.js
        │   └── paymentApi.js
        ├── context/                # React Context (State Management)
        │   ├── AuthContext.jsx     # User state, login/logout
        │   └── CartContext.jsx     # Cart state (localStorage)
        ├── components/
        │   ├── layout/
        │   │   ├── Navbar.jsx      # Responsive navbar + mobile menu
        │   │   ├── Footer.jsx      # 4-column footer
        │   │   └── AdminSidebar.jsx
        │   ├── ui/
        │   │   ├── Spinner.jsx
        │   │   └── Badge.jsx
        │   ├── ProductCard.jsx
        │   └── ProtectedRoute.jsx  # Auth + Admin guard
        └── pages/
            ├── HomePage.jsx
            ├── ProductListPage.jsx
            ├── ProductDetailPage.jsx
            ├── CartPage.jsx
            ├── CheckoutPage.jsx
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── MyOrdersPage.jsx
            └── admin/
                ├── AdminDashboard.jsx
                ├── AdminProducts.jsx
                ├── AdminCategories.jsx
                └── AdminOrders.jsx
```

---

## 🔬 Điểm nổi bật kỹ thuật

### 1. 🔒 Pessimistic Locking — Chống Overselling

Khi nhiều người mua cùng 1 sản phẩm đồng thời, hệ thống sử dụng `SELECT ... FOR UPDATE` để khóa dòng dữ liệu trước khi trừ kho:

```python
# inventory_service.py
stmt = (
    select(ProductVariant)
    .where(ProductVariant.id.in_(variant_ids))
    .order_by(ProductVariant.id)     # Sắp xếp để chống Deadlock
    .with_for_update()               # 🔒 Pessimistic Lock
)
```

**4 tầng bảo vệ:**
| Tầng | Cơ chế | Mô tả |
|------|--------|-------|
| Application | `SELECT FOR UPDATE` | Khóa dòng variant trước khi trừ kho |
| Application | Sort variant IDs | Chống Deadlock khi lock nhiều dòng |
| Application | Stock validation | Kiểm tra `stock >= quantity` sau khi lock |
| Database | CHECK constraint | `CHECK (stock_quantity >= 0)` |

### 2. 💳 VNPay Payment Integration

Luồng thanh toán hoàn chỉnh với chữ ký bảo mật HMAC SHA512:

```
Client → POST /payments/create_url/{order_id}
       → Server tạo URL kèm chữ ký HMAC SHA512
       → Redirect user sang VNPay
       → User thanh toán
       → VNPay gọi Webhook IPN → Server xác thực chữ ký → Cập nhật DB
       → VNPay redirect user về Return URL
```

### 3. 📸 Price Snapshot

Giá sản phẩm được "chụp lại" tại thời điểm đặt hàng vào `order_items.unit_price`. Khi Admin thay đổi giá sau đó, đơn hàng cũ vẫn giữ nguyên giá gốc.

### 4. 🏗️ Async Everything

Toàn bộ backend sử dụng async/await từ API layer đến database:
- `AsyncSession` (SQLAlchemy 2.0)
- `asyncpg` driver
- FastAPI async endpoints

---

## 🔧 Biến môi trường

| Biến | Mô tả | Giá trị mặc định |
|------|-------|------------------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@db:5432/fashion_ecommerce` |
| `SECRET_KEY` | JWT signing key | `your-super-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL | `30` |
| `CORS_ORIGINS` | Allowed origins | `["http://localhost:3000"]` |
| `VNPAY_TMN_CODE` | VNPay merchant code | `MOCK_TMN_CODE` |
| `VNPAY_HASH_SECRET` | VNPay HMAC secret | `MOCK_HASH_SECRET` |
| `VNPAY_URL` | VNPay payment URL | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy:

1. Fork dự án
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit thay đổi (`git commit -m 'Add amazing feature'`)
4. Push lên branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

---

## 📄 License

Dự án này được phân phối dưới giấy phép **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

<p align="center">
  Made with ❤️ for learning and portfolio purposes.
</p>
