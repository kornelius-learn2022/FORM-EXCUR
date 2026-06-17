import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoCitaHati from "../assets/252-SMA_CITA_HATI_EAST_SURABAYA.png"; // <-- Import gambar ditambahkan di sini

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State untuk toggle password
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Siapkan data dengan format URL Encoded (Syarat OAuth2 FastAPI)
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      // Tembak API Login
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (response.ok) {
        const data = await response.json();

        // 1. Simpan Token untuk keamanan
        localStorage.setItem("token", data.access_token);

        // 2. Simpan informasi user untuk ditampilkan dan diedit di Dashboard
        localStorage.setItem("id_admin", data.id_admin); // <--- TAMBAHAN BARU
        localStorage.setItem("username", data.username);

        if (data.foto) {
          localStorage.setItem("foto", data.foto);
        } else {
          localStorage.removeItem("foto");
        }

        // 3. Arahkan ke halaman Dashboard
        navigate("/DashboardAdmin");
      } else {
        const errData = await response.json();
        setErrorMsg(
          errData.detail || "Login failed. Please check your credentials.",
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Network error. Could not connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3f8] flex flex-col items-center justify-center p-6 font-sans">
      {/* Card Login Utama */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Bagian Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-3 mb-6">
            <img
              src={logoCitaHati}
              alt="Cita Hati Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1d3c6a] tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-500 font-medium">
            System Access Registration Extracurricular{" "}
            <span className="text-[#38aef0] font-bold">2026/2027</span>
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl text-center animate-in fade-in zoom-in duration-300">
            {errorMsg}
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Input Username */}
          <div>
            <label className="block text-sm font-bold text-[#1d3c6a] mb-2 pl-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#f1f5f9] border-2 border-transparent rounded-2xl pl-14 pr-5 py-4 text-[#0f172a] focus:bg-white focus:border-[#38aef0] focus:ring-4 focus:ring-[#e3f2fd] transition-all outline-none font-medium placeholder:text-slate-400"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-sm font-bold text-[#1d3c6a] mb-2 pl-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    width="18"
                    height="11"
                    x="3"
                    y="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>

              {/* Type input berubah berdasarkan state showPassword */}
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f1f5f9] border-2 border-transparent rounded-2xl pl-14 pr-12 py-4 text-[#0f172a] focus:bg-white focus:border-[#38aef0] focus:ring-4 focus:ring-[#e3f2fd] transition-all outline-none font-medium placeholder:text-slate-400"
                placeholder="Enter your password"
                required
              />

              {/* Tombol Toggle Show/Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#1d3c6a] transition-colors"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                    <line x1="2" y1="2" x2="22" y2="22"></line>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1d3c6a] hover:bg-[#152c4f] text-white text-lg font-bold rounded-2xl py-4 mt-4 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 group disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span>{isLoading ? "Loading..." : "Login to System"}</span>
            {!isLoading && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1.5"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            )}
          </button>
        </form>
      </div>

      {/* Footer Area */}
      <footer className="mt-12 text-center">
        <p className="text-[#94a3b8] font-medium text-sm">
          © 2026 Cita Hati East Surabaya
        </p>
      </footer>
    </div>
  );
};

export default LoginAdmin;
