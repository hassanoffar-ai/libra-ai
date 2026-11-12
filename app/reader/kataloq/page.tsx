"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Tag,
  Calendar,
  Hash,
  Sparkles,
  BookX,
  LogOut,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { Book, getBooks } from "@/services/books-service";
import { ViewBookModal } from "@/components/books/view-book-modal";
import { useAuth } from "@/lib/firebase/auth-context";

function ReaderCatalogContent() {
  const router = useRouter();
  const { user, profile, role, isLoading: isAuthLoading, logout } = useAuth();

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Detail Modal
  const [viewingBook, setViewingBook] = useState<Book | null>(null);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/");
    }
  }, [user, isAuthLoading, router]);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (err) {
      console.error("Kitablar yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();

    const handleUpdate = () => loadBooks();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const defaultCats = ["Dərslik", "Bədii ədəbiyyat", "Texniki və İxtisas", "Elmi", "Lüğət və Məlumat"];
    const found = books.map((b) => b.category).filter(Boolean);
    return Array.from(new Set([...defaultCats, ...found]));
  }, [books]);

  // Filter books based on search parameters
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // 1. Text Search: Title, Author, Category, ISBN, UDK
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = book.title.toLowerCase().includes(q);
        const authorMatch = book.author.toLowerCase().includes(q);
        const categoryMatch = book.category.toLowerCase().includes(q);
        const isbnMatch = (book.isbn || "").toLowerCase().includes(q);
        const udkMatch = (book.udk || "").toLowerCase().includes(q);

        if (!titleMatch && !authorMatch && !categoryMatch && !isbnMatch && !udkMatch) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "all" && book.category !== selectedCategory) {
        return false;
      }

      // 3. Only Available
      if (onlyAvailable && book.availableCount <= 0) {
        return false;
      }

      return true;
    });
  }, [books, searchQuery, selectedCategory, onlyAvailable]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Header - Reader Navigation */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/reader"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Şəxsi Kabinet</span>
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 leading-tight block">
                Peşə Kitabxanası
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold leading-none">
                Oxucu Kitab Axtarışı
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">
              {profile?.firstName} {profile?.lastName}
            </span>
            <div className="flex items-center gap-1.5 justify-end text-[10px] text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                {profile?.category === "Müəllim" ? (
                  <Briefcase className="w-3 h-3" />
                ) : (
                  <GraduationCap className="w-3 h-3" />
                )}
                <span>{profile?.category || "Tələbə"}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Çıxış</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Hero Search Section */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Elektron Fond Axtarışı</span>
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kitab Fondunu Axtarın
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              Lənkəran Dövlət Peşə Təhsil Mərkəzinin kitabxanasında mövcud olan dərsliklər, nüsxələr və rəf ünvanları.
            </p>

            {/* Main Search Bar */}
            <div className="mt-5 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Kitabın adı, müəllif, kateqoriya və ya ISBN nömrəsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Təmizlə
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Bütün kateqoriyalar ({books.length})
              </button>

              {categories.map((cat) => {
                const count = books.filter((b) => b.category === cat).length;
                if (count === 0 && selectedCategory !== cat) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Availability Toggle */}
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>Yalnız fondda mövcud olanlar</span>
            </label>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Tapılan nəşrlər: {filteredBooks.length} kitab</span>
          {searchQuery && (
            <span>
              Sorğu: <span className="text-slate-900 font-semibold">&ldquo;{searchQuery}&rdquo;</span>
            </span>
          )}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Kitab fondu yüklənir...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <BookX className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Uyğun kitab tapılmadı</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Axtarış sözünü dəyişərək və ya kateqoriya filtrini sıfırlayaraq yenidən cəhd edin.
            </p>
            {(searchQuery || selectedCategory !== "all" || onlyAvailable) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setOnlyAvailable(false);
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Bütün filtrləri sıfırla
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBooks.map((book) => {
              const isAvailable = book.availableCount > 0;

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-lg transition-all p-5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top row: Category Badge & Availability */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Tag className="w-3 h-3" />
                        <span className="truncate max-w-[140px]">{book.category}</span>
                      </span>

                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Mövcuddur</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Hamısı oxucudadır</span>
                        </span>
                      )}
                    </div>

                    {/* Book Spine Icon & Title */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className="w-12 h-16 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white flex flex-col items-center justify-center p-1.5 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-5 h-5 text-indigo-300 mb-1" />
                        <span className="text-[9px] font-bold font-mono tracking-tighter text-indigo-200">
                          Peşə
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

                    {/* Meta Specifications */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Nəşr ili:</span>
                        </span>
                        <span className="font-semibold text-slate-700">
                          {book.year || "Qeyd edilməyib"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-slate-400" />
                          <span>ISBN:</span>
                        </span>
                        <span className="font-mono text-slate-700 truncate max-w-[150px]">
                          {book.isbn || "Yoxdur"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rəf ünvanı:</span>
                        </span>
                        <span className="font-semibold text-indigo-700 truncate max-w-[150px]">
                          {book.initialShelf || "Əsas Fond"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>Nüsxə vəziyyəti:</span>
                        </span>
                        <span className="font-bold text-slate-800">
                          Cəmi {book.copiesCount} ədəd ({book.availableCount} fondda)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Strictly Read-Only */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setViewingBook(book)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Detallara və nüsxələrə bax</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Book Detail Modal - Strictly Read-Only (no onEdit prop passed) */}
      {viewingBook && (
        <ViewBookModal
          isOpen={Boolean(viewingBook)}
          onClose={() => setViewingBook(null)}
          book={viewingBook}
        />
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs mt-12">
        Peşə Kitabxanası © 2026 • Lənkəran Dövlət Peşə Təhsil Mərkəzi
      </footer>
    </div>
  );
}

export default function ReaderCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReaderCatalogContent />
    </Suspense>
  );
}

