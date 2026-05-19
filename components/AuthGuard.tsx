"use client";

import { ReactNode, useEffect, useState } from "react";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { usePathname, useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";

export default function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const pathname = usePathname();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (!currentUser && pathname !== "/login") {
          router.replace("/login");
        }

        if (currentUser && pathname === "/login") {
          router.replace("/dashboard");
        }
      });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}