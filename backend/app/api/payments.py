"""
Payments Router — Tích hợp cổng thanh toán (VNPay Sandbox).
"""
import uuid
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.order import Order, PaymentStatus, OrderStatus
from app.services.vnpay_service import VNPayService

router = APIRouter()


@router.post("/create_url/{order_id}")
async def create_payment_url(
    order_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Tạo URL chuyển hướng đến trang thanh toán VNPay.
    Chỉ user sở hữu đơn hàng mới có thể tạo URL thanh toán.
    """
    stmt = select(Order).where(Order.id == order_id, Order.user_id == current_user.id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order has already been paid")

    vnpay = VNPayService()
    ip_addr = request.client.host if request.client else "127.0.0.1"
    
    # Tính amount thành int (VNĐ không có số thập phân)
    amount = int(order.total_amount)
    order_info = f"Thanh toan don hang {order.order_number}"

    payment_url = vnpay.get_payment_url(
        order_id=str(order.id),
        amount=amount,
        ip_address=ip_addr,
        order_info=order_info
    )

    return {"payment_url": payment_url}


@router.get("/vnpay_return")
async def vnpay_return(request: Request):
    """
    Trang khách hàng được chuyển về sau khi thanh toán trên VNPay.
    Đây chỉ là trang hiển thị, không dùng để update Database (bảo mật).
    """
    params = dict(request.query_params)
    vnp_ResponseCode = params.get("vnp_ResponseCode")
    
    # Trong môi trường thực tế, nếu font-end được tách rời, 
    # ta sẽ redirect user về frontend kèm status code.
    if vnp_ResponseCode == "00":
        return {"message": "Giao dịch thành công! (Transaction Successful)", "data": params}
    else:
        return {"message": "Giao dịch thất bại hoặc bị hủy. (Transaction Failed/Cancelled)", "data": params}


@router.get("/vnpay_ipn")
async def vnpay_ipn(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook (IPN) - VNPay sẽ gọi ngầm vào URL này để báo trạng thái giao dịch.
    Đây là nơi cập nhật Database để đảm bảo tính an toàn.
    """
    params = dict(request.query_params)
    vnpay = VNPayService()

    # 1. Xác thực chữ ký để tránh bị gọi API giả mạo
    if not vnpay.validate_response(params.copy()):
        return {"RspCode": "97", "Message": "Invalid Signature"}

    order_id = params.get("vnp_TxnRef")
    vnp_ResponseCode = params.get("vnp_ResponseCode")

    try:
        stmt = select(Order).where(Order.id == uuid.UUID(order_id))
        result = await db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            return {"RspCode": "01", "Message": "Order Not Found"}

        # Kiểm tra số tiền khớp (Chống sửa amount trong URL)
        vnp_amount = int(params.get("vnp_Amount", 0)) // 100  # VNPay gửi nhân 100
        if vnp_amount != int(order.total_amount):
            return {"RspCode": "04", "Message": "Invalid Amount"}

        # Nếu đơn đã thanh toán rồi thì bỏ qua (Idempotent)
        if order.payment_status == PaymentStatus.PAID:
            return {"RspCode": "02", "Message": "Order already confirmed"}

        # 2. Cập nhật Database dựa vào kết quả thanh toán
        if vnp_ResponseCode == "00":
            order.payment_status = PaymentStatus.PAID
            order.status = OrderStatus.CONFIRMED
        else:
            order.payment_status = PaymentStatus.FAILED

        await db.commit()
        return {"RspCode": "00", "Message": "Confirm Success"}

    except Exception as e:
        return {"RspCode": "99", "Message": f"Unknown Error: {str(e)}"}
