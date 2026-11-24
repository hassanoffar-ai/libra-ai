"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  MapPin,
  Edit,
  Trash2,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import {
  BookCopy,
  getCopies,
  deleteCopy,
} from "@/services/books-service";
import { EditCopyModal } from "@/components/copies/edit-copy-modal";

export default function NusxelerPage() {
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchInv, setSearchInv] = useState("");
  const [filterShelf, setFilterShelf] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCondition, setFilterCondition] = useState<string>("all");

  // Edit Modal State
  const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null);

  const fetchCopies = async () => {
    setIsLoading(true);
    try {
      const data = await getCopies();
      setCopies(data);
    } catch (err) {
      console.error("Nüsxələr yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCopies();

    const handleUpdate = () => fetchCopies();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  const handleDeleteCopy = async (copy: BookCopy) => {
    if (
      confirm(
        `"${copy.inventoryNumber}" nömrəli nüsxəni silmək istədiyinizdən əminsiniz?`
      )
    ) {
      try {
        await deleteCopy(copy.id);
        fetchCopies();
      } catch (err) {
        console.error("Nüsxə silinərkən xəta:", err);
      }
    }
  };

  // Unique Shelves list
  const shelfLocationsList = useMemo(() => {
    const set = new Set<string>();
    copies.forEach((c) => {
      if (c.shelfLocation) set.add(c.shelfLocation);
    });
    return Array.from(set);
  }, [copies]);

  // Fast counts
  const availableCount = useMemo(
    () => copies.filter((c) => c.status === "Fondda").length,
    [copies]
  );
  const borrowedCount = useMemo(
    () => copies.filter((c) => c.status === "Oxucuda").length,
    [copies]
  );
  const repairCount = useMemo(
    () =>
      copies.filter(
        (c) =>
          c.condition === "Təmirə ehtiyac var" || c.condition === "Yararsız"
      ).length,
    [copies]
  );

  // Filtered Copies
  const filteredCopies = useMemo(() => {
    return copies.filter((copy) => {
      const q = searchInv.toLowerCase().trim();
      const matchesSearch =
        !q ||
        copy.inventoryNumber.toLowerCase().includes(q) ||
        copy.bookTitle.toLowerCase().includes(q) ||
        copy.bookAuthor.toLowerCase().includes(q);

      const matchesShelf =
        filterShelf === "all" || copy.shelfLocation === filterShelf;
      const matchesStatus =
        filterStatus === "all" || copy.status === filterStatus;
      const matchesCondition =
        filterCondition === "all" || copy.condition === filterCondition;

      return matchesSearch && matchesShelf && matchesStatus && matchesCondition;
    });
  }, [copies, searchInv, filterShelf, filterStatus, filterCondition]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E4E0F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Fiziki Kitab Nüsxələri
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200/60 text-violet-800 text-xs font-bold">
              <Layers className="w-3.5 h-3.5 text-violet-700" />
              {copies.length} fiziki vahid
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manual inventar uçotu, fiziki vəziyyət və rəf ünvanlarının idarə olunması
          </p>
        </div>

        <Link
          href="/kitablar"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#E4E0F0] hover:bg-[#F7F5FC] text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-violet-700" />
          <span>Kitab Fonduna Keç</span>
        </Link>
      </div>

      {/* Quick Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-[#E4E0F0] border-t-2 border-violet-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Cəmi Nüsxə</span>
          <span className="text-xl font-black text-slate-900">{copies.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E4E0F0] border-t-2 border-emerald-600 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 block uppercase">Rəfdə / Hazır</span>
          <span className="text-xl font-black text-emerald-700">{availableCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E4E0F0] border-t-2 border-violet-600 shadow-2xs">
          <span className="text-[11px] font-bold text-violet-700 block uppercase">Oxucuda</span>
          <span className="text-xl font-black text-violet-700">{borrowedCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-[#E4E0F0] border-t-2 border-amber-600 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 block uppercase">Təmir / Yararsız</span>
          <span className="text-xl font-black text-amber-700">{repairCount}</span>
        </div>
      </div>

      {/* 2. Fast Filter Toolbar */}
      <div className="bg-white rounded-xl border border-[#E4E0F0] p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Inventory Number & Book Search */}
          <div className="sm:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInv}
              onChange={(e) => setSearchInv(e.target.value)}
              placeholder="İnventar № və ya Kitab adı..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all font-mono"
            />
          </div>

          {/* Shelf Location Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterShelf}
              onChange={(e) => setFilterShelf(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all"
            >
              <option value="all">Bütün Rəf Yerləri</option>
              {shelfLocationsList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Physical Condition Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all"
            >
              <option value="all">Bütün Fiziki Vəziyyətlər</option>
              <option value="Əla">Əla vəziyyətdə</option>
              <option value="Yaxşı">Yaxşı vəziyyətdə</option>
              <option value="Təmirə ehtiyac var">Təmirə ehtiyac var</option>
              <option value="Yararsız">Yararsız</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all"
            >
              <option value="all">Bütün Statuslar</option>
              <option value="Fondda">Fondda (Rəfdə)</option>
              <option value="Oxucuda">Oxucuda</option>
              <option value="Silinib">Silinib</option>
            </select>
          </div>
        </div>

        {/* Toolbar Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Göstərilən nüsxə sayı: <strong className="text-slate-800">{filteredCopies.length}</strong> / {copies.length}
          </span>
          {(searchInv || filterShelf !== "all" || filterStatus !== "all" || filterCondition !== "all") && (
            <button
              onClick={() => {
                setSearchInv("");
                setFilterShelf("all");
                setFilterStatus("all");
                setFilterCondition("all");
              }}
              className="text-violet-700 hover:underline font-semibold"
            >
              Filtrləri sıfırla
            </button>
          )}
        </div>
      </div>

      {/* 3. Table or Graceful Real Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-12 text-center text-slate-400 text-sm">
          Fiziki nüsxələr yüklənir...
        </div>
      ) : copies.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[360px] shadow-xs">
          <div className="w-16 h-16 rounded-xl bg-violet-50 border border-violet-200/70 flex items-center justify-center text-violet-700 shadow-sm mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Hazırda bazada qeydiyyata alınmış məlumat yoxdur
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Kitab fonduna yeni nəşr əlavə edərkən nüsxə sayını qeyd etdikdə, sistem avtomatik olaraq unikal inventar nömrələri formalaşdıracaq.
          </p>
          <Link
            href="/kitablar"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Kitab fonduna daxil ol və əlavə et</span>
          </Link>
        </div>
      ) : filteredCopies.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            Axtarışa uyğun fiziki nüsxə tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            İnventar nömrəsini və ya tətbiq olunmuş rəf/status filtrlərini yoxlayın.
          </p>
          <button
            onClick={() => {
              setSearchInv("");
              setFilterShelf("all");
              setFilterStatus("all");
              setFilterCondition("all");
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
          >
            Filtrləri təmizlə
          </button>
        </div>
      ) : (
        /* Copies Table */
        <div className="bg-white rounded-xl border border-[#E4E0F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5FC] border-b border-[#E4E0F0] text-[11px] font-bold text-violet-950 uppercase tracking-wider">
                  <th className="py-3 px-4">İnventar №</th>
                  <th className="py-3 px-4">Aid Olduğu Kitab</th>
                  <th className="py-3 px-4">Rəf Ünvanı</th>
                  <th className="py-3 px-4">Fiziki Vəziyyəti</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0F0]">
                {filteredCopies.map((copy) => (
                  <tr
                    key={copy.id}
                    className="hover:bg-[#F7F5FC] transition-colors group"
                  >
                    {/* Inventory ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-violet-900 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200/70 text-xs">
                          {copy.inventoryNumber}
                        </span>
                      </div>
                    </td>

                    {/* Book Title & Author */}
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">
                          {copy.bookTitle}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {copy.bookAuthor}
                        </span>
                      </div>
                    </td>

                    {/* Shelf Location */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-violet-700 flex-shrink-0" />
                        <span>{copy.shelfLocation}</span>
                      </div>
                    </td>

                    {/* Physical Condition */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          copy.condition === "Əla"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : copy.condition === "Yaxşı"
                            ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                            : copy.condition === "Təmirə ehtiyac var"
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}
                      >
                        {copy.condition === "Təmirə ehtiyac var" && (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        )}
                        {copy.condition}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          copy.status === "Fondda"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : copy.status === "Oxucuda"
                            ? "bg-violet-50 text-violet-700 border border-violet-200/60"
                            : "bg-slate-100 text-slate-600 border border-[#E4E0F0]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            copy.status === "Fondda"
                              ? "bg-emerald-500"
                              : copy.status === "Oxucuda"
                              ? "bg-violet-600"
                              : "bg-slate-400"
                          }`}
                        />
                        {copy.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingCopy(copy)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-[#E4E0F0] hover:border-blue-200 transition-all font-semibold text-[11px] cursor-pointer"
                          title="Redaktə et (Vəziyyət və Rəf yeri)"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Redaktə et</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCopy(copy)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-[#E4E0F0] hover:border-rose-200 transition-all font-semibold text-[11px] cursor-pointer"
                          title="Fiziki nüsxəni sil"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Copy Modal */}
      <EditCopyModal
        isOpen={Boolean(editingCopy)}
        copy={editingCopy}
        onClose={() => setEditingCopy(null)}
        onSuccess={fetchCopies}
      />
    </div>
  );
}
