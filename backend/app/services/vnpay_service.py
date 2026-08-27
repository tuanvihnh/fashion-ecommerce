"""
VNPay Service — Xử lý logic tạo URL thanh toán và xác thực chữ ký (HMAC SHA512).

Luồng thanh toán VNPay:
1. Client gọi API /payments/create_url/{order_id}
2. Server tạo URL chứa thông tin đơn hàng + chữ ký HMAC SHA512
3. Client chuyển hướng user sang trang VNPay để nhập thẻ
4. VNPay xử lý giao dịch
5. VNPay gọi ngầm Webhook IPN (/payments/vnpay_ipn) để báo kết quả
6. VNPay chuyển hướng user về Return URL (/payments/vnpay_return)
"""
import hashlib
import hmac
import urllib.parse
from datetime import datetime
from typing import Dict

from app.core.config import settings


class VNPayService:
    """Service xử lý tích hợp cổng thanh toán VNPay."""

    def __init__(self):
        self.vnpay_tmn_code = settings.VNPAY_TMN_CODE
        self.vnpay_hash_secret = settings.VNPAY_HASH_SECRET
        self.vnpay_url = settings.VNPAY_URL
        self.vnpay_return_url = settings.VNPAY_RETURN_URL

    def _hmac_sha512(self, data: str) -> str:
        """Tạo chữ ký HMAC SHA512 từ dữ liệu."""
        return hmac.new(
            self.vnpay_hash_secret.encode('utf-8'),
            data.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()

    def get_payment_url(self, order_id: str, amount: int, ip_address: str, order_info: str) -> str:
        """Tạo URL chuyển hướng người dùng sang trang thanh toán VNPay.

        Args:
            order_id: Mã đơn hàng (dùng làm vnp_TxnRef)
            amount: Số tiền (VNĐ, số nguyên)
            ip_address: IP của khách hàng
            order_info: Mô tả đơn hàng

        Returns:
            URL thanh toán đầy đủ kèm chữ ký bảo mật
        """
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": self.vnpay_tmn_code,
            "vnp_Amount": str(int(amount * 100)),  # VNPay yêu cầu nhân 100
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(order_id),
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": self.vnpay_return_url,
            "vnp_IpAddr": ip_address,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
        }

        # ⚡ QUAN TRỌNG: Sắp xếp parameters theo alphabet
        # Đây là quy định BẮT BUỘC của VNPay. Nếu không sắp xếp,
        # chữ ký sẽ sai và VNPay từ chối giao dịch.
        vnp_params = dict(sorted(vnp_params.items()))

        # Build query string
        query_string = urllib.parse.urlencode(vnp_params, quote_via=urllib.parse.quote_plus)

        # Tạo chữ ký HMAC SHA512
        hash_value = self._hmac_sha512(query_string)

        # Nối chữ ký vào cuối URL
        payment_url = f"{self.vnpay_url}?{query_string}&vnp_SecureHash={hash_value}"
        return payment_url

    def validate_response(self, vnp_params: Dict[str, str]) -> bool:
        """Xác thực chữ ký trả về từ VNPay (Chống giả mạo / Tamper-proof).

        Khi VNPay gọi Webhook IPN hoặc Return URL, nó gửi kèm chữ ký.
        Ta phải tự tính lại chữ ký từ dữ liệu nhận được và so sánh
        với chữ ký VNPay gửi. Nếu khớp → dữ liệu hợp lệ, chưa bị sửa đổi.

        Args:
            vnp_params: Dictionary chứa toàn bộ query params từ VNPay

        Returns:
            True nếu chữ ký hợp lệ, False nếu bị giả mạo
        """
        # Lấy chữ ký VNPay gửi về
        vnp_secure_hash = vnp_params.pop("vnp_SecureHash", None)
        # VNPay đôi khi trả thêm vnp_SecureHashType, cần loại bỏ
        vnp_params.pop("vnp_SecureHashType", None)

        if not vnp_secure_hash:
            return False

        # Lọc các tham số rỗng và sắp xếp lại
        vnp_params = {k: v for k, v in vnp_params.items() if v}
        vnp_params = dict(sorted(vnp_params.items()))

        query_string = urllib.parse.urlencode(vnp_params, quote_via=urllib.parse.quote_plus)

        # Tính lại chữ ký từ dữ liệu nhận được
        hash_value = self._hmac_sha512(query_string)

        # So sánh: nếu khớp → dữ liệu chưa bị ai sửa đổi
        return hash_value == vnp_secure_hash
