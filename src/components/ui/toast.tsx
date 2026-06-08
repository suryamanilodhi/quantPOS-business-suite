"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; type: ToastType; message: string };
type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-3), { id, type, message }]);
    window.setTimeout(() => remove(id), 4500);
  }, [remove]);

  const value = useMemo(() => ({
    toast,
    success: (message: string) => toast(message, "success"),
    error: (message: string) => toast(message, "error"),
    info: (message: string) => toast(message, "info")
  }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[70] grid w-[calc(100vw-2rem)] max-w-sm gap-3 sm:right-6 sm:top-6">
        {toasts.map((item) => <ToastMessage key={item.id} toast={item} onClose={() => remove(item.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

function ToastMessage({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const isError = toast.type === "error";
  const Icon = toast.type === "success" ? CheckCircle2 : isError ? XCircle : Info;
  return (
    <div className={`flex items-start gap-3 rounded-md border bg-white p-3 text-sm shadow-soft ${isError ? "border-red-200 text-danger" : toast.type === "success" ? "border-emerald-200 text-success" : "border-line text-ink"}`}>
      <Icon className="mt-0.5 shrink-0" size={18} />
      <p className="min-w-0 flex-1 break-words font-medium">{toast.message}</p>
      <button type="button" onClick={onClose} className="rounded-md p-1 text-muted hover:bg-slate-100" aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}
