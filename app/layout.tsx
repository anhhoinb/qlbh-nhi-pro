import "./globals.css";

import Sidebar from "@/components/Sidebar";

import AuthGuard from "@/components/AuthGuard";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="vi">

      <body>

        <AuthGuard>

          <div className="flex">

            <Sidebar />

            <main className="flex-1">
              {children}
            </main>

          </div>

        </AuthGuard>

      </body>

    </html>
  );
}