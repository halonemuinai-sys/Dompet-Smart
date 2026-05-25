"use client";

import React, { useEffect } from "react";
import { useAppState } from "@/hooks/useAppState";
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from "lucide-react";

export function CustomConfirmAlert() {
  const { confirmState, alertState, hideAlert } = useAppState();

  // Auto-dismiss alert after 3 seconds
  useEffect(() => {
    if (alertState.isOpen) {
      const timer = setTimeout(() => {
        hideAlert();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alertState.isOpen, hideAlert]);

  // Handle ESC key to close confirmation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirmState.isOpen) {
        confirmState.onCancel();
      }
    };
    if (confirmState.isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmState.isOpen, confirmState]);

  return (
    <>
      {/* 1. Custom Alert Banner / Toast (Slides down from top-center) */}
      {alertState.isOpen && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center justify-between gap-4 px-4 py-3 rounded-2xl shadow-xl border animate-slide-down bg-white max-w-sm w-full mx-4 sm:mx-0">
          <div className="flex items-center gap-3">
            {alertState.type === "success" && (
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {alertState.type === "error" && (
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-xl">
                <XCircle className="w-5 h-5" />
              </div>
            )}
            {alertState.type === "info" && (
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Info className="w-5 h-5" />
              </div>
            )}
            <p className="text-xs font-semibold text-slate-700 leading-snug">
              {alertState.message}
            </p>
          </div>
          <button
            onClick={hideAlert}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Custom Confirm Dialog (Slides down from top-center with blurred backdrop) */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
          {/* Blurred Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={confirmState.onCancel}
          />

          {/* Dialog Body (Positioned higher, sliding down beautifully) */}
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl z-10 border border-slate-100 mt-12 sm:mt-24 animate-slide-down">
            <div className="flex items-start gap-4">
              {/* Confirm Icon */}
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmState.type === "danger"
                    ? "bg-rose-50 text-rose-600"
                    : confirmState.type === "warning"
                    ? "bg-amber-50 text-amber-500"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>

              {/* Title & Message */}
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-black text-slate-800 tracking-tight leading-tight">
                  {confirmState.title}
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {confirmState.message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={confirmState.onCancel}
                className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmState.onConfirm}
                className={`px-5 py-2 text-xs font-black text-white rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.02] ${
                  confirmState.type === "danger"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                    : confirmState.type === "warning"
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                }`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
