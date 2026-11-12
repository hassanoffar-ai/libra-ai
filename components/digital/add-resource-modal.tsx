"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  Globe,
  Upload,
  Link2,
  File,
  Loader2,
  Check,
} from "lucide-react";
import {
  createDigitalResource,
  updateDigitalResource,
  DigitalResource,
} from "@/services/digital-library-service";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface AddResourceModalProps {
  isOpen: boolean;
  editResource?: DigitalResource | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "İnformasiya Texnologiyaları",
  "Avtomobil Mühəndisliyi",
  "Elektrotexnika və Energetika",
  "Dərslik və Metodiki Vəsait",
  "Bədii Ədəbiyyat",
  "Riyaziyyat və Təbiət Elmləri",
  "İqtisadiyyat və Menecment",
  "Qaynaq və Metal İstehsalı",
  "Turizm və İaşə",
  "Digər",
];

export function AddResourceModal({
  isOpen,
  editResource,
  onClose,
  onSuccess,
}: AddResourceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [format, setFormat] = useState<"PDF" | "EPUB" | "DOCX" | "DOC" | "PPTX" | "XLSX" | string>("PDF");
  const [fileSize, setFileSize] = useState("4.5 MB");
  const [fileUrl, setFileUrl] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Sync state when editing or opening
  useEffect(() => {
    setUploadProgress(null);
    if (editResource) {
      setTitle(editResource.title || "");
      setAuthor(editResource.author || "");
      setCategory(editResource.category || CATEGORIES[0]);
      setFormat(editResource.format || "PDF");
      setFileSize(editResource.fileSize || "4.5 MB");
      setFileUrl(editResource.fileUrl || "");
      setDescription(editResource.description || "");
      setActiveTab(editResource.fileUrl?.startsWith("http") ? "url" : "file");
      setSelectedFile(null);
    } else {
      setTitle("");
      setAuthor("");
      setCategory(CATEGORIES[0]);
      setFormat("PDF");
      setFileSize("4.5 MB");
      setFileUrl("");
      setDescription("");
      setActiveTab("file");
      setSelectedFile(null);
    }
    setError(null);
    setIsSuccess(false);
  }, [editResource, isOpen]);

  if (!isOpen) return null;

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);

    // Auto-detect format
    const ext = file.name.split(".").pop()?.toUpperCase() || "";
    if (ext === "PDF") setFormat("PDF");
    else if (ext === "EPUB") setFormat("EPUB");
    else if (ext === "DOCX") setFormat("DOCX");
    else if (ext === "DOC") setFormat("DOC");
    else if (ext === "PPT" || ext === "PPTX") setFormat("PPTX");
    else if (ext === "XLS" || ext === "XLSX") setFormat("XLSX");

    // Auto-calculate size
    const mb = file.size / (1024 * 1024);
    if (mb >= 1) {
      setFileSize(`${mb.toFixed(1)} MB`);
    } else {
      const kb = file.size / 1024;
      setFileSize(`${kb.toFixed(0)} KB`);
    }

    // Pre-fill title if empty
    if (!title.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ");
      setTitle(cleanName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setError("Başlıq və müəllif sahələri mütləq doldurulmalıdır.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalFileUrl = fileUrl.trim();
      let storagePath = editResource?.storagePath || "";
      let finalFileName = editResource?.fileName || "";

      // If user uploaded a new local file from device
      if (activeTab === "file" && selectedFile) {
        finalFileName = selectedFile.name;
        const sanitized = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        // Store directly under e-library/{timestamp}_{filename} using uploadBytesResumable
        storagePath = `e-library/${Date.now()}_${sanitized}`;
        const storageRef = ref(storage, storagePath);

        setUploadProgress(0);

        try {
          const uploadTask = uploadBytesResumable(storageRef, selectedFile);

          finalFileUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                if (snapshot.totalBytes > 0) {
                  const progress = Math.round(
                    (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                  );
                  setUploadProgress(progress);
                }
              },
              (storageErr) => {
                reject(storageErr);
              },
              async () => {
                try {
                  const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadUrl);
                } catch (urlErr) {
                  reject(urlErr);
                }
              }
            );
          });
        } catch (storageErr: any) {
          console.error("Firebase Storage upload error:", storageErr);
          setUploadProgress(null);
          throw new Error(
            `Fayl Firebase Storage yaddaşına yüklənə bilmədi (${
              storageErr?.message || "İcazə və ya bağlantı xətası"
            }). Zəhmət olmasa internet bağlantınızı yoxlayın və ya 'URL / Keçid' tabından istifadə edin.`
          );
        }
      } else if (activeTab === "url" && !finalFileUrl) {
        throw new Error("Zəhmət olmasa resurs üçün keçid (URL) daxil edin.");
      } else if (!finalFileName && finalFileUrl) {
        const urlBase = finalFileUrl.split("/").pop()?.split("?")[0] || "";
        finalFileName = urlBase || `${title.trim().replace(/\s+/g, "_")}.${format.toLowerCase()}`;
      }

      // STRICT VALIDATION: Ensure NO base64 data URLs or raw blobs enter the database
      if (finalFileUrl.startsWith("data:")) {
        throw new Error("Fayl məzmunu (Base64) birbaşa verilənlər bazasında saxlanıla bilməz. Yalnız yüngül Firebase Storage və ya birbaşa keçid (URL) qəbul edilir.");
      }

      if (editResource) {
        await updateDigitalResource(editResource.id, {
          title: title.trim(),
          author: author.trim(),
          category,
          format,
          fileFormat: format,
          fileSize: fileSize.trim() || "4.0 MB",
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          originalFileName: finalFileName,
          storagePath,
          description: description.trim(),
        });
      } else {
        await createDigitalResource({
          title: title.trim(),
          author: author.trim(),
          category,
          format,
          fileFormat: format,
          fileSize: fileSize.trim() || "4.0 MB",
          fileUrl: finalFileUrl,
          fileName: finalFileName,
          originalFileName: finalFileName,
          storagePath,
          description: description.trim(),
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Resurs yadda saxlanılarkən xəta baş verdi.");
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
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editResource
                  ? "Elektron Resursu Redaktə Et"
                  : "Yeni Elektron Resurs Əlavə Et"}
              </h3>
              <p className="text-xs text-slate-400">
                {editResource
                  ? "Mövcud rəqəmsal vəsaitin məlumatlarını yeniləyin"
                  : "Rəqəmsal dərslik, vəsait və ya elektron kitab yüklənməsi"}
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
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              {editResource ? "Resurs Yeniləndi!" : "Resurs Əlavə Edildi!"}
            </h4>
            <p className="text-xs text-slate-500">
              Məlumatlar uğurla elektron kitabxana bazasında saxlanıldı.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB SELECTOR: Local Device File vs External Link (Requirement 2) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Faylın Mənbəyi
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("file")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "file"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Kompüterdən Yüklə</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "url"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>URL / Keçid Əlavə Et</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Local Device File Picker / Drag and Drop */}
            {activeTab === "file" && (
              <div className="space-y-2">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-indigo-500 bg-indigo-50/50"
                      : selectedFile
                      ? "border-emerald-400 bg-emerald-50/30"
                      : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.epub,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <File className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 break-all">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {fileSize} • {format} formatı müəyyən edildi
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-600 hover:underline mt-1">
                        Faylı dəyişmək üçün klikləyin
                      </span>
                    </div>
                  ) : editResource?.fileUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        Mövcud fayl saxlanılır ({editResource.fileSize})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Yeni fayl seçmək üçün bura klikləyin və ya faylı sürükləyin
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Faylı bura sürükləyin və ya seçmək üçün klikləyin
                      </p>
                      <p className="text-[11px] text-slate-400">
                        PDF, EPUB, DOC, DOCX, PPTX (Format və ölçü avtomatik təyin edilir)
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Progress Bar (Requirement 1) */}
                {uploadProgress !== null && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Fayl Firebase Storage-a yüklənir...</span>
                      </span>
                      <span className="font-mono text-indigo-700 bg-white px-2.5 py-0.5 rounded-md border border-indigo-200 text-xs font-bold shadow-2xs">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-indigo-200/70 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-150 ease-out shadow-xs"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: External Link Input */}
            {activeTab === "url" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faylın Xarici Keçidi (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://example.com/kitab.pdf"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Resursun Adı / Başlığı *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Məs: Veb Proqramlaşdırma Əsasları"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Müəllif(lər) və ya Tərtibçi *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Məs: R. Məmmədov"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Category & Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  İxtisas / Kateqoriya
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fayl Formatı
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800 font-bold"
                >
                  <option value="PDF">PDF Sənədi</option>
                  <option value="EPUB">EPUB E-Kitab</option>
                  <option value="DOCX">Word (.docx)</option>
                  <option value="DOC">Word (.doc)</option>
                  <option value="PPTX">PowerPoint (.pptx)</option>
                  <option value="XLSX">Excel (.xlsx)</option>
                </select>
              </div>
            </div>

            {/* File Size */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Təxmini Fayl Ölçüsü
              </label>
              <input
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="Məs: 4.5 MB"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800 font-mono"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Təsvir / Qısa Qeyd (İxtiyari)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vəsaitin təyinatı və ya laboratoriya işləri haqqında..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-800 resize-none"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                İmtina
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {uploadProgress !== null
                        ? `Yüklənir (${uploadProgress}%)...`
                        : "Yadda saxlanılır..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {editResource ? "Dəyişiklikləri Saxla" : "Resursu Əlavə Et"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
