"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Building,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createReader, generateNextTicketNumber } from "@/services/circulation-service";

export default function ReaderRegisterPage() {
  const router = useRouter();

  // Form states - Hybrid Reader Registration & Librarian Approval
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+994 ");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
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
      errors.email = "Düzgün e-poçt formatı daxil edin (məs: ad.soyad@ldptm.edu.az).";
    }

    if (!department.trim()) {
      errors.department = "Qrup və ya Şöbə qeyd edilməlidir.";
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
      const cleanPhone = phone.trim();
      const cleanDept = department.trim();

      const ticketNumber = await generateNextTicketNumber().catch(
        () => `OX-${Math.floor(1000 + Math.random() * 9000)}`
      );

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: cleanPhone,
          email: email.trim().toLowerCase(),
          department: cleanDept,
          category,
          password,
          confirmPassword,
          ticketNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Qeydiyyat zamanı xəta baş verdi.");
        setIsSubmitting(false);
        return;
      }

      const assignedTicket = data.ticketNumber || ticketNumber;
      await createReader({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        department: cleanDept,
        category,
        role: category === "Müəllim" ? "teacher" : "student",
        accessRole: "reader",
        ticketNumber: assignedTicket,
        password: password,
        status: "pending",
        maxBookLimit: category === "Müəllim" ? 10 : 5,
        notes: "Onlayn qeydiyyatdan keçib (Təsdiq gözləyir)",
      }).catch(console.error);

      setSuccessInfo({
        message: "Qeydiyyat tamamlandı! Hesabınız kitabxanaçı təsdiqindən sonra aktivləşəcək.",
      });

      setTimeout(() => {
        router.push("/?registered=1");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gözlənilməz şəbəkə xətası baş verdi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5FC] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative selection:bg-violet-700 selection:text-white">
      {/* Floating Success Notification */}
      {successInfo && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-[#2E1065] text-white p-4 rounded-xl shadow-2xl border border-violet-500/30 flex items-start gap-3.5">
            <div className="p-2 bg-emerald-500 text-white rounded-lg flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs sm:text-sm font-bold">{successInfo.message}</h4>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-violet-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Giriş səhifəsinə yönləndirilirsiniz...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="w-full max-w-xl my-auto">
          {/* Institutional Brand Header */}
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group focus:outline-none mb-2"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-[#2E1065] via-[#3B0764] to-[#4C1D95] flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 text-[#C4B5FD]" />
              </div>
              <div className="text-left">
                <span className="text-xl font-black tracking-tight text-slate-900 block uppercase">
                  Lənkəran DPTM
                </span>
                <span className="text-xs text-violet-700 font-semibold block">
                  Elektron Kitabxana
                </span>
              </div>
            </Link>

            <h1 className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
              Oxucu Qeydiyyatı
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Kitabxana xidmətlərindən istifadə etmək üçün təhsil və əlaqə məlumatlarınızı daxil edin
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-xl border border-[#E4E0F0] border-t-2 border-violet-800 shadow-sm p-5 sm:p-8 relative">
            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ad & Soyad */}
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
                      placeholder="Məs: Əli"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (fieldErrors.firstName) setFieldErrors({ ...fieldErrors, firstName: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.firstName
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-[#E4E0F0] focus:ring-violet-500/20 focus:border-violet-700"
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
                      placeholder="Məs: Məmmədov"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (fieldErrors.lastName) setFieldErrors({ ...fieldErrors, lastName: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.lastName
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-[#E4E0F0] focus:ring-violet-500/20 focus:border-violet-700"
                      }`}
                    />
                  </div>
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Mobil telefon & E-poçt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobil telefon <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Məs: +994 50 123 45 67"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.phone
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-[#E4E0F0] focus:ring-violet-500/20 focus:border-violet-700"
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
                      placeholder="Məs: ad.soyad@ldptm.edu.az"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                      }}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.email
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-[#E4E0F0] focus:ring-violet-500/20 focus:border-violet-700"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Kateqoriya */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  İstifadəçi kateqoriyası <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory("Tələbə")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs sm:text-sm font-bold transition-all focus:outline-none ${
                      category === "Tələbə"
                        ? "bg-violet-50 border-violet-700 text-violet-950 ring-2 ring-violet-600/20 shadow-xs"
                        : "bg-[#F7F5FC] border-[#E4E0F0] text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 ${category === "Tələbə" ? "text-violet-700" : "text-slate-400"}`} />
                    <span>Tələbə</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory("Müəllim")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs sm:text-sm font-bold transition-all focus:outline-none ${
                      category === "Müəllim"
                        ? "bg-violet-50 border-violet-700 text-violet-950 ring-2 ring-violet-600/20 shadow-xs"
                        : "bg-[#F7F5FC] border-[#E4E0F0] text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 ${category === "Müəllim" ? "text-violet-700" : "text-slate-400"}`} />
                    <span>Müəllim</span>
                  </button>
                </div>
              </div>

              {/* Qrup / Şöbə */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Qrup və ya Şöbə <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={
                      category === "Müəllim"
                        ? "Məs: Kompüter texnologiyaları kafedrası"
                        : "Məs: Qrup 204 və ya Aqronomluq ixtisası"
                    }
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      if (fieldErrors.department) setFieldErrors({ ...fieldErrors, department: "" });
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.department
                        ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                        : "border-[#E4E0F0] focus:ring-violet-500/20 focus:border-violet-700"
                    }`}
                  />
                </div>
                {fieldErrors.department && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.department}</p>
                )}
              </div>

              {/* Şifrə & Təkrarı */}
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
                      className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.password
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-[#E4E0F0] focus:ring-violet-500/20 focus:border-violet-700"
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
                      className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-[#F7F5FC] border rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.confirmPassword
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-[#E4E0F0] focus:ring-violet-500/20 focus:border-violet-700"
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

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !!successInfo}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold text-white bg-violet-700 hover:bg-violet-800 active:bg-violet-900 transition-all shadow-md shadow-violet-900/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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
            <div className="mt-6 pt-5 border-t border-[#E4E0F0] text-center">
              <p className="text-xs sm:text-sm text-slate-500">
                Artıq hesabınız var?{" "}
                <Link
                  href="/"
                  className="font-bold text-violet-700 hover:text-violet-900 transition-colors ml-1 inline-flex items-center gap-1 group"
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
        Peşə Kitabxanası © 2026 • Lənkəran Dövlət Peşə Təhsil Mərkəzi
      </footer>
    </div>
  );
}
