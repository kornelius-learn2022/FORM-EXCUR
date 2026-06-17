import os
import bcrypt  # <-- KITA MENGGUNAKAN BCRYPT SECARA LANGSUNG
from datetime import datetime, timedelta
from typing import Optional
from dotenv import load_dotenv
from jose import JWTError, jwt, ExpiredSignatureError
from fastapi import Header

# Muat variabel lingkungan
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "fallback_rahasia_default_sangat_panjang_123!")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))

# ==========================================
# FUNGSI-FUNGSI KEAMANAN TANPA PASSLIB
# ==========================================


def get_password_hash(password: str) -> str:
    """
    Mengenkripsi password menggunakan library bcrypt secara langsung.
    Aman dari bug passlib.
    """
    # Bcrypt membutuhkan format 'bytes', jadi kita encode dulu password-nya
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()

    # Hasilkan hash
    hashed_password_bytes = bcrypt.hashpw(pwd_bytes, salt)

    # Kembalikan sebagai string agar bisa masuk ke MySQL (VARCHAR)
    return hashed_password_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Memverifikasi password menggunakan library bcrypt langsung.
    """
    try:
        # Ubah string dari user dan database kembali ke format 'bytes'
        password_bytes = plain_password.encode("utf-8")
        hashed_password_bytes = hashed_password.encode("utf-8")

        # Bandingkan
        return bcrypt.checkpw(password_bytes, hashed_password_bytes)
    except ValueError:
        # Menangkap error jika format hash di DB rusak atau salah ketik
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Membuat JWT Token (Bagian ini tidak berubah)
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
