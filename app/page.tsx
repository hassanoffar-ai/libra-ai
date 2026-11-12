"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Library,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

function ReaderLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegisteredRedirect = searchParams.get("registered") === "1";

  const { login, user, role, isLoading: isAuthLoading } = useAuth();

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

  // If already logged in, redirect to appropriate area
  useEffect(() => {
    if (!isAuthLoading && user && role) {
      if (role === "admin" || (role as string) === "librarian") {
        router.push("/dashboard");
      } else {
        router.push("/portal");
      }
    }
  }, [user, role, isAuthLoading, router]);

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
      const res = await login(cleanEmail, password, "oxucu");

      if (!res.success) {
        setErrorMessage(res.error || "E-poçt və ya şifrə yanlışdır.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage("Uğurla daxil oldunuz! Yönləndirilirsiniz...");

      setTimeout(() => {
        if (res.role === "admin" || (res.role as string) === "librarian") {
          router.push("/dashboard");
        } else {
          router.push("/portal");
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || "Giriş zamanı gözlənilməz xəta baş verdi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      {/* Decorative ambient gradient backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-indigo-100/70 via-purple-50/40 to-transparent blur-3xl opacity-80" />
      </div>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl">

          {/* Top Institutional Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug max-w-3xl mx-auto">
              Lənkəran Dövlət Peşə Təhsil Mərkəzinin kitabxanasına
              <br className="hidden sm:inline" /> xoş gəlmisiniz.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Peşə Kitabxanası elektron fondu, dərsliklər və oxucu xidmətləri portalı
            </p>
          </div>

          {/* Grid Layout: Building Photo on Left, Login Card on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            
            {/* Left Column: Lənkəran Dövlət Peşə Təhsil Mərkəzi Building Photo */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="h-64 sm:h-80 lg:h-full lg:min-h-[480px] relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl shadow-slate-200/60 group">
                {/* Building Photo */}
                <img
                  src="/ldptm-building.jpg"
                  alt="Lənkəran Dövlət Peşə Təhsil Mərkəzi"
                  className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                {/* Institutional Badge over Image */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
                  <Library className="w-4 h-4 text-indigo-400" />
                  <span>Peşə Kitabxanası</span>
                </div>

                {/* Building Card Bottom Details */}
                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-7 text-white z-10">
                  <span className="inline-block text-[10px] font-bold tracking-widest uppercase text-indigo-300 mb-1">
                    RƏSMİ TƏDRİS VƏ KİTAB FONDU
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-1.5">
                    Lənkəran Dövlət Peşə Təhsil Mərkəzi
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed hidden sm:block">
                    Müasir texniki, bədii və metodiki dərsliklərlə zənginləşdirilmiş rəqəmsal və fiziki kitabxana resursları.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Reader Login Card */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 flex flex-col justify-between h-full relative">
                <div>
                  {/* Card Header */}
                  <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/30">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-base font-bold text-slate-900 leading-none block">
                          Peşə Kitabxanası
                        </span>
                        <span className="text-[11px] text-slate-400 leading-tight">
                          Oxucu şəxsi kabinetinə daxil olun
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback messages */}
                  {errorMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {/* Form */}
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
                          placeholder="ad.soyad@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          className="w-full pl-10 pr-3.5 py-3 sm:py-2.5 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[46px] sm:min-h-0"
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
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          className="w-full pl-10 pr-10 py-3 sm:py-2.5 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[46px] sm:min-h-0"
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

                    {/* Daxil ol düyməsi */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-3 px-4 rounded-xl text-base sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] transition-all shadow-md shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px]"
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
                </div>

                {/* Bottom Section: Hesabınız yoxdur? Qeydiyyatdan keçin */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500">Hesabınız yoxdur?</span>
                  <Link
                    href="/register"
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>Qeydiyyatdan keçin</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 backdrop-blur-xs">
        Peşə Kitabxanası © 2026 • Lənkəran Dövlət Peşə Təhsil Mərkəzi
      </footer>
    </div>
  );
}

export default function ReaderLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Yüklənir...</p>
          </div>
        </div>
      }
    >
      <ReaderLoginForm />
    </Suspense>
  );
}
