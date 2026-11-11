"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Library,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ticket,
} from "lucide-react";

export default function ReaderRegisterPage() {
  const router = useRouter();

  // Form states - Requirement 3
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+994 ");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<"Tələbə" | "Müəllim">("Tələbə");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show/Hide toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    ticketNumber?: string;
  } | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setErrorMessage(null);

    if (!firstName.trim() || firstName.trim().length < 2) {
      errors.firstName = "Ad minimum 2 simvoldan ibarət olmalıdır.";
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      errors.lastName = "Soyad minimum 2 simvoldan ibarət olmalıdır.";
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      errors.phone = "Düzgün mobil telefon nömrəsi daxil edin (məs: +994 50 123 45 67).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Düzgün e-poçt formatı daxil edin (məs: ad.soyad@example.com).";
    }

    if (!password || password.length < 6) {
      errors.password = "Şifrə minimum 6 simvol olmalıdır.";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Şifrə və şifrənin təkrarı bir-biri ilə uyğun gəlmir.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          category,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Qeydiyyat zamanı xəta baş verdi.");
        setIsSubmitting(false);
        return;
      }

      setSuccessInfo({
        message: data.message || "Qeydiyyat uğurla tamamlandı! Giriş edə bilərsiniz.",
        ticketNumber: data.ticketNumber,
      });

      // Automatically redirect to login page after 2.5 seconds
      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gözlənilməz şəbəkə xətası baş verdi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative selection:bg-indigo-600 selection:text-white">
      {/* Decorative ambient gradient backdrop */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-100/70 via-purple-50/40 to-transparent blur-3xl opacity-80" />
      </div>

      {/* Floating Success Notification */}
      {successInfo && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-900/95 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-500/30 flex items-start gap-3.5">
            <div className="p-2 bg-emerald-500 text-white rounded-xl flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold">{successInfo.message}</h4>
              {successInfo.ticketNumber && (
                <p className="text-xs text-emerald-200 mt-1">
                  Oxucu Bilet №:{" "}
                  <span className="font-mono font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-400/30">
                    {successInfo.ticketNumber}
                  </span>
                </p>
              )}
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Giriş səhifəsinə yönləndirilirsiniz...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl">

          {/* Brand Header */}
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group focus:outline-none mb-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F172A] via-indigo-950 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-indigo-950/20 group-hover:scale-105 transition-transform duration-200">
                <Library className="w-6 h-6 text-indigo-300" />
              </div>
              <div className="flex items-center gap-1.5 text-left">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-sans">
                  LIBRA
                </span>
                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-md tracking-wider shadow-sm">
                  AI
                </span>
              </div>
            </Link>
            <p className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              Lənkəran Dövlət Peşə Təhsil Mərkəzi
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
              Oxucu Qeydiyyatı
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Kitabxana xidmətlərindən istifadə etmək üçün qeydiyyatdan keçin
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-10 relative">

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* 1. Ad & 2. Soyad (2 sütun) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ad <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Adınız"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (fieldErrors.firstName) setFieldErrors({ ...fieldErrors, firstName: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.firstName
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Soyad <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Soyadınız"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (fieldErrors.lastName) setFieldErrors({ ...fieldErrors, lastName: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.lastName
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* 3. Mobil telefon & 4. E-poçt (2 sütun) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobil telefon nömrəsi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="+994 50 000 00 00"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.phone
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-poçt ünvanı <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="ad.soyad@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.email
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* 5. İstifadəçi kateqoriyası: Tələbə / Müəllim */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  İstifadəçi kateqoriyası <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory("Tələbə")}
                    className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all focus:outline-none ${
                      category === "Tələbə"
                        ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 ${category === "Tələbə" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>Tələbə</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("Müəllim")}
                    className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all focus:outline-none ${
                      category === "Müəllim"
                        ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 ${category === "Müəllim" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>Müəllim</span>
                  </button>
                </div>
              </div>

              {/* 6. Şifrə & 7. Şifrənin təkrarı (2 sütun) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Şifrə <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Min. 6 simvol"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                      }}
                      className={`w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.password
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
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
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Şifrənin təkrarı <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Şifrəni təkrarlayın"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: "" });
                      }}
                      className={`w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.confirmPassword
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showConfirmPassword ? "Şifrəni gizlə" : "Şifrəni göstər"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Primary Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !!successInfo}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-[0.99] transition-all shadow-md shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Qeydiyyat aparılır...</span>
                    </>
                  ) : (
                    <>
                      <span>Qeydiyyatdan keç</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom link: Artıq hesabınız var? Daxil olun */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs sm:text-sm text-slate-500">
                Artıq hesabınız var?{" "}
                <Link
                  href="/"
                  className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-1 inline-flex items-center gap-1 group"
                >
                  <span>Daxil olun</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        LIBRA AI © 2026 • Lənkəran Dövlət Peşə Təhsil Mərkəzi
      </footer>
    </div>
  );
}

