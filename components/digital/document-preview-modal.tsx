"use client";

import React, { useState } from "react";
import {
  X,
  Maximize2,
  Minimize2,
  Download,
  BookOpen,
  FileText,
  FileSpreadsheet,
  FileCode,
  Globe,
  ExternalLink,
} from "lucide-react";
import { DigitalResource, downloadDigitalResource } from "@/services/digital-library-service";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  resource: DigitalResource | null;
  onClose: () => void;
}

export function DocumentPreviewModal({ isOpen, resource, onClose }: DocumentPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !resource) return null;

  const isPdf = resource.format?.toUpperCase() === "PDF";
  const isOffice = ["DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX"].includes(resource.format?.toUpperCase());

  const handleDownload = async () => {
    await downloadDigitalResource(resource);
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
                isPdf
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : isOffice
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
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

          {/* Reader Controls: Fullscreen, Download, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
              title={isFullscreen ? "Tam ekrandan çıx" : "Tam ekran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Direct Original-Format Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              title="Faylı orijinal formatda yüklə"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yüklə ({resource.fileSize})</span>
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
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
          {isPdf && resource.fileUrl ? (
            <iframe
              src={resource.fileUrl}
              className="w-full h-full rounded-xl border border-slate-800 bg-white"
              title={resource.title}
            />
          ) : (
            <div className="w-full max-w-xl bg-white text-slate-900 rounded-2xl shadow-xl p-8 sm:p-10 space-y-6 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
                {isOffice ? <FileText className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
              </div>

              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 mb-2 font-mono">
                  {resource.format} • {resource.fileSize}
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {resource.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Müəllif: <strong className="text-slate-700">{resource.author}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  İxtisas / Bölmə: <strong className="text-slate-700">{resource.category}</strong>
                </p>
              </div>

              {resource.description && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed text-left">
                  {resource.description}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Orijinal Formatda Yüklə ({resource.fileName || resource.format})</span>
                </button>

                {resource.fileUrl?.startsWith("http") && (
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Brauzerdə aç</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
