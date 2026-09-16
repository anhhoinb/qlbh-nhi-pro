"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ReturnRecord = {
  id: string;
  orderId?: string;
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  totalQuantity?: number;
  totalRefund?: number;
  reason?: string;
  restocked?: boolean;
  createdAt?: any;
  items?: any[];
};

export default function ReturnsByOrderPage() {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 20;

  const formatMoney = (value: any) =>
    Number(value || 0).toLocaleString("vi-VN");

  const formatDate = (value: any) => {
    if (!value) return "---";

    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value?.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

    return Number.isNaN(date.getTime())
      ? "---"
      : date.toLocaleString("vi-VN");
  };

  useEffect(() => {
    const loadReturns = async () => {
      try {
        const snapshot = await getDocs(collection(db, "returns"));

        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as ReturnRecord[];

        data.sort((a, b) => {
          const getTime = (value: any) => {
            if (!value) return 0;

            if (typeof value?.toDate === "function") {
              return value.toDate().getTime();
            }

            if (value?.seconds) {
              return value.seconds * 1000;
            }

            const date = new Date(value);

            return Number.isNaN(date.getTime())
              ? 0
              : date.getTime();
          };

          return getTime(b.createdAt) - getTime(a.createdAt);
        });

        setReturns(data);
      } catch (error) {
        console.error(error);
        alert("Không tải được báo cáo trả hàng");
      } finally {
        setLoading(false);
      }
    };

    loadReturns();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (!selectedReturn) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedReturn(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedReturn]);

  const filteredReturns = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return returns;
    }

    return returns.filter((item) =>
      [
        item.orderCode,
        item.customerName,
        item.customerPhone,
        item.reason,
        ...(Array.isArray(item.items)
          ? item.items.flatMap((product: any) => [
              product.productName,
              product.productCode,
            ])
          : []),
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      )
    );
  }, [returns, search]);

  const totalRefund = filteredReturns.reduce(
    (sum, item) => sum + Number(item.totalRefund || 0),
    0
  );

  const totalQuantity = filteredReturns.reduce(
    (sum, item) => sum + Number(item.totalQuantity || 0),
    0
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReturns.length / pageSize)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const currentReturns = filteredReturns.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const visiblePageNumbers = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let startPage = Math.max(1, safeCurrentPage - 2);
    let endPage = startPage + 4;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = totalPages - 4;
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  })();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-black">
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Trả hàng theo đơn hàng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Danh sách các phiếu trả hàng đã phát sinh
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã đơn, khách hàng, số điện thoại, sản phẩm hoặc lý do..."
            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500">
              Phiếu trả hàng
            </div>

            <div className="mt-2 text-3xl font-bold text-sky-700">
              {filteredReturns.length}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500">
              Tổng số lượng trả
            </div>

            <div className="mt-2 text-3xl font-bold text-amber-600">
              {totalQuantity}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500">
              Tổng tiền hoàn
            </div>

            <div className="mt-2 text-3xl font-bold text-rose-600">
              {formatMoney(totalRefund)}đ
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    Thời gian
                  </th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    Mã đơn
                  </th>
                  <th className="px-4 py-3 text-left">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Số lượng trả
                  </th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Tiền hoàn
                  </th>
                  <th className="px-4 py-3 text-left">
                    Lý do
                  </th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">
                    Nhập lại kho
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-10 text-center text-slate-500"
                    >
                      Chưa có dữ liệu trả hàng
                    </td>
                  </tr>
                ) : (
                  currentReturns.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedReturn(item)}
                      className="border-b border-slate-200 hover:bg-sky-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-4 py-3 font-bold text-sky-700 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedReturn(item);
                          }}
                          className="hover:underline"
                        >
                          {item.orderCode || "---"}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {item.customerName || "Khách lẻ"}
                        </div>

                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.customerPhone || ""}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {Number(item.totalQuantity || 0)}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                        {formatMoney(item.totalRefund)}đ
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {item.reason || "---"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.restocked
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.restocked ? "Có" : "Không"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredReturns.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Hiển thị{" "}
                <span className="font-semibold text-slate-700">
                  {(safeCurrentPage - 1) * pageSize + 1}
                </span>
                {" - "}
                <span className="font-semibold text-slate-700">
                  {Math.min(
                    safeCurrentPage * pageSize,
                    filteredReturns.length
                  )}
                </span>
                {" / "}
                <span className="font-semibold text-slate-700">
                  {filteredReturns.length}
                </span>{" "}
                phiếu trả hàng
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                >
                  Trước
                </button>

                {visiblePageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold ${
                      safeCurrentPage === page
                        ? "bg-sky-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPages, prev + 1)
                    )
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedReturn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReturn(null);
            }
          }}
        >
          <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Chi tiết phiếu trả hàng
                </h2>
                <div className="mt-1 text-sm text-slate-500">
                  Mã đơn:{" "}
                  <span className="font-bold text-sky-700">
                    {selectedReturn.orderCode || "---"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-xl font-bold text-slate-600 hover:bg-slate-300"
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="max-h-[82vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Thời gian trả
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {formatDate(selectedReturn.createdAt)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Khách hàng
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {selectedReturn.customerName || "Khách lẻ"}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {selectedReturn.customerPhone || "---"}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs font-semibold uppercase text-amber-700">
                    Tổng số lượng trả
                  </div>
                  <div className="mt-1 text-2xl font-bold text-amber-700">
                    {Number(selectedReturn.totalQuantity || 0)}
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-xs font-semibold uppercase text-rose-700">
                    Tổng tiền hoàn
                  </div>
                  <div className="mt-1 text-2xl font-bold text-rose-600">
                    {formatMoney(selectedReturn.totalRefund)}đ
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Lý do trả hàng
                  </div>
                  <div className="mt-1 font-medium text-slate-800">
                    {selectedReturn.reason || "---"}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Nhập lại kho
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                        selectedReturn.restocked
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedReturn.restocked
                        ? "Có - đã nhập lại kho"
                        : "Không nhập lại kho"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-800 px-5 py-3 text-base font-bold text-white">
                  Sản phẩm đã trả
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left w-16">
                          STT
                        </th>
                        <th className="px-4 py-3 text-left">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-left">
                          Mã SP
                        </th>
                        <th className="px-4 py-3 text-right">
                          SL trả
                        </th>
                        <th className="px-4 py-3 text-left">
                          Đơn vị
                        </th>
                        <th className="px-4 py-3 text-right">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-right">
                          VAT
                        </th>
                        <th className="px-4 py-3 text-right">
                          Tiền hoàn
                        </th>
                        <th className="px-4 py-3 text-center">
                          Về kho
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {Array.isArray(selectedReturn.items) &&
                      selectedReturn.items.length > 0 ? (
                        selectedReturn.items.map(
                          (product: any, index: number) => (
                            <tr
                              key={`${product.productId || product.itemIndex || "product"}-${index}`}
                              className="border-t border-slate-100"
                            >
                              <td className="px-4 py-3">
                                {index + 1}
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-900">
                                {product.productName || "---"}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {product.productCode || "---"}
                              </td>

                              <td className="px-4 py-3 text-right font-bold text-amber-700">
                                {Number(product.quantity || 0)}
                              </td>

                              <td className="px-4 py-3">
                                {product.unit || "---"}
                              </td>

                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {formatMoney(product.unitPrice)}đ
                              </td>

                              <td className="px-4 py-3 text-right">
                                {Number(product.vatRate || 0)}%
                              </td>

                              <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                                {formatMoney(product.lineRefund)}đ
                              </td>

                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                                    product.restocked
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {product.restocked ? "Có" : "Không"}
                                </span>
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-8 text-center text-slate-500"
                          >
                            Phiếu trả này chưa có chi tiết sản phẩm
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="text-xs text-slate-500">
                Có thể nhấn ESC để đóng
              </div>

              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 font-semibold text-white hover:bg-slate-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
