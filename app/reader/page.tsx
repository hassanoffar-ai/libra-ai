"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Ticket,
  BookOpen,
  Calendar,
  Clock,
  Search,
  Laptop,
  BookmarkCheck,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { getLoans, Loan } from "@/services/circulation-service";

function ReaderPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDeniedAdmin = searchParams.get("denied") === "admin_only";

  const { user, profile, role, isLoading, logout, updateCategory } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoansLoading, setIsLoansLoading] = useState(true);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);

  // If not logged in, redirect to reader login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      getLoans()
        .then((allLoans) => {
          // Filter loans belonging to current reader (by email or ticket)
          const myLoans = allLoans.filter(
            (l) =>
              (profile?.ticketNumber && l.readerTicket === profile.ticketNumber) ||
              (user.email && l.readerName.toLowerCase().includes(user.email.toLowerCase()))
          );
          setLoans(myLoans);
        })
        .catch(console.error)
        .finally(() => setIsLoansLoading(false));
    }
  }, [user, profile]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Məlumatlar yüklənir...</p>
        </div>
      </div>
    );
  }

  const activeLoans = loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib");

  const handleToggleCategory = async () => {
    const nextCategory: "Tələbə" | "Müəllim" =
      profile?.category === "Müəllim" ? "Tələbə" : "Müəllim";
    setIsUpdatingCategory(true);
    setCategoryFeedback(null);
    try {
      const res = await updateCategory(nextCategory);
      if (res.success) {
        setCategoryFeedback(`Kateqoriyanız "${nextCategory}" olaraq uğurla yeniləndi.`);
        setTimeout(() => setCategoryFeedback(null), 4000);
      } else {
        setCategoryFeedback(res.error || "Xəta baş verdi.");
      }
    } catch {
      setCategoryFeedback("Yeniləmə xətası baş verdi.");
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 leading-none block">
              Peşə Kitabxanası
            </span>
            <span className="text-[11px] text-slate-400 leading-tight">Oxucu Şəxsi Kabineti</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">
              {profile?.firstName} {profile?.lastName}
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold font-mono">
              {profile?.ticketNumber || "OX-1001"}
            </span>
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

        {/* Admin Access Restriction Notice Banner */}
        {isDeniedAdmin && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">İcazə Məhdudiyyəti</span>
              <span>Kitabxana idarəetmə panelinə yalnız Administratorlar daxil ola bilər. Oxucu profilinizlə şəxsi kabinetinizə yönləndirildiniz.</span>
            </div>
          </div>
        )}

        {/* Reader Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 via-purple-50/40 to-transparent rounded-bl-full pointer-events-none -z-0" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md ring-4 ring-indigo-50">
                {profile?.firstName?.[0] || "O"}
                {profile?.lastName?.[0] || "X"}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile?.firstName} {profile?.lastName}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Aktiv Oxucu
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-mono font-bold text-slate-700">
                      Bilet №: {profile?.ticketNumber || "OX-1001"}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                    {profile?.category === "Müəllim" ? (
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span>{profile?.category || "Tələbə"}</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile?.email}</span>
                  </span>
                </div>

                {/* Role/Category Correction Mechanism for existing and new users */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400">Status yanlış qeyd olunub?</span>
                  <button
                    type="button"
                    disabled={isUpdatingCategory}
                    onClick={handleToggleCategory}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isUpdatingCategory ? "animate-spin" : ""}`} />
                    <span>
                      {profile?.category === "Müəllim" ? "Tələbəyə keçir" : "Müəllimə keçir"}
                    </span>
                  </button>
                  {categoryFeedback && (
                    <span className="text-[11px] font-semibold text-emerald-600 animate-in fade-in">
                      ✓ {categoryFeedback}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/reader/kataloq"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Kitab Fondunu Axtar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Service Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/reader/kataloq"
            className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Kitab Fondu və Axtarış
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kitabxana fondunda olan dərslik və nəşrləri axtarın, rəf yerlərini və mövcudluq sayını öyrənin.
            </p>
          </Link>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-3">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Oxucu Bileti
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bilet №: <span className="font-mono font-bold text-slate-800">{profile?.ticketNumber || "OX-1001"}</span>. Kitabxanadan kitab götürərkən bu nömrəni təqdim edin.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
              {profile?.category === "Müəllim" ? (
                <Briefcase className="w-5 h-5" />
              ) : (
                <GraduationCap className="w-5 h-5" />
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Oxucu Kateqoriyası
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cari kateqoriya: <span className="font-bold text-slate-800">{profile?.category || "Tələbə"}</span>. Səhifə yeniləndikdə məlumatınız dəyişmir.
            </p>
          </div>
        </div>

        {/* My Borrowed Books Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Məndə Olan Kitablar</h2>
              <p className="text-xs text-slate-500">Hazırda oxuduğunuz və təhvil verilməli olan kitablar</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeLoans.length} aktiv kitab
            </span>
          </div>

          {activeLoans.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Hazırda borcda kitabınız yoxdur</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Elektron kitab fondundan istədiyiniz kitabı seçib kitabxanaya yaxınlaşaraq biletinizlə əldə edə bilərsiniz.
              </p>
              <Link
                href="/reader/kataloq"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs"
              >
                <span>Fondda Axtarış</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{loan.bookTitle}</h4>
                    <p className="text-xs text-slate-500">{loan.bookAuthor}</p>
                    <span className="inline-block mt-1 font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/50">
                      İnventar: {loan.inventoryNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block">Təhvil tarixi:</span>
                      <span className="font-semibold text-slate-800 font-mono">{loan.dueDate}</span>
                    </div>
                    {loan.status === "Gecikib" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Gecikib
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Clock className="w-3.5 h-3.5" />
                        Oxunur
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ReaderPortalPage() {
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
      <ReaderPortalContent />
    </Suspense>
  );
}
