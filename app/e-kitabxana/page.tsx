"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Laptop,
  Plus,
  Search,
  Filter,
  Download,
  BookOpen,
  FileText,
  FileCode,
  Sparkles,
  Layers,
  Calendar,
  X,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  DigitalResource,
  getDigitalResources,
  incrementDownload,
  deleteDigitalResource,
  downloadDigitalResource,
} from "@/services/digital-library-service";
import { AddResourceModal } from "@/components/digital/add-resource-modal";
import { DocumentPreviewModal } from "@/components/digital/document-preview-modal";

export default function EKitabxanaPage() {
  const [resources, setResources] = useState<DigitalResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<DigitalResource | null>(null);
  const [previewResource, setPreviewResource] = useState<DigitalResource | null>(null);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const data = await getDigitalResources();
      setResources(data);
    } catch (err) {
      console.error("Elektron resurslar yüklənərkən xəta:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();

    const handleUpdate = () => fetchResources();
    window.addEventListener("libra-data-updated", handleUpdate);
    return () => window.removeEventListener("libra-data-updated", handleUpdate);
  }, []);

  // Category list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    resources.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [resources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.author.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q));

      const matchesFormat =
        selectedFormat === "all" || r.format === selectedFormat;

      const matchesCategory =
        selectedCategory === "all" || r.category === selectedCategory;

      return matchesSearch && matchesFormat && matchesCategory;
    });
  }, [resources, searchQuery, selectedFormat, selectedCategory]);

  const handleDownloadClick = async (res: DigitalResource) => {
    await downloadDigitalResource(res);
    fetchResources();
  };

  const handleDeleteResource = async (res: DigitalResource) => {
    if (confirm(`"${res.title}" adlı elektron resursu silmək istəyirsiniz?`)) {
      await deleteDigitalResource(res.id);
      fetchResources();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Elektron Kitabxana (E-Kitabxana)
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
              <Laptop className="w-3.5 h-3.5 text-indigo-600" />
              {resources.length} rəqəmsal resurs
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Lənkəran Dövlət Peşə Təhsil Mərkəzinin rəqəmsal dərslik, metodiki vəsait və elektron kitab fondu
          </p>
        </div>

        <button
          onClick={() => {
            setEditingResource(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Elektron Resurs</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Resurs adı, müəllif və ya mövzu axtarın..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          {/* Format filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-semibold text-slate-700"
            >
              <option value="all">Bütün Formatlar</option>
              <option value="PDF">PDF Sənədləri</option>
              <option value="EPUB">EPUB E-Kitablar</option>
              <option value="DOCX">Word (.docx)</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
            >
              <option value="all">Bütün İxtisaslar</option>
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Göstərilən resurs sayı: <strong className="text-slate-800">{filteredResources.length}</strong> / {resources.length}
          </span>
          {(searchQuery || selectedFormat !== "all" || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedFormat("all");
                setSelectedCategory("all");
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              Filtrləri sıfırla
            </button>
          )}
        </div>
      </div>

      {/* 3. Resource Cards Grid or Graceful Empty State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Elektron kitabxana yüklənir...
        </div>
      ) : resources.length === 0 ? (
        /* Empty State: No Digital Resources */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm mb-4">
            <Laptop className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Elektron kitabxanada hələ rəqəmsal resurs yerləşdirilməyib
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
            Mərkəzin tələbələri üçün rəqəmsal dərsliklər, PDF təlimat və laboratoriya vəsaitləri yükləyərək onlayn oxuma və yükləmə imkanı yaradın.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>İlk elektron resursu əlavə et</span>
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        /* Search 0 */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800 mb-1">
            Axtarışa uyğun elektron resurs tapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Açar sözləri dəyişərək və ya tətbiq olunmuş format filtrlərini sıfırlayaraq yenidən yoxlayın.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedFormat("all");
              setSelectedCategory("all");
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            Bütün filtrləri sıfırla
          </button>
        </div>
      ) : (
        /* Resource Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => {
            const isPdf = res.format === "PDF";
            const isEpub = res.format === "EPUB";

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Format & Size Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] tracking-wider ${
                        isPdf
                          ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                          : isEpub
                          ? "bg-violet-50 text-violet-700 border border-violet-200/60"
                          : "bg-blue-50 text-blue-700 border border-blue-200/60"
                      }`}
                    >
                      {res.format} • {res.fileSize}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {res.downloadCount ?? res.downloadsCount ?? 0} endirmə
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div
                      className={`w-10 h-12 rounded-xl flex items-center justify-center shadow-2xs flex-shrink-0 group-hover:scale-105 transition-transform ${
                        isPdf
                          ? "bg-rose-600 text-white"
                          : isEpub
                          ? "bg-violet-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h3
                        onClick={() => setPreviewResource(res)}
                        className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors cursor-pointer"
                        title={res.title}
                      >
                        {res.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{res.author}</p>
                    </div>
                  </div>

                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 mb-2 truncate max-w-full">
                    {res.category}
                  </span>

                  {res.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {res.uploadDate}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Admin Edit & Delete Actions (Requirement 3) */}
                    <div className="flex items-center gap-1 border-r border-slate-200/80 pr-1.5 mr-0.5">
                      <button
                        onClick={() => {
                          setEditingResource(res);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Redaktə et"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(res)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setPreviewResource(res)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                      title="Sənədi daxili oxucu ilə aç"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Oxu / Baxış</span>
                    </button>

                    <button
                      onClick={() => handleDownloadClick(res)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Yüklə"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        editResource={editingResource}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingResource(null);
        }}
        onSuccess={fetchResources}
      />

      {/* Reader Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewResource)}
        resource={previewResource}
        onClose={() => setPreviewResource(null)}
      />
    </div>
  );
}

