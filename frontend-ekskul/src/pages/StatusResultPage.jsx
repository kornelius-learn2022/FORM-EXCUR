import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
// Tambahkan ikon Clock untuk status "Pending Selection"
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import logoCitaHati from "../assets/252-SMA_CITA_HATI_EAST_SURABAYA.png";
import logoExcur from "../assets/Form excur.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function StatusResultPage() {
  const { noReg } = useParams();

  // --- STATE UNTUK DATA DARI BACKEND ---
  const [ticketData, setTicketData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- FETCH DATA SAAT HALAMAN DIMUAT ---
  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ticket/${noReg}`);
        if (!response.ok) {
          throw new Error("Registration data not found.");
        }
        const data = await response.json();
        setTicketData(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (noReg) {
      fetchStatusData();
    }
  }, [noReg]);

  // Tampilan saat sedang memuat data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] flex items-center justify-center font-sans">
        <p className="text-slate-500 font-bold animate-pulse">
          Loading status...
        </p>
      </div>
    );
  }
  // Tampilan saat data tidak ditemukan (Error)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] flex flex-col items-center justify-center gap-4 font-sans text-center px-4">
        <XCircle size={80} className="text-red-400 mb-4" />
        <p className="text-red-500 font-bold text-xl">{error}</p>
        <Link to="/" className="text-[#1c447a] font-bold hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e2e8f0] p-4 md:p-8 flex items-center justify-center font-sans">
      {/* Container Utama - Glassmorphism */}
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2.5rem] p-8 md:p-16 border border-white/50 flex flex-col items-center text-center">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-12">
          <img
            src={logoCitaHati}
            alt="Logo"
            className="h-20 mb-6 drop-shadow-md"
          />
          <h1 className="text-3xl font-extrabold text-gray-900">
            Registration Status
          </h1>
          <p className="text-gray-500 font-medium">
            Extracurricular Program 2026/2027
          </p>
        </div>

        {/* Visual Status (Dinamis berdasarkan ticketData.status) */}
        <div className="relative my-8">
          {ticketData.status === "Accepted" ? (
            <div className="flex flex-col items-center text-[#22c55e]">
              <CheckCircle2
                size={120}
                strokeWidth={1.5}
                className="drop-shadow-lg"
              />
              <span className="mt-4 text-2xl font-black uppercase tracking-[0.2em]">
                ACCEPTED
              </span>
            </div>
          ) : ticketData.status === "Pending Selection" ? (
            <div className="flex flex-col items-center text-[#f59e0b]">
              <Clock size={120} strokeWidth={1.5} className="drop-shadow-lg" />
              <span className="mt-4 text-2xl font-black uppercase tracking-[0.2em]">
                PENDING SELECTION
              </span>
            </div>
          ) : (
            // Default jika status "Rejected" atau lainnya
            <div className="flex flex-col items-center text-[#ef4444]">
              <XCircle
                size={120}
                strokeWidth={1.5}
                className="drop-shadow-lg"
              />
              <span className="mt-4 text-2xl font-black uppercase tracking-[0.2em]">
                {ticketData.status}
              </span>
            </div>
          )}
        </div>

        {/* Info Detail */}
        <div className="w-full max-w-md space-y-4 mt-8">
          {/* Kolom Nama Siswa */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
              Student Name
            </p>
            <p className="text-lg font-bold text-gray-800 uppercase">
              {ticketData.student_name}
            </p>
          </div>

          {/* Kolom Program & Reg Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                Program
              </p>
              <p className="text-lg font-bold text-gray-800">
                {ticketData.excur_name}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                Reg Number
              </p>
              <p className="text-lg font-bold text-gray-800">
                {ticketData.no_register}
              </p>
            </div>
          </div>

          {/* Kolom Selection Date & Place (HANYA TAMPIL JIKA ADA) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                Selection Date
              </p>
              <p className="text-lg font-bold text-gray-800">
                {ticketData.selection_date}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                Location
              </p>
              <p className="text-lg font-bold text-gray-800">
                {ticketData.place}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <Link
          to="/"
          className="mt-12 text-[#1c447a] font-bold hover:text-[#3eb4f0] transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
