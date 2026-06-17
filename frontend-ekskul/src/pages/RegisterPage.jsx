import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mengambil base URL API dari file .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RegisterPage = () => {
  const navigate = useNavigate();

  // --- STATE UNTUK MENYIMPAN DATA DARI BACKEND ---
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [extracurriculars, setExtracurriculars] = useState([]);

  // --- STATE UNTUK MENYIMPAN PILIHAN USER ---
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedExcur, setSelectedExcur] = useState("");
  const [selectedQuota, setSelectedQuota] = useState(null);

  // --- STATE BARU UNTUK SUCCESS MESSAGE, ERROR MESSAGE & NO REGISTER ---
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredNo, setRegisteredNo] = useState("");

  // --- STATE FASE PENDAFTARAN ---
  // Diubah inisialisasinya menjadi "loading" agar tidak berkedip "closed" saat fetch data
  const [registrationPhase, setRegistrationPhase] = useState("loading");

  // Fungsi untuk mengambil data Ekstrakurikuler
  const fetchExtracurriculars = async () => {
    try {
      const excurRes = await fetch(`${API_BASE_URL}/api/extracurricular`);
      const excurData = await excurRes.json();
      setExtracurriculars(excurData);
    } catch (error) {
      console.error("Failed to fetch extracurriculars:", error);
    }
  };

  // Fungsi BARU: Mengambil pengaturan tanggal dari Backend
  const fetchSettingsAndCheckPhase = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/settings`);
      if (response.ok) {
        const settings = await response.json();

        // Cek tanggal saat ini
        const now = new Date();

        // Ubah format string dari backend menjadi format Date Javascript
        const selStart = new Date(settings.selection_start);
        const selEnd = new Date(settings.selection_end);
        const dirStart = new Date(settings.direct_start);
        const dirEnd = new Date(settings.direct_end);

        // Evaluasi logika fase pendaftaran
        if (now >= selStart && now <= selEnd) {
          setRegistrationPhase("selection");
        } else if (now >= dirStart && now <= dirEnd) {
          setRegistrationPhase("direct");
        } else {
          setRegistrationPhase("closed");
        }
      } else {
        setRegistrationPhase("closed");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setRegistrationPhase("closed"); // Default ke closed jika gagal koneksi
    }
  };

  // 1. Ambil data Kelas, Ekskul, dan Settings saat halaman pertama kali dimuat
  useEffect(() => {
    const fetchInitialOptions = async () => {
      try {
        const classRes = await fetch(`${API_BASE_URL}/api/classes`);
        const classData = await classRes.json();
        setClasses(classData);

        await fetchExtracurriculars();
        await fetchSettingsAndCheckPhase(); // Panggil pengecekan jadwal di sini
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setRegistrationPhase("closed");
      }
    };

    fetchInitialOptions();
  }, []);

  // 2. Ambil data Siswa KETIKA Kelas (Class) dipilih atau diubah
  useEffect(() => {
    setSelectedStudent("");
    setShowSuccessMessage(false);
    setErrorMessage("");

    if (!selectedClass) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/students/${selectedClass}`,
        );
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  // Efek untuk meng-update state selectedQuota setiap kali selectedExcur berubah
  useEffect(() => {
    setErrorMessage("");

    if (selectedExcur) {
      const excur = extracurriculars.find(
        (item) => item.id_excur === parseInt(selectedExcur),
      );
      if (excur) {
        setSelectedQuota(excur.kuota);
      }
    } else {
      setSelectedQuota(null);
    }
  }, [selectedExcur, extracurriculars]);

  // --- LOGIKA FILTERING DATA EKSTRAKURIKULER (KONTROL OTOMATIS) ---
  const displayedExtracurriculars = extracurriculars.filter((excur) => {
    if (registrationPhase === "selection") return excur.selection_date; // Ada tanggal seleksi
    if (registrationPhase === "direct") return !excur.selection_date; // Tidak ada tanggal seleksi
    return false; // Kosong jika closed (atau loading)
  });

  // 3. Fungsi untuk mengirim data pendaftaran (Submit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const payload = {
      id_students: parseInt(selectedStudent),
      id_excur: parseInt(selectedExcur),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();

        // LOGIKA BARU: Langsung pindah halaman (redirect) berdasarkan fase
        if (registrationPhase === "selection") {
          // Jika fase Selection, pindah ke halaman Tiket
          navigate(`/ticket/${responseData.no_register}`);
        } else {
          // Jika fase Direct, pindah ke halaman Status Result
          navigate(`/status/${responseData.no_register}`);
        }
      } else {
        const errData = await response.json();
        // Tampilkan pesan error di state jika gagal
        setErrorMessage(
          errData.detail || "Registration failed. Please try again.",
        );
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage("Network error. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[#eff1f4] flex items-center justify-center p-4 relative">
      <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* Sisi Kiri: Ilustrasi */}
        <div className="bg-[#f9fafc] md:w-1/2 flex items-center justify-center p-8 hidden md:flex">
          <img
            src="src/assets/Form excur.png"
            alt="Education Illustration"
            className="w-80 lg:w-96 h-auto object-contain"
          />
        </div>

        {/* Sisi Kanan: Area Form Pendaftaran / Pesan Closed */}
        <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center">
          {/* JIKA SEDANG LOADING CEK JADWAL */}
          {registrationPhase === "loading" ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <svg
                className="animate-spin h-10 w-10 mb-4 text-[#1e4079]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="font-medium text-sm animate-pulse">
                Checking registration schedule...
              </p>
            </div>
          ) : registrationPhase === "closed" ? (
            /* JIKA PENDAFTARAN SEDANG DITUTUP */
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Registration Closed
              </h2>
              <p className="text-slate-500 leading-relaxed">
                There is no extracurricular registration currently active at
                this time. Please check back later.
              </p>
            </div>
          ) : (
            /* JIKA PENDAFTARAN AKTIF */
            <>
              {/* Header Logo & Judul */}
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 mr-4 flex-shrink-0 flex items-center justify-center">
                  <img
                    src="src/assets/252-SMA_CITA_HATI_EAST_SURABAYA.png"
                    alt="Logo Cita Hati"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    Registration
                  </h1>
                  <p className="text-sm text-slate-500">
                    Extracurricular Program 2026/2027
                  </p>
                </div>
              </div>

              {/* Form Utama */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. DROPDOWN KELAS */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">
                    Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:border-[#1e4079] focus:ring-1 focus:ring-[#1e4079] transition-colors"
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((className, index) => (
                      <option key={index} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. DROPDOWN NAMA SISWA */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 tracking-wider mb-2 uppercase">
                    Student Name
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:border-[#1e4079] focus:ring-1 focus:ring-[#1e4079] transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                    required
                    disabled={!selectedClass || students.length === 0}
                  >
                    <option value="">
                      {!selectedClass
                        ? "-- Select Class First --"
                        : "-- Choose Student --"}
                    </option>
                    {students.map((student) => (
                      <option
                        key={student.id_students}
                        value={student.id_students}
                      >
                        {student.student_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. DROPDOWN EKSTRAKURIKULER & INFO KUOTA */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">
                      Select Extracurricular
                    </label>
                    <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-[#1e4079] rounded-md uppercase tracking-wider border border-blue-100">
                      {registrationPhase === "selection"
                        ? "Selection Phase"
                        : "Direct Entry Phase"}
                    </span>
                  </div>

                  <select
                    value={selectedExcur}
                    onChange={(e) => setSelectedExcur(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:border-[#1e4079] focus:ring-1 focus:ring-[#1e4079] transition-colors"
                    required
                  >
                    <option value="">-- Choose Option --</option>
                    {displayedExtracurriculars.map((excur) => (
                      <option
                        key={excur.id_excur}
                        value={excur.id_excur}
                        disabled={excur.kuota <= 0}
                        className={
                          excur.kuota <= 0 ? "text-red-400 italic" : ""
                        }
                      >
                        {excur.excur_name} {excur.kuota <= 0 ? "(Full)" : ""}
                      </option>
                    ))}
                  </select>

                  {/* Animasi Info Sisa Kuota */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      selectedQuota !== null
                        ? "max-h-12 opacity-100 mt-2"
                        : "max-h-0 opacity-0 mt-0"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium flex items-center py-2 px-3 rounded-md border ${
                        selectedQuota <= 0
                          ? "text-red-700 bg-red-50 border-red-200"
                          : "text-[#1e4079] bg-blue-50 border-blue-100"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Remaining Quota:{" "}
                      <span className="font-bold ml-1">{selectedQuota}</span>
                    </p>
                  </div>
                </div>

                {/* Tombol Submit & Pesan Info / Sukses / Error */}
                {!showSuccessMessage ? (
                  errorMessage ? (
                    /* BANNER ERROR DENGAN TOMBOL OK KEMBALI KE REGIS */
                    <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">
                      <div className="flex items-center text-red-600 mb-2">
                        <svg
                          className="w-6 h-6 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          ></path>
                        </svg>
                        <h3 className="text-lg font-bold">
                          Registration Failed!
                        </h3>
                      </div>
                      <p className="text-red-700 text-sm mb-5">
                        {errorMessage.toLowerCase().includes("full") ||
                        errorMessage.toLowerCase().includes("quota")
                          ? "The extracurricular quota is already full. Please find and select another extracurricular program."
                          : errorMessage}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          setSelectedExcur(""); // Mereset pilihan ekskul agar user bisa memilih ulang
                          fetchExtracurriculars(); // Memperbarui sisa data kuota terbaru dari backend
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center"
                      >
                        OK, Back to Registration
                      </button>
                    </div>
                  ) : (
                    /* TAMPILAN NORMAL (TOMBOL SUBMIT DAN INFO STANDAR) */
                    <div className="animate-in fade-in duration-300">
                      <button
                        type="submit"
                        className="w-full mt-4 bg-[#1e4079] hover:bg-[#15305b] text-white font-semibold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedQuota !== null && selectedQuota <= 0}
                      >
                        Submit Registration
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      <div className="flex items-start mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Please verify your choices before submitting. Make
                          sure you select the correct Extracurricular Program.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  /* PESAN SUKSES INLINE DENGAN TOMBOL DINAMIS */
                  <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">
                    <div className="flex items-center text-green-600 mb-2">
                      <svg
                        className="w-6 h-6 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      <h3 className="text-lg font-bold">Registration Saved!</h3>
                    </div>
                    <p className="text-green-700 text-sm mb-4">
                      Selection successfully recorded into the system.
                    </p>
                    <button
                      type="button"
                      // PERUBAHAN: Routing Dinamis berdasarkan Fase Registrasi
                      onClick={() =>
                        navigate(
                          registrationPhase === "selection"
                            ? `/ticket/${registeredNo}`
                            : `/status/${registeredNo}`,
                        )
                      }
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center"
                    >
                      {/* PERUBAHAN: Teks Tombol Dinamis berdasarkan Fase Registrasi */}
                      {registrationPhase === "selection"
                        ? "View Digital Ticket"
                        : "View Registration Status"}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
