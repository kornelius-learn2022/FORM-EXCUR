import React from "react";
import { Link } from "react-router-dom";
import { ClipboardSignature, FileSearch, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    // Background gradasi modern yang bersih
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] flex flex-col items-center justify-center p-6 md:p-12 font-sans text-gray-900">
      {/* Container Utama dengan efek Glassmorphism yang sangat halus */}
      <div className="w-full max-w-6xl">
        {/* HEADER SECTION - Dibuat lebih elegan */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-8 mb-20 bg-white/50 backdrop-blur-sm p-8 rounded-[2rem] border border-white/50 shadow-sm">
          <div className="flex-shrink-0 p-2 bg-white rounded-2xl shadow-inner">
            <img
              src="src/assets/Form excur.png"
              alt="Cita Hati Logo"
              className="h-28 w-auto object-contain"
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#1c447a] tracking-tight mb-2">
              Extracurricular Program
            </h1>
            <p className="text-xl text-gray-500 font-medium tracking-wide">
              Registration System{" "}
              <span className="text-[#37b1f6] font-bold">2026/2027</span>
            </p>
          </div>
        </div>

        {/* BUTTONS SECTION - Dibuat lebih ergonomis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Tombol Register */}
          <Link
            to="/register"
            className="group relative overflow-hidden bg-white p-8 rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-[#37b1f6]/10 rounded-2xl text-[#37b1f6]">
                <ClipboardSignature size={40} strokeWidth={1.5} />
              </div>
              <span className="text-2xl font-bold">Register Excur</span>
            </div>
            <div className="p-3 bg-gray-100 rounded-full group-hover:bg-[#37b1f6] group-hover:text-white transition-colors">
              <ArrowRight size={24} />
            </div>
          </Link>

          {/* Tombol Check Status */}
          <Link
            to="/check-status"
            className="group relative overflow-hidden bg-white p-8 rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="p-4 bg-[#37b1f6]/10 rounded-2xl text-[#37b1f6]">
                <FileSearch size={40} strokeWidth={1.5} />
              </div>
              <span className="text-2xl font-bold">Check Status</span>
            </div>
            <div className="p-3 bg-gray-100 rounded-full group-hover:bg-[#37b1f6] group-hover:text-white transition-colors">
              <ArrowRight size={24} />
            </div>
          </Link>
        </div>
      </div>

      {/* Footer minimalis */}
      <p className="mt-20 text-gray-400 text-sm font-medium">
        © 2026 Cita Hati East Surabaya
      </p>
    </div>
  );
}
