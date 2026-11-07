"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Layers,
  MapPin,
  Sparkles,
  BookX,
  RefreshCw,
} from "lucide-react";
import { Book, getBooks } from "@/services/books-service";
import { AddBookModal } from "@/components/books/add-book-modal";
import { ViewBookModal } from "@/components/books/view-book-modal";
import { DeleteBookDialog } from "@/components/books/delete-book-dialog";

export default function KitablarPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
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
    fetchBooks();

    // Digər səhifələrdən və ya modallardan gələn dəyişiklikləri dinləmək
    const handleUpdate = () => fetchBooks();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      // Text search: Title, Author, ISBN, UDK
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.isbn && book.isbn.toLowerCase().includes(query)) ||
        (book.udk && book.udk.toLowerCase().includes(query));

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || book.category === selectedCategory;

      // Language filter
      const matchesLanguage =
        selectedLanguage === "all" || book.language === selectedLanguage;

      return matchesSearch && matchesCategory && matchesLanguage;
    });
  }, [books, searchQuery, selectedCategory, selectedLanguage]);

  // Extract unique categories and languages
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [books]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Kitab Fondu
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              {books.length} adda kitab
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin əsas kitab fondu və kataloq reyestri
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBook(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yeni Kitab Əlavə Et</span>
        </button>
      </div>

      {/* 2. Top Bar: Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Axtarış: Kitabın adı, Müəllif, ISBN və ya UDK..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                Təmizlə
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            >
              <option value="all">Bütün Kateqoriyalar</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            >
              <option value="all">Bütün Dillər</option>
              <option value="Azərbaycan">Azərbaycan dili</option>
              <option value="Rus">Rus dili</option>
              <option value="İngilis">İngilis dili</option>
              <option value="Türk">Türk dili</option>
              <option value="Digər">Digər dillər</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Göstərilir: <strong className="text-slate-800">{filteredBooks.length}</strong> / {books.length} kitab
          </span>
          {(searchQuery || selectedCategory !== "all" || selectedLanguage !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedLanguage("all");
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Bütün filtrləri sıfırla
            </button>
          )}
        </div>
      </div>

      {/* 3. Data Table or Graceful Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Kitab fondu yüklənir...
        </div>
      ) : books.length === 0 ? (
        /* Empty State: No Books in library at all */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Kitab fondunda hələ heç bir nəşr qeydə alınmayıb
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin kitabxana fonduna yeni dərsliklər, texniki ədəbiyyat və bədii nəşrlər əlavə edərək inventar uçotuna başlayın.
          </p>
          <button
            onClick={() => {
              setEditingBook(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>İlk kitabı əlavə et</span>
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        /* Empty State: Search/Filter returned 0 results */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <BookX className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800 mb-1">
            Axtarış parametrlərinə uyğun kitab tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Açar sözləri dəyişərək və ya tətbiq olunmuş kateqoriya/dil filtrlərini sıfırlayaraq yenidən yoxlayın.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedLanguage("all");
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            Filtrləri təmizlə
          </button>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Kitabın Adı və Müəllif</th>
                  <th className="py-3 px-4">ISBN / UDK</th>
                  <th className="py-3 px-4">Kateqoriya</th>
                  <th className="py-3 px-4">Nəşriyyat / İl</th>
                  <th className="py-3 px-4 text-center">Nüsxə (Cəmi / Hazır)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCount > 0;
                  return (
                    <tr
                      key={book.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Title & Author */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3 max-w-sm">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => setViewingBook(book)}>
                              {book.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {book.author}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ISBN / UDK */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div>{book.isbn || "—"}</div>
                        <div className="text-slate-400 text-[10px]">{book.udk || ""}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 max-w-[160px] truncate">
                          {book.category}
                        </span>
                      </td>

                      {/* Publisher & Year */}
                      <td className="py-3 px-4 text-slate-600">
                        <div>{book.publisher || "—"}</div>
                        <div className="text-[10px] text-slate-400">
                          {book.year ? `${book.year} il` : ""}
                        </div>
                      </td>

                      {/* Copies (Total / Available) */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">
                          {book.copiesCount}
                        </span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className={`font-bold ${isAvailable ? "text-emerald-600" : "text-rose-600"}`}>
                          {book.availableCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Fondda var
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Bitib
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingBook(book)}
                            title="Baxış"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingBook(book);
                              setIsAddModalOpen(true);
                            }}
                            title="Redaktə et"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingBook(book)}
                            title="Sil"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        editBook={editingBook}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBook(null);
        }}
        onSuccess={fetchBooks}
      />

      {/* View Details Modal */}
      <ViewBookModal
        isOpen={Boolean(viewingBook)}
        book={viewingBook}
        onClose={() => setViewingBook(null)}
        onEdit={(book) => {
          setEditingBook(book);
          setIsAddModalOpen(true);
        }}
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
