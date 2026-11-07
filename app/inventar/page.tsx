"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Layers,
  ArrowRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  X,
  Edit,
} from "lucide-react";
import {
  BookCopy,
  getCopies,
  verifyAuditCopy,
  CopyCondition,
  CopyStatus,
} from "@/services/books-service";

export default function InventarPage() {
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Rapid Scan / Input state
  const [scanInput, setScanInput] = useState("");
  const [activeScannedCopy, setActiveScannedCopy] = useState<BookCopy | null>(null);
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);

  // Edit / Update dialog state
  const [newShelfLocation, setNewShelfLocation] = useState("");
  const [newCondition, setNewCondition] = useState<CopyCondition>("Əla");
  const [isChangingShelf, setIsChangingShelf] = useState(false);
  const [isChangingCondition, setIsChangingCondition] = useState(false);

  // Shelf Filter
  const [selectedShelf, setSelectedShelf] = useState<string>("all");
  const [auditFilter, setAuditFilter] = useState<"all" | "verified" | "pending">("all");

  const inputRef = useRef<HTMLInputElement>(null);

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

  // Unique shelf locations
  const shelfList = useMemo(() => {
    const set = new Set<string>();
    copies.forEach((c) => {
      if (c.shelfLocation) set.add(c.shelfLocation);
    });
    return Array.from(set);
  }, [copies]);

  // Handle Search / Keypress Enter on Central Input
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanInput.trim().toUpperCase();
    if (!query) return;

    const found = copies.find(
      (c) => c.inventoryNumber.toUpperCase() === query || c.inventoryNumber.toUpperCase().includes(query)
    );

    if (found) {
      setActiveScannedCopy(found);
      setNewShelfLocation(found.shelfLocation);
      setNewCondition(found.condition);
      setIsChangingShelf(false);
      setIsChangingCondition(false);
      setScanFeedback({
        type: "success",
        text: `Nüsxə tapıldı: ${found.inventoryNumber} - "${found.bookTitle}"`,
      });
    } else {
      setActiveScannedCopy(null);
      setScanFeedback({
        type: "error",
        text: `"${query}" nömrəli nüsxə bazada tapılmadı! Zəhmət olmasa nömrəni dəqiqləşdirin.`,
      });
    }
  };

  // Quick Action: "Rəfdədir / Yoxlandı"
  const handleVerifyInPlace = async (copy: BookCopy) => {
    try {
      const updated = await verifyAuditCopy(copy.id, {
        condition: copy.condition,
        shelfLocation: copy.shelfLocation,
        status: "Fondda",
      });
      setActiveScannedCopy(updated);
      setScanFeedback({
        type: "success",
        text: `"${copy.inventoryNumber}" nüsxəsi təsdiqləndi: Yoxlanılıb və rəfdədir.`,
      });
      setScanInput("");
      inputRef.current?.focus();
      await fetchCopies();
    } catch (err) {
      console.error("Audit təsdiqlənərkən xəta:", err);
    }
  };

  // Quick Action: Save Changed Shelf
  const handleSaveShelf = async (copy: BookCopy) => {
    if (!newShelfLocation.trim()) return;
    try {
      const updated = await verifyAuditCopy(copy.id, {
        shelfLocation: newShelfLocation.trim(),
        condition: copy.condition,
        status: copy.status === "İtmiş" ? "Fondda" : copy.status,
      });
      setActiveScannedCopy(updated);
      setIsChangingShelf(false);
      setScanFeedback({
        type: "success",
        text: `Rəf yeri dəyişdirildi: ${updated.shelfLocation}`,
      });
      await fetchCopies();
    } catch (err) {
      console.error("Rəf yeri yenilənərkən xəta:", err);
    }
  };

  // Quick Action: Save Changed Condition / Mark Lost
  const handleSaveCondition = async (copy: BookCopy, statusOverride?: CopyStatus) => {
    try {
      const updated = await verifyAuditCopy(copy.id, {
        condition: newCondition,
        status: statusOverride || copy.status,
      });
      setActiveScannedCopy(updated);
      setIsChangingCondition(false);
      setScanFeedback({
        type: "warning",
        text: statusOverride === "İtmiş"
          ? `Nüsxə itmiş elan edildi və fond uçotundan çıxarıldı.`
          : `Fiziki vəziyyəti yeniləndi: ${newCondition}`,
      });
      await fetchCopies();
    } catch (err) {
      console.error("Vəziyyət yenilənərkən xəta:", err);
    }
  };

  // Filtered copies for Shelf Audit Table
  const filteredAuditCopies = useMemo(() => {
    return copies.filter((c) => {
      const matchesShelf = selectedShelf === "all" || c.shelfLocation === selectedShelf;
      const isVerified = c.auditStatus === "Yoxlanılıb";
      const matchesAudit =
        auditFilter === "all" ||
        (auditFilter === "verified" && isVerified) ||
        (auditFilter === "pending" && !isVerified);

      return matchesShelf && matchesAudit;
    });
  }, [copies, selectedShelf, auditFilter]);

  // Statistics
  const totalCopiesCount = copies.length;
  const verifiedCount = copies.filter((c) => c.auditStatus === "Yoxlanılıb").length;
  const pendingCount = totalCopiesCount - verifiedCount;
  const repairOrLostCount = copies.filter(
    (c) => c.condition === "Təmirə ehtiyac var" || c.condition === "Yararsız" || c.status === "İtmiş"
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              İnventarlaşdırma və Rəf Yoxlanışı
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
              Dövri Audit
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Fiziki nüsxələrin rəflər üzrə faktiki mövcudluğunun, yerləşməsinin və vəziyyətinin təsdiqi
          </p>
        </div>

        <button
          onClick={fetchCopies}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Məlumatları Yenilə</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Cəmi Nüsxə</span>
          <span className="text-xl font-extrabold text-slate-900">{totalCopiesCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 block uppercase">Yoxlanılıb</span>
          <span className="text-xl font-extrabold text-emerald-700">{verifiedCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 block uppercase">Yoxlama Gözləyir</span>
          <span className="text-xl font-extrabold text-amber-700">{pendingCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 block uppercase">Təmir / İtmiş</span>
          <span className="text-xl font-extrabold text-rose-700">{repairOrLostCount}</span>
        </div>
      </div>

      {/* 2. Sürətli Yoxlama Paneli (Central Keyboard-First Input) */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-5">
        <div className="max-w-xl space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
            Klaviaturadan Sürətli Yoxlama
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            İnventar Nömrəsi ilə Anlıq Yoxlama
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Nüsxənin üzərindəki inventar nömrəsini daxil edib <b>Enter</b> düyməsini basın. Nüsxə dərhal rəfdə təsdiqlənəcək.
          </p>
        </div>

        {/* Central Search Form */}
        <form onSubmit={handleScanSubmit} className="max-w-xl flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="İnventar № daxil edin (Məs: INV-1001)..."
              className="w-full pl-4 pr-10 py-3.5 text-sm sm:text-base bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition-all font-mono font-bold"
            />
            {scanInput && (
              <button
                type="button"
                onClick={() => setScanInput("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 flex-shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Axtar / Yoxla</span>
          </button>
        </form>

        {/* Feedback Banner */}
        {scanFeedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in ${
              scanFeedback.type === "success"
                ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200"
                : scanFeedback.type === "warning"
                ? "bg-amber-500/20 border border-amber-400/40 text-amber-200"
                : "bg-rose-500/20 border border-rose-400/40 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {scanFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{scanFeedback.text}</span>
            </div>
            <button
              onClick={() => setScanFeedback(null)}
              className="p-1 opacity-60 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Scanned Copy Inspection Card */}
        {activeScannedCopy && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                  {activeScannedCopy.inventoryNumber.split("-")[0] || "INV"}
                </div>
                <div>
                  <span className="font-mono font-bold text-indigo-300 text-xs">
                    {activeScannedCopy.inventoryNumber}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {activeScannedCopy.bookTitle}
                  </h3>
                  <p className="text-xs text-slate-300">{activeScannedCopy.bookAuthor}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 font-medium">
                  {activeScannedCopy.shelfLocation}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    activeScannedCopy.auditStatus === "Yoxlanılıb"
                      ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/40"
                      : "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                  }`}
                >
                  {activeScannedCopy.auditStatus === "Yoxlanılıb" ? "✓ Yoxlanılıb" : "Yoxlama gözləyir"}
                </span>
              </div>
            </div>

            {/* In-Place Verification & Adjustment Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Primary: Rəfdədir / Yoxlandı */}
              <button
                type="button"
                onClick={() => handleVerifyInPlace(activeScannedCopy)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Rəfdədir / Yoxlandı</span>
              </button>

              {/* Secondary: Rəf yerini dəyiş */}
              <button
                type="button"
                onClick={() => {
                  setIsChangingShelf(!isChangingShelf);
                  setIsChangingCondition(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold text-xs transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                <span>Rəf yerini dəyiş</span>
              </button>

              {/* Secondary: Fiziki vəziyyəti yenilə */}
              <button
                type="button"
                onClick={() => {
                  setIsChangingCondition(!isChangingCondition);
                  setIsChangingShelf(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold text-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Vəziyyəti yenilə ({activeScannedCopy.condition})</span>
              </button>

              {/* Mark Lost */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${activeScannedCopy.inventoryNumber}" nüsxəsini İTMİŞ elan etmək istəyirsiniz?`)) {
                    handleSaveCondition(activeScannedCopy, "İtmiş");
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 rounded-xl font-semibold text-xs transition-colors ml-auto"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>İtmiş elan et</span>
              </button>
            </div>

            {/* Inline Shelf Location Editor */}
            {isChangingShelf && (
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2 text-xs animate-in fade-in">
                <MapPin className="w-4 h-4 text-indigo-300 flex-shrink-0" />
                <input
                  type="text"
                  value={newShelfLocation}
                  onChange={(e) => setNewShelfLocation(e.target.value)}
                  placeholder="Yeni rəf ünvanı (Məs: Zal 1, Rəf B-2)..."
                  className="flex-1 px-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder-slate-400 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleSaveShelf(activeScannedCopy)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs"
                >
                  Təsdiq et
                </button>
              </div>
            )}

            {/* Inline Condition Editor */}
            {isChangingCondition && (
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2 text-xs animate-in fade-in">
                <span className="text-slate-300 font-medium">Yeni vəziyyət:</span>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value as CopyCondition)}
                  className="px-3 py-1.5 bg-slate-800 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs"
                >
                  <option value="Əla">Əla vəziyyətdə</option>
                  <option value="Yaxşı">Yaxşı vəziyyətdə</option>
                  <option value="Təmirə ehtiyac var">Təmirə ehtiyac var</option>
                  <option value="Yararsız">Yararsız</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleSaveCondition(activeScannedCopy)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs"
                >
                  Yadda saxla
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Rəf üzrə Filtrləmə & Audit Siyahısı */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Rəf Üzrə Faktiki Yoxlama Siyahısı
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seçilmiş rəfdə olmalı olan bütün fiziki nüsxələr və audit nəticələri
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Shelf location filter */}
              <select
                value={selectedShelf}
                onChange={(e) => setSelectedShelf(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
              >
                <option value="all">Bütün Rəflər</option>
                {shelfList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Verification status filter */}
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 font-semibold"
              >
                <option value="all">Bütün audit statusları</option>
                <option value="verified">Yoxlanılıb</option>
                <option value="pending">Gözləyir</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Nüsxələr yüklənir...
          </div>
        ) : filteredAuditCopies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
            Seçilmiş rəf və ya filtrə uyğun nüsxə tapılmadı.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">İnventar №</th>
                    <th className="py-3 px-4">Kitabın Adı və Müəllif</th>
                    <th className="py-3 px-4">Rəf Yeri</th>
                    <th className="py-3 px-4">Fiziki Vəziyyəti</th>
                    <th className="py-3 px-4">Son Yoxlama</th>
                    <th className="py-3 px-4 text-center">Audit Statusu</th>
                    <th className="py-3 px-4 text-right">Təsdiq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditCopies.map((copy) => {
                    const isVerified = copy.auditStatus === "Yoxlanılıb";

                    return (
                      <tr
                        key={copy.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isVerified ? "bg-emerald-50/20" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono font-extrabold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-xs">
                            {copy.inventoryNumber}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 block truncate max-w-xs">
                            {copy.bookTitle}
                          </div>
                          <span className="text-[11px] text-slate-400 block">
                            {copy.bookAuthor}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span>{copy.shelfLocation}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              copy.condition === "Əla"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : copy.condition === "Yaxşı"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {copy.condition}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500">
                          {copy.lastAuditDate || "Yoxlanılmayıb"}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Yoxlanılıb
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Gözləyir
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleVerifyInPlace(copy)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Təsdiqlə</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

