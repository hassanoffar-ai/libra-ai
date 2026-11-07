"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, BookmarkPlus, Search, User, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Reader,
  getReaders,
  createReservation,
} from "@/services/circulation-service";
import {
  Book,
  getBooks,
} from "@/services/books-service";

interface AddReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddReservationModal({ isOpen, onClose, onSuccess }: AddReservationModalProps) {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [readerQuery, setReaderQuery] = useState("");
  const [bookQuery, setBookQuery] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([getReaders(), getBooks()]).then(([r, b]) => {
        setReaders(r);
        setBooks(b);
      });
      setSelectedReader(null);
      setSelectedBook(null);
      setReaderQuery("");
      setBookQuery("");
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  // Live filter readers
  const filteredReaders = useMemo(() => {
    const q = readerQuery.toLowerCase().trim();
    if (!q) return [];
    return readers.filter((r) => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      return name.includes(q) || r.ticketNumber.toLowerCase().includes(q);
    }).slice(0, 5);
  }, [readers, readerQuery]);

  // Live filter books
  const filteredBooks = useMemo(() => {
    const q = bookQuery.toLowerCase().trim();
    if (!q) return [];
    return books.filter((b) => {
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }).slice(0, 5);
  }, [books, bookQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReader || !selectedBook) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createReservation({
        readerId: selectedReader.id,
        bookId: selectedBook.id,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.message || "Xəta baş verdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Yeni Rezervasiya (Növbə)
              </h3>
              <p className="text-xs text-slate-400">
                Mövcud olmayan və ya istiqrazda olan kitab üçün növbə qeydiyyatı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Rezervasiya uğurla qeydə alındı!
            </h4>
            <p className="text-xs text-slate-500">
              Kitab növbə sırasına əlavə edildi. Nüsxə fonda daxil olan kimi təxsis ediləcək.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Reader Selection */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">
                1. Oxucu Seçin <span className="text-rose-500">*</span>
              </label>

              {!selectedReader ? (
                <div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={readerQuery}
                      onChange={(e) => setReaderQuery(e.target.value)}
                      placeholder="Oxucu adı və ya Bilet № daxil edin..."
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  {readerQuery && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white mt-1 shadow-sm max-h-40 overflow-y-auto">
                      {filteredReaders.length === 0 ? (
                        <div className="p-3 text-center text-slate-400">Oxucu tapılmadı</div>
                      ) : (
                        filteredReaders.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedReader(r);
                              setReaderQuery("");
                            }}
                            className="p-2.5 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between"
                          >
                            <span className="font-bold text-slate-900">{r.firstName} {r.lastName}</span>
                            <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                              {r.ticketNumber}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {selectedReader.firstName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        {selectedReader.firstName} {selectedReader.lastName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {selectedReader.ticketNumber} • {selectedReader.department}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedReader(null)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* 2. Book Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700">
                2. Rezerv Ediləcək Kitabı Seçin <span className="text-rose-500">*</span>
              </label>

              {!selectedBook ? (
                <div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={bookQuery}
                      onChange={(e) => setBookQuery(e.target.value)}
                      placeholder="Kitabın adı və ya ISBN daxil edin..."
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>

                  {bookQuery && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white mt-1 shadow-sm max-h-40 overflow-y-auto">
                      {filteredBooks.length === 0 ? (
                        <div className="p-3 text-center text-slate-400">Kitab tapılmadı</div>
                      ) : (
                        filteredBooks.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBook(b);
                              setBookQuery("");
                            }}
                            className="p-2.5 hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <span className="font-bold text-slate-900 block truncate max-w-xs">{b.title}</span>
                              <span className="text-[11px] text-slate-500">{b.author}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {b.availableCount} hazır
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block text-xs truncate max-w-xs">
                        {selectedBook.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {selectedBook.author} • {selectedBook.category}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
              >
                İmtina
              </button>
              <button
                type="submit"
                disabled={!selectedReader || !selectedBook || isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-2xs transition-all disabled:opacity-50"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>{isSubmitting ? "Yaradılır..." : "Rezervasiya Yarat"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

