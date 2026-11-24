"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookmarkCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  Reservation,
  getReservations,
  updateReservationStatus,
} from "@/services/circulation-service";
import {
  getCopies,
  BookCopy,
} from "@/services/books-service";
import { AddReservationModal } from "@/components/reservations/add-reservation-modal";

export default function RezervasiyalarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableCopies, setAvailableCopies] = useState<BookCopy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resData, copiesData] = await Promise.all([
        getReservations(),
        getCopies(),
      ]);
      setReservations(resData);
      setAvailableCopies(copiesData.filter((c) => c.status === "Fondda"));
    } catch (err) {
      console.error("Rezervasiyalar yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.readerName.toLowerCase().includes(q) ||
        r.readerTicket.toLowerCase().includes(q) ||
        r.bookTitle.toLowerCase().includes(q) ||
        r.bookAuthor.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === "all" || r.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchQuery, selectedStatus]);

  // Handle assigning an available copy to this reservation
  const handleAssignCopy = async (res: Reservation) => {
    const matchingCopy = availableCopies.find((c) => c.bookId === res.bookId);
    if (!matchingCopy) {
      alert("Hazırda bu kitab üçün fondda boş nüsxə yoxdur. Kitab qaytarıldıqda dərhal təxsis edə bilərsiniz.");
      return;
    }

    try {
      await updateReservationStatus(res.id, "Nüsxə ayrıldı", {
        copyId: matchingCopy.id,
        inventoryNumber: matchingCopy.inventoryNumber,
      });
      fetchData();
    } catch (err) {
      console.error("Nüsxə təxsis edilərkən xəta:", err);
    }
  };

  // Handle cancellation
  const handleCancelReservation = async (res: Reservation) => {
    if (confirm(`"${res.readerName}" adlı oxucunun "${res.bookTitle}" rezervasiyasını ləğv etmək istəyirsiniz?`)) {
      try {
        await updateReservationStatus(res.id, "Ləğv edildi");
        fetchData();
      } catch (err) {
        console.error("Rezervasiya ləğv edilərkən xəta:", err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E4E0F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Kitab Rezervasiyaları
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200/60 text-violet-800 text-xs font-bold">
              <BookmarkCheck className="w-3.5 h-3.5 text-violet-700" />
              Növbə Reyestri
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Oxucuların əvvəlcədən sifariş etdiyi kitablar və nüsxə təxsisatının idarə olunması
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 active:bg-violet-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/30 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Rezervasiya</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E4E0F0] p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Axtarış: Oxucu adı, Bilet № və ya Kitab adı..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all font-semibold"
            >
              <option value="all">Bütün Statuslar</option>
              <option value="Gözləyir">Gözləyir (Növbədə)</option>
              <option value="Nüsxə ayrıldı">Nüsxə ayrıldı (Hazır)</option>
              <option value="Tamamlandı">Tamamlandı</option>
              <option value="Ləğv edildi">Ləğv edildi</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Göstərilən rezervasiya: <strong className="text-slate-800">{filteredReservations.length}</strong> / {reservations.length}
          </span>
          {(searchQuery || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("all");
              }}
              className="text-violet-700 hover:underline font-semibold"
            >
              Axtarışı təmizlə
            </button>
          )}
        </div>
      </div>

      {/* 3. Table or Graceful Real Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-12 text-center text-slate-400 text-sm">
          Rezervasiyalar yüklənir...
        </div>
      ) : reservations.length === 0 ? (
        /* Empty State: 100% Real Empty state */
        <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
          <div className="w-16 h-16 rounded-xl bg-violet-50 border border-violet-200/70 flex items-center justify-center text-violet-700 shadow-sm mb-4">
            <BookmarkCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Hazırda bazada qeydiyyata alınmış məlumat yoxdur
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Oxucular fondda bitmiş və ya istiqrazda olan kitabları əvvəlcədən sifariş edə bilər. Nüsxə fonda qayıtdıqda növbəyə əsasən avtomatik təxsis edilir.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>İlk rezervasiyanı yarat</span>
          </button>
        </div>
      ) : filteredReservations.length === 0 ? (
        /* Search 0 */
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            Axtarışa uyğun rezervasiya tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Açar sözləri və ya tətbiq olunmuş status filtrini yoxlayın.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedStatus("all");
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer"
          >
            Filtrləri təmizlə
          </button>
        </div>
      ) : (
        /* Reservations Table */
        <div className="bg-white rounded-xl border border-[#E4E0F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5FC] border-b border-[#E4E0F0] text-[11px] font-bold text-violet-950 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center">Növbə №</th>
                  <th className="py-3 px-4">Oxucu</th>
                  <th className="py-3 px-4">Kitabın Adı</th>
                  <th className="py-3 px-4">Sifariş Tarixi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0F0]">
                {filteredReservations.map((res) => {
                  const hasCopyInStock = availableCopies.some((c) => c.bookId === res.bookId);

                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-[#F7F5FC] transition-colors group"
                    >
                      {/* Queue position */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-xs text-violet-900 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200/70">
                          #{res.queuePosition}
                        </span>
                      </td>

                      {/* Reader */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{res.readerName}</div>
                      </td>

                      {/* Book Title */}
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">
                            {res.bookTitle}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {res.bookAuthor}
                          </span>
                        </div>
                      </td>

                      {/* Reserved Date */}
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {res.reservedDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            res.status === "Nüsxə ayrıldı"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : res.status === "Gözləyir"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-[#E4E0F0]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              res.status === "Nüsxə ayrıldı"
                                ? "bg-emerald-500"
                                : res.status === "Gözləyir"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {res.status}
                        </span>

                        {res.assignedInventoryNumber && (
                          <div className="font-mono text-[10px] text-violet-700 mt-0.5 font-bold">
                            {res.assignedInventoryNumber}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {res.status === "Gözləyir" && (
                            <>
                              <button
                                onClick={() => handleAssignCopy(res)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                                  hasCopyInStock
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                                title={hasCopyInStock ? "Fonda qayıtmış nüsxəni təxsis et" : "Fondda boş nüsxə yoxdur"}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Təxsis Et</span>
                              </button>
                              <button
                                onClick={() => handleCancelReservation(res)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Rezervasiyanı ləğv et"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {res.status === "Nüsxə ayrıldı" && (
                            <Link
                              href={`/verilme?readerId=${res.readerId}&copyId=${res.assignedCopyId}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>İstiqraza Çıxar</span>
                            </Link>
                          )}
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

      {/* Add Reservation Modal */}
      <AddReservationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
