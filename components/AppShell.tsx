"use client";

import { ReactNode } from "react";

import { usePathname } from "next/navigation";

import Sidebar from "@/components/Sidebar";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const noSidebarPages = [
    "/login",
    "/pos",
  ];

  const isNoSidebarPage =
    noSidebarPages.includes(pathname);

  if (isNoSidebarPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}