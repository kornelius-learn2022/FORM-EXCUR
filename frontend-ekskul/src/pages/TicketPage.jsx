import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import logoCitaHati from "../assets/252-SMA_CITA_HATI_EAST_SURABAYA.png";
import logoExcur from "../assets/Form excur.png";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function TicketPage() {
  const { noReg } = useParams();

  const [ticketData, setTicketData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isDownloading, setIsDownloading] = useState(false);

  const ticketRef = useRef(null);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ticket/${noReg}`);
        if (!response.ok) {
          throw new Error("Ticket not found or invalid registration number.");
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
      fetchTicketData();
    }
  }, [noReg]);

  const currentNoReg = noReg || "INVALID-REG";
  const qrValue = `${window.location.origin}/status/${currentNoReg}`;

  const handleDownload = async () => {
    if (!ticketRef.current || isDownloading) return;

    setIsDownloading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: (node) => {
          if (
            node.hasAttribute &&
            node.hasAttribute("data-html2canvas-ignore")
          ) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement("a");
      link.download = `Ticket_${currentNoReg}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Image generation error:", err);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#eef3f8] flex items-center justify-center">
        <p className="text-slate-500 font-medium">Loading ticket data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#eef3f8] flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-bold">{error}</p>
        <Link to="/" className="text-blue-600 underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3f8] flex items-center justify-center p-4 md:p-12 font-sans text-[#0f172a]">
      <div className="w-full max-w-4xl flex flex-col gap-6 lg:gap-8">
        {/* TICKET PASSPORT CONTAINER */}
        <div
          id="ticket-area"
          ref={ticketRef}
          className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col md:flex-row"
        >
          {/* SISI KIRI */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-dashed border-slate-200 relative">
            <div className="hidden md:block absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#eef3f8]"></div>
            <div className="hidden md:block absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-[#eef3f8]"></div>

            <div>
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2 flex-shrink-0">
                  <img
                    src={logoCitaHati}
                    alt="Cita Hati Logo"
                    className="h-28 w-auto object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <div>
                  <span className="text-xs font-black text-[#38aef0] uppercase tracking-[0.2em] block mb-0.5">
                    Official Receipt
                  </span>
                  <h1 className="text-xl md:text-2xl font-extrabold text-[#1d3c6a] leading-tight">
                    Extracurricular Program
                  </h1>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Student Name
                  </label>
                  <p className="text-lg font-extrabold text-[#1d3c6a] uppercase tracking-wide">
                    {ticketData.student_name}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <p className="text-lg font-bold text-slate-700">
                    2026 / 2027
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Selected Extracurricular
                  </label>
                  <p className="text-lg font-extrabold text-[#38aef0] tracking-wide">
                    {ticketData.excur_name}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Grade Level
                  </label>
                  <p className="text-lg font-bold text-slate-700">
                    {ticketData.student_class} Class
                  </p>
                </div>

                {ticketData.selection_date && ticketData.place && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Selection Date
                      </label>
                      <p className="text-lg font-bold text-slate-700">
                        {ticketData.selection_date}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Location / Place
                      </label>
                      <p className="text-lg font-bold text-slate-700">
                        {ticketData.place}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bagian Status "Accepted" Telah Dihapus dari Sini */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Registration Number
                </label>
                <p className="text-sm font-mono font-bold text-slate-600 tracking-wider">
                  {currentNoReg}
                </p>
              </div>
            </div>
          </div>

          {/* SISI KANAN */}
          <div className="w-full md:w-80 bg-slate-50/60 p-8 md:p-12 flex flex-col items-center justify-center text-center gap-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <QRCodeCanvas
                value={qrValue}
                size={160}
                level={"H"}
                bgColor={"#ffffff"}
                fgColor={"#1d3c6a"}
              />
            </div>

            <div className="space-y-1.5 max-w-[200px]">
              <h3 className="text-xs font-black text-[#1d3c6a] uppercase tracking-wider">
                Digital Verification
              </h3>
              <p className="text-[12px] font-medium text-slate-400 leading-relaxed mb-6">
                Scan this QR code anytime to live-check your application
                approval status.
              </p>
            </div>

            {/* TOMBOL DOWNLOAD */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              data-html2canvas-ignore="true"
              className="w-full bg-[#1d3c6a] text-white font-bold text-sm py-3 px-6 rounded-xl shadow-[0_8px_20px_rgba(29,60,106,0.2)] hover:bg-[#152c4f] disabled:bg-slate-400 disabled:cursor-wait transition-all duration-300 flex items-center justify-center gap-2 mt-auto"
            >
              {isDownloading ? (
                <span>Generating...</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                  </svg>
                  Download Receipt
                </>
              )}
            </button>
          </div>
        </div>

        {/* AKSI TOMBOL BACK */}
        <div className="flex flex-col sm:flex-row items-center justify-start px-2 md:px-4 mt-2">
          <Link
            to="/"
            className="text-sm font-bold text-slate-400 hover:text-[#1d3c6a] transition-colors flex items-center gap-2 group py-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:-translate-x-1"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
