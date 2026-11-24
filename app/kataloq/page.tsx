"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  BookOpen,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BookX,
  Compass,
  Edit2,
  Trash2,
} from "lucide-react";
import { Book, getBooks } from "@/services/books-service";
import { ViewBookModal } from "@/components/books/view-book-modal";
import { AddBookModal } from "@/components/books/add-book-modal";
import { DeleteBookDialog } from "@/components/books/delete-book-dialog";
import { useAuth } from "@/lib/firebase/auth-context";

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

  // View, Edit, Delete modals
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  // Authentication role check (Librarian/Admin only)
  const { user, role, isAdmin } = useAuth();
  const hasLocalAdmin = typeof window !== "undefined" && localStorage.getItem("libra_admin_session") === "true";
  const isLibrarian = isAdmin || Boolean(user) || role === "admin" || (role as string) === "librarian" || hasLocalAdmin;

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
      <div className="rounded-xl bg-gradient-to-r from-[#2E1065] via-[#3B0764] to-[#4C1D95] text-white p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Compass className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#C4B5FD] text-xs font-semibold backdrop-blur-xs">
            <Compass className="w-3.5 h-3.5" />
            <span>OPAC Açıq Elektron Kataloq</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Elektron Kitabxana Kataloqu
          </h1>
          <p className="text-xs sm:text-sm text-violet-200/90 leading-relaxed">
            Lənkəran Dövlət Peşə Təhsil Mərkəzi kitab fonduna aid nəşrləri axtarın, rəf ünvanlarını dəqiqləşdirin və fiziki nüsxələrin mövcudluğunu yoxlayın.
          </p>

          {/* Quick Search Bar */}
          <div className="pt-2">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-violet-300" />
              </div>
              <input
                type="text"
                value={mainQuery}
                onChange={(e) => setMainQuery(e.target.value)}
                placeholder="Kitab adı, müəllif, ixtisas və ya açar söz daxil edin..."
                className="w-full pl-12 pr-28 py-3 text-xs sm:text-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-violet-200/60 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white/20 transition-all shadow-inner"
              />
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="absolute right-2 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-5 shadow-2xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#E4E0F0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-violet-700" />
              Təkmil Axtarış Filtrləri
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-violet-700 hover:underline font-semibold"
              >
                Filtrləri sıfırla
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Müəllifə görə
              </label>
              <input
                type="text"
                value={authorQuery}
                onChange={(e) => setAuthorQuery(e.target.value)}
                placeholder="Məs: Əli Məmmədov"
                className="w-full px-3 py-2 text-xs bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kateqoriya / Sahə
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all text-slate-800 font-semibold"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nəşr İli
              </label>
              <input
                type="text"
                value={yearQuery}
                onChange={(e) => setYearQuery(e.target.value)}
                placeholder="Məs: 2023"
                className="w-full px-3 py-2 text-xs bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all font-mono text-slate-800"
              />
            </div>

            <div className="flex items-center sm:pt-5">
              <label className="relative flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 text-violet-700 rounded border-[#E4E0F0] focus:ring-violet-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  Yalnız fondda mövcud olanlar
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
            className="text-violet-700 hover:underline font-semibold"
          >
            Axtarışı təmizlə
          </button>
        )}
      </div>

      {/* 4. Book Cards Grid or Graceful Real Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-12 text-center text-slate-400 text-sm">
          Elektron kataloq yüklənir...
        </div>
      ) : books.length === 0 ? (
        /* Empty State: 100% Real Empty state */
        <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[360px] shadow-xs">
          <div className="w-16 h-16 rounded-xl bg-violet-50 border border-violet-200/70 flex items-center justify-center text-violet-700 shadow-sm mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Hazırda bazada qeydiyyata alınmış məlumat yoxdur
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Kitabxanaçı tərəfindən "Kitab fondu" bölməsindən yeni nəşrlər əlavə edildikdə, onlar dərhal bu kataloqda axtarış üçün aktivləşəcəkdir.
          </p>
        </div>
      ) : filteredBooks.length === 0 ? (
        /* Empty State: No search results */
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <BookX className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            Axtarış parametrlərinə uyğun heç bir nəşr tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Açar sözləri dəyişərək və ya tətbiq olunmuş filtrləri sıfırlayaraq yenidən cəhd edin.
          </p>
          <button
            onClick={resetAllFilters}
            className="px-4 py-2 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer"
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
                className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top card row: Category pill & Availability badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold text-violet-800 bg-violet-50 px-2.5 py-0.5 rounded-md border border-violet-200/60 truncate max-w-[150px]">
                      {book.category}
                    </span>
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {book.availableCount} nüsxə hazır
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Oxucuda / Bitib
                      </span>
                    )}
                  </div>

                  {/* Stylized Book Spine & Title */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-12 h-16 rounded-lg bg-gradient-to-tr from-[#2E1065] to-[#6D28D9] text-white flex flex-col items-center justify-center p-1.5 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5 text-[#C4B5FD] mb-1" />
                      <span className="text-[9px] font-bold font-mono tracking-tighter text-[#DDD6FE]">
                        Peşə
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3
                        onClick={() => setViewingBook(book)}
                        className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-violet-700 transition-colors cursor-pointer"
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
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1.5 border-t border-[#E4E0F0]">
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

                {/* Bottom Row: Exact Physical Shelf Location & Actions */}
                <div className="pt-3 border-t border-[#E4E0F0] flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-[#F7F5FC] px-2.5 py-1 rounded-lg border border-[#E4E0F0] truncate">
                    <MapPin className="w-3.5 h-3.5 text-violet-700 flex-shrink-0" />
                    <span className="truncate">{book.initialShelf}</span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setViewingBook(book)}
                      className="px-2.5 py-1 text-xs font-bold text-violet-700 hover:text-violet-900 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                    >
                      Detallar
                    </button>

                    {/* Admin / Librarian Actions (Hidden from readers) */}
                    {isLibrarian && (
                      <div className="flex items-center gap-0.5 border-l border-[#E4E0F0] pl-1.5 ml-0.5">
                        <button
                          onClick={() => {
                            setEditingBook(book);
                            setIsEditModalOpen(true);
                          }}
                          title="Redaktə et"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingBook(book)}
                          title="Sil"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
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
        onEdit={
          isLibrarian
            ? (book) => {
                setEditingBook(book);
                setIsEditModalOpen(true);
              }
            : undefined
        }
      />

      {/* Edit Book Modal */}
      <AddBookModal
        isOpen={isEditModalOpen}
        editBook={editingBook}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBook(null);
        }}
        onSuccess={fetchBooks}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteBookDialog
        isOpen={Boolean(deletingBook)}
        book={deletingBook}
        onClose={() => setDeletingBook(null)}
        onSuccess={fetchBooks}
      />
    </div>
  );
}
