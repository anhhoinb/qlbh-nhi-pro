"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  sellPrice?: number;
  sellprice?: number;
  cost?: number;
  importPrice?: number;
  importprice?: number;
  capitalPrice?: number;
  capital_price?: number;
  curprice?: number;
  discount?: number;
  vat?: number;
  tax?: number;
};

type PaymentItem = {
  method?: string;
  type?: string;
  paymentMethod?: string;
  payment_method?: string;
  methodText?: string;
  paymentMethodText?: string;
  label?: string;
  name?: string;
  amount?: number;
  value?: number;
  money?: number;
  total?: number;
};

type SplitPayment = {
  cash?: number;
  bank?: number;
  transfer?: number;
  card?: number;
  cod?: number;
};

type OrderData = {
  id: string;

  orderCode?: string;
  order_code?: string;
  code?: string;

  status?: string;
  createdAt?: any;

  items?: OrderItem[];
  list?: OrderItem[];

  total?: number;
  grand_total?: number;
  totalAmount?: number;
  total_amount?: number;
  finalTotal?: number;
  final_total?: number;
  subtotal?: number;

  paidAmount?: number;
  paid_amount?: number;
  amountPaid?: number;
  amount_paid?: number;
  totalPaid?: number;
  total_paid?: number;

  cashAmount?: number;
  cash_amount?: number;
  cashPaid?: number;
  cash_paid?: number;
  paidCash?: number;
  paid_cash?: number;
  moneyCash?: number;
  money_cash?: number;

  transferAmount?: number;
  transfer_amount?: number;
  bankAmount?: number;
  bank_amount?: number;
  bankPaid?: number;
  bank_paid?: number;
  paidBank?: number;
  paid_bank?: number;
  moneyBank?: number;
  money_bank?: number;

  cardAmount?: number;
  card_amount?: number;

  codAmount?: number;
  cod_amount?: number;

  customerPay?: number;
  customer_pay?: number;

  remainingAmount?: number;
  remaining_amount?: number;
  debtAmount?: number;
  debt_amount?: number;

  paymentMethod?: string;
  payment_method?: string;
  paymentType?: string;
  payment_type?: string;
  paymentMethodText?: string;
  payment_method_text?: string;

  splitPayment?: SplitPayment;
  split_payment?: SplitPayment;

  payments?: PaymentItem[];

  customer?: any;
  customerName?: string;
  customerPhone?: string;
  customerCode?: string;
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
  const [openOrderId, setOpenOrderId] = useState("");

  const itemsPerPage = 20;

  const toNumber = (value: any) => {
    const number = Number(value || 0);

    if (Number.isNaN(number)) {
      return 0;
    }

    return number;
  };

  const formatMoney = (value: any) => {
    return toNumber(value).toLocaleString("vi-VN") + "đ";
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
    return (
      order.orderCode ||
      order.order_code ||
      order.code ||
      order.id
    );
  };

  const getOrderItems = (order: OrderData) => {
    if (Array.isArray(order.items)) {
      return order.items;
    }

    if (Array.isArray(order.list)) {
      return order.list;
    }

    return [];
  };

  const getItemName = (item: OrderItem) => {
    return (
      item.name ||
      item.productName ||
      item.product_name ||
      "Sản phẩm"
    );
  };

  const getItemCode = (item: OrderItem) => {
    return item.sku || item.code || "";
  };

  const getItemQty = (item: OrderItem) => {
    return toNumber(item.quantity || item.qty || 0);
  };

  const getItemPrice = (item: OrderItem) => {
    return toNumber(
      item.price ||
        item.sellPrice ||
        item.sellprice ||
        0
    );
  };

  const getItemCost = (item: OrderItem) => {
    return toNumber(
      item.cost ||
        item.importPrice ||
        item.importprice ||
        item.capitalPrice ||
        item.capital_price ||
        item.curprice ||
        0
    );
  };

  const getItemTotal = (item: OrderItem) => {
    return getItemQty(item) * getItemPrice(item);
  };

  const getItemCapitalTotal = (item: OrderItem) => {
    return getItemQty(item) * getItemCost(item);
  };

  const getOrderTotal = (order: OrderData) => {
    return toNumber(
      order.total ||
        order.grand_total ||
        order.totalAmount ||
        order.total_amount ||
        order.finalTotal ||
        order.final_total ||
        order.subtotal ||
        0
    );
  };

  const getItemsCount = (order: OrderData) => {
    return getOrderItems(order).reduce((sum, item) => {
      return sum + toNumber(item.quantity || item.qty || 0);
    }, 0);
  };

  const getCapitalMoney = (order: OrderData) => {
    return getOrderItems(order).reduce((sum, item) => {
      const qty = toNumber(item.quantity || item.qty || 0);

      const cost = toNumber(
        item.cost ||
          item.importPrice ||
          item.importprice ||
          item.capitalPrice ||
          item.capital_price ||
          item.curprice ||
          0
      );

      return sum + qty * cost;
    }, 0);
  };

  const normalizeText = (value: any) => {
    return String(value || "")
      .toLowerCase()
      .trim();
  };

  const getPaymentMethod = (order: OrderData) => {
    return normalizeText(
      order.paymentMethod ||
        order.payment_method ||
        order.paymentType ||
        order.payment_type ||
        order.paymentMethodText ||
        order.payment_method_text ||
        ""
    );
  };

  const isCashMethod = (method: string) => {
    return (
      method.includes("cash") ||
      method.includes("tiền mặt") ||
      method.includes("tien mat") ||
      method.includes("tien_mat") ||
      method === "tm"
    );
  };

  const isTransferMethod = (method: string) => {
    return (
      method.includes("bank") ||
      method.includes("transfer") ||
      method.includes("chuyển khoản") ||
      method.includes("chuyen khoan") ||
      method.includes("chuyen_khoan") ||
      method.includes("ck") ||
      method.includes("thẻ") ||
      method.includes("the") ||
      method.includes("card")
    );
  };

  const isCodMethod = (method: string) => {
    return (
      method.includes("cod") ||
      method.includes("thu hộ") ||
      method.includes("thu ho")
    );
  };

  const isMixedMethod = (method: string) => {
    return (
      method.includes("mixed") ||
      method.includes("mix") ||
      method.includes("split") ||
      method.includes("cash_bank") ||
      method.includes("cash_transfer") ||
      method.includes("bank_cash") ||
      method.includes("transfer_cash") ||
      method.includes("tm_ck") ||
      method.includes("ck_tm") ||
      method.includes("tiền mặt + chuyển khoản") ||
      method.includes("tien mat + chuyen khoan") ||
      method.includes("tiền mặt và chuyển khoản") ||
      method.includes("tien mat va chuyen khoan")
    );
  };

  const getPaymentMethodLabel = (order: OrderData) => {
    const method =
      order.paymentMethodText ||
      order.payment_method_text ||
      order.paymentMethod ||
      order.payment_method ||
      order.paymentType ||
      order.payment_type ||
      "";

    const text = normalizeText(method);

    if (isMixedMethod(text)) {
      return "Tiền mặt + chuyển khoản";
    }

    if (isCashMethod(text)) {
      return "Tiền mặt";
    }

    if (isTransferMethod(text)) {
      return "Chuyển khoản / thẻ";
    }

    if (isCodMethod(text)) {
      return "COD";
    }

    return method || "---";
  };

  const getPaymentItemAmount = (payment: PaymentItem) => {
    return toNumber(
      payment.amount ||
        payment.value ||
        payment.money ||
        payment.total ||
        0
    );
  };

  const getPaymentItemMethod = (payment: PaymentItem) => {
    return normalizeText(
      payment.method ||
        payment.type ||
        payment.paymentMethod ||
        payment.payment_method ||
        payment.methodText ||
        payment.paymentMethodText ||
        payment.label ||
        payment.name ||
        ""
    );
  };

  const getSplitPayment = (order: OrderData) => {
    return order.splitPayment || order.split_payment || {};
  };

  const getCashAmount = (order: OrderData) => {
    const direct = toNumber(
      order.cashAmount ||
        order.cash_amount ||
        order.cashPaid ||
        order.cash_paid ||
        order.paidCash ||
        order.paid_cash ||
        order.moneyCash ||
        order.money_cash ||
        0
    );

    if (direct > 0) {
      return direct;
    }

    const split = getSplitPayment(order);

    const splitCash = toNumber(split.cash);

    if (splitCash > 0) {
      return splitCash;
    }

    if (Array.isArray(order.payments)) {
      const totalCash = order.payments.reduce(
        (sum, payment) => {
          const method = getPaymentItemMethod(payment);

          if (isCashMethod(method)) {
            return sum + getPaymentItemAmount(payment);
          }

          return sum;
        },
        0
      );

      if (totalCash > 0) {
        return totalCash;
      }
    }

    const method = getPaymentMethod(order);

    if (isCashMethod(method) && !isMixedMethod(method)) {
      return toNumber(
        order.paidAmount ||
          order.paid_amount ||
          order.amountPaid ||
          order.amount_paid ||
          order.totalPaid ||
          order.total_paid ||
          order.customerPay ||
          order.customer_pay ||
          getOrderTotal(order)
      );
    }

    return 0;
  };

  const getTransferAmount = (order: OrderData) => {
    const direct =
      toNumber(
        order.transferAmount ||
          order.transfer_amount ||
          order.bankAmount ||
          order.bank_amount ||
          order.bankPaid ||
          order.bank_paid ||
          order.paidBank ||
          order.paid_bank ||
          order.moneyBank ||
          order.money_bank ||
          0
      ) +
      toNumber(
        order.cardAmount ||
          order.card_amount ||
          0
      );

    if (direct > 0) {
      return direct;
    }

    const split = getSplitPayment(order);

    const splitTransfer =
      toNumber(split.bank) +
      toNumber(split.transfer) +
      toNumber(split.card);

    if (splitTransfer > 0) {
      return splitTransfer;
    }

    if (Array.isArray(order.payments)) {
      const totalTransfer = order.payments.reduce(
        (sum, payment) => {
          const method = getPaymentItemMethod(payment);

          if (isTransferMethod(method)) {
            return sum + getPaymentItemAmount(payment);
          }

          return sum;
        },
        0
      );

      if (totalTransfer > 0) {
        return totalTransfer;
      }
    }

    const method = getPaymentMethod(order);

    if (isTransferMethod(method) && !isMixedMethod(method)) {
      return toNumber(
        order.paidAmount ||
          order.paid_amount ||
          order.amountPaid ||
          order.amount_paid ||
          order.totalPaid ||
          order.total_paid ||
          order.customerPay ||
          order.customer_pay ||
          getOrderTotal(order)
      );
    }

    return 0;
  };

  const getCodAmount = (order: OrderData) => {
    const direct = toNumber(
      order.codAmount ||
        order.cod_amount ||
        0
    );

    if (direct > 0) {
      return direct;
    }

    const split = getSplitPayment(order);

    const splitCod = toNumber(split.cod);

    if (splitCod > 0) {
      return splitCod;
    }

    if (Array.isArray(order.payments)) {
      const totalCod = order.payments.reduce(
        (sum, payment) => {
          const method = getPaymentItemMethod(payment);

          if (isCodMethod(method)) {
            return sum + getPaymentItemAmount(payment);
          }

          return sum;
        },
        0
      );

      if (totalCod > 0) {
        return totalCod;
      }
    }

    const method = getPaymentMethod(order);

    if (isCodMethod(method)) {
      return toNumber(
        order.paidAmount ||
          order.paid_amount ||
          order.amountPaid ||
          order.amount_paid ||
          order.totalPaid ||
          order.total_paid ||
          order.customerPay ||
          order.customer_pay ||
          getOrderTotal(order)
      );
    }

    return 0;
  };

  const getPaidAmount = (order: OrderData) => {
    const calculated =
      getCashAmount(order) +
      getTransferAmount(order) +
      getCodAmount(order);

    if (calculated > 0) {
      return calculated;
    }

    return toNumber(
      order.paidAmount ||
        order.paid_amount ||
        order.amountPaid ||
        order.amount_paid ||
        order.totalPaid ||
        order.total_paid ||
        order.customerPay ||
        order.customer_pay ||
        0
    );
  };

  const getRemainingAmount = (order: OrderData) => {
    const direct = toNumber(
      order.remainingAmount ||
        order.remaining_amount ||
        order.debtAmount ||
        order.debt_amount ||
        0
    );

    if (direct > 0) {
      return direct;
    }

    const total = getOrderTotal(order);
    const paid = getPaidAmount(order);

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

      if (
        order.status === "cancelled" ||
        order.status === "returned"
      ) {
        return result;
      }

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
    const querySnapshot = await getDocs(
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
    setOpenOrderId("");
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
                    setCustomFrom(e.target.value)
                  }
                  className="border bg-white rounded-xl px-4 py-3 outline-none"
                />

                <input
                  type="date"
                  value={customTo}
                  onChange={(e) =>
                    setCustomTo(e.target.value)
                  }
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
            <p className="text-gray-500">
              Số đơn hàng
            </p>

            <p className="text-2xl font-bold text-blue-700 mt-2">
              {
  sortedOrders.filter(
    (order) =>
      order.status !== "cancelled" &&
      order.status !== "returned"
  ).length
}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Số lượng SP
            </p>

            <p className="text-2xl font-bold text-purple-600 mt-2">
              {summary.items}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Doanh số
            </p>

            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatMoney(summary.total)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Tiền mặt
            </p>

            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatMoney(summary.cash)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              CK / thẻ
            </p>

            <p className="text-2xl font-bold text-blue-600 mt-2">
              {formatMoney(summary.transfer)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500">
              Tiền vốn
            </p>

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
                Hiển thị {paginatedOrders.length} /{" "}
                {sortedOrders.length} đơn hàng phù hợp
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
                  <th className="p-4">
                    Ngày
                  </th>

                  <th className="p-4">
                    Mã đơn hàng
                  </th>

                  <th className="p-4">
                    Trạng thái
                  </th>

                  <th className="p-4 text-center">
                    SL sản phẩm
                  </th>

                  <th className="p-4 text-right">
                    Doanh số dự kiến
                  </th>

                  <th className="p-4 text-right">
                    Tiền mặt
                  </th>

                  <th className="p-4 text-right">
                    Chuyển khoản
                  </th>

                  <th className="p-4 text-right">
                    COD
                  </th>

                  <th className="p-4 text-right">
                    Còn lại phải trả
                  </th>

                  <th className="p-4 text-right">
                    Tiền vốn dự kiến
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedOrders.map((order) => {
                  const isOpen = openOrderId === order.id;
                  const orderItems = getOrderItems(order);

                  return (
                    <Fragment key={order.id}>
                      <tr
                        className={`border-t hover:bg-gray-50 ${
                          isOpen ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <td className="p-4 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenOrderId(
                                isOpen ? "" : order.id
                              )
                            }
                            className="inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            <span>
                              {getOrderCode(order)}
                            </span>

                            <span className="text-xs">
                              {isOpen ? "▲" : "▼"}
                            </span>
                          </button>
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

                      {isOpen && (
                        <tr className="border-t bg-blue-50/40">
                          <td
                            colSpan={10}
                            className="px-4 pb-4 pt-2"
                          >
                            <div className="ml-auto w-[58%] min-w-[760px] rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                              <div className="mb-4 flex flex-wrap items-center gap-2">
  <button
    type="button"
    onClick={() =>
      window.open(
  `/print-order/invoice?id=${
    order.id || order.orderCode
  }`,
  "_blank"
)
    }
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
  >
    In đơn hàng
  </button>

  <button
    type="button"
    onClick={() =>
      window.open(
  `/print-order/export?id=${
    order.id || order.orderCode
  }`,
  "_blank"
)
    }
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold"
  >
    In phiếu xuất kho
  </button>

  <button
    type="button"
    onClick={() =>
      window.open(
  `/print-order/delivery?id=${
    order.id || order.orderCode
  }`,
  "_blank"
)
    }
    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-semibold"
  >
    Phiếu giao hàng
  </button>
</div>

<div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
  <div>
    <span className="text-gray-500">
      Mã đơn:{" "}
    </span>

    <span className="font-bold text-blue-700">
      {getOrderCode(order)}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      Thanh toán:{" "}
    </span>

    <span className="font-semibold">
      {getPaymentMethodLabel(order)}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      Khách:{" "}
    </span>

    <span className="font-semibold">
      {order.customerName ||
        order.customer?.name ||
        "Khách lẻ"}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      Tổng:{" "}
    </span>

    <span className="font-bold text-green-600">
      {formatMoney(getOrderTotal(order))}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      TM:{" "}
    </span>

    <span className="font-semibold text-green-600">
      {formatMoney(getCashAmount(order))}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      CK:{" "}
    </span>

    <span className="font-semibold text-blue-600">
      {formatMoney(getTransferAmount(order))}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      COD:{" "}
    </span>

    <span className="font-semibold text-orange-600">
      {formatMoney(getCodAmount(order))}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      Còn lại:{" "}
    </span>

    <span className="font-semibold text-red-600">
      {formatMoney(getRemainingAmount(order))}
    </span>
  </div>

  <div>
    <span className="text-gray-500">
      Vốn:{" "}
    </span>

    <span className="font-semibold">
      {formatMoney(getCapitalMoney(order))}
    </span>
  </div>
</div>
                              <div className="overflow-hidden rounded-lg border">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                      <th className="px-3 py-2 text-left">
                                        Sản phẩm
                                      </th>

                                      <th className="px-3 py-2 text-center w-16">
                                        SL
                                      </th>

                                      <th className="px-3 py-2 text-right w-28">
                                        Đơn giá
                                      </th>

                                      <th className="px-3 py-2 text-right w-32">
                                        Thành tiền
                                      </th>

                                      <th className="px-3 py-2 text-right w-24">
                                        Vốn
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {orderItems.map((item, index) => (
                                      <tr
                                        key={index}
                                        className="border-t hover:bg-gray-50"
                                      >
                                        <td className="px-3 py-2">
                                          <div className="font-semibold leading-5">
                                            {getItemName(item)}
                                          </div>

                                          {getItemCode(item) && (
                                            <div className="text-xs text-gray-500 leading-4 truncate max-w-[260px]">
                                              Mã: {getItemCode(item)}
                                            </div>
                                          )}
                                        </td>

                                        <td className="px-3 py-2 text-center font-semibold">
                                          {getItemQty(item)}
                                        </td>

                                        <td className="px-3 py-2 text-right">
                                          {formatMoney(getItemPrice(item))}
                                        </td>

                                        <td className="px-3 py-2 text-right font-bold text-blue-700">
                                          {formatMoney(getItemTotal(item))}
                                        </td>

                                        <td className="px-3 py-2 text-right text-orange-600 font-semibold">
                                          {formatMoney(getItemCapitalTotal(item))}
                                        </td>
                                      </tr>
                                    ))}

                                    {orderItems.length === 0 && (
                                      <tr>
                                        <td
                                          colSpan={5}
                                          className="px-3 py-4 text-center text-gray-500"
                                        >
                                          Đơn hàng này chưa có chi tiết sản phẩm
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

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
                        setCurrentPage(totalPages)
                      }
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