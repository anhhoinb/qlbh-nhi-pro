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

  if (Number.isNaN(date.getTime())) {
    return "---";
  }

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
    return "bg-green-100 text-green-700";
  }

  return "bg-gray-100 text-gray-700";
}

export default function InventoryCheckPage() {
  const [checks, setChecks] = useState<InventoryCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");

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
        String(value || "")
          .toLowerCase()
          .includes(search)
      );
    });
  }, [checks, keyword]);

  return (
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Kiểm hàng
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Tạo phiếu kiểm kho, ghi nhận số lượng thực tế và theo dõi chênh lệch.
            </p>
          </div>

          <Link
            href="/inventory-check/create"
            className="rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white hover:bg-blue-800"
          >
            + Tạo phiếu kiểm
          </Link>
        </div>

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo mã phiếu, người kiểm, kho hoặc trạng thái..."
            className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="p-3 text-left">Mã phiếu</th>
                  <th className="p-3 text-left">Ngày tạo</th>
                  <th className="p-3 text-left">Kho</th>
                  <th className="p-3 text-left">Người kiểm</th>
                  <th className="p-3 text-center">Số sản phẩm</th>
                  <th className="p-3 text-center">Có chênh lệch</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-gray-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredChecks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-gray-500"
                    >
                      Chưa có phiếu kiểm hàng
                    </td>
                  </tr>
                ) : (
                  filteredChecks.map((item) => {
                    const items = item.items || [];
                    const differenceCount = items.filter(
                      (product) =>
                        Number(product.difference || 0) !== 0
                    ).length;

                    return (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3 font-semibold text-blue-700">
                          {item.code || item.id}
                        </td>

                        <td className="p-3">
                          {formatDate(
                            item.createdAt || item.checkedAt
                          )}
                        </td>

                        <td className="p-3">
                          {item.warehouseName || "Kho mặc định"}
                        </td>

                        <td className="p-3">
                          {item.checkedBy || "---"}
                        </td>

                        <td className="p-3 text-center">
                          {items.length}
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`font-semibold ${
                              differenceCount > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {differenceCount}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <Link
                            href={`/inventory-check/${item.id}`}
                            className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
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
    </main>
  );
}