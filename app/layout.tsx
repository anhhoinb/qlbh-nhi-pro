"use client";

import "./globals.css";

import { usePathname } from "next/navigation";

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar =
    pathname === "/pos";

  return (
    <html lang="vi">

      <body>

        <div className="flex">

          {!hideSidebar && <Sidebar />}

          <main className="flex-1">
            {children}
          </main>

        </div>

      </body>

    </html>
  );
}