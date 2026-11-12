"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertTriangle,
  UserX,
  BookOpen,
  Clock,
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
    if (confirm(`"${reader.firstName} ${reader.lastName}" adlı oxucunu bazadan silmək istəyirsiniz?`)) {
      await deleteReader(reader.id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Oxucular
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              {readers.length} qeydiyyat
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin tələbə, müəllim və əməkdaş oxucu bazası
          </p>
        </div>

        <button
          onClick={() => {
            setEditingReader(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yeni Oxucu Əlavə Et</span>
        </button>
      </div>

      {/* 2. Top Bar: Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        {/* Quick Filter Tabs / Badges - Requirement 4 */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatus === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Bütün Oxucular ({readers.length})
          </button>

          <button
            onClick={() => setSelectedStatus("pending")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatus === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Təsdiq gözləyənlər</span>
            {pendingCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  selectedStatus === "pending"
                    ? "bg-white text-amber-800"
                    : "bg-amber-500 text-white animate-pulse"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedStatus("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatus === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80"
            }`}
          >
            Aktiv
          </button>

          <button
            onClick={() => setSelectedStatus("blocked")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatus === "blocked"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/80"
            }`}
          >
            Bloklanıb
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search field */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Axtarış: Ad, Soyad, Bilet №, Qrup və ya Əlaqə..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
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
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
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
              className="text-indigo-600 hover:underline font-medium"
            >
              Filtrləri sıfırla
            </button>
          )}
        </div>
      </div>

      {/* 3. Readers Table or Graceful Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Oxucu bazası yüklənir...
        </div>
      ) : readers.length === 0 ? (
        /* Empty State: No readers */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Oxucu bazasında hələ heç bir üzv qeydiyyatdan keçməyib
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Mərkəzin tələbə və müəllim heyətini sistemə daxil edərək kitab istiqrazına başlayın.
          </p>
          <button
            onClick={() => {
              setEditingReader(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>İlk oxucunu əlavə et</span>
          </button>
        </div>
      ) : filteredReaders.length === 0 ? (
        /* Empty State: No results */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <UserX className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800 mb-1">
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
                  <th className="py-3 px-4">Ad, Soyad və Ata Adı</th>
                  <th className="py-3 px-4">Kateqoriya</th>
                  <th className="py-3 px-4">Qrup / Şöbə</th>
                  <th className="py-3 px-4">Əlaqə</th>
                  <th className="py-3 px-4 text-center">Götürülmüş Kitab</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReaders.map((reader) => {
                  const activeBooks = readerActiveBookCount[reader.id] || 0;
                  const isNearLimit = activeBooks >= reader.maxBookLimit;

                  return (
                    <tr
                      key={reader.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3 px-4">
                        <span
                          onClick={() => setViewingReader(reader)}
                          className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer block"
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
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            reader.category === "Müəllim"
                              ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                              : reader.category === "Əməkdaş"
                              ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                              : "bg-blue-50 text-blue-700 border border-blue-200/60"
                          }`}
                        >
                          {reader.category}
                        </span>
                      </td>

                      {/* Department / Group */}
                      <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate">
                        {reader.department}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{reader.phone}</div>
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
                              ? "bg-slate-100 text-slate-600"
                              : isNearLimit
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-indigo-50 text-indigo-700 border border-indigo-100"
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
                          {/* One-click Təsdiqlə / Aktiv et button - Requirement 4 */}
                          {isReaderPending(reader.status) && (
                            <button
                              onClick={() => handleApprove(reader)}
                              title="Oxucunu təsdiqlə və aktiv et"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Təsdiqlə / Aktiv et</span>
                            </button>
                          )}
                          <button
                            onClick={() => setViewingReader(reader)}
                            title="Profilə və Tarixçəyə bax"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingReader(reader);
                              setIsAddModalOpen(true);
                            }}
                            title="Redaktə et"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reader)}
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
