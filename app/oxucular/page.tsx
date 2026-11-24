"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  UserX,
  BookOpen,
} from "lucide-react";
import {
  Reader,
  getReaders,
  deleteReader,
  updateReader,
  getLoans,
  Loan,
  isReaderPending,
  isReaderActive,
  isReaderBlocked,
} from "@/services/circulation-service";
import { AddReaderModal } from "@/components/readers/add-reader-modal";
import { ViewReaderModal } from "@/components/readers/view-reader-modal";

export default function OxucularPage() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReader, setEditingReader] = useState<Reader | null>(null);
  const [viewingReader, setViewingReader] = useState<Reader | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rData, lData] = await Promise.all([getReaders(), getLoans()]);
      setReaders(rData);
      setLoans(lData);
    } catch (err) {
      console.error("Oxucular yüklənərkən xəta:", err);
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

  // Calculate active book count per reader
  const readerActiveBookCount = useMemo(() => {
    const map: Record<string, number> = {};
    loans.forEach((loan) => {
      if (loan.status === "Aktiv" || loan.status === "Gecikib") {
        map[loan.readerId] = (map[loan.readerId] || 0) + 1;
      }
    });
    return map;
  }, [loans]);

  // Count of pending readers awaiting librarian approval
  const pendingCount = useMemo(() => {
    return readers.filter((r) => isReaderPending(r.status)).length;
  }, [readers]);

  // Filtered readers
  const filteredReaders = useMemo(() => {
    return readers.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${r.firstName} ${r.lastName} ${r.fatherName || ""}`.toLowerCase();
      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        r.ticketNumber?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q);

      const matchesCat = selectedCategory === "all" || r.category === selectedCategory;
      let matchesStatus = true;
      if (selectedStatus === "pending") {
        matchesStatus = isReaderPending(r.status);
      } else if (selectedStatus === "active" || selectedStatus === "Aktiv") {
        matchesStatus = isReaderActive(r.status);
      } else if (selectedStatus === "blocked" || selectedStatus === "Bloklanıb") {
        matchesStatus = isReaderBlocked(r.status);
      } else if (selectedStatus === "Borclu") {
        matchesStatus = r.status === "Borclu";
      }

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [readers, searchQuery, selectedCategory, selectedStatus]);

  const handleApprove = async (reader: Reader) => {
    try {
      await updateReader(reader.id, { status: "active" });
      fetchData();
    } catch (err) {
      console.error("Oxucu təsdiqlənərkən xəta:", err);
    }
  };

  const handleDelete = async (reader: Reader) => {
    if (confirm(`"${reader.firstName} ${reader.lastName}" adlı oxucunu silmək istəyirsiniz?`)) {
      try {
        await deleteReader(reader.id);
        fetchData();
      } catch (err) {
        console.error("Oxucu silinərkən xəta:", err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E4E0F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Oxucuların Reyestri
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-200/60 text-violet-800 text-xs font-bold">
              <Users className="w-3.5 h-3.5 text-violet-700" />
              {readers.length} qeydiyyat
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Lənkəran Dövlət Peşə Təhsil Mərkəzi tələbə, müəllim və inzibati oxucu bazası
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReader(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 active:bg-violet-900 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/30 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Oxucu Qeydiyyatı</span>
        </button>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-[#E4E0F0] p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Main search input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Axtarış: Ad, Soyad, Bilet №, Qrup və ya Əlaqə..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all font-semibold"
            >
              <option value="all">Bütün Kateqoriyalar</option>
              <option value="Tələbə">Tələbə</option>
              <option value="Müəllim">Müəllim</option>
              <option value="Əməkdaş">Əməkdaş</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 focus:bg-white transition-all font-semibold"
            >
              <option value="all">Bütün Statuslar</option>
              <option value="pending">Təsdiq gözləyir ({pendingCount})</option>
              <option value="active">Aktiv</option>
              <option value="Borclu">Borclu (Gecikməsi var)</option>
              <option value="blocked">Bloklanıb</option>
            </select>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Göstərilir: <strong className="text-slate-800">{filteredReaders.length}</strong> / {readers.length} oxucu
          </span>
          {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedStatus("all");
              }}
              className="text-violet-700 hover:underline font-semibold"
            >
              Filtrləri sıfırla
            </button>
          )}
        </div>
      </div>

      {/* 3. Readers Table or Graceful Real Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-12 text-center text-slate-400 text-sm">
          Oxucu bazası yüklənir...
        </div>
      ) : readers.length === 0 ? (
        /* Empty State: 100% Real Empty state */
        <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
          <div className="w-16 h-16 rounded-xl bg-violet-50 border border-violet-200/70 flex items-center justify-center text-violet-700 shadow-sm mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Hazırda bazada qeydiyyata alınmış məlumat yoxdur
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Mərkəzin tələbə və müəllim heyətini sistemə daxil edərək kitab istiqrazına başlayın.
          </p>
          <button
            onClick={() => {
              setEditingReader(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>İlk oxucunu əlavə et</span>
          </button>
        </div>
      ) : filteredReaders.length === 0 ? (
        /* Empty State: No results */
        <div className="bg-white rounded-xl border border-[#E4E0F0] p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <UserX className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 mb-1">
            Axtarışa uyğun oxucu tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Açar sözü dəyişərək və ya tətbiq olunmuş filtrləri sıfırlayaraq yenidən yoxlayın.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedStatus("all");
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer"
          >
            Filtrləri təmizlə
          </button>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-xl border border-[#E4E0F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F5FC] border-b border-[#E4E0F0] text-[11px] font-bold text-violet-950 uppercase tracking-wider">
                  <th className="py-3 px-4">Ad, Soyad və Ata Adı</th>
                  <th className="py-3 px-4">Kateqoriya</th>
                  <th className="py-3 px-4">Qrup / Şöbə</th>
                  <th className="py-3 px-4">Əlaqə</th>
                  <th className="py-3 px-4 text-center">Götürülmüş Kitab</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E0F0]">
                {filteredReaders.map((reader) => {
                  const activeBooks = readerActiveBookCount[reader.id] || 0;
                  const isNearLimit = activeBooks >= reader.maxBookLimit;

                  return (
                    <tr
                      key={reader.id}
                      className="hover:bg-[#F7F5FC] transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3 px-4">
                        <span
                          onClick={() => setViewingReader(reader)}
                          className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors cursor-pointer block"
                        >
                          {reader.firstName} {reader.lastName}
                        </span>
                        {reader.fatherName && (
                          <span className="text-[11px] text-slate-400 block">
                            {reader.fatherName}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            reader.category === "Müəllim"
                              ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                              : reader.category === "Əməkdaş"
                              ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                              : "bg-violet-50 text-violet-800 border border-violet-200/60"
                          }`}
                        >
                          {reader.category}
                        </span>
                      </td>

                      {/* Department / Group */}
                      <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate font-medium">
                        {reader.department}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{reader.phone}</div>
                        {reader.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {reader.email}
                          </div>
                        )}
                      </td>

                      {/* Borrowed Book Count / Limit */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            activeBooks === 0
                              ? "bg-[#F7F5FC] text-slate-600 border border-[#E4E0F0]"
                              : isNearLimit
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-violet-50 text-violet-800 border border-violet-200/60"
                          }`}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{activeBooks} / {reader.maxBookLimit}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isReaderPending(reader.status)
                              ? "bg-amber-50 text-amber-800 border border-amber-300/80"
                              : isReaderActive(reader.status)
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : reader.status === "Borclu"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isReaderPending(reader.status)
                                ? "bg-amber-500 animate-pulse"
                                : isReaderActive(reader.status)
                                ? "bg-emerald-500"
                                : reader.status === "Borclu"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {isReaderPending(reader.status)
                            ? "Təsdiq gözləyir"
                            : isReaderActive(reader.status)
                            ? "Aktiv"
                            : isReaderBlocked(reader.status)
                            ? "Bloklanıb"
                            : reader.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReaderPending(reader.status) && (
                            <button
                              onClick={() => handleApprove(reader)}
                              title="Oxucunu təsdiqlə və aktiv et"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all whitespace-nowrap cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Təsdiqlə / Aktiv et</span>
                            </button>
                          )}
                          <button
                            onClick={() => setViewingReader(reader)}
                            title="Profilə və Tarixçəyə bax"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingReader(reader);
                              setIsAddModalOpen(true);
                            }}
                            title="Redaktə et"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reader)}
                            title="Sil"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

      {/* Add / Edit Reader Modal */}
      <AddReaderModal
        isOpen={isAddModalOpen}
        editReader={editingReader}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingReader(null);
        }}
        onSuccess={fetchData}
      />

      {/* View Reader Details & History Modal */}
      <ViewReaderModal
        isOpen={Boolean(viewingReader)}
        reader={viewingReader}
        onClose={() => setViewingReader(null)}
        onEdit={(r) => {
          setEditingReader(r);
          setIsAddModalOpen(true);
        }}
      />
    </div>
  );
}
