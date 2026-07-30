"use client";

import { useRouter } from "next/navigation";

export default function QuotationsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý báo giá
            </h1>

            <p className="mt-1 text-gray-500">
              Tạo và quản lý các bảng báo giá.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/quotations/create")}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            + Tạo báo giá
          </button>
        </div>
      </div>
    </main>
  );
}