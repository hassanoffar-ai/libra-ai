"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, User, Phone, Mail, Building, Tag, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Reader,
  ReaderCategory,
  ReaderStatus,
  createReader,
  updateReader,
  getReaders,
} from "@/services/circulation-service";

interface AddReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editReader?: Reader | null;
}

const CATEGORIES: ReaderCategory[] = ["Tələbə", "Müəllim", "Əməkdaş"];
const STATUSES: ReaderStatus[] = ["Aktiv", "Borclu", "Bloklanıb"];

export function AddReaderModal({ isOpen, onClose, onSuccess, editReader }: AddReaderModalProps) {
  const isEdit = Boolean(editReader);

  const [ticketNumber, setTicketNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [category, setCategory] = useState<ReaderCategory>("Tələbə");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [maxBookLimit, setMaxBookLimit] = useState(5);
  const [status, setStatus] = useState<ReaderStatus>("Aktiv");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (editReader) {
      setTicketNumber(editReader.ticketNumber);
      setFirstName(editReader.firstName);
      setLastName(editReader.lastName);
      setFatherName(editReader.fatherName || "");
      setCategory(editReader.category);
      setDepartment(editReader.department);
      setPhone(editReader.phone);
      setEmail(editReader.email || "");
      setMaxBookLimit(editReader.maxBookLimit || (editReader.category === "Müəllim" ? 10 : 5));
      setStatus(editReader.status);
      setNotes(editReader.notes || "");
      setErrors({});
      setIsSuccess(false);
    } else if (isOpen) {
      resetForm();
      // Generate next ticket number automatically
      getReaders().then((readers) => {
        const nextNum = 1000 + readers.length + 1;
        setTicketNumber(`OX-${nextNum}`);
      });
    }
  }, [editReader, isOpen]);

  const resetForm = () => {
    setTicketNumber("");
    setFirstName("");
    setLastName("");
    setFatherName("");
    setCategory("Tələbə");
    setDepartment("");
    setPhone("+994 ");
    setEmail("");
    setMaxBookLimit(5);
    setStatus("Aktiv");
    setNotes("");
    setErrors({});
    setIsSuccess(false);
  };

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: ReaderCategory) => {
    setCategory(newCat);
    if (!isEdit) {
      setMaxBookLimit(newCat === "Müəllim" ? 10 : 5);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "Ad tələb olunur";
    if (!lastName.trim()) newErrors.lastName = "Soyad tələb olunur";
    if (!department.trim()) newErrors.department = "Qrup, ixtisas və ya şöbə qeyd edilməlidir";
    if (!phone.trim() || phone.trim() === "+994") newErrors.phone = "Əlaqə nömrəsi daxil edilməlidir";
    if (!ticketNumber.trim()) newErrors.ticketNumber = "Oxucu bilet nömrəsi tələb olunur";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && editReader) {
        await updateReader(editReader.id, {
          ticketNumber: ticketNumber.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fatherName: fatherName.trim(),
          category,
          department: department.trim(),
          phone: phone.trim(),
          email: email.trim(),
          maxBookLimit: Number(maxBookLimit) || 5,
          status,
          notes: notes.trim(),
        });
      } else {
        await createReader({
          ticketNumber: ticketNumber.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fatherName: fatherName.trim(),
          category,
          department: department.trim(),
          phone: phone.trim(),
          email: email.trim(),
          maxBookLimit: Number(maxBookLimit) || 5,
          status: "Aktiv",
          notes: notes.trim(),
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 900);
    } catch (err) {
      console.error("Oxucu saxlanarkən xəta:", err);
      setErrors({ form: "Əməliyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEdit ? "Oxucu Məlumatlarını Redaktə Et" : "Yeni Oxucu Qeydiyyatı"}
              </h3>
              <p className="text-xs text-slate-400">
                Elektron oxucu bileti və şəxsi kartın formalaşdırılması
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              {isEdit ? "Oxucu məlumatları yeniləndi!" : "Oxucu uğurla qeydiyyata alındı!"}
            </h4>
            <p className="text-xs text-slate-500 font-mono">
              Oxucu Bilet №: {ticketNumber}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
            {errors.form && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Ticket & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bilet Nömrəsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                  placeholder="OX-1001"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Oxucu Kateqoriyası
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as ReaderCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name, Surname, Father Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Məs: Rəşad"
                  className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all ${
                    errors.firstName ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Soyadı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Məs: Qasımov"
                  className={`w-full px-3 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all ${
                    errors.lastName ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ata adı
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Məs: İlham"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Department / Group */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Qrup / İxtisas / Şöbə <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Məs: Qrup 204 - Veb Dizayn və Proqram təminatı"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all ${
                    errors.department ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
                  }`}
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Contacts: Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Əlaqə Telefonu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+994 50 123 45 67"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-poçt Ünvanı
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="oxucu@ldptm.edu.az"
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Limit & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Eyni vaxtda kitab limiti
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxBookLimit}
                  onChange={(e) => setMaxBookLimit(parseInt(e.target.value) || 5)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {isEdit && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Oxucu Statusu
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ReaderStatus)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Əlavə Qeydlər
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Oxucu haqqında fərdi qeydlər və ya xüsusi icazələr..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                İmtina
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
              >
                {isSubmitting ? "Saxlanılır..." : isEdit ? "Yenilə" : "Qeydiyyata Al"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

