"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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

export default function ReaderLoginPage() {
  const router = useRouter();
  const { login, user, role, isLoading: isAuthLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect to appropriate area
  useEffect(() => {
    if (!isAuthLoading && user && role) {
      if (role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/reader");
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
        if (res.role === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/reader");
        }
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || "Giriş zamanı gözlənilməz xəta baş verdi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      {/* Background Building Image - Clear, crisp & vivid */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/ldptm-building.jpg"
          alt="Lənkəran Dövlət Peşə Təhsil Mərkəzi"
          className="w-full h-full object-cover object-center"
          style={{
            filter: "contrast(1.05) saturate(1.05)",
          }}
        />
        {/* Soft natural edge vignette so the building stays sharp and vivid */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30" />
      </div>

      {/* Main Container - Centered on top of the background */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="w-full max-w-lg my-auto">

          {/* Center Overlaid Login & Registration Card */}
          <div className="bg-white/95 sm:bg-white/95 backdrop-blur-xl rounded-3xl border border-white/80 shadow-2xl shadow-slate-950/60 p-6 sm:p-8 relative">
            <div>
              {/* Institutional Header & Brand INSIDE Card (Requested by User) */}
              <div className="mb-6 pb-5 border-b border-slate-100 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3 shadow-2xs">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Peşə Kitabxanası</span>
                </div>

                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                  Lənkəran Dövlət Peşə Təhsil Mərkəzinin kitabxanasına xoş gəlmisiniz.
                </h1>
                
                <p className="mt-1.5 text-xs text-slate-500 font-medium">
                  Elektron kitab fondu və oxucu xidmətləri portalı
                </p>
              </div>

              {/* Success Message Banner */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {/* Error Message Banner */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
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

            {/* Qeydiyyatdan keçin keçidi */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
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
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center text-xs text-white/90 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
        Peşə Kitabxanası © 2026 • Lənkəran Dövlət Peşə Təhsil Mərkəzi
      </footer>
    </div>
  );
}
