"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookPlus,
  BookOpen,
  Layers,
  MapPin,
  Tag,
  Hash,
  Globe,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Book,
  CreateBookInput,
  BookLanguage,
  createBook,
  updateBook,
} from "@/services/books-service";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editBook?: Book | null;
}

const CATEGORIES = [
  "İnformasiya Texnologiyaları",
  "Avtomobil Mühəndisliyi",
  "Elektrotexnika və Energetika",
  "Dərslik və Metodiki Vəsait",
  "Bədii Ədəbiyyat",
  "Riyaziyyat və Təbiət Elmləri",
  "Tarix və İctimaiyyət",
  "Aqrar və Kənd Təsərrüfatı",
  "Qida və Xidmət Sahəsi",
  "Digər",
];

const LANGUAGES: BookLanguage[] = ["Azərbaycan", "Rus", "İngilis", "Türk", "Digər"];

export function AddBookModal({ isOpen, onClose, onSuccess, editBook }: AddBookModalProps) {
  const isEdit = Boolean(editBook);

  // Form Fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [udk, setUdk] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [publisher, setPublisher] = useState("");
  const [year, setYear] = useState("");
  const [pages, setPages] = useState<number | "">("");
  const [language, setLanguage] = useState<BookLanguage>("Azərbaycan");
  const [initialShelf, setInitialShelf] = useState("Zal 1, Rəf A-1");
  const [description, setDescription] = useState("");

  // Copy generation fields (only in create mode)
  const [initialCopiesCount, setInitialCopiesCount] = useState(1);
  const [inventoryPrefix, setInventoryPrefix] = useState("INV-");
  const [inventoryStartNumber, setInventoryStartNumber] = useState(1001);

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (editBook) {
      setTitle(editBook.title || "");
      setAuthor(editBook.author || "");
      setIsbn(editBook.isbn || "");
      setUdk(editBook.udk || "");
      setCategory(editBook.category || CATEGORIES[0]);
      setPublisher(editBook.publisher || "");
      setYear(editBook.year ? String(editBook.year) : "");
      setPages(editBook.pages || "");
      setLanguage(editBook.language || "Azərbaycan");
      setInitialShelf(editBook.initialShelf || "Zal 1, Rəf A-1");
      setDescription(editBook.description || "");
    } else {
      resetForm();
    }
  }, [editBook, isOpen]);

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setIsbn("");
    setUdk("");
    setCategory(CATEGORIES[0]);
    setPublisher("");
    setYear("");
    setPages("");
    setLanguage("Azərbaycan");
    setInitialShelf("Zal 1, Rəf A-1");
    setDescription("");
    setInitialCopiesCount(1);
    setInventoryPrefix("INV-");
    setInventoryStartNumber(1001);
    setErrors({});
    setIsSuccess(false);
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Kitabın başlığı tələb olunur";
    }
    if (!author.trim()) {
      newErrors.author = "Müəllif adı tələb olunur";
    }
    if (!isEdit && (initialCopiesCount < 1 || isNaN(initialCopiesCount))) {
      newErrors.initialCopiesCount = "Ən azı 1 nüsxə daxil edilməlidir";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && editBook) {
        await updateBook(editBook.id, {
          title: title.trim(),
          author: author.trim(),
          isbn: isbn.trim(),
          udk: udk.trim(),
          category,
          publisher: publisher.trim(),
          year: year.trim(),
          pages: pages ? Number(pages) : undefined,
          language,
          initialShelf: initialShelf.trim(),
          description: description.trim(),
        });
      } else {
        const input: CreateBookInput = {
          title: title.trim(),
          author: author.trim(),
          isbn: isbn.trim(),
          udk: udk.trim(),
          category,
          publisher: publisher.trim(),
          year: year.trim(),
          pages: pages ? Number(pages) : undefined,
          language,
          initialShelf: initialShelf.trim(),
          description: description.trim(),
          initialCopiesCount: Number(initialCopiesCount) || 1,
          inventoryPrefix: inventoryPrefix.trim() || "INV-",
          inventoryStartNumber: Number(inventoryStartNumber) || 1001,
        };
        await createBook(input);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Kitab saxlanarkən xəta:", err);
      setErrors({ form: "Əməliyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin." });
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdit ? "Kitab Məlumatlarını Redaktə Et" : "Yeni Kitab Qeydiyyatı"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? "Kataloq və biblioqrafik göstəricilərin yenilənməsi"
                  : "Kitab fondu və avtomatik fiziki nüsxələrin uçotu"}
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

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-1">
              {isEdit ? "Kitab uğurla yeniləndi!" : "Kitab və fiziki nüsxələr uğurla qeydiyyata alındı!"}
            </h4>
            <p className="text-xs text-slate-500">
              Məlumatlar kitab fonduna və inventar siyahısına əlavə edildi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {errors.form && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Section 1: Əsas Məlumatlar */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Biblioqrafik Məlumatlar
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kitabın Başlığı (Adı) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Məs: Kompüter Şəbəkələri və İnformasiya Təhlükəsizliyi"
                    className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all ${
                      errors.title ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  />
                  {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Müəllif(lər) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Məs: Professor E. Əliyev"
                    className={`w-full px-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all ${
                      errors.author ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                    }`}
                  />
                  {errors.author && <p className="text-[11px] text-rose-500 mt-1">{errors.author}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kateqoriya / Tədris Sahəsi
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Şifrlər və Nəşr Məlumatları */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Şifrlər və Nəşriyyat
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ISBN Nömrəsi
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="Məs: 978-9952-12-345-6"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UDK / BBK Şifri
                  </label>
                  <input
                    type="text"
                    value={udk}
                    onChange={(e) => setUdk(e.target.value)}
                    placeholder="Məs: 004.7 (075.8)"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nəşriyyat
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Məs: Maarif / Şərq-Qərb"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nəşr İli
                    </label>
                    <input
                      type="text"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="Məs: 2023"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Səhifə Sayı
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pages}
                      onChange={(e) => setPages(e.target.value ? parseInt(e.target.value) : "")}
                      placeholder="Məs: 320"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nəşr Dili
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as BookLanguage)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang} dili
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rəf Ünvanı (Zal, Rəf)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={initialShelf}
                      onChange={(e) => setInitialShelf(e.target.value)}
                      placeholder="Məs: Zal 1, Rəf A-2"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qısa Təsvir / Açar Sözlər
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kitabın məzmunu və ya oxucuların axtarışı üçün açar sözlər..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none text-xs"
                />
              </div>
            </div>

            {/* Section 3: Fiziki Nüsxələrin Avtomatik Formallaşdırılması (yalnız yeni kitab yaradıldıqda) */}
            {!isEdit && (
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Fiziki Nüsxələrin İnventar Uçotu
                  </h4>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                    Avtomatik generasiya
                  </span>
                </div>
                <p className="text-xs text-indigo-800/80 leading-relaxed">
                  Qeyd edilən sayda unikal inventar nömrələri avtomatik formalaşdırılaraq <b>/nusxeler</b> bazasına daxil ediləcəkdir.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nüsxə Sayı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={initialCopiesCount}
                      onChange={(e) => setInitialCopiesCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İnventar Prefiksi
                    </label>
                    <input
                      type="text"
                      value={inventoryPrefix}
                      onChange={(e) => setInventoryPrefix(e.target.value)}
                      placeholder="INV-"
                      className="w-full px-3.5 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Başlanğıc Nömrə
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={inventoryStartNumber}
                      onChange={(e) => setInventoryStartNumber(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <span>Nümunə inventar nömrələri:</span>
                  <code className="bg-white px-2 py-0.5 rounded border border-indigo-100 font-mono text-indigo-700 font-semibold">
                    {inventoryPrefix}{String(inventoryStartNumber).padStart(4, "0")}
                  </code>
                  {initialCopiesCount > 1 && (
                    <>
                      <span>...</span>
                      <code className="bg-white px-2 py-0.5 rounded border border-indigo-100 font-mono text-indigo-700 font-semibold">
                        {inventoryPrefix}{String(inventoryStartNumber + initialCopiesCount - 1).padStart(4, "0")}
                      </code>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                İmtina
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saxlanılır...</span>
                ) : isEdit ? (
                  <span>Dəyişiklikləri Saxla</span>
                ) : (
                  <>
                    <BookPlus className="w-4 h-4" />
                    <span>Fonda Daxil Et</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

