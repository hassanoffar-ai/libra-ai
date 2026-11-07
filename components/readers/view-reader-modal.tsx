"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  ArrowUpRight,
  Edit2,
} from "lucide-react";
import { Reader, Loan, getLoans } from "@/services/circulation-service";

interface ViewReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reader: Reader | null;
  onEdit?: (reader: Reader) => void;
}

export function ViewReaderModal({ isOpen, onClose, reader, onEdit }: ViewReaderModalProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  useEffect(() => {
    if (reader && isOpen) {
      getLoans({ readerId: reader.id }).then((data) => setLoans(data));
    }
  }, [reader, isOpen]);

  if (!isOpen || !reader) return null;

  const activeLoans = loans.filter((l) => l.status === "Aktiv" || l.status === "Gecikib");
  const pastLoans = loans.filter((l) => l.status === "Qaytarılıb");
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0 font-bold">
              {reader.firstName.charAt(0)}{reader.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                  {reader.ticketNumber}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    reader.status === "Aktiv"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                      : reader.status === "Borclu"
                      ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                      : "bg-rose-950 text-rose-400 border border-rose-800/50"
                  }`}
                >
                  {reader.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {reader.firstName} {reader.lastName} {reader.fatherName ? `(${reader.fatherName} qızı/oğlu)` : ""}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Reader Info Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Kateqoriya</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {reader.category}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[11px] text-slate-400 block font-medium">Şöbə / Qrup</span>
                <span className="font-semibold text-slate-900 block mt-0.5 truncate">
                  {reader.department}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Kitab Limiti</span>
                <span className="font-semibold text-indigo-700 block mt-0.5">
                  {activeLoans.length} / {reader.maxBookLimit} aktiv
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="font-medium text-slate-800">{reader.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate">{reader.email || "E-poçt qeyd edilməyib"}</span>
              </div>
            </div>

            {reader.notes && (
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 italic">
                Qeyd: {reader.notes}
              </p>
            )}
          </div>

          {/* Tabs: Active Loans vs History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
              <button
                onClick={() => setActiveTab("active")}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-lg transition-colors ${
                  activeTab === "active"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Hazırda Oxucuda Olanlar ({activeLoans.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-lg transition-colors ${
                  activeTab === "history"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Oxu Tarixçəsi ({pastLoans.length})</span>
              </button>
            </div>

            {/* Tab 1: Active Loans */}
            {activeTab === "active" && (
              <div>
                {activeLoans.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 text-center text-slate-400 border border-slate-200">
                    Oxucunun hazırda heç bir aktiv götürülmüş kitabı yoxdur.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeLoans.map((loan) => {
                      const isOverdue = loan.dueDate < today;
                      return (
                        <div
                          key={loan.id}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-mono text-[10px] font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {loan.inventoryNumber}
                              </span>
                              <h5 className="font-bold text-slate-900 truncate">
                                {loan.bookTitle}
                              </h5>
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {loan.bookAuthor}
                            </span>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Verilib: {loan.issueDate}
                            </span>
                            <div className="mt-0.5">
                              {isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  Son tarix: {loan.dueDate} (Gecikir)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  Son tarix: {loan.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Past History */}
            {activeTab === "history" && (
              <div>
                {pastLoans.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 text-center text-slate-400 border border-slate-200">
                    Oxucunun keçmiş oxu qeydi hələ yoxdur.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pastLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {loan.inventoryNumber}
                            </span>
                            <h5 className="font-bold text-slate-800 truncate">
                              {loan.bookTitle}
                            </h5>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {loan.bookAuthor}
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3" />
                            Qaytarılıb: {loan.returnDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <Link
            href={`/verilme?readerId=${reader.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Bu Oxucuya Kitab Ver</span>
          </Link>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(reader);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Redaktə Et
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-2xs transition-colors"
            >
              Bağla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

