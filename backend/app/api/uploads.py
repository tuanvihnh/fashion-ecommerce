"""
Upload Router — API cho phép Admin upload hình ảnh sản phẩm.
"""
import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Request, Depends
from app.core.dependencies import require_admin
from app.models.user import User

router = APIRouter()

# Thư mục lưu trữ file tĩnh
UPLOAD_DIR = "uploads"
# Đảm bảo thư mục tồn tại
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post(
    "/image",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Upload ảnh sản phẩm (Admin only)",
)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    admin_user: User = Depends(require_admin),
):
    """
    API Upload ảnh (Admin).
    File sẽ được đổi tên (UUID) để tránh trùng lặp và lưu trữ vào thư mục /uploads.
    Trả về URL của hình ảnh để client lưu vào trường image_url của Product/Variant.
    """
    # 1. Kiểm tra định dạng file
    if file.content_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không được hỗ trợ. Vui lòng dùng JPEG, PNG, hoặc WebP."
        )

    # 2. Tạo tên file duy nhất với UUID
    file_extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # 3. Lưu file vào ổ cứng (chạy trên thread block an toàn)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu file: {str(e)}"
        )

    # 4. Trả về đường dẫn public (Static URL)
    # Sửa lỗi lấy nhầm domain nội bộ của Docker (backend:8000)
    base_url = str(request.base_url).replace("backend:8000", "localhost:8000")
    image_url = f"{base_url}static/{filename}"

    return {
        "filename": filename,
        "url": image_url,
        "message": "Upload thành công"
    }
