"use client";

import { useEffect, useState } from "react";

import { checkAdmin }
  from "@/lib/checkAdmin";

export default function AdminPage() {

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const check = async () => {

      const result =
        await checkAdmin();

      setIsAdmin(result);

      setLoading(false);
    };

    check();

  }, []);

  if (loading) {

    return (
      <div className="p-10 text-2xl">
        Đang kiểm tra quyền...
      </div>
    );

  }

  if (!isAdmin) {

    return (
      <div className="p-10 text-red-500 text-3xl font-bold">
        Bạn không có quyền truy cập
      </div>
    );

  }

  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <div className="bg-white rounded-3xl shadow p-10">

        <h1 className="text-5xl font-bold text-blue-700 mb-5">
          ADMIN PANEL
        </h1>

        <p className="text-xl text-gray-600">
          Bạn đang đăng nhập với quyền admin
        </p>

      </div>

    </main>
  );
}