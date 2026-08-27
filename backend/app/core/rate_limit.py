"""
Rate Limiting — Bảo vệ các endpoint nhạy cảm khỏi brute-force attack.
Sử dụng slowapi (dựa trên limits library).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Limiter instance — dùng IP client làm key
limiter = Limiter(key_func=get_remote_address)
