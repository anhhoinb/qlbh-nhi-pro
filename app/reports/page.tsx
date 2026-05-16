"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";

type OrderItem = {
  name?: string;
  productName?: string;
  quantity?: number;
  price?: number;
};

type OrderData = {
  id: string;
  total?: number;
  grand_total?: number;
  totalAmount?: number;
  profit?: number;
  paymentMethod?: string;
  createdAt?: any;
  items?: OrderItem[];
  status?: string;
};

export default function SalesReportPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filterType, setFilterType] = useState("7days");
  const [reportType, setReportType] = useState("daily");

  const [hoverChart, setHoverChart] = useState<{
    index: number;
    type: "revenue" | "profit";
  } | null>(null);

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  const getFilterLabel = () => {
    if (filterType === "today") return "Hôm nay";
    if (filterType === "yesterday") return "Hôm qua";
    if (filterType === "7days") return "7 ngày qua";
    if (filterType === "month") return "Tháng này";
    if (filterType === "lastMonth") return "Tháng trước";
    if (filterType === "q1") return "Quý 1";
    if (filterType === "q2") return "Quý 2";
    if (filterType === "q3") return "Quý 3";
    if (filterType === "q4") return "Quý 4";
    if (filterType === "year") return "Năm nay";
    if (filterType === "lastYear") return "Năm trước";

    return "Tất cả";
  };

  const getOrderDate = (order: OrderData) => {
    if (!order.createdAt) return null;

    if (order.createdAt.toDate) {
      return order.createdAt.toDate();
    }

    if (order.createdAt.seconds) {
      return new Date(order.createdAt.seconds * 1000);
    }

    const date = new Date(order.createdAt);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const getOrderTotal = (order: OrderData) => {
    return Number(
      order.total ||
        order.grand_total ||
        order.totalAmount ||
        0
    );
  };

  const getOrderProfit = (order: OrderData) => {
    if (order.profit !== undefined) {
      return Number(order.profit || 0);
    }

    return Math.round(getOrderTotal(order) * 0.35);
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

  const filterOrders = (list: OrderData[]) => {
    const now = new Date();

    return list.filter((order) => {
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

      if (filterType === "month") {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }

      if (filterType === "lastMonth") {
        const lastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

        return (
          orderDate.getMonth() === lastMonth.getMonth() &&
          orderDate.getFullYear() === lastMonth.getFullYear()
        );
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

      return true;
    });
  };

  const filteredOrders = useMemo(() => {
    return filterOrders(orders);
  }, [orders, filterType]);

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const totalOrders = filteredOrders.length;

  const returnedOrders = filteredOrders.filter(
    (order) =>
      order.status === "returned" ||
      order.status === "return"
  ).length;

  const getChartDays = () => {
    const now = new Date();

    const days: {
      label: string;
      date: Date;
      revenue: number;
      profit: number;
    }[] = [];

    if (filterType === "today") {
      days.push({
        label: now.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        date: now,
        revenue: 0,
        profit: 0,
      });

      return days;
    }

    if (filterType === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      days.push({
        label: yesterday.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        date: yesterday,
        revenue: 0,
        profit: 0,
      });

      return days;
    }

    if (filterType === "month") {
      const totalDays = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          day
        );

        days.push({
          label: `${String(day).padStart(2, "0")}/${String(
            now.getMonth() + 1
          ).padStart(2, "0")}`,
          date: d,
          revenue: 0,
          profit: 0,
        });
      }

      return days;
    }

    if (filterType === "lastMonth") {
      const lastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      const totalDays = new Date(
        lastMonth.getFullYear(),
        lastMonth.getMonth() + 1,
        0
      ).getDate();

      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth(),
          day
        );

        days.push({
          label: `${String(day).padStart(2, "0")}/${String(
            lastMonth.getMonth() + 1
          ).padStart(2, "0")}`,
          date: d,
          revenue: 0,
          profit: 0,
        });
      }

      return days;
    }

    if (
      filterType === "q1" ||
      filterType === "q2" ||
      filterType === "q3" ||
      filterType === "q4"
    ) {
      const quarterNumber = Number(filterType.replace("q", ""));
      const startMonth = (quarterNumber - 1) * 3;

      for (let month = startMonth; month < startMonth + 3; month++) {
        const d = new Date(now.getFullYear(), month, 1);

        days.push({
          label: `T${month + 1}`,
          date: d,
          revenue: 0,
          profit: 0,
        });
      }

      return days;
    }

    if (filterType === "year" || filterType === "lastYear") {
      const year =
        filterType === "lastYear"
          ? now.getFullYear() - 1
          : now.getFullYear();

      for (let month = 0; month < 12; month++) {
        const d = new Date(year, month, 1);

        days.push({
          label: `T${month + 1}`,
          date: d,
          revenue: 0,
          profit: 0,
        });
      }

      return days;
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);

      days.push({
        label: d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        date: d,
        revenue: 0,
        profit: 0,
      });
    }

    return days;
  };

  const chartData = useMemo(() => {
    const days = getChartDays();

    filteredOrders.forEach((order) => {
      const orderDate = getOrderDate(order);

      if (!orderDate) return;

      let found:
        | {
            label: string;
            date: Date;
            revenue: number;
            profit: number;
          }
        | undefined;

      if (
        filterType === "q1" ||
        filterType === "q2" ||
        filterType === "q3" ||
        filterType === "q4" ||
        filterType === "year" ||
        filterType === "lastYear"
      ) {
        found = days.find(
          (day) =>
            day.date.getMonth() === orderDate.getMonth() &&
            day.date.getFullYear() === orderDate.getFullYear()
        );
      } else {
        found = days.find((day) =>
          isSameDay(day.date, orderDate)
        );
      }

      if (found) {
        found.revenue += getOrderTotal(order);
        found.profit += getOrderProfit(order);
      }
    });

    return days;
  }, [filteredOrders, filterType]);

  const maxChartValue = Math.max(
    ...chartData.map((item) =>
      Math.max(item.revenue, item.profit)
    ),
    1
  );

  const chartStep = 500000;

  const chartMax = Math.max(
    chartStep,
    Math.ceil(maxChartValue / chartStep) * chartStep
  );

  const chartLevels = Array.from(
    {
      length: chartMax / chartStep + 1,
    },
    (_, index) => chartMax - index * chartStep
  );

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

  const goToReport = (path: string) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="max-w-[1700px] mx-auto space-y-5">

        {/* TOP ACTION */}
        <div className="flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold">
            + Thêm báo cáo
          </button>
        </div>

        {/* FILTER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">
            Báo cáo bán hàng
          </h1>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border bg-white rounded px-4 py-2 outline-none w-full md:w-60"
          >
            <option value="today">Hôm nay</option>
            <option value="yesterday">Hôm qua</option>
            <option value="7days">7 ngày qua</option>
            <option value="month">Tháng này</option>
            <option value="lastMonth">Tháng trước</option>
            <option value="q1">Quý 1</option>
            <option value="q2">Quý 2</option>
            <option value="q3">Quý 3</option>
            <option value="q4">Quý 4</option>
            <option value="year">Năm nay</option>
            <option value="lastYear">Năm ngoái</option>
            <option value="all">Tất cả</option>
          </select>
        </div>

        {/* REVENUE CHART FULL WIDTH */}
        <section className="bg-white p-5 rounded shadow-sm">
          <div className="flex items-start justify-between border-b pb-3 mb-4">
            <div>
              <h2 className="font-bold uppercase tracking-wide">
                Doanh thu cửa hàng
              </h2>

              <p className="text-gray-500 text-sm">
                {getFilterLabel()}
              </p>
            </div>

            <div className="text-3xl font-bold text-blue-600">
              {formatMoney(totalRevenue)}
            </div>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="text-blue-600 font-semibold text-sm">
              Theo ngày giao hàng
            </span>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-blue-600 font-semibold text-sm bg-transparent outline-none cursor-pointer"
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="7days">7 ngày qua</option>
              <option value="month">Tháng này</option>
              <option value="lastMonth">Tháng trước</option>
              <option value="q1">Quý 1</option>
              <option value="q2">Quý 2</option>
              <option value="q3">Quý 3</option>
              <option value="q4">Quý 4</option>
              <option value="year">Năm nay</option>
              <option value="lastYear">Năm ngoái</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <div className="relative mt-4">
            <div className="flex h-[300px]">

              {/* CỘT MỨC DOANH THU BÊN TRÁI */}
              <div className="w-[85px] h-[230px] relative text-xs text-gray-600">
                {chartLevels.map((level, index) => (
                  <div
                    key={index}
                    className="absolute right-2 -translate-y-1/2"
                    style={{
                      top: `${(index / (chartLevels.length - 1)) * 100}%`,
                    }}
                  >
                    {formatMoney(level)}
                  </div>
                ))}
              </div>

              {/* KHU VỰC BIỂU ĐỒ */}
              <div className="flex-1 overflow-x-auto pb-3">
                <div className="relative min-w-[1000px] h-[230px] border-b border-gray-300">

                  {/* ĐƯỜNG NGANG THEO MỨC DOANH THU */}
                  {chartLevels.map((level, index) => (
                    <div
                      key={index}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{
                        top: `${(index / (chartLevels.length - 1)) * 100}%`,
                      }}
                    />
                  ))}

                  {/* CỘT DOANH THU + LỢI NHUẬN */}
                  <div className="absolute inset-0 flex items-end justify-between px-8">
                    {chartData.map((item, index) => {
                      const chartInnerHeight = 210;

                      const revenueHeight =
                        chartMax > 0
                          ? (item.revenue / chartMax) * chartInnerHeight
                          : 0;

                      const profitHeight =
                        chartMax > 0
                          ? (item.profit / chartMax) * chartInnerHeight
                          : 0;

                      const tooltipBottom =
                        Math.max(
                          Math.max(revenueHeight, profitHeight) - 45,
                          28
                        );

                      return (
                        <div
                          key={index}
                          className="relative flex flex-col items-center justify-end h-full min-w-[70px]"
                        >
                          {hoverChart && hoverChart.index === index && (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 z-30 bg-white border border-gray-300 shadow-lg rounded px-3 py-2 text-sm whitespace-nowrap"
                              style={{
                                bottom: `${tooltipBottom}px`,
                              }}
                            >
                              <div className="font-semibold text-gray-800 mb-1">
                                {item.label}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>
                                  Doanh thu:{" "}
                                  <b>{formatMoney(item.revenue)}</b>
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span>
                                  Lợi nhuận:{" "}
                                  <b>{formatMoney(item.profit)}</b>
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-end gap-2 h-[210px]">
                            <div
                              className="w-10 bg-blue-400 hover:bg-blue-500 cursor-pointer transition"
                              style={{
                                height: `${Math.max(
                                  item.revenue > 0 ? 4 : 2,
                                  revenueHeight
                                )}px`,
                              }}
                              onMouseEnter={() =>
                                setHoverChart({
                                  index,
                                  type: "revenue",
                                })
                              }
                              onMouseLeave={() => setHoverChart(null)}
                            />

                            <div
                              className="w-4 bg-green-500 hover:bg-green-600 cursor-pointer transition"
                              style={{
                                height: `${Math.max(
                                  item.profit > 0 ? 4 : 2,
                                  profitHeight
                                )}px`,
                              }}
                              onMouseEnter={() =>
                                setHoverChart({
                                  index,
                                  type: "profit",
                                })
                              }
                              onMouseLeave={() => setHoverChart(null)}
                            />
                          </div>

                          <div className="absolute -bottom-7 text-xs text-gray-700 whitespace-nowrap">
                            {item.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-8 mt-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-5 h-3 bg-blue-400 inline-block" />
              Doanh thu
            </div>

            <div className="flex items-center gap-2">
              <span className="w-5 h-3 bg-green-500 inline-block" />
              Lợi nhuận
            </div>
          </div>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full border rounded mt-5 p-3 outline-none"
          >
            <option value="daily">Chọn loại báo cáo</option>
            <option value="revenue">Báo cáo doanh thu</option>
            <option value="profit">Báo cáo lợi nhuận</option>
          </select>

          <div className="text-yellow-500 text-sm mt-3">
            ● Gợi ý
          </div>
        </section>

        {/* BOTTOM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <section className="bg-white p-5 rounded shadow-sm min-h-56">
            <div className="flex justify-between border-b pb-3 mb-4">
              <div>
                <h2 className="font-bold uppercase">
                  Trả hàng
                </h2>

                <p className="text-gray-500 text-sm">
                  {getFilterLabel()}
                </p>
              </div>

              <div className="text-3xl font-bold text-blue-600">
                {returnedOrders}
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <button
                type="button"
                onClick={() => goToReport("/reports/returns/orders")}
                className="block hover:text-blue-600"
              >
                ▣ Trả hàng theo đơn hàng
              </button>

              <button
                type="button"
                onClick={() => goToReport("/reports/returns/products")}
                className="block hover:text-blue-600"
              >
                ◈ Trả hàng theo sản phẩm
              </button>
            </div>
          </section>

          <section className="bg-white p-5 rounded shadow-sm min-h-56">
            <div className="flex justify-between border-b pb-3 mb-4">
              <div>
                <h2 className="font-bold uppercase">
                  Thanh toán
                </h2>

                <p className="text-gray-500 text-sm">
                  {getFilterLabel()}
                </p>
              </div>

              <div className="text-3xl font-bold text-blue-600">
                {formatMoney(totalRevenue)}
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <button
                type="button"
                onClick={() => goToReport("/reports/finance")}
                className="block hover:text-blue-600"
              >
                ▣ Báo cáo thanh toán theo thời gian
              </button>

              <button
                type="button"
                onClick={() => goToReport("/reports/finance")}
                className="block hover:text-blue-600"
              >
                ▣ Báo cáo thanh toán theo nhân viên
              </button>

              <button
                type="button"
                onClick={() => goToReport("/reports/finance")}
                className="block hover:text-blue-600"
              >
                ▣ Báo cáo theo phương thức thanh toán
              </button>

              <button
                type="button"
                onClick={() => goToReport("/reports/finance")}
                className="block hover:text-blue-600"
              >
                ♙ Báo cáo thanh toán theo chi nhánh
              </button>
            </div>
          </section>

          <section className="bg-white p-5 rounded shadow-sm min-h-56">
            <div className="flex justify-between border-b pb-3 mb-4">
              <div>
                <h2 className="font-bold uppercase">
                  Đơn hàng
                </h2>

                <p className="text-gray-500 text-sm">
                  {getFilterLabel()}
                </p>
              </div>

              <div className="text-3xl font-bold text-blue-600">
                {totalOrders}
              </div>
            </div>

            <div className="space-y-4 text-gray-700">
              <button
                type="button"
                onClick={() => goToReport("/reports/orders")}
                className="block hover:text-blue-600"
              >
                ▣ Báo cáo thống kê theo đơn hàng
                <span className="ml-2 text-xs bg-red-500 text-white px-1 rounded">
                  New
                </span>
              </button>

              <button
                type="button"
                onClick={() => goToReport("/reports/products")}
                className="block hover:text-blue-600"
              >
                ▣ Báo cáo thống kê theo sản phẩm
              </button>

              <button
                type="button"
                onClick={() => goToReport("/reports/sales-detail")}
                className="block hover:text-blue-600"
              >
                ▣ Báo cáo bán hàng chi tiết
              </button>
            </div>
          </section>

        </div>

        {/* CUSTOM REPORT */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Báo cáo tùy chỉnh
          </h2>

          <button className="text-gray-600">
            Tất cả ▾
          </button>
        </div>

      </div>
    </main>
  );
}