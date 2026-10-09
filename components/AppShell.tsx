"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const hideSidebar =
    pathname.startsWith("/print-order") ||
    pathname.startsWith("/quotations/print") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/login");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen || hideSidebar) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen, hideSidebar]);

  if (hideSidebar) return <>{children}</>;

  return (
    <div className="flex min-h-screen min-w-0 bg-gray-100">
      {/* Desktop: giữ nguyên Sidebar 256px theo bố cục flex ban đầu. */}
      <div className="hidden shrink-0 md:flex">
        <Sidebar />
      </div>

      {/* Mobile: phần nội dung sử dụng toàn bộ chiều rộng màn hình. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-2xl text-slate-800"
          >
            ☰
          </button>
          <span className="text-base font-bold text-sky-700">NhiPro</span>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 h-full w-full bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(85vw,320px)] flex-col overflow-hidden bg-slate-800 shadow-2xl">
            <div className="flex shrink-0 justify-end border-b border-slate-700 p-2">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Đóng menu điều hướng"
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white"
              >
                ✕ Đóng
              </button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto [&>aside]:!min-h-0 [&>aside]:!w-full"
              onClick={(event) => {
                // Chỉ đóng khi nhấn link điều hướng, không đóng khi mở nhóm menu.
                const target = event.target;
                if (target instanceof Element && target.closest("a[href]")) {
                  setMenuOpen(false);
                }
              }}
            >
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
