"use client";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "@/lib/firebase";

import {
  useRouter,
  usePathname,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {

  const router = useRouter();

  const pathname =
    usePathname();

  const [loading, setLoading] =
    useState(true);

  // các trang không cần login
  const publicRoutes = [
    "/login",
    "/products",
    "/customers",
    "/orders",
  ];

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          // route public
          if (
            publicRoutes.includes(
              pathname
            )
          ) {

            setLoading(false);

            return;
          }

          // chưa login
          if (!user) {

            router.push("/login");

            return;
          }

          setLoading(false);
        }
      );

    return () => unsubscribe();

  }, [pathname]);

  if (loading) {

    return (
      <div className="p-10 text-2xl">
        Đang tải...
      </div>
    );

  }

  return <>{children}</>;
}