"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  Search,
  LogOut,
  AlertTriangle,
  Phone,
  Mail,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Bookmark,
  Layers,
  Laptop,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  getLoans,
  Loan,
  getReservations,
  Reservation,
  getReaderByEmail,
  Reader,
  isReaderPending,
  isReaderBlocked,
} from "@/services/circulation-service";

function ReaderPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDeniedAdmin = searchParams.get("denied") === "admin_only";

  const { user, profile, role, isLoading, logout } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [readerRecord, setReaderRecord] = useState<Reader | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // If not logged in, redirect to reader login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      const email = user.email || profile?.email || "";
      Promise.all([
        getLoans().catch(() => []),
        getReservations().catch(() => []),
        email ? getReaderByEmail(email).catch(() => null) : Promise.resolve(null),
      ])
        .then(([allLoans, allReservations, readerData]) => {
          if (readerData) {
            setReaderRecord(readerData);
          }

          // Filter loans for this reader
          const myLoans = allLoans.filter((l) => {
            const matchesEmail = email && l.readerName.toLowerCase().includes(email.toLowerCase());
            const matchesId = readerData && l.readerId === readerData.id;
            const matchesTicket = (readerData?.ticketNumber || profile?.ticketNumber) &&
              l.readerTicket === (readerData?.ticketNumber || profile?.ticketNumber);
            const matchesName = profile?.firstName && l.readerName.toLowerCase().includes(profile.firstName.toLowerCase());
            return matchesEmail || matchesId || matchesTicket || matchesName;
          });
          setLoans(myLoans);

          // Filter reservations for this reader
          const myReservations = allReservations.filter((r) => {
            const matchesEmail = email && r.readerName.toLowerCase().includes(email.toLowerCase());
            const matchesId = readerData && r.readerId === readerData.id;
            const matchesTicket = (readerData?.ticketNumber || profile?.ticketNumber) &&
              r.readerTicket === (readerData?.ticketNumber || profile?.ticketNumber);
            const matchesName = profile?.firstName && r.readerName.toLowerCase().includes(profile.firstName.toLowerCase());
            return matchesEmail || matchesId || matchesTicket || matchesName;
          });
          setReservations(myReservations);
        })
        .finally(() => setIsDataLoading(false));
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

  // Derive reader status & ticket number
  const currentStatus = readerRecord?.status || profile?.status || "pending";
  const isPending = isReaderPending(currentStatus);
  const isBlocked = isReaderBlocked(currentStatus);
  const ticketNumber = readerRecord?.ticketNumber || profile?.ticketNumber || "OX-1045";
  const department = readerRecord?.department || profile?.department || (profile?.category === "Müəllim" ? "Kafedra" : "Tələbə qrupu");

  const activeLoans = loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib");
  const readerCategory = profile?.category === "Müəllim" ? "Müəllim" : "Tələbə";
  const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user.displayName || "Oxucu";

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
            <span className="text-[11px] text-slate-400 leading-tight">Oxucu Şəxsi Portalı</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">
              {fullName}
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold">
              Bilet: {ticketNumber}
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
              <span>Kitabxana idarəetmə panelinə yalnız Administratorlar daxil ola bilər. Oxucu profilinizlə şəxsi portalınıza yönləndirildiniz.</span>
            </div>
          </div>
        )}

        {/* Pending Approval Notice Banner - Requirement 3 */}
        {isPending && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-amber-950 text-xs sm:text-sm flex items-start gap-3.5 shadow-sm animate-in fade-in duration-200">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-bold text-sm text-amber-950">Hesabınız ilkin təsdiq gözləyir</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 text-[10px] font-bold">
                  Təsdiq gözləyir
                </span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Hesabınız ilkin təsdiq gözləyir. Fiziki kitab götürmək üçün kitabxanaya yaxınlaşın.
              </p>
            </div>
          </div>
        )}

        {/* Reader Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 via-purple-50/40 to-transparent rounded-bl-full pointer-events-none -z-0" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5 flex-1">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md ring-4 ring-indigo-50 flex-shrink-0">
                {profile?.firstName?.[0] || fullName?.[0] || "O"}
                {profile?.lastName?.[0] || fullName?.split(" ")?.[1]?.[0] || "X"}
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {/* Role / Category Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                      {readerCategory === "Müəllim" ? (
                        <Briefcase className="w-3.5 h-3.5" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5" />
                      )}
                      <span>Status: {readerCategory}</span>
                    </span>

                    {/* Account Status Badge: Təsdiq gözləyir vs Aktiv vs Bloklanıb */}
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>Təsdiq gözləyir</span>
                      </span>
                    ) : isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3" />
                        <span>Bloklanıb</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktiv</span>
                      </span>
                    )}

                    {/* Ticket Number Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      <span>Bilet №: {ticketNumber}</span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Xoş gəlmisiniz, {fullName}
                  </h1>
                </div>

                {/* Structured Profile Fields: Ad, Soyad, Bilet №, Qrup/Şöbə, E-poçt */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[11px] font-medium">Oxucu Bileti:</span>
                    <span className="font-bold text-indigo-700 text-sm font-mono">{ticketNumber}</span>
                  </div>
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[11px] font-medium">Qrup / Şöbə:</span>
                    <span className="font-bold text-slate-800 text-xs truncate block" title={department}>
                      {department || "—"}
                    </span>
                  </div>
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[11px] font-medium">Telefon:</span>
                    <span className="font-bold text-slate-800 text-xs truncate block">
                      {profile?.phone || readerRecord?.phone || "—"}
                    </span>
                  </div>
                  <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[11px] font-medium">E-poçt ünvanı:</span>
                    <span className="font-medium text-slate-700 text-xs truncate block" title={profile?.email || user.email || ""}>
                      {profile?.email || user.email || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-wrap gap-2.5 flex-shrink-0">
              <Link
                href="/kataloq"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Kitab Fondunu Axtar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Access Cards: Electronic Catalog & Digital Library (Clean 2-Column Grid, No Empty Gaps) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Link
            href="/kataloq"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Elektron Kataloq və Kitab Fondu
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Mərkəzin zəngin kitabxana fondunda olan dərslik və nəşrləri axtarın, rəf yerlərini və mövcudluq sayını öyrənin.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>Kataloqa keçid et</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/e-kitabxana"
            className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4 group-hover:scale-105 transition-transform">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Rəqəmsal Kitabxana və Resurslar
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Elektron dərsliklər, metodiki vəsaitlər və PDF formatında olan rəqəmsal materialları onlayn oxuyun və yükləyin.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
              <span>Rəqəmsal fonda bax</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
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
                Elektron kitab fondundan istədiyiniz kitabı seçib kitabxanaya yaxınlaşaraq bilet nömrənizlə ({ticketNumber}) əldə edə bilərsiniz.
              </p>
              <Link
                href="/kataloq"
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

        {/* Reservation History Section - Requirement 3 */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                <span>Rezervasiya Tarixçəsi</span>
              </h2>
              <p className="text-xs text-slate-500">Növbəyə durduğunuz və təhvil gözləyən kitab rezervasiyaları</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {reservations.length} rezervasiya
            </span>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
                <Bookmark className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-700">Aktiv rezervasiya tapılmadı</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                Kitabxana fondunda hazırda fondda olmayan nəşrləri növbəyə yazılaraq rezerv edə bilərsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{res.bookTitle}</h4>
                    <p className="text-xs text-slate-500">{res.bookAuthor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400">
                        Rezerv tarixi: <span className="font-mono text-slate-600">{res.reservedDate}</span>
                      </span>
                      {res.queuePosition > 0 && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                          Növbə: №{res.queuePosition}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        res.status === "Nüsxə ayrıldı"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : res.status === "Tamamlandı"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : res.status === "Ləğv edildi"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {res.status === "Nüsxə ayrıldı" ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : res.status === "Gözləyir" ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                      <span>{res.status}</span>
                    </span>
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

