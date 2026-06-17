import os
import shutil
import uuid
import random
import string
from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    status,
    File,
    UploadFile,
    Form,
    Header,
)
from jose import JWTError, jwt, ExpiredSignatureError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List
import models
from datetime import date
from datetime import datetime, timedelta
from fastapi.staticfiles import StaticFiles

# Pastikan Anda mengimpor fungsi hash dari file auth.py
from fastapi.security import OAuth2PasswordRequestForm
from auth import (
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM,
    get_password_hash,
)

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

# --- KONFIGURASI CORS ---
# Masukkan URL frontend React kamu ke dalam list ini.
# Pastikan TIDAK ADA garis miring (/) di akhir URL.
origins = [
    "http://localhost:3000",  # Jika menggunakan Create React App
    "http://localhost:5173",  # Jika menggunakan Vite
    "http://127.0.0.1:5173",  # Alternatif IP untuk Vite
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Mengizinkan URL React di atas untuk mengakses API
    allow_credentials=True,  # Mengizinkan pengiriman cookie/token kredensial
    allow_methods=["*"],  # Mengizinkan semua method (GET, POST, PUT, DELETE, OPTIONS)
    allow_headers=["*"],  # Mengizinkan semua header
)


class AdminResponse(BaseModel):
    id_admin: int
    username: str
    foto: Optional[str] = None

    class Config:
        from_attributes = True


class ExtracurricularResponse(BaseModel):
    id_excur: int
    excur_name: str
    kuota: int
    selection_date: Optional[date] = None
    place: Optional[str] = None

    class Config:
        from_attributes = True  # Agar bisa membaca data dari SQLAlchemy


class ExtracurricularCreate(BaseModel):
    excur_name: str
    kuota: int
    selection_date: Optional[date] = None
    place: Optional[str] = None


class ExtracurricularUpdate(BaseModel):
    excur_name: Optional[str] = None
    kuota: Optional[int] = None
    selection_date: Optional[date] = None
    place: Optional[str] = None


class PengajarCreate(BaseModel):
    nama_pengajar: str
    id_excur: Optional[int] = None  # Bisa kosong jika guru belum di-assign ke ekskul


# Schema untuk form edit (Update)
class PengajarUpdate(BaseModel):
    nama_pengajar: Optional[str] = None
    id_excur: Optional[int] = None


# Schema untuk response standar
class PengajarResponse(BaseModel):
    id_pengajar: int
    nama_pengajar: str
    id_excur: Optional[int] = None

    class Config:
        from_attributes = True


# Schema untuk response GET List (Tampil bersama nama ekskul hasil JOIN)
class PengajarWithExcurResponse(BaseModel):
    id_pengajar: int
    nama_pengajar: str
    id_excur: Optional[int] = None
    excur_name: Optional[str] = None  # Didapat dari hasil JOIN

    class Config:
        from_attributes = True


class StudentCreate(BaseModel):
    student_name: str
    kelas: str


# Skema untuk Update (Boleh update nama saja atau kelas saja)
class StudentUpdate(BaseModel):
    student_name: Optional[str] = None
    kelas: Optional[str] = None


class StudentResponse(BaseModel):
    id_students: int
    student_name: str
    kelas: str

    class Config:
        from_attributes = True  # Mengizinkan Pydantic membaca data dari SQLAlchemy O


class RegistrationCreate(BaseModel):
    id_students: int
    id_excur: int


# Skema Output: Data yang dikembalikan sebagai response API
class RegistrationResponse(BaseModel):
    no_register: str  # <--- Ganti int menjadi str
    id_students: int
    id_excur: int
    status: str

    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    no_register: str
    student_name: str
    student_class: str
    excur_name: str
    status: str
    selection_date: Optional[date] = None
    place: Optional[str] = None

    class Config:
        from_attributes = True


class RegistrationDetailResponse(BaseModel):
    no_register: str
    student_name: str
    student_class: str
    excur_name: str
    status: Optional[str] = None
    selection_date: Optional[date] = None
    place: Optional[str] = None
    nama_pengajar: Optional[str] = None

    class Config:
        from_attributes = True


class RegistrationUpdate(BaseModel):
    id_excur: Optional[int] = None
    status: Optional[str] = None
    selection_date: Optional[date] = None  # TAMBAHAN BARU
    place: Optional[str] = None


class RegistrationSettingsUpdate(BaseModel):
    selection_start: Optional[datetime] = None
    selection_end: Optional[datetime] = None
    direct_start: Optional[datetime] = None
    direct_end: Optional[datetime] = None


# Skema untuk response data yang diambil dari database (GET/Response PUT)
class RegistrationSettingsResponse(BaseModel):
    id: int
    selection_start: Optional[datetime]
    selection_end: Optional[datetime]
    direct_start: Optional[datetime]
    direct_end: Optional[datetime]

    class Config:
        from_attributes = True


# 1: Ambil Daftar Kelas ---
@app.get("/api/classes", response_model=List[str], tags=["Dropdown Options"])
def get_unique_classes(db: Session = Depends(get_db)):
    """
    Mengambil daftar kelas yang unik dari tabel students untuk dropdown pertama.
    """
    # Query: SELECT DISTINCT class FROM students
    classes = db.query(models.StudentDB.kelas).distinct().all()

    # Hasil query SQLAlchemy berbentuk tuple [( '4A', ), ( '4B', )]
    # Kita ubah menjadi list string biasa: ['4A', '4B']
    return [c[0] for c in classes]


# 2: Ambil Siswa berdasarkan Kelas ---
@app.get(
    "/api/students/{nama_kelas}",
    response_model=List[StudentResponse],
    tags=["Dropdown Options"],
)
def get_students_by_class(nama_kelas: str, db: Session = Depends(get_db)):
    """
    Mengambil daftar siswa berdasarkan kelas yang dipilih untuk dropdown kedua.
    """
    # Query: SELECT * FROM students WHERE class = 'nama_kelas'
    students = (
        db.query(models.StudentDB).filter(models.StudentDB.kelas == nama_kelas).all()
    )
    return students


# 3: Ambil Semua Ekstrakurikuler ---
@app.post(
    "/api/extracurricular",
    response_model=ExtracurricularResponse,
    tags=["Extracurricular"],
)
def create_extracurricular(
    excur_data: ExtracurricularCreate, db: Session = Depends(get_db)
):
    """
    Menambahkan data ekstrakurikuler baru ke database.
    """
    new_excur = models.ExtracurricularDB(
        excur_name=excur_data.excur_name,
        kuota=excur_data.kuota,
        selection_date=excur_data.selection_date,
        place=excur_data.place,
    )

    db.add(new_excur)
    db.commit()
    db.refresh(new_excur)

    return new_excur


@app.get(
    "/api/extracurricular",
    response_model=List[ExtracurricularResponse],
    tags=["Dropdown Options"],
)
def get_all_extracurriculars(db: Session = Depends(get_db)):
    """
    Mengambil semua daftar ekstrakurikuler dari tabel database.
    """
    # Mengambil semua baris data dari tabel extracurricular
    excurs = (
        db.query(models.ExtracurricularDB)
        .filter(models.ExtracurricularDB.kuota > 0)
        .all()
    )

    return excurs


@app.get(
    "/api/extracurricularnolquota",
    response_model=List[ExtracurricularResponse],
    tags=["Dropdown Options"],
)
def get_all_extracurriculars(db: Session = Depends(get_db)):
    """
    Mengambil semua daftar ekstrakurikuler dari tabel database.
    """
    # Mengambil semua baris data dari tabel extracurricular
    excurs = db.query(models.ExtracurricularDB).all()

    return excurs


@app.put(
    "/api/extracurricular/{id_excur}",
    response_model=ExtracurricularResponse,
    tags=["Extracurricular"],
)
def update_extracurricular(
    id_excur: int, excur_data: ExtracurricularUpdate, db: Session = Depends(get_db)
):
    """
    Mengedit data ekstrakurikuler berdasarkan id_excur.
    """
    # Cari ekskul berdasarkan ID
    excur = (
        db.query(models.ExtracurricularDB)
        .filter(models.ExtracurricularDB.id_excur == id_excur)
        .first()
    )

    if not excur:
        raise HTTPException(status_code=404, detail="Extracurricular not found")

    # Update nilai jika data dikirimkan dari frontend (tidak None)
    if excur_data.excur_name is not None:
        excur.excur_name = excur_data.excur_name
    if excur_data.kuota is not None:
        excur.kuota = excur_data.kuota
    if excur_data.selection_date is not None:
        excur.selection_date = excur_data.selection_date
    if excur_data.place is not None:
        excur.place = excur_data.place

    db.commit()
    db.refresh(excur)  # Ambil data terbaru dari database

    return excur


@app.delete("/api/extracurricular/{id_excur}", tags=["Extracurricular"])
def delete_extracurricular(id_excur: int, db: Session = Depends(get_db)):
    """
    Menghapus data ekstrakurikuler beserta validasi keberadaannya.
    """
    # Cari ekskul berdasarkan ID
    excur = (
        db.query(models.ExtracurricularDB)
        .filter(models.ExtracurricularDB.id_excur == id_excur)
        .first()
    )

    if not excur:
        raise HTTPException(status_code=404, detail="Extracurricular not found")

    # Opsional: Cek apakah ekskul ini sedang dipakai di tabel registrasi
    # Jika dipakai, biasanya tidak boleh dihapus sembarangan agar data pendaftaran tidak rusak.
    is_used = (
        db.query(models.RegisterExcurDB)
        .filter(models.RegisterExcurDB.id_excur == id_excur)
        .first()
    )

    if is_used:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this extracurricular because students are already registered to it",
        )

    # Proses hapus dari database
    db.delete(excur)
    db.commit()

    return {"message": "Extracurricular deleted successfully"}


# 4. Proses Pendaftaran Ekstrakurikuler ---
def generate_unique_reg_no(db: Session) -> str:
    """
    Menghasilkan nomor registrasi unik, contoh: REG-A1B2C3
    Terus mengulang (while True) jika kebetulan kode sudah ada di database.
    """
    while True:
        # Menghasilkan 6 karakter acak (kombinasi huruf besar dan angka)
        random_str = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=6)
        )
        new_no = f"REG-{random_str}"

        # Cek ke database apakah kode ini sudah pernah dipakai
        exists = (
            db.query(models.RegisterExcurDB)
            .filter(models.RegisterExcurDB.no_register == new_no)
            .first()
        )

        # Jika belum ada (exists == None), berarti kode ini aman dipakai
        if not exists:
            return new_no


# ==========================================
@app.post("/api/register", response_model=RegistrationResponse, tags=["Registration"])
def register_extracurricular(
    reg_data: RegistrationCreate, db: Session = Depends(get_db)
):
    """
    Mendaftarkan siswa ke ekstrakurikuler, mengurangi kuota otomatis,
    dan men-generate no_register alfanumerik unik.
    Sistem dilengkapi Pessimistic Locking untuk mencegah rebutan kuota (War Ticket).
    """

    # 1. Cari data ekstrakurikuler dan KUNCI baris ini (Pessimistic Locking)
    # Begitu dieksekusi, request lain akan "antre" sampai db.commit() dipanggil
    excur = (
        db.query(models.ExtracurricularDB)
        .filter(models.ExtracurricularDB.id_excur == reg_data.id_excur)
        .with_for_update()  # <--- TAMBAHAN KUNCI ANTI-MINUS DI SINI
        .first()
    )

    # Jika ekskul tidak ditemukan, kembalikan error 404
    if not excur:
        raise HTTPException(status_code=404, detail="Extracurricular not found")

    # 2. Cek apakah kuota masih tersedia
    # Pengecekan ini menjadi 100% akurat karena data sedang digembok
    if excur.kuota <= 0:
        raise HTTPException(status_code=400, detail="Extracurricular quota is full")

    # 3. Logika penentuan status
    if excur.selection_date or excur.place:
        registration_status = "Pending Selection"
    else:
        registration_status = "Accepted"

    # 4. CEK APAKAH SISWA SUDAH MENDAFTAR DI EKSKUL MANA PUN
    # Hapus filter id_excur agar sistem mengecek seluruh pendaftaran milik siswa ini
    existing_reg = (
        db.query(models.RegisterExcurDB)
        .filter(models.RegisterExcurDB.id_students == reg_data.id_students)
        .first()
    )

    if existing_reg:
        # Cari nama ekskul yang sudah didaftarkan sebelumnya untuk memberikan info yang jelas
        registered_excur = (
            db.query(models.ExtracurricularDB)
            .filter(models.ExtracurricularDB.id_excur == existing_reg.id_excur)
            .first()
        )

        registered_name = (
            registered_excur.excur_name if registered_excur else "another program"
        )

        # Kembalikan pesan error dalam bahasa Inggris yang spesifik
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed. This student is already registered for the '{registered_name}' program.",
        )

    # 5. Kurangi kuota ekstrakurikuler
    excur.kuota -= 1

    # 6. Buat record pendaftaran baru ke database (Memasukkan no_register kustom)
    # Kita panggil fungsi generate_unique_reg_no() di sini
    unique_no_reg = generate_unique_reg_no(db)

    new_registration = models.RegisterExcurDB(
        no_register=unique_no_reg,
        id_students=reg_data.id_students,
        id_excur=reg_data.id_excur,
        status=registration_status,
    )

    db.add(new_registration)

    # 7. Simpan perubahan ke database (KUNCI/LOCK OTOMATIS DILEPAS DI SINI)
    db.commit()
    db.refresh(new_registration)

    return new_registration


# baca data berdasarkan no_register
@app.get("/api/ticket/{no_register}", response_model=TicketResponse, tags=["Ticket"])
def get_ticket_by_noreg(no_register: str, db: Session = Depends(get_db)):
    """
    Mengambil data detail registrasi (Tiket) berdasarkan no_register.
    Menggunakan JOIN untuk mendapatkan nama siswa dan nama ekstrakurikuler.
    """

    # Melakukan query dengan JOIN ke 3 tabel sekaligus
    result = (
        db.query(
            models.RegisterExcurDB.no_register,
            models.StudentDB.student_name,
            models.StudentDB.kelas.label("student_class"),
            models.ExtracurricularDB.excur_name,
            models.RegisterExcurDB.status,
            models.ExtracurricularDB.selection_date,
            models.ExtracurricularDB.place,
        )
        .join(
            models.StudentDB,
            models.RegisterExcurDB.id_students == models.StudentDB.id_students,
        )
        .join(
            models.ExtracurricularDB,
            models.RegisterExcurDB.id_excur == models.ExtracurricularDB.id_excur,
        )
        .filter(models.RegisterExcurDB.no_register == no_register)
        .first()
    )

    # Jika data tidak ditemukan berdasarkan no_register
    if not result:
        raise HTTPException(
            status_code=404, detail="Ticket not found. Invalid Registration Number."
        )

    # Mengembalikan data dalam bentuk dictionary yang sesuai dengan TicketResponse
    return {
        "no_register": result.no_register,
        "student_name": result.student_name,
        "student_class": result.student_class,
        "excur_name": result.excur_name,
        "status": result.status,
        "selection_date": result.selection_date,
        "place": result.place,
    }


# 5 Tampilkan data pendaftaran
# ==========================================
@app.get(
    "/api/registrations",
    response_model=list[RegistrationDetailResponse],
    tags=["Registration Admin"],
)
def get_all_registrations(db: Session = Depends(get_db)):
    """
    Menampilkan seluruh data pendaftaran lengkap dengan nama siswa,
    nama ekskul, detail seleksi, dan nama pengajar.
    Jika ada lebih dari 1 pengajar, namanya akan digabung ke dalam 1 baris registrasi.
    """
    results = (
        db.query(
            models.RegisterExcurDB.no_register,
            models.StudentDB.student_name,
            models.StudentDB.kelas.label("student_class"),
            models.ExtracurricularDB.excur_name,
            models.RegisterExcurDB.status,
            models.ExtracurricularDB.selection_date,
            models.ExtracurricularDB.place,
            models.PengajarDB.nama_pengajar,
        )
        .join(
            models.StudentDB,
            models.RegisterExcurDB.id_students == models.StudentDB.id_students,
        )
        .join(
            models.ExtracurricularDB,
            models.RegisterExcurDB.id_excur == models.ExtracurricularDB.id_excur,
        )
        .outerjoin(
            models.PengajarDB,
            models.ExtracurricularDB.id_excur == models.PengajarDB.id_excur,
        )
        .all()
    )

    # Menggunakan dictionary untuk mencegah duplikasi baris
    grouped_results = {}

    for row in results:
        no_reg = row.no_register

        if no_reg not in grouped_results:
            # Jika no_register belum ada di dictionary, buat entri baru
            grouped_results[no_reg] = {
                "no_register": row.no_register,
                "student_name": row.student_name,
                "student_class": row.student_class,
                "excur_name": row.excur_name,
                "status": row.status,
                "selection_date": row.selection_date,
                "place": row.place,
                "nama_pengajar": row.nama_pengajar if row.nama_pengajar else "",
            }
        else:
            # Jika no_register sudah ada (karena diduplikasi oleh JOIN pengajar ke-2),
            # Cukup gabungkan nama pengajarnya dengan tanda koma
            if (
                row.nama_pengajar
                and row.nama_pengajar not in grouped_results[no_reg]["nama_pengajar"]
            ):
                if grouped_results[no_reg]["nama_pengajar"]:
                    grouped_results[no_reg]["nama_pengajar"] += f", {row.nama_pengajar}"
                else:
                    grouped_results[no_reg]["nama_pengajar"] = row.nama_pengajar

    # Ubah kembali nilai dictionary menjadi list agar sesuai dengan response_model
    return list(grouped_results.values())


@app.put(
    "/api/register/{no_register}",
    response_model=RegistrationResponse,
    tags=["Registration Admin"],
)
def update_registration(
    no_register: str,
    reg_data: RegistrationUpdate,
    db: Session = Depends(get_db),
):
    """
    Mengedit status pendaftaran siswa, dan mengupdate jadwal/tempat
    di tabel ekstrakurikuler yang bersangkutan.
    """
    registration = (
        db.query(models.RegisterExcurDB)
        .filter(models.RegisterExcurDB.no_register == no_register)
        .first()
    )

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    # A. Jika Admin Mengubah Pilihan Ekstrakurikuler
    if reg_data.id_excur is not None and reg_data.id_excur != registration.id_excur:
        # Kembalikan kuota ekskul lama
        old_excur = (
            db.query(models.ExtracurricularDB)
            .filter(models.ExtracurricularDB.id_excur == registration.id_excur)
            .first()
        )
        if old_excur:
            old_excur.kuota += 1

        # Kurangi kuota ekskul baru
        new_excur = (
            db.query(models.ExtracurricularDB)
            .filter(models.ExtracurricularDB.id_excur == reg_data.id_excur)
            .first()
        )
        if not new_excur:
            raise HTTPException(status_code=404, detail="New Extracurricular not found")
        if new_excur.kuota <= 0:
            raise HTTPException(
                status_code=400, detail="New Extracurricular quota is full"
            )

        new_excur.kuota -= 1
        registration.id_excur = reg_data.id_excur

    # B. Menyimpan Status (Ini tetap masuk ke tabel register_excur)
    if reg_data.status is not None:
        registration.status = reg_data.status

    # C. PERBAIKAN: Menyimpan Tanggal dan Tempat ke tabel ExtracurricularDB
    if reg_data.selection_date is not None or reg_data.place is not None:
        target_excur = (
            db.query(models.ExtracurricularDB)
            .filter(models.ExtracurricularDB.id_excur == registration.id_excur)
            .first()
        )

        if target_excur:
            if reg_data.selection_date is not None:
                target_excur.selection_date = reg_data.selection_date
            if reg_data.place is not None:
                target_excur.place = reg_data.place

    db.commit()
    db.refresh(registration)

    return registration


@app.delete("/api/register/{no_register}", tags=["Registration Admin"])
def delete_registration(no_register: str, db: Session = Depends(get_db)):
    """
    Menghapus pendaftaran siswa.
    Kuota ekstrakurikuler akan otomatis dikembalikan (+1).
    """
    registration = (
        db.query(models.RegisterExcurDB)
        .filter(models.RegisterExcurDB.no_register == no_register)
        .first()
    )

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Kembalikan kuota ekstrakurikuler yang dibatalkan (+1)
    excur = (
        db.query(models.ExtracurricularDB)
        .filter(models.ExtracurricularDB.id_excur == registration.id_excur)
        .first()
    )

    if excur:
        excur.kuota += 1

    # Hapus data dari tabel
    db.delete(registration)
    db.commit()

    return {
        "message": f"Registration {no_register} deleted successfully and quota restored."
    }


# Menampilkan penngajar berdasarkan id_excur
@app.get(
    "/api/pengajar",
    response_model=list[PengajarWithExcurResponse],
    tags=["Pengajar"],
)
def get_all_pengajar(db: Session = Depends(get_db)):
    """
    Mengambil semua data pengajar beserta nama ekstrakurikuler yang diajarnya.
    Menggunakan OUTER JOIN agar pengajar yang belum punya ekskul tetap tampil.
    """
    results = (
        db.query(
            models.PengajarDB.id_pengajar,
            models.PengajarDB.nama_pengajar,
            models.PengajarDB.id_excur,
            models.ExtracurricularDB.excur_name,
        )
        .outerjoin(
            models.ExtracurricularDB,
            models.PengajarDB.id_excur == models.ExtracurricularDB.id_excur,
        )
        .all()
    )

    # Memformat hasil dari tuple ke dalam dictionary list
    formatted_results = []
    for row in results:
        formatted_results.append(
            {
                "id_pengajar": row.id_pengajar,
                "nama_pengajar": row.nama_pengajar,
                "id_excur": row.id_excur,
                "excur_name": row.excur_name,
            }
        )

    return formatted_results


# ==========================================
# 2. CREATE: Menambahkan Pengajar Baru
# ==========================================
@app.post("/api/pengajar", response_model=PengajarResponse, tags=["Pengajar"])
def create_pengajar(pengajar_data: PengajarCreate, db: Session = Depends(get_db)):
    """
    Menambahkan guru/pengajar baru.
    Jika id_excur diisi, sistem akan memvalidasi apakah ekskul tersebut ada di database.
    """
    if pengajar_data.id_excur is not None:
        excur_exists = (
            db.query(models.ExtracurricularDB)
            .filter(models.ExtracurricularDB.id_excur == pengajar_data.id_excur)
            .first()
        )
        if not excur_exists:
            raise HTTPException(status_code=404, detail="Extracurricular ID not found")

    new_pengajar = models.PengajarDB(
        nama_pengajar=pengajar_data.nama_pengajar, id_excur=pengajar_data.id_excur
    )

    db.add(new_pengajar)
    db.commit()
    db.refresh(new_pengajar)

    return new_pengajar


# ==========================================
# 3. UPDATE: Mengedit Pengajar
# ==========================================
@app.put(
    "/api/pengajar/{id_pengajar}",
    response_model=PengajarResponse,
    tags=["Pengajar"],
)
def update_pengajar(
    id_pengajar: int,
    pengajar_data: PengajarUpdate,
    db: Session = Depends(get_db),
):
    """
    Mengedit nama pengajar atau memindahkan pengajar ke ekstrakurikuler lain.
    """
    pengajar = (
        db.query(models.PengajarDB)
        .filter(models.PengajarDB.id_pengajar == id_pengajar)
        .first()
    )

    if not pengajar:
        raise HTTPException(status_code=404, detail="Pengajar not found")

    # Update nama pengajar jika dikirim
    if pengajar_data.nama_pengajar is not None:
        pengajar.nama_pengajar = pengajar_data.nama_pengajar

    # Update id_excur (pindah ekskul) jika dikirim
    if pengajar_data.id_excur is not None:
        excur_exists = (
            db.query(models.ExtracurricularDB)
            .filter(models.ExtracurricularDB.id_excur == pengajar_data.id_excur)
            .first()
        )
        if not excur_exists:
            raise HTTPException(
                status_code=404, detail="New Extracurricular ID not found"
            )
        pengajar.id_excur = pengajar_data.id_excur

    db.commit()
    db.refresh(pengajar)

    return pengajar


# ==========================================
# 4. DELETE: Menghapus Pengajar
# ==========================================
@app.delete("/api/pengajar/{id_pengajar}", tags=["Pengajar"])
def delete_pengajar(id_pengajar: int, db: Session = Depends(get_db)):
    """
    Menghapus data pengajar dari database.
    """
    pengajar = (
        db.query(models.PengajarDB)
        .filter(models.PengajarDB.id_pengajar == id_pengajar)
        .first()
    )

    if not pengajar:
        raise HTTPException(status_code=404, detail="Pengajar not found")

    db.delete(pengajar)
    db.commit()

    return {"message": f"Pengajar dengan ID {id_pengajar} berhasil dihapus"}


# fastapi setting registration settings
# ==========================================
# ENDPOINT UNTUK SETTINGS (TANGGAL PENDAFTARAN)
# ==========================================


@app.get(
    "/api/settings",
    response_model=RegistrationSettingsResponse,
    tags=["Settings"],
)
def get_registration_settings(db: Session = Depends(get_db)):
    """
    Mengambil data pengaturan tanggal pendaftaran.
    Karena ini pengaturan global, kita selalu mengambil baris pertama.
    """
    settings = db.query(models.RegistrationSettingsDB).first()

    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found in database")

    return settings


@app.put(
    "/api/settings", response_model=RegistrationSettingsResponse, tags=["Settings"]
)
def update_registration_settings(
    settings_data: RegistrationSettingsUpdate, db: Session = Depends(get_db)
):
    """
    Memperbarui pengaturan tanggal pendaftaran.
    """
    # Ambil baris pertama dari tabel settings
    settings = db.query(models.RegistrationSettingsDB).first()

    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found in database")

    # Update data jika nilainya dikirimkan dari frontend (tidak None)
    if settings_data.selection_start is not None:
        settings.selection_start = settings_data.selection_start

    if settings_data.selection_end is not None:
        settings.selection_end = settings_data.selection_end

    if settings_data.direct_start is not None:
        settings.direct_start = settings_data.direct_start

    if settings_data.direct_end is not None:
        settings.direct_end = settings_data.direct_end

    db.commit()
    db.refresh(settings)

    return settings


# students list
@app.get("/api/students", response_model=List[StudentResponse], tags=["Students"])
def get_all_students(db: Session = Depends(get_db)):
    """Mengambil daftar seluruh siswa."""
    return db.query(models.StudentDB).all()


# 1b. READ STUDENTS BY CLASS
@app.get(
    "/api/students/{kelas_name}",
    response_model=List[StudentResponse],
    tags=["Students"],
)
def get_students_by_class(kelas_name: str, db: Session = Depends(get_db)):
    """Mengambil data siswa khusus untuk kelas tertentu."""
    return db.query(models.StudentDB).filter(models.StudentDB.kelas == kelas_name).all()


# 2. CREATE SINGLE STUDENT
@app.post("/api/students", response_model=StudentResponse, tags=["Students"])
def create_single_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Menambahkan satu data siswa ke database."""
    new_student = models.StudentDB(
        student_name=student.student_name, kelas=student.kelas
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


# 3. CREATE MULTIPLE STUDENTS (Bulk Input)
@app.post(
    "/api/students/bulk",
    response_model=List[StudentResponse],
    tags=["Students"],
)
def create_multiple_students(
    students: List[StudentCreate], db: Session = Depends(get_db)
):
    """Menambahkan banyak data siswa sekaligus (Bisa untuk fitur Import Excel/CSV)."""
    new_students = [
        models.StudentDB(student_name=s.student_name, kelas=s.kelas) for s in students
    ]

    # db.add_all mempercepat proses penyimpanan data massal
    db.add_all(new_students)
    db.commit()

    for student in new_students:
        db.refresh(student)

    return new_students


# 4. UPDATE STUDENT
@app.put(
    "/api/students/{id_students}",
    response_model=StudentResponse,
    tags=["Students"],
)
def update_student(
    id_students: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
):
    """Memperbarui nama atau kelas siswa berdasarkan ID."""
    db_student = (
        db.query(models.StudentDB)
        .filter(models.StudentDB.id_students == id_students)
        .first()
    )

    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    if student_update.student_name is not None:
        db_student.student_name = student_update.student_name
    if student_update.kelas is not None:
        db_student.kelas = student_update.kelas

    db.commit()
    db.refresh(db_student)
    return db_student


# 5. DELETE STUDENT
@app.delete("/api/students/{id_students}", tags=["Students"])
def delete_student(id_students: int, db: Session = Depends(get_db)):
    """Menghapus data siswa dari database."""
    db_student = (
        db.query(models.StudentDB)
        .filter(models.StudentDB.id_students == id_students)
        .first()
    )

    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(db_student)
    db.commit()
    return {"message": f"Student '{db_student.student_name}' successfully deleted"}


# admin

# ==========================================
# PERSIAPAN FOLDER PENYIMPANAN FOTO
# ==========================================
UPLOAD_DIR = "static/admin_photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Buat folder otomatis jika belum ada

# Beri tahu FastAPI untuk menjadikan folder 'static' sebagai folder publik
# agar fotonya bisa diakses Frontend melalui link: http://localhost:8000/static/...
app.mount("/static", StaticFiles(directory="static"), name="static")

# ==========================================
# CRUD ADMIN DENGAN UPLOAD FOTO
# ==========================================


# 1. CREATE ADMIN (POST)
@app.post("/api/admins", response_model=AdminResponse, tags=["Admin"])
async def create_admin(
    username: str = Form(...),
    password: str = Form(...),
    foto: UploadFile = File(None),  # Foto bersifat opsional
    db: Session = Depends(get_db),
):
    """Membuat admin baru beserta upload foto ke server."""

    # Cek duplikasi username
    existing_admin = (
        db.query(models.AdminDB).filter(models.AdminDB.username == username).first()
    )
    if existing_admin:
        raise HTTPException(status_code=400, detail="Username already registered")

    foto_path = None
    if foto:
        # Buat nama file unik menggunakan UUID agar tidak tertimpa jika namanya sama
        file_extension = foto.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_location = os.path.join(UPLOAD_DIR, unique_filename)

        # Simpan file fisik ke server
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)

        # Path yang akan disimpan ke database
        foto_path = f"/{file_location}"

    # Hash password sebelum disimpan
    hashed_password = get_password_hash(password)

    new_admin = models.AdminDB(
        username=username, password=hashed_password, foto=foto_path
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin


# 2. READ ALL ADMINS (GET)
@app.get("/api/admins", response_model=List[AdminResponse], tags=["Admin"])
def get_all_admins(db: Session = Depends(get_db)):
    """Mengambil daftar seluruh admin."""
    return db.query(models.AdminDB).all()


# 3. UPDATE ADMIN (PUT)
@app.put("/api/admins/{id_admin}", response_model=AdminResponse, tags=["Admin"])
async def update_admin(
    id_admin: int,
    username: str = Form(None),
    password: str = Form(None),
    foto: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    """Memperbarui data admin dan mengganti foto jika ada."""
    db_admin = (
        db.query(models.AdminDB).filter(models.AdminDB.id_admin == id_admin).first()
    )
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    if username:
        # Cek apakah username baru dipakai orang lain
        existing_user = (
            db.query(models.AdminDB).filter(models.AdminDB.username == username).first()
        )
        if existing_user and existing_user.id_admin != id_admin:
            raise HTTPException(status_code=400, detail="Username already taken")
        db_admin.username = username

    if password:
        db_admin.password = get_password_hash(password)

    if foto:
        # Hapus foto lama dari server fisik jika ada
        if db_admin.foto:
            old_file_path = db_admin.foto.lstrip("/")  # Hapus garis miring di depan
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        # Simpan foto baru
        file_extension = foto.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_location = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)

        db_admin.foto = f"/{file_location}"

    db.commit()
    db.refresh(db_admin)
    return db_admin


# 4. DELETE ADMIN (DELETE)
@app.delete("/api/admins/{id_admin}", tags=["Admin"])
def delete_admin(id_admin: int, db: Session = Depends(get_db)):
    """Menghapus data admin beserta file foto fisiknya dari server."""
    db_admin = (
        db.query(models.AdminDB).filter(models.AdminDB.id_admin == id_admin).first()
    )
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    # Hapus file fisik foto dari server
    if db_admin.foto:
        file_path = db_admin.foto.lstrip("/")
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(db_admin)
    db.commit()

    return {"message": f"Admin '{db_admin.username}' successfully deleted"}


@app.post("/api/login", tags=["Auth"])
def login_admin(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    Endpoint untuk autentikasi login.
    Menerima username dan password dalam format URL-Encoded, lalu mengembalikan Token JWT.
    """
    # 1. Cari data admin di database berdasarkan username
    db_admin = (
        db.query(models.AdminDB)
        .filter(models.AdminDB.username == form_data.username)
        .first()
    )

    # 2. Jika admin tidak ditemukan atau password salah, tolak akses
    if not db_admin or not verify_password(form_data.password, db_admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau Password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Jika username dan password cocok, buat Token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_admin.username}, expires_delta=access_token_expires
    )

    # 4. Kembalikan token dan info user tambahan (jika Frontend membutuhkan fotonya saat login)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": db_admin.username,
        "id_admin": db_admin.id_admin,
        "foto": db_admin.foto,
    }


@app.get("/api/auth/check-token", tags=["Auth"])
def check_token(authorization: str = Header(None)):
    """
    Endpoint untuk memeriksa keabsahan token JWT yang dikirim di Header.
    Merespon 'true' jika valid, 'expire' jika kedaluwarsa, dan 'false' jika salah/rusak.
    """
    # Jika token tidak dilampirkan sama sekali di header
    if not authorization:
        return {"status": "false"}

    try:
        # Memotong teks 'Bearer <token>' untuk mengambil kode token saja
        token = authorization.split(" ")[1]

        # Proses Decode (Otomatis memverifikasi waktu kedaluwarsa)
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # JIKA LOLOS DECODE, MAKA TOKEN BENAR
        return {"status": "true"}

    except ExpiredSignatureError:
        # JIKA TOKEN SUDAH EXPIRED
        return {"status": "expire"}

    except (JWTError, IndexError):
        # JIKA TOKEN SALAH, RUSAK, ATAU FORMAT HEADER TIDAK SESUAI
        return {"status": "false"}
