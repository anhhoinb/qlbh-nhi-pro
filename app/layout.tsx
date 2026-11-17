
import type { Metadata } from "next";

import "./globals.css";

import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "NhiPro",
  description: "Quản lý bán hàng Nhi Pro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <AuthGuard>
            <AppShell>
              {children}
            </AppShell>
          </AuthGuard>
        </ToastProvider>
      </body>
    </html>
  );
}
