"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Quotation = {
  id: string;
  quotationCode?: string;
  quotation_code?: string;
  quotationDate?: string;
  createdAt?: any;
  updatedAt?: any;
  buyer?: {
    companyName?: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };
  subtotal?: number;
  vatAmount?: number;
  total?: number;
  status?: string;
  items?: unknown[];
};

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: unknown) {
  return toNumber(value).toLocaleString("vi-VN");
}

function formatDate(value: any, fallback?: string) {
  if (value) {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value?.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("vi-VN");
    }
  }

  if (fallback) {
    const date = new Date(`${fallback}T00:00:00`);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("vi-VN");
    }
  }

  return "---";
}

function getQuotationCode(item: Quotation) {
  return item.quotationCode || item.quotation_code || item.id;
}

function getStatusLabel(status?: string) {
  if (status === "confirmed") return "Đã xác nhận";
  if (status === "cancelled") return "Đã hủy";
  return "Bản nháp";
}

function getStatusClass(status?: string) {
  if (status === "confirmed") {
    return "bg-green-100 text-green-700";
  }

  if (status === "cancelled") {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

export default function QuotationsPage() {
  const router = useRouter();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");

  const loadQuotations = async () => {
    try {
      setLoading(true);

      let snapshot;

      try {
        snapshot = await getDocs(
          query(
            collection(db, "quotations"),
            orderBy("createdAt", "desc")
          )
        );
      } catch {
        snapshot = await getDocs(collection(db, "quotations"));
      }

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Quotation[];

      data.sort((a, b) => {
        const aTime =
          a.createdAt?.seconds ||
          a.updatedAt?.seconds ||
          0;

        const bTime =
          b.createdAt?.seconds ||
          b.updatedAt?.seconds ||
          0;

        return bTime - aTime;
      });

      setQuotations(data);
    } catch (error) {
      console.error(error);
      alert("Không tải được danh sách báo giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const filteredQuotations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return quotations;
    }

    return quotations.filter((item) => {
      const values = [
        getQuotationCode(item),
        item.buyer?.companyName,
        item.buyer?.contactName,
        item.buyer?.phone,
        item.buyer?.email,
        item.status,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [quotations, search]);

  const deleteQuotation = async (item: Quotation) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa báo giá ${getQuotationCode(item)} không?\n\nThao tác này không thể hoàn tác.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      await deleteDoc(doc(db, "quotations", item.id));

      setQuotations((prev) =>
        prev.filter((quotation) => quotation.id !== item.id)
      );

      alert("Đã xóa báo giá");
    } catch (error) {
      console.error(error);
      alert("Không xóa được báo giá");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Quản lý báo giá
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Xem lại, in lại và quản lý các bảng báo giá đã lưu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/quotations/create")}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            + Tạo báo giá
          </button>
        </div>

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã báo giá, tên công ty, số điện thoại hoặc email..."
            className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="p-3 text-left">Mã báo giá</th>
                  <th className="p-3 text-left">Ngày tạo</th>
                  <th className="p-3 text-left">Khách hàng</th>
                  <th className="p-3 text-center">Số sản phẩm</th>
                  <th className="p-3 text-right">Tiền hàng</th>
                  <th className="p-3 text-right">VAT</th>
                  <th className="p-3 text-right">Tổng cộng</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-10 text-center text-gray-500"
                    >
                      Đang tải danh sách báo giá...
                    </td>
                  </tr>
                ) : filteredQuotations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-10 text-center text-gray-500"
                    >
                      Chưa có báo giá nào
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3 font-semibold text-blue-700">
                        {getQuotationCode(item)}
                      </td>

                      <td className="p-3">
                        {formatDate(
                          item.createdAt || item.updatedAt,
                          item.quotationDate
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold">
                          {item.buyer?.companyName || "---"}
                        </div>

                        {(item.buyer?.phone || item.buyer?.email) && (
                          <div className="mt-1 text-xs text-gray-500">
                            {[item.buyer?.phone, item.buyer?.email]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {item.items?.length || 0}
                      </td>

                      <td className="p-3 text-right">
                        {formatMoney(item.subtotal)}đ
                      </td>

                      <td className="p-3 text-right">
                        {formatMoney(item.vatAmount)}đ
                      </td>

                      <td className="p-3 text-right font-bold text-red-600">
                        {formatMoney(item.total)}đ
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

                      <td className="p-3">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/quotations/print?id=${encodeURIComponent(
                                  item.id
                                )}`,
                                "_blank"
                              )
                            }
                            className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Xem
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/quotations/print?id=${encodeURIComponent(
                                  item.id
                                )}&print=1`,
                                "_blank"
                              )
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            In lại
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => deleteQuotation(item)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            {deletingId === item.id
                              ? "Đang xóa..."
                              : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Tổng số báo giá:{" "}
          <strong>{filteredQuotations.length}</strong>
        </div>
      </div>
    </main>
  );
}