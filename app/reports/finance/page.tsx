"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type OrderItem = {
  id?: string;
  name?: string;
  productName?: string;
  title?: string;
  sku?: string;
  code?: string;
  quantity?: number;
  qty?: number;
  unit?: string;
  price?: number;
  salePrice?: number;
  vat?: number;
  vatPercent?: number;
  total?: number;
  amount?: number;
};

type OrderData = {
  id: string;
  order_code?: string;
  orderCode?: string;
  code?: string;

  customer?: any;
  customer_name?: any;
  customerName?: string;

  items?: OrderItem[];
  products?: OrderItem[];

  total?: number;
  grand_total?: number;
  grandTotal?: number;
  totalAmount?: number;

  paymentMethod?: string;
  payment_method?: string;
  paymentType?: string;

  cashAmount?: number;
  bankAmount?: number;
  cardAmount?: number;

  customerPaid?: number;
  customer_pay?: number;
  paidAmount?: number;
  changeAmount?: number;
  change_amount?: number;

  createdAt?: any;
  created_at?: any;

  createdBy?: string;
  created_by?: string;
  userName?: string;
  sellerName?: string;

  discountAmount?: number;
  discount?: number;
  vatAmount?: number;
  vat?: number;

  status?: string;
  orderStatus?: string;
  returnedAmount?: number;
};

type PaymentFilter = "all" | "cash" | "bank";

export default function FinanceReportPage() {
  const [orders, setOrders] =
    useState<OrderData[]>([]);

  const [filterType, setFilterType] =
    useState("7days");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("all");

  const [expandedOrderId, setExpandedOrderId] =
    useState<string | null>(null);

  const ordersPerPage = 15;

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString(
      "vi-VN"
    );
  };

  const getOrderDate = (order: OrderData) => {
    const rawDate =
      order.createdAt || order.created_at;

    if (!rawDate) {
      return null;
    }

    if (rawDate.toDate) {
      return rawDate.toDate();
    }

    if (rawDate.seconds) {
      return new Date(
        rawDate.seconds * 1000
      );
    }

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const formatDateTime = (order: OrderData) => {
    const date = getOrderDate(order);

    if (!date) {
      return "---";
    }

    return date.toLocaleString("vi-VN");
  };

  const getOrderCode = (order: OrderData) => {
    return (
      order.order_code ||
      order.orderCode ||
      order.code ||
      order.id
    );
  };

  const getCustomerName = (order: OrderData) => {
    if (
      typeof order.customer_name === "object"
    ) {
      return (
        order.customer_name?.name ||
        "---"
      );
    }

    if (typeof order.customer === "object") {
      return (
        order.customer?.name ||
        "---"
      );
    }

    return (
      order.customerName ||
      order.customer_name ||
      order.customer ||
      "Khách lẻ"
    );
  };

  const getCreatedBy = (order: OrderData) => {
    return (
      order.createdBy ||
      order.created_by ||
      order.userName ||
      order.sellerName ||
      "---"
    );
  };

  const getOrderTotal = (order: OrderData) => {
    return Number(
      order.total ||
        order.grand_total ||
        order.grandTotal ||
        order.totalAmount ||
        0
    );
  };

  const getOrderDiscount = (
    order: OrderData
  ) => {
    return Number(
      order.discountAmount ||
        order.discount ||
        0
    );
  };

  const getOrderVat = (order: OrderData) => {
    return Number(
      order.vatAmount ||
        order.vat ||
        0
    );
  };

  const getCustomerPaid = (
    order: OrderData
  ) => {
    return Number(
      order.customerPaid ||
        order.customer_pay ||
        order.paidAmount ||
        0
    );
  };

  const getChangeAmount = (
    order: OrderData
  ) => {
    return Number(
      order.changeAmount ||
        order.change_amount ||
        0
    );
  };

  const getOrderItems = (
    order: OrderData
  ) => {
    return (
      order.items ||
      order.products ||
      []
    );
  };

  const isCancelledOrder = (
    order: OrderData
  ) => {
    const status = String(
      order.status ||
        order.orderStatus ||
        ""
    ).toLowerCase();

    return [
      "cancel",
      "cancelled",
      "canceled",
      "huy",
      "hủy",
      "đã hủy",
    ].includes(status);
  };

  const getOrderStatus = (
    order: OrderData
  ) => {
    return String(
      order.status ||
        order.orderStatus ||
        ""
    ).toLowerCase();
  };

  const isReturnedOrder = (
    order: OrderData
  ) => {
    const status =
      getOrderStatus(order);

    return (
      status === "returned" ||
      status === "return"
    );
  };

  const isPartiallyReturnedOrder = (
    order: OrderData
  ) => {
    return (
      getOrderStatus(order) ===
      "partially_returned"
    );
  };

  const getReturnedAmount = (
    order: OrderData
  ) => {
    return Number(
      order.returnedAmount || 0
    );
  };

  const getNetOrderTotal = (
    order: OrderData
  ) => {
    if (isCancelledOrder(order)) {
      return 0;
    }

    if (isReturnedOrder(order)) {
      return 0;
    }

    if (
      isPartiallyReturnedOrder(
        order
      )
    ) {
      return Math.max(
        0,
        getOrderTotal(order) -
          getReturnedAmount(order)
      );
    }

    return getOrderTotal(order);
  };

  const getOrderStatusText = (
    order: OrderData
  ) => {
    if (isCancelledOrder(order)) {
      return "Đã hủy";
    }

    if (isReturnedOrder(order)) {
      return "Đã trả hàng";
    }

    if (
      isPartiallyReturnedOrder(
        order
      )
    ) {
      return "Trả một phần";
    }

    return "Hoàn thành";
  };

  const getPaymentMethodText = (
    order: OrderData
  ) => {
    const method =
      order.paymentMethod ||
      order.payment_method ||
      order.paymentType ||
      "";

    if (
      method === "bank" ||
      method === "Chuyển khoản" ||
      method === "chuyen_khoan"
    ) {
      return "Chuyển khoản";
    }

    if (
      method === "cash" ||
      method === "Tiền mặt" ||
      method === "tien_mat"
    ) {
      return "Tiền mặt";
    }

    if (
      method === "card" ||
      method === "Quẹt thẻ" ||
      method === "quet_the"
    ) {
      return "Quẹt thẻ";
    }

    if (
      method === "mixed" ||
      method === "CK+TM" ||
      method === "CK + TM" ||
      method === "ck_tm"
    ) {
      return "CK + TM";
    }

    return "Chưa có";
  };

  const isCashPayment = (
    order: OrderData
  ) => {
    return (
      getPaymentMethodText(order) ===
      "Tiền mặt"
    );
  };

  const isBankPayment = (
    order: OrderData
  ) => {
    const method =
      getPaymentMethodText(order);

    return (
      method === "Chuyển khoản" ||
      method === "Quẹt thẻ"
    );
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
    quarter: number
  ) => {
    const month = date.getMonth();
    const startMonth =
      (quarter - 1) * 3;
    const endMonth =
      startMonth + 2;

    return (
      date.getFullYear() ===
        new Date().getFullYear() &&
      month >= startMonth &&
      month <= endMonth
    );
  };

  const filterOrdersByDate = (
    list: OrderData[]
  ) => {
    const now = new Date();

    return list.filter((order) => {
      const orderDate =
        getOrderDate(order);

      if (!orderDate) {
        return false;
      }

      if (filterType === "today") {
        return isSameDay(
          orderDate,
          now
        );
      }

      if (filterType === "yesterday") {
        const yesterday =
          new Date();

        yesterday.setDate(
          yesterday.getDate() - 1
        );

        return isSameDay(
          orderDate,
          yesterday
        );
      }

      if (filterType === "7days") {
        const start =
          new Date();

        start.setDate(
          start.getDate() - 6
        );

        start.setHours(
          0,
          0,
          0,
          0
        );

        return orderDate >= start;
      }

      if (filterType === "month") {
        return (
          orderDate.getMonth() ===
            now.getMonth() &&
          orderDate.getFullYear() ===
            now.getFullYear()
        );
      }

      if (filterType === "lastMonth") {
        const lastMonth =
          new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );

        return (
          orderDate.getMonth() ===
            lastMonth.getMonth() &&
          orderDate.getFullYear() ===
            lastMonth.getFullYear()
        );
      }

      if (filterType === "q1") {
        return isInQuarter(orderDate, 1);
      }

      if (filterType === "q2") {
        return isInQuarter(orderDate, 2);
      }

      if (filterType === "q3") {
        return isInQuarter(orderDate, 3);
      }

      if (filterType === "q4") {
        return isInQuarter(orderDate, 4);
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

      return true;
    });
  };

  const filteredOrders =
    useMemo(() => {
      const dateFiltered =
        filterOrdersByDate(orders);

      const sorted =
        [...dateFiltered].sort(
          (a, b) => {
            const dateA =
              getOrderDate(a)?.getTime() ||
              0;

            const dateB =
              getOrderDate(b)?.getTime() ||
              0;

            return dateB - dateA;
          }
        );

      const activeOrders =
        sorted.filter(
          (order) =>
            !isCancelledOrder(order)
        );

      if (
        paymentFilter === "cash"
      ) {
        return activeOrders.filter(
          isCashPayment
        );
      }

      if (
        paymentFilter === "bank"
      ) {
        return activeOrders.filter(
          isBankPayment
        );
      }

      return activeOrders;
    }, [
      orders,
      filterType,
      paymentFilter,
    ]);

  const totalRevenue =
    filteredOrders.reduce(
      (sum, order) =>
        sum +
        getNetOrderTotal(order),
      0
    );

  const cashTotal =
    filteredOrders.reduce(
      (sum, order) => {
        const method =
          getPaymentMethodText(order);

        const netTotal =
          getNetOrderTotal(order);

        if (method === "Tiền mặt") {
          return sum + netTotal;
        }

        if (method === "CK + TM") {
          const originalTotal =
            getOrderTotal(order);

          if (
            originalTotal <= 0 ||
            netTotal <= 0
          ) {
            return sum;
          }

          const cashRatio =
            Number(
              order.cashAmount || 0
            ) / originalTotal;

          return (
            sum +
            netTotal * cashRatio
          );
        }

        return sum;
      },
      0
    );

  const bankTotal =
    filteredOrders.reduce(
      (sum, order) => {
        const method =
          getPaymentMethodText(order);

        const netTotal =
          getNetOrderTotal(order);

        if (
          method === "Chuyển khoản" ||
          method === "Quẹt thẻ"
        ) {
          return sum + netTotal;
        }

        if (method === "CK + TM") {
          const originalTotal =
            getOrderTotal(order);

          if (
            originalTotal <= 0 ||
            netTotal <= 0
          ) {
            return sum;
          }

          const bankRatio =
            Number(
              order.bankAmount ||
                order.cardAmount ||
                0
            ) / originalTotal;

          return (
            sum +
            netTotal * bankRatio
          );
        }

        return sum;
      },
      0
    );

  const getNetRatio = (
    order: OrderData
  ) => {
    const originalTotal =
      getOrderTotal(order);

    if (originalTotal <= 0) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        1,
        getNetOrderTotal(order) /
          originalTotal
      )
    );
  };

  const discountTotal =
    filteredOrders.reduce(
      (sum, order) =>
        sum +
        getOrderDiscount(order) *
          getNetRatio(order),
      0
    );

  const vatTotal =
    filteredOrders.reduce(
      (sum, order) =>
        sum +
        getOrderVat(order) *
          getNetRatio(order),
      0
    );

    const estimatedProfit =
  filteredOrders.reduce(
    (sum, order) => {

      if (isCancelledOrder(order)) {
        return sum;
      }

      const revenue =
        getNetOrderTotal(order);

      const ratio =
        getNetRatio(order);

      const discount =
        getOrderDiscount(order) *
        ratio;

      const vat =
        getOrderVat(order) *
        ratio;

      const profit =
        Math.max(
          0,
          revenue -
            discount -
            vat
        ) * 0.35;

      return sum + profit;
    },
    0
  );

  const totalReturnedAmount =
    filteredOrders.reduce(
      (sum, order) =>
        sum +
        getReturnedAmount(order),
      0
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredOrders.length /
          ordersPerPage
      )
    );

  const currentOrders =
    filteredOrders.slice(
      (currentPage - 1) *
        ordersPerPage,
      currentPage *
        ordersPerPage
    );

  const handleSelectOrder = (
    order: OrderData
  ) => {
    setExpandedOrderId((prev) =>
      prev === order.id ? null : order.id
    );
  };

  const handlePaymentFilter = (
    type: PaymentFilter
  ) => {
    setCurrentPage(1);
    setExpandedOrderId(null);

    if (paymentFilter === type) {
      setPaymentFilter("all");
      return;
    }

    setPaymentFilter(type);
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
    setExpandedOrderId(null);
  }, [filterType]);

  return (
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="max-w-[1500px] mx-auto space-y-4">

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Báo cáo tài chính
            </h1>

            <p className="text-gray-500 mt-1">
              Tổng hợp doanh thu, thanh toán, VAT và chiết khấu
            </p>
          </div>

          <div className="relative w-full md:w-64 md:mr-20">
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value)
              }
              className="appearance-none border bg-white rounded-xl pl-4 pr-14 py-3 outline-none w-full cursor-pointer"
            >
              <option value="today">
                Hôm nay
              </option>

              <option value="yesterday">
                Hôm qua
              </option>

              <option value="7days">
                7 ngày qua
              </option>

              <option value="month">
                Tháng này
              </option>

              <option value="lastMonth">
                Tháng trước
              </option>

              <option value="q1">
                Quý 1
              </option>

              <option value="q2">
                Quý 2
              </option>

              <option value="q3">
                Quý 3
              </option>

              <option value="q4">
                Quý 4
              </option>

              <option value="year">
                Năm nay
              </option>

              <option value="lastYear">
                Năm trước
              </option>

              <option value="all">
                Tất cả
              </option>
            </select>

            <span className="pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-black text-lg">
              ▾
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">

          <div className="bg-white rounded-2xl shadow p-4 min-h-[95px]">
            <p className="text-gray-500 text-sm">
              Tổng doanh thu
            </p>

            <p className="text-2xl font-bold text-blue-700 mt-2">
              {formatMoney(totalRevenue)}đ
            </p>

            {totalReturnedAmount > 0 && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Đã hoàn: {formatMoney(totalReturnedAmount)}đ
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-4 min-h-[95px]">
            <p className="text-gray-500 text-sm">
              Tiền mặt
            </p>

            <p className="text-2xl font-bold text-green-600 mt-2">
              {formatMoney(cashTotal)}đ
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 min-h-[95px]">
            <p className="text-gray-500 text-sm">
              Chuyển khoản / thẻ
            </p>

            <p className="text-2xl font-bold text-purple-600 mt-2">
              {formatMoney(bankTotal)}đ
            </p>
          </div>

<div className="bg-white rounded-2xl shadow p-4 min-h-[95px]">
  <p className="text-gray-500 text-sm">
    Số đơn hàng
  </p>

  <p className="text-2xl font-bold text-orange-600 mt-2">
    {filteredOrders.filter(
  (order) => !isCancelledOrder(order)
).length}
  </p>

  <div className="mt-3 pt-3 border-t">
    <p className="text-gray-500 text-sm">
      Lãi tạm tính
    </p>

    <p className="text-xl font-bold text-emerald-600 mt-1">
      {formatMoney(estimatedProfit)}đ
    </p>
  </div>
</div>

<div className="bg-white rounded-2xl shadow p-4 min-h-[95px]">
  <p className="text-gray-500 text-sm">
    VAT & Chiết khấu
  </p>

  <div className="mt-4 space-y-3">

    <div className="flex justify-between items-center">
      <span className="text-gray-600">
        VAT
      </span>

      <strong className="text-blue-700">
        {formatMoney(vatTotal)}đ
      </strong>
    </div>

    <div className="flex justify-between items-center">
      <span className="text-gray-600">
        Chiết khấu
      </span>

      <strong className="text-red-600">
        {formatMoney(discountTotal)}đ
      </strong>
    </div>

  </div>
</div>

        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Danh sách đơn hàng
              </h2>

              <p className="text-gray-500 mt-1">
                Hiển thị 15 đơn hàng mỗi trang
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handlePaymentFilter("all")
                }
                className={`px-4 py-2 rounded-xl font-semibold border ${
                  paymentFilter === "all"
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Tất cả
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePaymentFilter("cash")
                }
                className={`px-4 py-2 rounded-xl font-semibold border ${
                  paymentFilter === "cash"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                title="Lọc đơn tiền mặt"
              >
                ▲ Tiền mặt
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePaymentFilter("bank")
                }
                className={`px-4 py-2 rounded-xl font-semibold border ${
                  paymentFilter === "bank"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                title="Lọc đơn chuyển khoản / thẻ"
              >
                ▼ Chuyển khoản / thẻ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">
                    STT
                  </th>

                  <th className="p-4 text-left">
                    Mã đơn
                  </th>

                  <th className="p-4 text-left">
                    Khách hàng
                  </th>

                  <th className="p-4 text-right">
                    Tổng tiền
                  </th>

                  <th className="p-4 text-left">
                    <div className="flex items-center gap-2">
                      <span>
                        Hình thức thanh toán
                      </span>

                      <div className="flex flex-col leading-none">
                        <button
                          type="button"
                          onClick={() =>
                            handlePaymentFilter(
                              "cash"
                            )
                          }
                          className={`text-xs ${
                            paymentFilter ===
                            "cash"
                              ? "text-green-600 font-bold"
                              : "text-gray-400 hover:text-green-600"
                          }`}
                          title="Tiền mặt"
                        >
                          ▲
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handlePaymentFilter(
                              "bank"
                            )
                          }
                          className={`text-xs ${
                            paymentFilter ===
                            "bank"
                              ? "text-purple-600 font-bold"
                              : "text-gray-400 hover:text-purple-600"
                          }`}
                          title="Chuyển khoản / thẻ"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </th>

                  <th className="p-4 text-left">
                    Trạng thái
                  </th>

                  <th className="p-4 text-left">
                    Ngày tạo
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      Không có đơn hàng phù hợp
                    </td>
                  </tr>
                ) : (
                  currentOrders.map(
                    (order, index) => {
                      const isExpanded =
                        expandedOrderId === order.id;

                      return (
                        <Fragment key={order.id}>
                          <tr
                            className={`border-t hover:bg-gray-50 ${
                              isExpanded
                                ? "bg-blue-50/40"
                                : ""
                            }`}
                          >
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectOrder(
                                    order
                                  )
                                }
                                className="mr-2 text-gray-500 hover:text-blue-700"
                                title={
                                  isExpanded
                                    ? "Thu gọn"
                                    : "Xem chi tiết"
                                }
                              >
                                {isExpanded
                                  ? "⌃"
                                  : "⌄"}
                              </button>

                              {(currentPage - 1) *
                                ordersPerPage +
                                index +
                                1}
                            </td>

                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectOrder(
                                    order
                                  )
                                }
                                className="font-bold text-blue-700 hover:underline"
                              >
                                {getOrderCode(order)}
                              </button>
                            </td>

                            <td className="p-4">
                              {getCustomerName(order)}
                            </td>

                            <td className="p-4 text-right">
                              <div className="font-bold">
                                {formatMoney(
                                  getNetOrderTotal(order)
                                )}
                                đ
                              </div>

                              {getReturnedAmount(order) > 0 && (
                                <div className="mt-1 text-xs font-semibold text-red-600">
                                  Hoàn {formatMoney(
                                    getReturnedAmount(order)
                                  )}đ
                                </div>
                              )}
                            </td>

                            <td className="p-4">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                  getPaymentMethodText(
                                    order
                                  ) === "Tiền mặt"
                                    ? "bg-green-100 text-green-700"
                                    : getPaymentMethodText(
                                        order
                                      ) ===
                                        "Chuyển khoản" ||
                                      getPaymentMethodText(
                                        order
                                      ) ===
                                        "Quẹt thẻ"
                                    ? "bg-purple-100 text-purple-700"
                                    : getPaymentMethodText(
                                        order
                                      ) ===
                                      "CK + TM"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {getPaymentMethodText(
                                  order
                                )}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                  isReturnedOrder(order)
                                    ? "bg-orange-100 text-orange-700"
                                    : isPartiallyReturnedOrder(order)
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {getOrderStatusText(order)}
                              </span>
                            </td>

                            <td className="p-4">
                              {formatDateTime(order)}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="border-t bg-blue-50/30">
                              <td
                                colSpan={7}
                                className="p-0"
                              >
                                <div className="m-3 rounded-xl border bg-white overflow-hidden">

                                  <div className="px-4 py-3 bg-blue-700 text-white flex items-center justify-between">
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                                      <strong className="text-base">
                                        Chi tiết: {getOrderCode(order)}
                                      </strong>

                                      <span>
                                        Khách:{" "}
                                        <b>{getCustomerName(order)}</b>
                                      </span>

                                      <span>
                                        Ngày:{" "}
                                        <b>{formatDateTime(order)}</b>
                                      </span>

                                      <span>
                                        Thanh toán:{" "}
                                        <b>{getPaymentMethodText(order)}</b>
                                      </span>

                                      <span>
                                        Người tạo:{" "}
                                        <b>{getCreatedBy(order)}</b>
                                      </span>

                                      <span>
                                        Trạng thái:{" "}
                                        <b>{getOrderStatusText(order)}</b>
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedOrderId(null)
                                      }
                                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30"
                                    >
                                      ×
                                    </button>
                                  </div>

                                  <div className="p-3">
                                    <div className="overflow-x-auto rounded-xl border">
                                      <table className="w-full min-w-[850px] text-sm">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th className="px-3 py-2 text-left">
                                              STT
                                            </th>

                                            <th className="px-3 py-2 text-left">
                                              Sản phẩm
                                            </th>

                                            <th className="px-3 py-2 text-left">
                                              Mã SKU
                                            </th>

                                            <th className="px-3 py-2 text-center">
                                              SL
                                            </th>

                                            <th className="px-3 py-2 text-left">
                                              Đơn vị
                                            </th>

                                            <th className="px-3 py-2 text-right">
                                              Đơn giá
                                            </th>

                                            <th className="px-3 py-2 text-center">
                                              VAT
                                            </th>

                                            <th className="px-3 py-2 text-right">
                                              Thành tiền
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody>
                                          {getOrderItems(order).length === 0 ? (
                                            <tr>
                                              <td
                                                colSpan={8}
                                                className="px-3 py-5 text-center text-gray-500"
                                              >
                                                Không có sản phẩm trong đơn
                                              </td>
                                            </tr>
                                          ) : (
                                            getOrderItems(order).map(
                                              (item, itemIndex) => {
                                                const quantity =
                                                  Number(
                                                    item.quantity ||
                                                      item.qty ||
                                                      0
                                                  );

                                                const price =
                                                  Number(
                                                    item.price ||
                                                      item.salePrice ||
                                                      0
                                                  );

                                                const rowTotal =
                                                  Number(
                                                    item.total ||
                                                      item.amount ||
                                                      price * quantity
                                                  );

                                                return (
                                                  <tr
                                                    key={
                                                      item.id ||
                                                      item.sku ||
                                                      item.code ||
                                                      `${order.id}-item-${itemIndex}`
                                                    }
                                                    className="border-t"
                                                  >
                                                    <td className="px-3 py-2">
                                                      {itemIndex + 1}
                                                    </td>

                                                    <td className="px-3 py-2 font-semibold">
                                                      {item.name ||
                                                        item.productName ||
                                                        item.title ||
                                                        "---"}
                                                    </td>

                                                    <td className="px-3 py-2">
                                                      {item.sku ||
                                                        item.code ||
                                                        "---"}
                                                    </td>

                                                    <td className="px-3 py-2 text-center font-semibold">
                                                      {quantity}
                                                    </td>

                                                    <td className="px-3 py-2">
                                                      {item.unit || "---"}
                                                    </td>

                                                    <td className="px-3 py-2 text-right">
                                                      {formatMoney(price)}đ
                                                    </td>

                                                    <td className="px-3 py-2 text-center">
                                                      {Number(
                                                        item.vat ||
                                                          item.vatPercent ||
                                                          0
                                                      )}
                                                      %
                                                    </td>

                                                    <td className="px-3 py-2 text-right font-bold">
                                                      {formatMoney(rowTotal)}đ
                                                    </td>
                                                  </tr>
                                                );
                                              }
                                            )
                                          )}
                                        </tbody>
                                      </table>
                                    </div>

                                    <div className="mt-3 flex justify-end">
                                      <div className="w-full md:w-[430px] bg-gray-50 rounded-xl p-3 text-sm space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Tổng tiền
                                          </span>

                                          <strong>
                                            {formatMoney(
                                              getOrderTotal(order)
                                            )}
                                            đ
                                          </strong>
                                        </div>

                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            VAT
                                          </span>

                                          <strong>
                                            {formatMoney(
                                              getOrderVat(order)
                                            )}
                                            đ
                                          </strong>
                                        </div>

                                        <div className="flex justify-between">
                                          <span className="text-gray-600">
                                            Chiết khấu
                                          </span>

                                          <strong>
                                            {formatMoney(
                                              getOrderDiscount(order)
                                            )}
                                            đ
                                          </strong>
                                        </div>

                                        {getReturnedAmount(order) > 0 && (
                                          <div className="flex justify-between text-red-600">
                                            <span>
                                              Tiền đã hoàn
                                            </span>

                                            <strong>
                                              -{formatMoney(
                                                getReturnedAmount(order)
                                              )}
                                              đ
                                            </strong>
                                          </div>
                                        )}

                                        <div className="border-t pt-2 flex justify-between text-base">
                                          <span className="font-bold text-blue-700">
                                            Doanh thu còn lại
                                          </span>

                                          <strong className="text-blue-700">
                                            {formatMoney(
                                              getNetOrderTotal(order)
                                            )}
                                            đ
                                          </strong>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Khách đưa
                                            </span>

                                            <strong>
                                              {formatMoney(
                                                getCustomerPaid(order)
                                              )}
                                              đ
                                            </strong>
                                          </div>

                                          <div className="flex justify-between">
                                            <span className="text-gray-600">
                                              Tiền thừa
                                            </span>

                                            <strong>
                                              {formatMoney(
                                                getChangeAmount(order)
                                              )}
                                              đ
                                            </strong>
                                          </div>
                                        </div>

                                        {getPaymentMethodText(order) ===
                                          "CK + TM" && (
                                          <div className="border-t pt-2 grid grid-cols-2 gap-3">
                                            <div className="flex justify-between">
                                              <span className="text-gray-600">
                                                Tiền mặt
                                              </span>

                                              <strong>
                                                {formatMoney(
                                                  order.cashAmount
                                                )}
                                                đ
                                              </strong>
                                            </div>

                                            <div className="flex justify-between">
                                              <span className="text-gray-600">
                                                Chuyển khoản
                                              </span>

                                              <strong>
                                                {formatMoney(
                                                  order.bankAmount
                                                )}
                                                đ
                                              </strong>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          <div className="p-5 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-gray-500">
              Tổng đơn phù hợp:{" "}
              <strong className="text-black">
                {filteredOrders.filter(
  (order) => !isCancelledOrder(order)
).length}
              </strong>
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((prev) =>
                    Math.max(1, prev - 1)
                  );
                  setExpandedOrderId(null);
                }}
                className="px-4 py-2 rounded-xl border bg-white disabled:opacity-40 hover:bg-gray-100"
              >
                Trước
              </button>

              {Array.from({
                length: totalPages,
              }).map((_, index) => {
                const page = index + 1;

                return (
                  <button
                    type="button"
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      setExpandedOrderId(null);
                    }}
                    className={`px-4 py-2 rounded-xl border font-semibold ${
                      currentPage === page
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={
                  currentPage === totalPages
                }
                onClick={() => {
                  setCurrentPage((prev) =>
                    Math.min(
                      totalPages,
                      prev + 1
                    )
                  );
                  setExpandedOrderId(null);
                }}
                className="px-4 py-2 rounded-xl border bg-white disabled:opacity-40 hover:bg-gray-100"
              >
                Sau
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
