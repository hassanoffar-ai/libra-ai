"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  GraduationCap,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const { login, user, role, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in as Admin, redirect directly to dashboard
  useEffect(() => {
    const hasLocalAdmin =
      typeof window !== "undefined" &&
      localStorage.getItem("libra_admin_session") === "true";

    if (!isAuthLoading && (user || role === "admin" || hasLocalAdmin)) {
      router.push(redirectTarget);
    }
  }, [user, role, isAuthLoading, redirectTarget, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Zəhmət olmasa administrator e-poçtunu daxil edin.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Şifrə minimum 6 simvoldan ibarət olmalıdır.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(cleanEmail, password, "admin");

      if (!res.success) {
        setErrorMessage(
          res.error || "Giriş icazəsi yoxdur və ya məlumatlar yanlışdır."
        );
        setIsSubmitting(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("libra_admin_session", "true");
        document.cookie =
          "libra_admin_session=true; path=/; max-age=432000; SameSite=Lax";
        document.cookie =
          "libra_role=admin; path=/; max-age=432000; SameSite=Lax";
      }

      setSuccessMessage(
        "Administrator təsdiqləndi! İdarəetmə panelinə yönləndirilirsiniz..."
      );

      setTimeout(() => {
        router.push(redirectTarget);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Giriş zamanı xəta baş verdi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F5FC]">
      {/* LEFT HALF: Institutional Royal Purple Showcase */}
      <div className="lg:w-1/2 relative bg-gradient-to-br from-[#2E1065] via-[#3B0764] to-[#4C1D95] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none">
        {/* Subtle geometric line art / architectural decorative pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="admin-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#admin-grid)" />
          </svg>
        </div>

        {/* Ambient violet orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-900/40 rounded-full blur-3xl pointer-events-none" />

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
              İnzibati İdarəetmə Paneli
            </span>
          </div>
        </div>

        {/* Middle: Admin Institutional Info */}
        <div className="relative z-10 my-10 lg:my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[#DDD6FE] text-xs font-semibold mb-4 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-[#C4B5FD]" />
            <span>Kitabxanaçı və İnzibati İdarəetmə Mərkəzi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            İnzibati Nəzarət və <br />
            <span className="text-[#C4B5FD]">Fond İdarəetməsi.</span>
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-violet-200/90 leading-relaxed font-normal">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin kitabxana fondunun dövriyyəsi, inventar uçotu, oxucu bazası və rəsmi hesabatların formalaşdırılması sistemi.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 pt-6 border-t border-white/10">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-white block">Kitab Dövriyyəsi</span>
              <span className="text-[11px] text-violet-200/70">Təhvil, qaytarma və rezervasiya</span>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-white block">İnventar & Barkod</span>
              <span className="text-[11px] text-violet-200/70">Nüsxə və rəf uçotu</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-violet-300/80">
          <span>Lənkəran Dövlət Peşə Təhsil Mərkəzi</span>
          <span>© 2026 Lənkəran DPTM</span>
        </div>
      </div>

      {/* RIGHT HALF: Pure Crisp White Authentication Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white min-h-[520px]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 text-violet-800 text-[11px] font-bold uppercase tracking-wider mb-2 border border-violet-100">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-700" />
              <span>İdarəetmə Paneli</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kitabxanaçı Girişi
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Fondun idarə edilməsi üçün təyin olunmuş inzibati məlumatları daxil edin.
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-poçt */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin E-poçtu
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

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold text-white bg-violet-700 hover:bg-violet-800 active:bg-violet-900 transition-all shadow-md shadow-violet-900/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-70 disabled:cursor-not-allowed min-h-[46px] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Yoxlanılır...</span>
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

          {/* Return link */}
          <div className="mt-8 pt-6 border-t border-[#E4E0F0] text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-violet-700 transition-colors inline-flex items-center gap-1.5 group font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Oxucu portalına qayıt</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DedicatedAdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F5FC] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-violet-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400">Yüklənir...</p>
          </div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
