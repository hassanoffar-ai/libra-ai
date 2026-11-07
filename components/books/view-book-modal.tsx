"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  BookOpen,
  MapPin,
  Tag,
  Hash,
  Globe,
  Calendar,
  Building,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Book, BookCopy, getCopies } from "@/services/books-service";

interface ViewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onEdit?: (book: Book) => void;
}

export function ViewBookModal({ isOpen, onClose, book, onEdit }: ViewBookModalProps) {
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [isLoadingCopies, setIsLoadingCopies] = useState(false);

  useEffect(() => {
    if (book && isOpen) {
      setIsLoadingCopies(true);
      getCopies(book.id)
        .then((res) => setCopies(res))
        .finally(() => setIsLoadingCopies(false));
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                Biblioqrafik Kart
              </span>
              <h3 className="text-base font-bold text-white truncate max-w-md mt-0.5">
                {book.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Main Info Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Müəllif
              </span>
              <h4 className="text-base font-bold text-slate-900">{book.author}</h4>
            </div>

            {book.description && (
              <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2">
                {book.description}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Kateqoriya</span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  {book.category}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Nəşr Dili</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {book.language} dili
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Nəşriyyat / İl</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {book.publisher || "—"} {book.year ? `(${book.year})` : ""}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Rəf Ünvanı</span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  {book.initialShelf}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">ISBN</span>
                <span className="font-mono text-slate-700">{book.isbn || "Qeyd edilməyib"}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">UDK / BBK Şifri</span>
                <span className="font-mono text-slate-700">{book.udk || "Qeyd edilməyib"}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Səhifə Sayı</span>
                <span className="text-slate-700">{book.pages ? `${book.pages} səh.` : "—"}</span>
              </div>
            </div>
          </div>

          {/* Physical Copies Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Qeydiyyatda Olan Fiziki Nüsxələr ({copies.length})
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  {book.availableCount} mövcud
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {book.copiesCount} ümumi
                </span>
              </div>
            </div>

            {isLoadingCopies ? (
              <div className="py-6 text-center text-xs text-slate-400">Nüsxələr yüklənir...</div>
            ) : copies.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500 border border-slate-200">
                Bu kitaba aid fiziki nüsxə qeydiyyatı tapılmadı.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                      <th className="py-2.5 px-3">İnventar №</th>
                      <th className="py-2.5 px-3">Rəf Yeri</th>
                      <th className="py-2.5 px-3">Fiziki Vəziyyəti</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {copies.map((copy) => (
                      <tr key={copy.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-950">
                          {copy.inventoryNumber}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {copy.shelfLocation}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              copy.condition === "Əla"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : copy.condition === "Yaxşı"
                                ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                : copy.condition === "Təmirə ehtiyac var"
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                : "bg-rose-50 text-rose-700 border border-rose-200/60"
                            }`}
                          >
                            {copy.condition}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              copy.status === "Fondda"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : copy.status === "Oxucuda"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                : "bg-slate-100 text-slate-600 border border-slate-200/60"
                            }`}
                          >
                            {copy.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-slate-400">
            Qeydiyyat tarixi: {book.createdAt ? new Date(book.createdAt).toLocaleDateString("az-AZ") : "—"}
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(book);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                Redaktə Et
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-2xs transition-colors"
            >
              Bağla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

