"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { readerLogin, getStoredReaderSession } from "@/services/reader-auth-service";

function ReaderLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisteredRedirect = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isRegisteredRedirect) {
      setSuccessMessage(
        "Qeydiyyat tamamlandı! Hesabınız kitabxanaçı təsdiqindən sonra aktivləşəcək."
      );
    }
  }, [isRegisteredRedirect]);

  // If already logged in as a Reader, redirect directly to /portal
  useEffect(() => {
    const existingSession = getStoredReaderSession();
    if (existingSession) {
      router.push("/portal");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Zəhmət olmasa e-poçt ünvanınızı daxil edin.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Şifrə minimum 6 simvoldan ibarət olmalıdır.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await readerLogin(cleanEmail, password);

      if (!res.success) {
        setErrorMessage(res.error || "E-poçt və ya şifrə yanlışdır.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Uğurla daxil oldunuz! Oxucu portalına yönləndirilirsiniz...");

      setTimeout(() => {
        router.push("/portal");
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Giriş zamanı gözlənilməz xəta baş verdi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F5FC]">
      {/* LEFT HALF: Institutional Royal Purple Showcase */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-[#2E1065] via-[#3B0764] to-[#4C1D95] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none">
        {/* Subtle geometric line art / architectural decorative grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Ambient velvet glowing orb */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-800/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Institutional LDPTM Official Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white p-1.5 shadow-lg flex items-center justify-center flex-shrink-0">
            <img
              src="/ldptm-logo.png"
              alt="Lənkəran Dövlət Peşə Təhsil Mərkəzi"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white block">
              Lənkəran Dövlət Peşə Təhsil Mərkəzi
            </span>
            <span className="text-[11px] text-[#C4B5FD] font-semibold block">
              Elektron Kitabxana
            </span>
          </div>
        </div>

        {/* Middle: Brand Core Information & LDPTM Building Visual */}
        <div className="relative z-10 my-8 lg:my-auto max-w-lg">
          {/* LDPTM Building Card */}
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-6 group">
            <img
              src="/ldptm-building.jpg"
              alt="Lənkəran Dövlət Peşə Təhsil Mərkəzi"
              className="w-full h-44 sm:h-48 object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2E1065]/90 via-[#2E1065]/30 to-transparent flex items-end p-4">
              <span className="text-xs font-bold text-white tracking-wide">
                Lənkəran Dövlət Peşə Təhsil Mərkəzinin Tədris Binası
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[#DDD6FE] text-xs font-semibold mb-3 backdrop-blur-xs">
            <BookOpen className="w-4 h-4 text-[#C4B5FD]" />
            <span>Elektron Kitabxana və Resurs Portalı</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
            Müasir Təhsil, <br />
            <span className="text-[#C4B5FD]">Zəngin Kitabxana.</span>
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-violet-200/90 leading-relaxed font-normal">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin tələbə və müəllim heyəti üçün fiziki kitab fondu, rəqəmsal dərsliklər və texniki ədəbiyyat bazası.
          </p>

          {/* Quick Stats or Features Pill */}
          <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-white block">Elektron Kataloq</span>
              <span className="text-[11px] text-violet-200/70">Kitab fondu üzrə axtarış</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-white block">Rəqəmsal Resurslar</span>
              <span className="text-[11px] text-violet-200/70">PDF dərslik və tədris vəsaiti</span>
            </div>
          </div>
        </div>

        {/* Bottom: Institutional Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-violet-300/80">
          <span>Lənkəran Dövlət Peşə Təhsil Mərkəzi</span>
          <span>© 2026 Lənkəran DPTM</span>
        </div>
      </div>

      {/* RIGHT HALF: Pure Crisp White Authentication Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white min-h-[520px]">
        <div className="w-full max-w-md">
          {/* Header & Prominent Welcome Text */}
          <div className="mb-8">
            <div className="mb-2 p-2.5 rounded-lg bg-violet-50 border border-violet-100 text-violet-900 text-xs sm:text-sm font-bold">
              Lənkəran Dövlət Peşə Təhsil Mərkəzinin elektron kitabxanasına xoş gəlmisiniz
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              Oxucu Girişi
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Şəxsi kabinetinizə daxil olaraq kitabları sifariş edin və oxu vəziyyətinizi izləyin.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-poçt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                E-poçt ünvanı
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 transition-all min-h-[44px]"
                />
              </div>
            </div>

            {/* Şifrə */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Şifrə
                </label>
                <span className="text-[11px] text-slate-400">Min. 6 simvol</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder=""
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border border-[#E4E0F0] rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-700 transition-all min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Şifrəni gizlə" : "Şifrəni göstər"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button: #6D28D9 Royal Interactive Purple */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold text-white bg-violet-700 hover:bg-violet-800 active:bg-violet-900 transition-all shadow-md shadow-violet-900/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-70 disabled:cursor-not-allowed min-h-[46px] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Daxil olunur...</span>
                  </>
                ) : (
                  <>
                    <span>Daxil ol</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Registration Link */}
          <div className="mt-8 pt-6 border-t border-[#E4E0F0] flex items-center justify-between text-xs">
            <span className="text-slate-500">Hesabınız yoxdur?</span>
            <Link
              href="/register"
              className="font-bold text-violet-700 hover:text-violet-900 transition-colors inline-flex items-center gap-1 group"
            >
              <span>Qeydiyyatdan keçin</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Admin Switch Link */}
          <div className="mt-4 pt-3 text-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-violet-700 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kitabxanaçı və İdarəetmə Paneli Girişi</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReaderLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5FC] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Yüklənir...</p>
          </div>
        </div>
      }
    >
      <ReaderLoginForm />
    </Suspense>
  );
}
