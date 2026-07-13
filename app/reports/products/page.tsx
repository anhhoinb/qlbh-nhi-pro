"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderItem = {
  name?: string;
  productName?: string;
  product_name?: string;
  sku?: string;
  code?: string;
  productCode?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  salePrice?: number;
  discount?: number;
  productDiscount?: number;
  vat?: number;
  tax?: number;
  total?: number;
  amount?: number;
};

type OrderData = {
  id: string;
  order_code?: string;
  status?: string;
  createdAt?: any;
  items?: OrderItem[];
};

type ProductReportRow = {
  id: string;
  date: Date | null;
  dateText: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  productMoney: number;
  discount: number;
  tax: number;
  total: number;
};

const FILTER_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "7days", label: "7 ngày qua" },
  { value: "30days", label: "30 ngày qua" },
  { value: "q1", label: "Quý 1" },
  { value: "q2", label: "Quý 2" },
  { value: "q3", label: "Quý 3" },
  { value: "q4", label: "Quý 4" },
  { value: "year", label: "Năm nay" },
  { value: "lastYear", label: "Năm trước" },
  { value: "custom", label: "Tùy chọn" },
];

export default function ProductsReportPage() {
  const [orders, setOrders] =
    useState<OrderData[]>([]);

  const [filterType, setFilterType] =
    useState("7days");

  const [customFrom, setCustomFrom] =
    useState("");

  const [customTo, setCustomTo] =
    useState("");

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 20;

  const formatMoney = (value: any) => {
    return (
      Number(value || 0).toLocaleString("vi-VN") +
      "đ"
    );
  };

  const getDate = (value: any) => {
    if (!value) return null;

    if (value.toDate) {
      return value.toDate();
    }

    if (value.seconds) {
      return new Date(value.seconds * 1000);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const formatDate = (value: any) => {
    const date = getDate(value);

    if (!date) return "---";

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isSameDay = (
    date1: Date,
    date2: Date
  ) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isInQuarter = (
    date: Date,
    quarter: number,
    year: number
  ) => {
    const month = date.getMonth();
    const startMonth = (quarter - 1) * 3;
    const endMonth = startMonth + 2;

    return (
      date.getFullYear() === year &&
      month >= startMonth &&
      month <= endMonth
    );
  };

  const isValidOrder = (order: OrderData) => {
    const status = String(order.status || "").trim().toLowerCase();

    return ![
      "cancelled",
      "đã hủy",
      "da huy",
      "returned",
      "trả hàng",
      "tra hang",
    ].includes(status);
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      if (!isValidOrder(order)) {
        return false;
      }

      const orderDate = getDate(order.createdAt);

      if (!orderDate) return false;

      if (filterType === "today") {
        return isSameDay(orderDate, now);
      }

      if (filterType === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(
          yesterday.getDate() - 1
        );

        return isSameDay(
          orderDate,
          yesterday
        );
      }

      if (filterType === "7days") {
        const start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        return orderDate >= start;
      }

      if (filterType === "30days") {
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);

        return orderDate >= start;
      }

      if (filterType === "q1") {
        return isInQuarter(
          orderDate,
          1,
          now.getFullYear()
        );
      }

      if (filterType === "q2") {
        return isInQuarter(
          orderDate,
          2,
          now.getFullYear()
        );
      }

      if (filterType === "q3") {
        return isInQuarter(
          orderDate,
          3,
          now.getFullYear()
        );
      }

      if (filterType === "q4") {
        return isInQuarter(
          orderDate,
          4,
          now.getFullYear()
        );
      }

      if (filterType === "year") {
        return (
          orderDate.getFullYear() ===
          now.getFullYear()
        );
      }

      if (filterType === "lastYear") {
        return (
          orderDate.getFullYear() ===
          now.getFullYear() - 1
        );
      }

      if (filterType === "custom") {
        if (!customFrom || !customTo) {
          return true;
        }

        const from = new Date(customFrom);
        const to = new Date(customTo);

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        return (
          orderDate >= from &&
          orderDate <= to
        );
      }

      return true;
    });
  }, [
    orders,
    filterType,
    customFrom,
    customTo,
  ]);

  const rows = useMemo(() => {
    const data: ProductReportRow[] = [];

    filteredOrders.forEach((order) => {
      const orderDate = getDate(order.createdAt);

      (order.items || []).forEach(
        (item, index) => {
          const quantity = Number(
            item.quantity || item.qty || 0
          );

          const price = Number(
            item.price || item.salePrice || 0
          );

          const discount = Number(
            item.discount ||
              item.productDiscount ||
              0
          );

          const tax = Number(
            item.vat || item.tax || 0
          );

          const productMoney =
            quantity * price;

          const total = Number(
            item.total ||
              item.amount ||
              productMoney - discount + tax
          );

          data.push({
            id: `${order.id}-${index}`,
            date: orderDate,
            dateText: formatDate(
              order.createdAt
            ),
            productName:
              item.name ||
              item.productName ||
              item.product_name ||
              "---",
            productCode:
              item.sku ||
              item.code ||
              item.productCode ||
              "---",
            quantity,
            price,
            productMoney,
            discount,
            tax,
            total,
          });
        }
      );
    });

    return data.sort((a, b) => {
      const dateA = a.date?.getTime() || 0;
      const dateB = b.date?.getTime() || 0;

      return dateB - dateA;
    });
  }, [filteredOrders]);

  const totalPages = Math.ceil(
    rows.length / itemsPerPage
  );

  const paginatedRows = useMemo(() => {
    const startIndex =
      (currentPage - 1) * itemsPerPage;

    const endIndex =
      startIndex + itemsPerPage;

    return rows.slice(startIndex, endIndex);
  }, [rows, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (
        let i = 1;
        i <= totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    let start = Math.max(
      currentPage - 2,
      1
    );

    let end =
      start + maxButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = end - maxButtons + 1;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages]);

  const summary = useMemo(() => {
    return rows.reduce(
      (result, item) => {
        result.quantity += item.quantity;
        result.productMoney +=
          item.productMoney;
        result.discount += item.discount;
        result.tax += item.tax;
        result.total += item.total;

        return result;
      },
      {
        quantity: 0,
        productMoney: 0,
        discount: 0,
        tax: 0,
        total: 0,
      }
    );
  }, [rows]);

  const exportReport = () => {
    const header = [
      "Ngày",
      "Tên sản phẩm",
      "Mã sản phẩm",
      "Số lượng hàng bán",
      "Tiền hàng",
      "Chiết khấu sản phẩm",
      "Thuế",
      "Thành tiền",
    ];

    const csvRows = rows.map((item) => [
      item.dateText,
      item.productName,
      item.productCode,
      item.quantity,
      item.productMoney,
      item.discount,
      item.tax,
      item.total,
    ]);

    const csvContent = [
      header,
      ...csvRows,
    ]
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(cell).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "bao-cao-thong-ke-san-pham.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const loadOrders = async () => {
    const querySnapshot =
      await getDocs(
        collection(db, "orders")
      );

    const data: OrderData[] = [];

    querySnapshot.forEach((docItem) => {
      data.push({
        id: docItem.id,
        ...docItem.data(),
      } as OrderData);
    });

    setOrders(data);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterType,
    customFrom,
    customTo,
  ]);

  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="max-w-[1700px] mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Báo cáo thống kê sản phẩm
            </h1>

            <p className="text-gray-500 mt-1">
              Chi tiết các sản phẩm bán ra
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value)
              }
              className="border bg-white rounded-xl px-4 py-3 outline-none w-56"
            >
              {FILTER_OPTIONS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            {filterType === "custom" && (
              <>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) =>
                    setCustomFrom(
                      e.target.value
                    )
                  }
                  className="border bg-white rounded-xl px-4 py-3 outline-none"
                />

                <input
                  type="date"
                  value={customTo}
                  onChange={(e) =>
                    setCustomTo(
                      e.target.value
                    )
                  }
                  className="border bg-white rounded-xl px-4 py-3 outline-none"
                />
              </>
            )}

            <button
              type="button"
              onClick={exportReport}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Xuất báo cáo
            </button>

            <button
              type="button"
              onClick={loadOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Tải lại
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Dòng sản phẩm
            </p>

            <p className="text-2xl font-bold text-blue-700 mt-2">
              {rows.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              SL hàng bán
            </p>

            <p className="text-2xl font-bold text-purple-600 mt-2">
              {summary.quantity}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Tiền hàng
            </p>

            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatMoney(
                summary.productMoney
              )}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Chiết khấu
            </p>

            <p className="text-2xl font-bold text-red-600 mt-2">
              {formatMoney(
                summary.discount
              )}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Thành tiền
            </p>

            <p className="text-2xl font-bold text-blue-700 mt-2">
              {formatMoney(summary.total)}
            </p>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Chi tiết sản phẩm bán ra
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Hiển thị{" "}
                {paginatedRows.length} /{" "}
                {rows.length} dòng sản phẩm
              </p>
            </div>

            <p className="text-sm text-gray-500">
              20 dòng / trang
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-4 w-[170px]">
                    Ngày
                  </th>

                  <th className="p-4 text-left min-w-[360px]">
                    Tên sản phẩm
                  </th>

                  <th className="p-4 text-center w-[140px]">
                    SL hàng bán
                  </th>

                  <th className="p-4 text-right w-[170px]">
                    Tiền hàng
                  </th>

                  <th className="p-4 text-right w-[170px]">
                    Chiết khấu SP
                  </th>

                  <th className="p-4 text-right w-[130px]">
                    Thuế
                  </th>

                  <th className="p-4 text-right w-[170px]">
                    Thành tiền
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedRows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 whitespace-nowrap">
                      {item.dateText}
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-gray-900">
                        {item.productName}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        Mã:{" "}
                        {item.productCode ||
                          "---"}
                      </div>
                    </td>

                    <td className="p-4 text-center font-semibold">
                      {item.quantity}
                    </td>

                    <td className="p-4 text-right font-semibold">
                      {formatMoney(
                        item.productMoney
                      )}
                    </td>

                    <td className="p-4 text-right text-red-600 font-semibold">
                      {formatMoney(
                        item.discount
                      )}
                    </td>

                    <td className="p-4 text-right text-orange-600 font-semibold">
                      {formatMoney(item.tax)}
                    </td>

                    <td className="p-4 text-right text-blue-700 font-bold">
                      {formatMoney(item.total)}
                    </td>
                  </tr>
                ))}

                {paginatedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      Không có sản phẩm bán ra phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <div className="p-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-sm text-gray-500">
                Trang {currentPage} /{" "}
                {totalPages || 1}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(page - 1, 1)
                    )
                  }
                  className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>

                {visiblePages[0] > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(1)
                      }
                      className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                    >
                      1
                    </button>

                    <span className="px-2 text-gray-400">
                      ...
                    </span>
                  </>
                )}

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      setCurrentPage(page)
                    }
                    className={`px-4 py-2 rounded-lg border font-semibold ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {visiblePages[
                  visiblePages.length - 1
                ] < totalPages && (
                  <>
                    <span className="px-2 text-gray-400">
                      ...
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage(
                          totalPages
                        )
                      }
                      className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  disabled={
                    currentPage === totalPages
                  }
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(
                        page + 1,
                        totalPages
                      )
                    )
                  }
                  className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}