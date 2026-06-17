import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# 1. Muat variabel lingkungan dari file .env
load_dotenv()

# Format URL: mysql+pymysql://username:password@host:port/nama_database
# Jika pakai XAMPP default, password biasanya kosong
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Membuat engine koneksi
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Membuat session agar FastAPI bisa berinteraksi dengan DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class untuk membuat model/tabel nantinya
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
