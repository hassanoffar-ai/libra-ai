"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  BookOpen,
  MapPin,
  Filter,
  Layers,
  Calendar,
  Globe,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BookX,
  Compass,
} from "lucide-react";
import { Book, getBooks } from "@/services/books-service";
import { ViewBookModal } from "@/components/books/view-book-modal";

export default function KataloqPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [mainQuery, setMainQuery] = useState("");
  const [authorQuery, setAuthorQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearQuery, setYearQuery] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // View modal
  const [viewingBook, setViewingBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (err) {
      console.error("Kataloq yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();

    const handleUpdate = () => fetchBooks();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  // Category list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = mainQuery.toLowerCase().trim();
      const matchesMain =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q));

      const matchesAuthor =
        !authorQuery || b.author.toLowerCase().includes(authorQuery.toLowerCase().trim());

      const matchesCategory =
        categoryFilter === "all" || b.category === categoryFilter;

      const matchesYear =
        !yearQuery || (b.year && String(b.year).includes(yearQuery.trim()));

      const matchesAvailable = !onlyAvailable || b.availableCount > 0;

      return (
        matchesMain &&
        matchesAuthor &&
        matchesCategory &&
        matchesYear &&
        matchesAvailable
      );
    });
  }, [books, mainQuery, authorQuery, categoryFilter, yearQuery, onlyAvailable]);

  const resetAllFilters = () => {
    setMainQuery("");
    setAuthorQuery("");
    setCategoryFilter("all");
    setYearQuery("");
    setOnlyAvailable(false);
  };

  const hasActiveFilters =
    Boolean(mainQuery) ||
    Boolean(authorQuery) ||
    categoryFilter !== "all" ||
    Boolean(yearQuery) ||
    onlyAvailable;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Compass className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>OPAC Açıq Elektron Kataloq</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Elektron Kitabxana Kataloqu
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Mərkəzin zəngin fonduna aid nəşrləri axtarın, rəf ünvanlarını dəqiqləşdirin və fiziki nüsxələrin mövcudluğunu anbaan yoxlayın.
          </p>

          {/* Quick Search Bar */}
          <div className="pt-2">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={mainQuery}
                onChange={(e) => setMainQuery(e.target.value)}
                placeholder="Kitab adı, müəllif, mövzu və ya açar sözlər daxil edin..."
                className="w-full pl-12 pr-28 py-3.5 text-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition-all shadow-inner"
              />
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="absolute right-2 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filtrlər</span>
                {isAdvancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Advanced Filters Drawer */}
      {isAdvancedOpen && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              Təkmil Axtarış Filtrləri
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-indigo-600 hover:underline font-semibold"
              >
                Filtrləri sıfırla
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Müəllifə görə
              </label>
              <input
                type="text"
                value={authorQuery}
                onChange={(e) => setAuthorQuery(e.target.value)}
                placeholder="Məs: Nizami Gəncəvi"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kateqoriya / Sahə
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
              >
                <option value="all">Bütün sahələr</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nəşr İli
              </label>
              <input
                type="text"
                value={yearQuery}
                onChange={(e) => setYearQuery(e.target.value)}
                placeholder="Məs: 2023"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono"
              />
            </div>

            <div className="flex items-center sm:pt-5">
              <label className="relative flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Yalnız rəfdə mövcud olanlar
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 3. Catalog Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Kataloqda tapıldı: <strong className="text-slate-800">{filteredBooks.length}</strong> nəşr
        </span>
        {hasActiveFilters && (
          <button
            onClick={resetAllFilters}
            className="text-indigo-600 hover:underline font-medium"
          >
            Axtarışı təmizlə
          </button>
        )}
      </div>

      {/* 4. Book Cards Grid or Graceful Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Elektron kataloq yüklənir...
        </div>
      ) : books.length === 0 ? (
        /* Empty State: Empty library */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[360px] shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Elektron kataloqda hələ heç bir kitab qeydiyyatı yoxdur
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Kitabxanaçı tərəfindən "Kitab fondu" bölməsindən yeni nəşrlər əlavə edildikdə, onlar dərhal bu kataloqda axtarış üçün aktivləşəcəkdir.
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        /* Empty State: No search results */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <BookX className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800 mb-1">
            Axtarış parametrlərinə uyğun heç bir nəşr tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Açar sözləri dəyişərək və ya tətbiq olunmuş filtrləri sıfırlayaraq yenidən cəhd edin.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            Bütün filtrləri sıfırla
          </button>
        </div>
      ) : (
        /* Book Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCount > 0;
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top card row: Category pill & Availability badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100/60 truncate max-w-[150px]">
                      {book.category}
                    </span>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {book.availableCount} nüsxə hazır
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Oxucuda / Bitib
                      </span>
                    )}
                  </div>

                  {/* Visual Stylized Book Spine & Title */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-16 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex flex-col items-center justify-center p-1.5 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5 text-indigo-300 mb-1" />
                      <span className="text-[9px] font-bold font-mono tracking-tighter text-indigo-200">
                        LIBRA
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3
                        onClick={() => setViewingBook(book)}
                        className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer"
                        title={book.title}
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {book.author}
                      </p>
                    </div>
                  </div>

                  {/* Key Metadata (Year, Language, Pages) */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1.5 border-t border-slate-100">
                    <span>{book.language}</span>
                    {book.year && (
                      <>
                        <span>•</span>
                        <span>{book.year} il</span>
                      </>
                    )}
                    {book.pages && (
                      <>
                        <span>•</span>
                        <span>{book.pages} səh.</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Exact Physical Shelf Location & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80 truncate">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{book.initialShelf}</span>
                  </div>

                  <button
                    onClick={() => setViewingBook(book)}
                    className="px-3 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors flex-shrink-0"
                  >
                    Detallar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Book Modal */}
      <ViewBookModal
        isOpen={Boolean(viewingBook)}
        book={viewingBook}
        onClose={() => setViewingBook(null)}
      />
    </div>
  );
}

