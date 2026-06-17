from fastapi import FastAPI, Depends
from sqlalchemy import (
    Column,
    Integer,
    String,
    create_engine,
    ForeignKey,
    Date,
    DateTime,
)
from database import Base

from typing import List

# --- 1. SETUP DATABASE SQLALCHEMY ---


class AdminDB(Base):
    __tablename__ = "admin"

    id_admin = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    foto = Column(String(255), nullable=True)


class ExtracurricularDB(Base):
    __tablename__ = "extracurricular"

    id_excur = Column(Integer, primary_key=True, index=True, autoincrement=True)
    excur_name = Column(String(100), nullable=False)
    kuota = Column(
        Integer, nullable=False, default=0
    )  # Menggunakan Integer untuk kuota
    selection_date = Column(Date, nullable=True)
    place = Column(String(255), nullable=True)


class PengajarDB(Base):
    __tablename__ = "pengajar"

    id_pengajar = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama_pengajar = Column(String(100), nullable=False)

    # ForeignKey merujuk pada 'id_excur' di tabel 'extracurricular'
    # nullable=True karena di database diset "Null: Yes"
    id_excur = Column(Integer, ForeignKey("extracurricular.id_excur"), nullable=True)


# Model Database (Sesuai dengan tabel di phpMyAdmin)
class StudentDB(Base):
    __tablename__ = "students"

    id_students = Column(Integer, primary_key=True, index=True)
    student_name = Column(String(100), nullable=False)
    # Karena 'class' tidak bisa dipakai sebagai nama variabel Python, kita gunakan 'kelas'
    kelas = Column("class", String(50), nullable=False)


class RegisterExcurDB(Base):
    __tablename__ = "register_excur"

    no_register = Column(String(255), primary_key=True, index=True)
    # Merujuk ke tabel extracurricular
    id_excur = Column(Integer, ForeignKey("extracurricular.id_excur"), nullable=False)

    # Merujuk ke tabel students
    id_students = Column(Integer, ForeignKey("students.id_students"), nullable=False)

    # Status pendaftaran (boleh kosong/null)
    status = Column(String(50), nullable=True)


class RegistrationSettingsDB(Base):
    __tablename__ = "registration_settings"

    id = Column(Integer, primary_key=True, index=True)

    # Menggunakan DateTime agar bisa menyimpan YYYY-MM-DD HH:MM:SS
    selection_start = Column(DateTime, nullable=True)
    selection_end = Column(DateTime, nullable=True)
    direct_start = Column(DateTime, nullable=True)
    direct_end = Column(DateTime, nullable=True)
