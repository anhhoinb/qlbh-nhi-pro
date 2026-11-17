
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error" | "info" | "warning";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast phải nằm trong ToastProvider");
  }

  return context;
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++nextId.current;

      setToasts((previous) => [
        ...previous.slice(-2),
        { id, message, type },
      ]);

      const timer = setTimeout(() => {
        setToasts((previous) =>
          previous.filter((item) => item.id !== id)
        );
      }, type === "error" ? 4000 : 2500);

      timers.current.push(timer);
    },
    []
  );

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const value: ToastContextType = {
    showToast,
    success: (message) => showToast(message, "success"),
    error: (message) => showToast(message, "error"),
    info: (message) => showToast(message, "info"),
    warning: (message) => showToast(message, "warning"),
  };

  const colors: Record<ToastType, string> = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
  };

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "i",
    warning: "!",
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed left-1/2 top-5 z-[9999] flex w-[calc(100%-24px)] max-w-[600px] -translate-x-1/2 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`${colors[toast.type]} pointer-events-auto flex min-h-[46px] items-center justify-center gap-2 rounded-md px-4 py-3 text-center text-sm font-medium text-white shadow-lg`}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white text-xs font-bold">
              {icons[toast.type]}
            </span>

            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
