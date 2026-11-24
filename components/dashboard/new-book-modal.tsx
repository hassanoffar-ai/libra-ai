"use client";

import React, { useState } from "react";
import { X, Plus, BookOpen, Layers, CheckCircle2 } from "lucide-react";

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (book: {
    title: string;
    author: string;
    category: string;
    copies: number;
  }) => void;
}

export function NewBookModal({ isOpen, onClose, onSubmit }: NewBookModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Texniki");
  const [copies, setCopies] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    onSubmit({
      title: title.trim(),
      author: author.trim(),
      category,
      copies: Number(copies) || 1,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setTitle("");
      setAuthor("");
      setCopies(1);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2E1065]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-[#E4E0F0] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#2E1065] via-[#3B0764] to-[#4C1D95] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[#DDD6FE] shadow-xs">
              <BookOpen className="w-4 h-4 text-[#C4B5FD]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Yeni Kitab Əlavə Et</h3>
              <p className="text-xs text-violet-200">Fondun kataloquna yeni nəşr qeydiyyatı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Kitab uğurla qeydiyyata alındı!
            </h4>
            <p className="text-xs text-slate-500">
              Statistikalar və fond göstəriciləri yeniləndi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kitabın Adı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Məs: İnformasiya Texnologiyalarının Əsasları"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Müəllif(lər) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Məs: Əli Məmmədov"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kateqoriya / Sahə
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all text-slate-800"
                >
                  <option value="Texniki">Texniki</option>
                  <option value="Dərslik">Dərslik</option>
                  <option value="Bədii">Bədii</option>
                  <option value="Elmi">Elmi</option>
                  <option value="Tarixi">Tarixi</option>
                  <option value="Digər">Digər</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fiziki Nüsxə Sayı
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all text-slate-800"
                  />
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E4E0F0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                İmtina
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 active:bg-violet-900 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Fonduna Əlavə Et
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
