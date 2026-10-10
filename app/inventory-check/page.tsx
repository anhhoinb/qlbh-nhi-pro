
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type InventoryCheckItem = {
  productId?: string;
  productName?: string;
  productCode?: string;
  systemStock?: number;
  actualStock?: number;
  difference?: number;
  note?: string;
};

type InventoryCheck = {
  id: string;
  code?: string;
  status?: "draft" | "completed" | "balanced" | string;
  checkedBy?: string;
  warehouseId?: string;
  warehouseName?: string;
  checkedAt?: any;
  createdAt?: any;
  items?: InventoryCheckItem[];
};

function formatDate(value: any) {
  if (!value) return "---";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value?.seconds
      ? new Date(value.seconds * 1000)
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "---";

  return date.toLocaleString("vi-VN");
}

function getStatusLabel(status?: string) {
  if (status === "completed") return "Đã kiểm";
  if (status === "balanced") return "Đã cân bằng kho";
  return "Bản nháp";
}

function getStatusClass(status?: string) {
  if (status === "completed") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "balanced") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatNumber(value?: number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function getDifference(item: InventoryCheckItem) {
  if (
    item.difference !== undefined &&
    item.difference !== null
  ) {
    return Number(item.difference);
  }

  return (
    Number(item.actualStock || 0) -
    Number(item.systemStock || 0)
  );
}

export default function InventoryCheckPage() {
  const [checks, setChecks] = useState<InventoryCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

  const [previewCheck, setPreviewCheck] =
    useState<InventoryCheck | null>(null);

  useEffect(() => {
    const loadChecks = async () => {
      try {
        setLoading(true);

        let snapshot;

        try {
          snapshot = await getDocs(
            query(
              collection(db, "inventory_checks"),
              orderBy("createdAt", "desc")
            )
          );
        } catch {
          snapshot = await getDocs(
            collection(db, "inventory_checks")
          );
        }

        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as InventoryCheck[];

        data.sort((a, b) => {
          const aTime =
            a.createdAt?.seconds ||
            a.checkedAt?.seconds ||
            0;

          const bTime =
            b.createdAt?.seconds ||
            b.checkedAt?.seconds ||
            0;

          return bTime - aTime;
        });

        setChecks(data);
      } catch (error) {
        console.error(error);
        alert("Không tải được danh sách phiếu kiểm hàng");
      } finally {
        setLoading(false);
      }
    };

    loadChecks();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewCheck(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!previewCheck) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewCheck]);

  const filteredChecks = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    if (!search) return checks;

    return checks.filter((item) => {
      const values = [
        item.code,
        item.checkedBy,
        item.warehouseName,
        item.status,
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(search)
      );
    });
  }, [checks, keyword]);

  const renderProductTable = (check: InventoryCheck) => {
    const items = Array.isArray(check.items)
      ? check.items
      : [];

    if (items.length === 0) {
      return (
        <div className="p-6 text-center text-sm text-slate-500">
          Phiếu này chưa có sản phẩm.
        </div>
      );
    }

    return (
      <div className="max-h-[500px] overflow-auto overscroll-contain">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-800 text-white">
            <tr>
              <th className="px-3 py-3 text-left">
                Sản phẩm
              </th>
              <th className="px-3 py-3 text-left">
                Mã SP
              </th>
              <th className="px-3 py-3 text-right">
                Tồn hệ thống
              </th>
              <th className="px-3 py-3 text-right">
                Thực tế
              </th>
              <th className="px-3 py-3 text-right">
                Chênh lệch
              </th>
              <th className="px-3 py-3 text-left">
                Ghi chú
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((product, index) => {
              const difference = getDifference(product);

              return (
                <tr
                  key={`${product.productId || product.productCode || index}-${index}`}
                  className="border-b border-slate-200"
                >
                  <td className="px-3 py-3 font-medium text-slate-800">
                    {product.productName || "---"}
                  </td>

                  <td className="px-3 py-3 text-slate-600">
                    {product.productCode || "---"}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {formatNumber(product.systemStock)}
                  </td>

                  <td className="px-3 py-3 text-right font-semibold">
                    {formatNumber(product.actualStock)}
                  </td>

                  <td
                    className={`px-3 py-3 text-right font-bold ${
                      difference < 0
                        ? "text-rose-600"
                        : difference > 0
                        ? "text-sky-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {difference > 0 ? "+" : ""}
                    {formatNumber(difference)}
                  </td>

                  <td className="px-3 py-3 text-slate-600">
                    {product.note || "---"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-black">
      <div className="w-full max-w-none">
        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Kiểm hàng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Tạo phiếu kiểm kho, ghi nhận số lượng thực tế
              và theo dõi chênh lệch.
            </p>
          </div>

          <Link
            href="/inventory-check/create"
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-center font-semibold text-white transition hover:bg-sky-700"
          >
            + Tạo phiếu kiểm
          </Link>
        </div>

        {/* SEARCH */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            placeholder="Tìm theo mã phiếu, người kiểm, kho hoặc trạng thái..."
            className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">
                    Mã phiếu
                  </th>
                  <th className="px-4 py-3 text-left">
                    Ngày tạo
                  </th>
                  <th className="px-4 py-3 text-left">
                    Kho
                  </th>
                  <th className="px-4 py-3 text-left">
                    Người kiểm
                  </th>
                  <th className="px-4 py-3 text-center">
                    Số sản phẩm
                  </th>
                  <th className="px-4 py-3 text-center">
                    Có chênh lệch
                  </th>
                  <th className="px-4 py-3 text-center">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-center">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredChecks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-slate-500"
                    >
                      Chưa có phiếu kiểm hàng
                    </td>
                  </tr>
                ) : (
                  filteredChecks.map((item) => {
                    const items = Array.isArray(item.items)
                      ? item.items
                      : [];

                    const differenceCount = items.filter(
                      (product) =>
                        getDifference(product) !== 0
                    ).length;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        {/* MÃ PHIẾU - CHỈ CLICK */}
                        <td className="px-4 py-3 font-semibold text-sky-700">
                          <button
                            type="button"
                            onClick={() => setPreviewCheck(item)}
                            className="cursor-pointer text-left font-semibold text-sky-700 hover:text-sky-900 hover:underline"
                            title="Nhấn để xem nhanh phiếu kiểm"
                          >
                            {item.code || item.id}
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          {formatDate(
                            item.createdAt || item.checkedAt
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {item.warehouseName || "Kho mặc định"}
                        </td>

                        <td className="px-4 py-3">
                          {item.checkedBy || "---"}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {items.length}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-semibold ${
                              differenceCount > 0
                                ? "text-rose-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {differenceCount}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/inventory-check/${item.id}`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Xem
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL XEM NHANH - CHỈ CLICK */}
      {previewCheck && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-5">
          <button
            type="button"
            aria-label="Đóng xem nhanh"
            onClick={() => setPreviewCheck(null)}
            className="absolute inset-0 cursor-default"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết phiếu kiểm hàng"
            className="relative z-10 flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-sky-700 sm:text-xl">
                  Phiếu kiểm:{" "}
                  {previewCheck.code || previewCheck.id}
                </h2>

                <div className="mt-1 text-sm text-slate-500">
                  {getStatusLabel(previewCheck.status)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewCheck(null)}
                className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-200"
              >
                ✕ Đóng
              </button>
            </div>

            {/* THÔNG TIN PHIẾU */}
            <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-slate-500">
                  Ngày tạo
                </div>
                <div className="font-semibold">
                  {formatDate(
                    previewCheck.createdAt ||
                      previewCheck.checkedAt
                  )}
                </div>
              </div>

              <div>
                <div className="text-slate-500">
                  Kho
                </div>
                <div className="font-semibold">
                  {previewCheck.warehouseName ||
                    "Kho mặc định"}
                </div>
              </div>

              <div>
                <div className="text-slate-500">
                  Người kiểm
                </div>
                <div className="font-semibold">
                  {previewCheck.checkedBy || "---"}
                </div>
              </div>

              <div>
                <div className="text-slate-500">
                  Số sản phẩm
                </div>
                <div className="font-semibold">
                  {previewCheck.items?.length || 0}
                </div>
              </div>
            </div>

            {/* DANH SÁCH SẢN PHẨM */}
            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                {renderProductTable(previewCheck)}
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setPreviewCheck(null)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>

              <Link
                href={`/inventory-check/${previewCheck.id}`}
                className="rounded-xl bg-sky-600 px-5 py-2.5 text-center font-semibold text-white hover:bg-sky-700"
              >
                Xem chi tiết đầy đủ
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
