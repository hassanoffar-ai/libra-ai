"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Book, deleteBook } from "@/services/books-service";

interface DeleteBookDialogProps {
  isOpen: boolean;
  book: Book | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteBookDialog({ isOpen, book, onClose, onSuccess }: DeleteBookDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !book) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBook(book.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Kitab silinərkən xəta:", err);
    } finally {
      setIsDeleting(false);
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
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">
          Kitabı fonddan silmək istəyirsiniz?
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          <strong className="text-slate-800">"{book.title}"</strong> kitabı və ona aid olan bütün ({book.copiesCount}) fiziki nüsxələr bazadan həmişəlik silinəcəkdir. Bu əməliyyat geri qaytarıla bilməz.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            İmtina
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "Silinir..." : "Bəli, Sil"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

