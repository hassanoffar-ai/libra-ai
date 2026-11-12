"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  X,
  Sparkles,
  LogOut,
  Building,
} from "lucide-react";
import {
  getStoredReaderSession,
  clearReaderSession,
  ReaderSession,
} from "@/services/reader-auth-service";
import {
  CatalogBook,
  fetchFirebaseCatalogBooks,
  filterCatalogBooks,
} from "@/services/firebase-catalog-service";

function ReaderCatalogContent() {
  const router = useRouter();
  const [reader, setReader] = useState<ReaderSession | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Books from Firebase Firestore
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [isBooksLoading, setIsBooksLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedBook, setSelectedBook] = useState<CatalogBook | null>(null);

  // Auth check: isolated reader session
  useEffect(() => {
    const session = getStoredReaderSession();
    if (!session) {
      router.push("/auth/login");
    } else {
      setReader(session);
    }
    setIsAuthLoading(false);
  }, [router]);

  // Fetch catalog directly from Firebase
  useEffect(() => {
    fetchFirebaseCatalogBooks()
      .then((data) => setBooks(data))
      .catch((err) => console.error("Firebase catalog error:", err))
      .finally(() => setIsBooksLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return ["all", ...Array.from(set)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return filterCatalogBooks(books, searchQuery, selectedCategory, onlyAvailable);
  }, [books, searchQuery, selectedCategory, onlyAvailable]);

  const handleLogout = () => {
    clearReaderSession();
    router.push("/auth/login");
  };

  if (isAuthLoading || !reader) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Məlumatlar yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Header - Reader Portal Top Navigation (NO Admin sidebar) */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Şəxsi kabinetə qayıt"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 leading-none block">
              Elektron Kitab Fondu
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">
              Lənkəran Dövlət Peşə Təhsil Mərkəzi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">
              {reader.firstName} {reader.lastName}
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold font-mono">
              Bilet: {reader.ticketNumber}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Çıxış</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner with Real-time Search */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-950/20">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-400/20 via-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Real-vaxt Firebase Kitab Fondu</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              Kitabxana Fondunu Axtarın
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
              Mərkəzin fiziki və rəqəmsal dərsliklərini axtarın, rəf yerlərini və fonddakı cari nüsxə sayını dərhal öyrənin.
            </p>

            {/* Main Search Input */}
            <div className="pt-2">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Kitabın adı, müəllif və ya kateqoriyaya görə axtarın..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 text-xs sm:text-sm bg-white/95 text-slate-900 placeholder:text-slate-400 rounded-2xl border border-white/20 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-400/30 focus:bg-white transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "all" ? "Bütün Kateqoriyalar" : cat}
                </button>
              ))}
            </div>

            {/* Only Available Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none flex-shrink-0">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Yalnız fondda olanlar</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Tapılan nəşrlər: <strong className="text-slate-700">{filteredBooks.length}</strong></span>
            <span>Mənbə: Firebase Firestore Real-Time Fondu</span>
          </div>
        </div>

        {/* Books Grid */}
        {isBooksLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Firebase fondundan kitablar yüklənir...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Axtarışa uyğun kitab tapılmadı</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Zəhmət olmasa axtarış sözünü dəyişin və ya kateqoriya filtrini sıfırlayın.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredBooks.map((book) => {
              const isAvailable = book.availableCount > 0;
              return (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-indigo-400/80 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header badges: Category & Real-time Availability badge */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 truncate max-w-[150px]">
                        {book.category}
                      </span>

                      {/* Requirement 3: Real-time availability badges from Firebase */}
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Fondda var ({book.availableCount} nüsxə)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex-shrink-0">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Hazırda fondda yoxdur</span>
                        </span>
                      )}
                    </div>

                    {/* Book Title & Author */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium truncate">
                        {book.author}
                      </p>
                    </div>

                    {/* Description preview */}
                    {book.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {book.description}
                      </p>
                    )}
                  </div>

                  {/* Footer details: Shelf location & Year */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span className="font-semibold truncate max-w-[150px]">
                        {book.shelfLocation || book.initialShelf}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{book.year}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Book Details Modal */}
        {selectedBook && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedBook(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    {selectedBook.category}
                  </span>
                  {selectedBook.availableCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Fondda var ({selectedBook.availableCount} nüsxə)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Hazırda fondda yoxdur
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {selectedBook.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Müəllif: {selectedBook.author}
                </p>
              </div>

              {selectedBook.description && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                  {selectedBook.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Rəf yeri</span>
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedBook.shelfLocation || selectedBook.initialShelf}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nəşr ili</span>
                  <span className="font-bold text-slate-800 text-xs font-mono mt-0.5 block">
                    {selectedBook.year}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                  <p className="font-semibold">Kitabı necə əldə etmək olar?</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Kitabxanaya yaxınlaşaraq bilet nömrənizi (<strong>{reader.ticketNumber}</strong>) və rəf yerini (<strong>{selectedBook.shelfLocation}</strong>) kitabxanaçıya bildirin.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Bağla
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ReaderCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Məlumatlar yüklənir...</p>
          </div>
        </div>
      }
    >
      <ReaderCatalogContent />
    </Suspense>
  );
}

