"use client";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "@/lib/firebase";

import {
  useRouter,
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

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {

          if (!user) {

            router.push("/login");

          }

          setLoading(false);
        }
      );

    return () => unsubscribe();

  }, []);

  if (loading) {

    return (
      <div className="p-10 text-2xl">
        Đang kiểm tra đăng nhập...
      </div>
    );

  }

  return <>{children}</>;
}