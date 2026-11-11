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
  Ticket,
  Sparkles,
  Loader2,
} from "lucide-react";
import { registerReader } from "@/services/auth-service";
import { ReaderCategory } from "@/services/circulation-service";

export default function RegisterPage() {
  const router = useRouter();

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+994 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [category, setCategory] = useState<ReaderCategory>("Tələbə");
  const [department, setDepartment] = useState("");

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{
    ticketNumber: string;
    message: string;
  } | null>(null);

  // Client-side quick validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      errors.fullName = "Ad və Soyad ən azı 3 simvoldan ibarət olmalıdır.";
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 9) {
      errors.phone = "Düzgün əlaqə nömrəsi daxil edin (məs: +994 50 123 45 67).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = "Düzgün e-poçt formatı daxil edin (məs: oxucu@libra.az).";
    }

    if (!password || password.length < 6) {
      errors.password = "Şifrə minimum 6 simvol olmalıdır.";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Şifrə və şifrənin təkrarı eyni olmalıdır.";
    }

    if (!department.trim()) {
      errors.department =
        category === "Tələbə"
          ? "Qrup və ya İxtisas sahəsini qeyd edin."
          : "Kafedra və ya Şöbə sahəsini qeyd edin.";
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
      const res = await registerReader({
        fullName,
        phone,
        email,
        password,
        confirmPassword,
        category,
        department,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Qeydiyyat zamanı xəta baş verdi.");
        setIsSubmitting(false);
        return;
      }

      // Success toast & information
      setSuccessInfo({
        ticketNumber: res.ticketNumber || "OX-1001",
        message: res.message || "Qeydiyyat uğurla tamamlandı! Giriş edə bilərsiniz",
      });

      // Automatically redirect after 2.5 seconds
      setTimeout(() => {
        router.push("/auth/login?registered=1");
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gözlənilməz xəta baş verdi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative platform ambient gradient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/60 via-purple-50/30 to-transparent pointer-events-none -z-10" />

      {/* Floating Success Toast Notification */}
      {successInfo && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-900/95 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-500/30 flex items-start gap-3.5">
            <div className="p-2 bg-emerald-500 text-white rounded-xl flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold">{successInfo.message}</h4>
              <p className="text-xs text-emerald-200 mt-1">
                Sizə təyin edilmiş Oxucu Bilet №:{" "}
                <span className="font-mono font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded border border-emerald-400/30">
                  {successInfo.ticketNumber}
                </span>
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Giriş səhifəsinə yönləndirilirsiniz...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F172A] via-indigo-900 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-950/20 group-hover:scale-105 transition-transform duration-200">
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
        <p className="mt-2 text-xs font-semibold text-indigo-600 tracking-wide uppercase">
          Lənkəran Dövlət Peşə Təhsil Mərkəzi
        </p>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">
          Oxucu Qeydiyyatı
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Kitabxana fonduna və elektron resurslara çıxış üçün hesab yaradın
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-200/80 relative">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ad və Soyad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ad və Soyad <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Məs: Rəşad Qasımov"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: "" });
                  }}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.fullName
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Əlaqə nömrəsi & E-poçt (2 sütun) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Əlaqə nömrəsi <span className="text-rose-500">*</span>
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
                    placeholder="oxucu@libra.az"
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

            {/* Oxucu Tipi Seçimi (Tələbə / Müəllim) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Oxucu tipi <span className="text-rose-500">*</span>
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
                    category === "Müəllim" || category === "Əməkdaş"
                      ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 ring-2 ring-indigo-600/20 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Briefcase className={`w-4 h-4 ${category === "Müəllim" ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>Müəllim / Əməkdaş</span>
                </button>
              </div>
            </div>

            {/* Qrup / İxtisas və ya Kafedra */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {category === "Tələbə" ? "Qrup / İxtisas Sahəsi" : "Kafedra / Şöbə"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={
                  category === "Tələbə"
                    ? "Məs: V-102 Kompüter sistemləri və kompleksləri"
                    : "Məs: İnformasiya texnologiyaları kafedrası"
                }
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (fieldErrors.department) setFieldErrors({ ...fieldErrors, department: "" });
                }}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.department
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                }`}
              />
              {fieldErrors.department && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.department}</p>
              )}
            </div>

            {/* Şifrə & Şifrənin Təkrarı (2 sütun) */}
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

            {/* Info notice: Automatic ticket number */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Ticket className="w-4 h-4" />
              </div>
              <p className="leading-relaxed">
                Qeydiyyat tamamlandıqda sizə unikal{" "}
                <span className="font-bold text-indigo-700">Oxucu Bilet Nömrəsi (OX-XXXX)</span>{" "}
                təyin olunacaq və giriş üçün istifadə edilə biləcək.
              </p>
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

          {/* Bottom link: Already have an account? */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs sm:text-sm text-slate-500">
              Artıq hesabınız var?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-1 inline-flex items-center gap-0.5 group"
              >
                <span>Daxil olun</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-400">
          LIBRA AI © 2026 • Lənkəran Dövlət Peşə Təhsil Mərkəzi
        </p>
      </div>
    </div>
  );
}

