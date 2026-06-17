import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import semua halaman (nanti kita buat file-filenya di folder src/pages)
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import CheckStatusPage from "./pages/CheckStatusPage";
import TicketPage from "./pages/TicketPage";
import StatusResultPage from "./pages/StatusResultPage";
import LoginAdmin from "./pages/LoginAdmin";
import DashboardPortal from "./pages/DashboardPortal";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
        <Routes>
          {/* 1. Halaman Utama: Menampilkan tombol registrasi & cek status */}
          <Route path="/" element={<LandingPage />} />

          {/* 2. Halaman Form Registrasi */}
          <Route path="/register" element={<RegisterPage />} />

          {/* 3. Halaman Input Cek Status (Input manual nomor registrasi) */}
          <Route path="/check-status" element={<CheckStatusPage />} />

          {/* 4. Halaman Tiket Registrasi (Menggunakan parameter :noReg) */}
          <Route path="/ticket/:noReg" element={<TicketPage />} />

          {/* 5. Halaman Hasil Registrasi / Data Telah Teregistrasi (Juga pakai :noReg) */}
          <Route path="/status/:noReg" element={<StatusResultPage />} />

          {/* 6. Halaman Login Admin */}
          <Route path="/LoginAdmin" element={<LoginAdmin />} />
          {/* 7. Halaman Dashboard Portal Admin */}
          <Route path="/DashboardAdmin" element={<DashboardPortal />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
