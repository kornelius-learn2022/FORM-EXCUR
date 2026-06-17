import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";

export default function CheckStatusPage() {
  const [noReg, setNoReg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (noReg.trim() !== "") {
      navigate(`/status/${noReg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] p-4 md:p-8 flex items-center justify-center font-sans">
      {/* Container Utama - Glassmorphism */}
      <div className="w-full max-w-6xl bg-white/70 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-8 md:p-16 border border-white/50 flex flex-col md:flex-row gap-16 items-center">
        {/* Sisi Kiri: Ilustrasi */}
        <div className="hidden md:flex w-1/2 flex-col items-center">
          <img
            src="src/assets/Form excur.png"
            alt="Check Status"
            className="w-full max-w-[420px] drop-shadow-2xl"
          />
          <h2 className="mt-8 text-2xl font-bold text-[#1c447a]">
            Check Registration Status
          </h2>
          <p className="text-gray-600 mt-2">
            {/* Teks diubah ke bahasa Inggris */}
            Enter your registration number to view the details.
          </p>
        </div>

        {/* Sisi Kanan: Form */}
        <div className="w-full md:w-1/2">
          <div className="flex items-center gap-4 mb-10">
            <img
              src="src/assets/252-SMA_CITA_HATI_EAST_SURABAYA.png"
              alt="Logo"
              className="h-16"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Status Check</h1>
              <p className="text-gray-500 text-sm font-medium">
                Extracurricular Program 2026/2027
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                Registration Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={noReg}
                  onChange={(e) => setNoReg(e.target.value)}
                  required
                  className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-[#3eb4f0] focus:ring-4 focus:ring-[#3eb4f0]/10 transition-all outline-none text-lg pl-14"
                  placeholder="e.g. REG-A1B2C3" // Placeholder disesuaikan dengan format baru
                />
                <Search
                  className="absolute left-5 top-4.5 text-gray-400"
                  size={24}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1c447a] hover:bg-[#3eb4f0] text-white font-bold py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              Check Now <ChevronRight size={22} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
