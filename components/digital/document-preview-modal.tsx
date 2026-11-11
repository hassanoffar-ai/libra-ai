"use client";

import React, { useState } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Printer,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { DigitalResource, incrementDownload } from "@/services/digital-library-service";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  resource: DigitalResource | null;
  onClose: () => void;
}

export function DocumentPreviewModal({ isOpen, resource, onClose }: DocumentPreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(28);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  if (!isOpen || !resource) return null;

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(175, Math.max(75, prev + delta)));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleDownload = () => {
    incrementDownload(resource.id);
    alert(`"${resource.title}" (${resource.format}) faylının endirilməsi başladıldı.`);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isFullscreen ? "p-0" : "p-2 sm:p-5"}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Reader Container */}
      <div
        className={`relative w-full ${
          isFullscreen ? "h-screen rounded-none" : "max-w-5xl h-[92vh] rounded-2xl"
        } bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-white`}
      >
        {/* Top Reader Toolbar */}
        <div className="h-14 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                resource.format === "PDF"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : resource.format === "EPUB"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {resource.format}
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                {resource.title}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">{resource.author}</p>
            </div>
          </div>

          {/* Reader Controls: Zoom, Page nav, Fullscreen, Download */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Page Navigation */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-white"
                title="Əvvəlki səhifə"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] px-1 text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-white"
                title="Növbəti səhifə"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <button
                onClick={() => handleZoom(-15)}
                className="p-1 hover:text-indigo-400"
                title="Kiçilt"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-slate-300 w-10 text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => handleZoom(15)}
                className="p-1 hover:text-indigo-400"
                title="Böyüt"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bookmark button */}
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-xl transition-colors ${
                isBookmarked ? "text-amber-400 bg-amber-500/20" : "text-slate-400 hover:bg-slate-800"
              }`}
              title="Əlfəcin qoy"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
              title={isFullscreen ? "Tam ekrandan çıx" : "Tam ekran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs transition-colors shadow-sm"
              title="Faylı kompüterə yüklə"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Yüklə ({resource.fileSize})</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Document Canvas */}
        <div className="flex-1 bg-slate-950/70 p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
            className="w-full max-w-2xl min-h-[640px] bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-14 space-y-6 select-text transition-transform duration-150"
          >
            {/* Mock Document Page Header */}
            <div className="pb-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-400 font-serif">
              <span>Lənkəran Dövlət Peşə Təhsil Mərkəzi • Elektron Tədris Fondu</span>
              <span className="font-mono text-slate-700 font-bold">Səhifə {currentPage}</span>
            </div>

            {/* Document Content Sample */}
            <div className="space-y-4 font-serif leading-relaxed text-sm text-slate-800">
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-indigo-700 block">
                Fəsil {Math.ceil(currentPage / 5)}: {resource.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-950">
                {resource.title}
              </h2>
              <p className="text-xs font-sans text-slate-500 italic pb-2 border-b border-slate-100">
                Müəllif: {resource.author}
              </p>

              <p className="pt-2">
                Bu dərslik və tədris vəsaiti Lənkəran Dövlət Peşə Təhsil Mərkəzinin tələbə və mühəndis-pedaqoji heyətinin rəqəmsal resurslarla təminatı məqsədilə elektron kitabxana bazasına daxil edilmişdir.
              </p>

              <p>
                Müasir peşə təhsilində rəqəmsallaşma tələbələrin nəzəri bilikləri sərbəst şəkildə əldə etməsinə, laboratoriya və praktiki məşğələlərə qabaqcadan hazırlaşmasına geniş imkanlar yaradır. Tədris modulları üzrə mənimsənilən biliklər gələcək əmək bazarında rəqabətədavamlı kadr potensialının formalaşdırılmasının əsas sütunudur.
              </p>

              <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans space-y-1">
                <span className="font-bold text-slate-900 block">Metodiki Tövsiyə #{currentPage}:</span>
                <p className="text-slate-600">
                  {resource.description || "Tədris materialının hər bir bölməsindən sonra nəzəriyyəni möhkəmləndirmək üçün praktiki laboratoriya tapşırıqlarını icra edin."}
                </p>
              </div>

              <p>
                Əlavə suallar və elektron laboratoriya faylları üçün Mərkəzin İnformasiya Texnologiyaları və Kitabxana İdarəetmə Mərkəzi ilə əlaqə saxlaya bilərsiniz.
              </p>
            </div>

            {/* Page Footer */}
            <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-sans">
              <span>Peşə Kitabxanası Rəqəmsal Oxucu</span>
              <span className="font-mono">{currentPage} / {totalPages}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

