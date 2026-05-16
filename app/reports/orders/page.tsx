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
  quantity?: number;
  qty?: number;
  price?: number;
  cost?: number;
  importPrice?: number;
  capitalPrice?: number;
  discount?: number;
  vat?: number;
  tax?: number;
};

type OrderData = {
  id: string;
  order_code?: string;
  code?: string;
  status?: string;
  createdAt?: any;
  items?: OrderItem[];

  total?: number;
  grand_total?: number;
  totalAmount?: number;

  cashAmount?: number;
  cash_amount?: number;
  transferAmount?: number;
  transfer_amount?: number;
  cardAmount?: number;
  card_amount?: number;
  codAmount?: number;
  cod_amount?: number;
  remainingAmount?: number;
  remaining_amount?: number;

  paymentMethod?: string;
  payment_method?: string;
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

export default function OrdersReportPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filterType, setFilterType] = useState("7days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
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

  const getOrderDate = (order: OrderData) => {
    return getDate(order.createdAt);
  };

  const isSameDay = (date1: Date, date2: Date) => {
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

  const getOrderCode = (order: OrderData) => {
    return order.order_code || order.code || order.id;
  };

  const getOrderTotal = (order: OrderData) => {
    return Number(
      order.total ||
        order.grand_total ||
        order.totalAmount ||
        0
    );
  };

  const getItemsCount = (order: OrderData) => {
    return (order.items || []).reduce((sum, item) => {
      return sum + Number(item.quantity || item.qty || 0);
    }, 0);
  };

  const getCapitalMoney = (order: OrderData) => {
    return (order.items || []).reduce((sum, item) => {
      const qty = Number(item.quantity || item.qty || 0);
      const cost = Number(
        item.cost ||
          item.importPrice ||
          item.capitalPrice ||
          0
      );

      return sum + qty * cost;
    }, 0);
  };

  const getPaymentMethod = (order: OrderData) => {
    return String(
      order.paymentMethod ||
        order.payment_method ||
        ""
    ).toLowerCase();
  };

  const getCashAmount = (order: OrderData) => {
    const direct = Number(
      order.cashAmount ||
        order.cash_amount ||
        0
    );

    if (direct > 0) return direct;

    const method = getPaymentMethod(order);

    if (
      method.includes("tiền mặt") ||
      method.includes("tien mat") ||
      method === "cash"
    ) {
      return getOrderTotal(order);
    }

    return 0;
  };

  const getTransferAmount = (order: OrderData) => {
    const direct =
      Number(order.transferAmount || order.transfer_amount || 0) +
      Number(order.cardAmount || order.card_amount || 0);

    if (direct > 0) return direct;

    const method = getPaymentMethod(order);

    if (
      method.includes("chuyển khoản") ||
      method.includes("chuyen khoan") ||
      method.includes("thẻ") ||
      method.includes("the") ||
      method.includes("card") ||
      method === "transfer"
    ) {
      return getOrderTotal(order);
    }

    return 0;
  };

  const getCodAmount = (order: OrderData) => {
    const direct = Number(
      order.codAmount ||
        order.cod_amount ||
        0
    );

    if (direct > 0) return direct;

    const method = getPaymentMethod(order);

    if (method.includes("cod")) {
      return getOrderTotal(order);
    }

    return 0;
  };

  const getRemainingAmount = (order: OrderData) => {
    const direct = Number(
      order.remainingAmount ||
        order.remaining_amount ||
        0
    );

    if (direct > 0) return direct;

    const total = getOrderTotal(order);
    const paid =
      getCashAmount(order) +
      getTransferAmount(order) +
      getCodAmount(order);

    return Math.max(total - paid, 0);
  };

  const getStatusText = (status?: string) => {
    if (!status) return "Hoàn thành";

    if (status === "pending") return "Chờ xử lý";
    if (status === "paid") return "Đã thanh toán";
    if (status === "completed") return "Hoàn thành";
    if (status === "cancelled") return "Đã hủy";
    if (status === "returned") return "Trả hàng";

    return status;
  };

  const getStatusClass = (status?: string) => {
    if (status === "cancelled") {
      return "bg-red-100 text-red-600";
    }

    if (status === "pending") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "returned") {
      return "bg-orange-100 text-orange-600";
    }

    return "bg-green-100 text-green-600";
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      const orderDate = getOrderDate(order);

      if (!orderDate) return false;

      if (filterType === "today") {
        return isSameDay(orderDate, now);
      }

      if (filterType === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return isSameDay(orderDate, yesterday);
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
        return isInQuarter(orderDate, 1, now.getFullYear());
      }

      if (filterType === "q2") {
        return isInQuarter(orderDate, 2, now.getFullYear());
      }

      if (filterType === "q3") {
        return isInQuarter(orderDate, 3, now.getFullYear());
      }

      if (filterType === "q4") {
        return isInQuarter(orderDate, 4, now.getFullYear());
      }

      if (filterType === "year") {
        return orderDate.getFullYear() === now.getFullYear();
      }

      if (filterType === "lastYear") {
        return orderDate.getFullYear() === now.getFullYear() - 1;
      }

      if (filterType === "custom") {
        if (!customFrom || !customTo) return true;

        const from = new Date(customFrom);
        const to = new Date(customTo);
        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);

        return orderDate >= from && orderDate <= to;
      }

      return true;
    });
  }, [orders, filterType, customFrom, customTo]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const dateA = getOrderDate(a)?.getTime() || 0;
      const dateB = getOrderDate(b)?.getTime() || 0;

      return dateB - dateA;
    });
  }, [filteredOrders]);

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return sortedOrders.slice(startIndex, endIndex);
  }, [sortedOrders, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    let start = Math.max(currentPage - 2, 1);
    let end = start + maxButtons - 1;

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
    return sortedOrders.reduce(
      (result, order) => {
        result.total += getOrderTotal(order);
        result.cash += getCashAmount(order);
        result.transfer += getTransferAmount(order);
        result.cod += getCodAmount(order);
        result.remaining += getRemainingAmount(order);
        result.capital += getCapitalMoney(order);
        result.items += getItemsCount(order);

        return result;
      },
      {
        total: 0,
        cash: 0,
        transfer: 0,
        cod: 0,
        remaining: 0,
        capital: 0,
        items: 0,
      }
    );
  }, [sortedOrders]);

  const loadOrders = async () => {
    const querySnapshot = await getDocs(collection(db, "orders"));

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
  }, [filterType, customFrom, customTo]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="max-w-[1700px] mx-auto space-y-5">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Toàn bộ đơn hàng
            </h1>

            <p className="text-gray-500 mt-1">
              Báo cáo thống kê theo đơn hàng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border bg-white rounded-xl px-4 py-3 outline-none w-56"
            >
              {FILTER_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            {filterType === "custom" && (
              <>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="border bg-white rounded-xl px-4 py-3 outline-none"
                />

                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="border bg-white rounded-xl px-4 py-3 outline-none"
                />
              </>
            )}

            <button
              type="button"
              onClick={loadOrders}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Tải lại
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">Số đơn hàng</p>
            <p className="text-2xl font-bold text-blue-700 mt-2">
              {sortedOrders.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">Số lượng SP</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {summary.items}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">Doanh số</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatMoney(summary.total)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">Tiền mặt</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatMoney(summary.cash)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">CK / thẻ</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {formatMoney(summary.transfer)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">Tiền vốn</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {formatMoney(summary.capital)}
            </p>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Danh sách đơn hàng
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Hiển thị {paginatedOrders.length} / {sortedOrders.length} đơn hàng phù hợp
              </p>
            </div>

            <p className="text-sm text-gray-500">
              20 dòng / trang
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-4">Ngày</th>
                  <th className="p-4">Mã đơn hàng</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-center">SL sản phẩm</th>
                  <th className="p-4 text-right">Doanh số dự kiến</th>
                  <th className="p-4 text-right">Tiền mặt</th>
                  <th className="p-4 text-right">Chuyển khoản</th>
                  <th className="p-4 text-right">COD</th>
                  <th className="p-4 text-right">Còn lại phải trả</th>
                  <th className="p-4 text-right">Tiền vốn dự kiến</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="p-4 font-bold text-blue-700 whitespace-nowrap">
                      {getOrderCode(order)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>

                    <td className="p-4 text-center font-semibold">
                      {getItemsCount(order)}
                    </td>

                    <td className="p-4 text-right font-semibold">
                      {formatMoney(getOrderTotal(order))}
                    </td>

                    <td className="p-4 text-right text-green-600 font-semibold">
                      {formatMoney(getCashAmount(order))}
                    </td>

                    <td className="p-4 text-right text-blue-600 font-semibold">
                      {formatMoney(getTransferAmount(order))}
                    </td>

                    <td className="p-4 text-right text-orange-600 font-semibold">
                      {formatMoney(getCodAmount(order))}
                    </td>

                    <td className="p-4 text-right text-red-600 font-semibold">
                      {formatMoney(getRemainingAmount(order))}
                    </td>

                    <td className="p-4 text-right font-semibold">
                      {formatMoney(getCapitalMoney(order))}
                    </td>
                  </tr>
                ))}

                {paginatedOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-8 text-center text-gray-500"
                    >
                      Không có đơn hàng phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {sortedOrders.length > 0 && (
            <div className="p-4 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages || 1}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(page - 1, 1))
                  }
                  className="px-4 py-2 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>

                {visiblePages[0] > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                    >
                      1
                    </button>

                    <span className="px-2 text-gray-400">...</span>
                  </>
                )}

                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg border font-semibold ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {visiblePages[visiblePages.length - 1] < totalPages && (
                  <>
                    <span className="px-2 text-gray-400">...</span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(page + 1, totalPages)
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