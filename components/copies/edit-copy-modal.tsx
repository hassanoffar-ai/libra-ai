"use client";

import React, { useState, useEffect } from "react";
import { X, Layers, MapPin, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  BookCopy,
  CopyCondition,
  CopyStatus,
  updateCopy,
} from "@/services/books-service";

interface EditCopyModalProps {
  isOpen: boolean;
  copy: BookCopy | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CONDITIONS: CopyCondition[] = ["Əla", "Yaxşı", "Təmirə ehtiyac var", "Yararsız"];
const STATUSES: CopyStatus[] = ["Fondda", "Oxucuda", "Silinib"];

export function EditCopyModal({ isOpen, copy, onClose, onSuccess }: EditCopyModalProps) {
  const [shelfLocation, setShelfLocation] = useState("");
  const [condition, setCondition] = useState<CopyCondition>("Əla");
  const [status, setStatus] = useState<CopyStatus>("Fondda");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (copy) {
      setShelfLocation(copy.shelfLocation || "");
      setCondition(copy.condition || "Əla");
      setStatus(copy.status || "Fondda");
      setIsSuccess(false);
    }
  }, [copy, isOpen]);

  if (!isOpen || !copy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelfLocation.trim()) return;

    setIsSubmitting(true);
    try {
      await updateCopy(copy.id, {
        shelfLocation: shelfLocation.trim(),
        condition,
        status,
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 900);
    } catch (err) {
      console.error("Nüsxə yenilənərkən xəta:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-mono font-bold text-xs">
              INV
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Nüsxəni Redaktə Et
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {copy.inventoryNumber}
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

        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Nüsxə məlumatları yeniləndi!
            </h4>
            <p className="text-xs text-slate-500">
              Rəf ünvanı və fiziki status yadda saxlanıldı.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Book Reference Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-400 font-medium block">Aid olduğu kitab:</span>
              <span className="font-bold text-slate-900 block truncate mt-0.5">
                {copy.bookTitle}
              </span>
              <span className="text-[11px] text-slate-500">{copy.bookAuthor}</span>
            </div>

            {/* Shelf Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rəf Ünvanı (Zal, Rəf, Bölmə) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  placeholder="Məs: Zal 1, Rəf B-4, Bölmə 2"
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-xs"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Physical Condition */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fiziki Vəziyyəti
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as CopyCondition)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-xs"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Inventory Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                İnventar Statusu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CopyStatus)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s} {s === "Fondda" ? "(Mövcuddur)" : s === "Oxucuda" ? "(İstiqrazdadır)" : "(Uçotdan çıxarılıb)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50"
              >
                {isSubmitting ? "Yenilənir..." : "Yadda Saxla"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

