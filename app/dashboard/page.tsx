"use client";

import React, { useState, useEffect } from "react";
import { Plus, RefreshCw, Sparkles, BookOpen } from "lucide-react";
import {
  getDashboardData,
  initialZeroDashboardData,
  DashboardData,
} from "@/services/dashboard-service";
import { createBook } from "@/services/books-service";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TurnoverChart } from "@/components/dashboard/turnover-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { ActivityWidget } from "@/components/dashboard/activity-widget";
import { NewBookModal } from "@/components/dashboard/new-book-modal";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(initialZeroDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const loadData = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const result = await getDashboardData();
      setData(result);
      const now = new Date();
      setLastSyncTime(
        now.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error("Dashboard məlumatları yüklənərkən xəta baş verdi:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);

    const handleUpdate = () => loadData(false);
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  // Yeni kitab əlavə edildikdə kitab fonduna daxil edirik və dashboard-u yeniləyirik
  const handleAddNewBook = async (newBook: {
    title: string;
    author: string;
    category: string;
    copies: number;
  }) => {
    try {
      await createBook({
        title: newBook.title,
        author: newBook.author,
        category: newBook.category,
        language: "Azərbaycan",
        initialCopiesCount: newBook.copies,
        initialShelf: "Zal 1, Rəf A-1",
      });
      await loadData();
    } catch (err) {
      console.error("Kitab əlavə edilərkən xəta:", err);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Salam, Administrator!
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Peşə Kitabxanası
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kitabxananın cari vəziyyətinə və dövriyyəsinə ümumi baxış.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            title="Məlumatları yenilə"
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kitab Əlavə Et</span>
          </button>
        </div>
      </div>

      {/* 2. KEY STATISTIC CARDS */}
      <section>
        <StatCards stats={data.stats} />
      </section>

      {/* 3. DATA VISUALIZATION (CHARTS) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TurnoverChart data={data.turnover} />
        </div>
        <div className="lg:col-span-1">
          <CategoryChart data={data.categories} />
        </div>
      </section>

      {/* 4. RECENT ACTIVITY & URGENT ALERTS WIDGETS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsWidget alerts={data.overdueAlerts} />
        <ActivityWidget activities={data.recentActivities} />
      </section>

      {/* Modal: Yeni Kitab Əlavə Et */}
      <NewBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddNewBook}
      />
    </div>
  );
}
