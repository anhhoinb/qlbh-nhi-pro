"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type OrderItem = {
  name?: string;
  productName?: string;
  product_name?: string;
  sku?: string;
  code?: string;
  productCode?: string;
  product_code?: string;
  quantity?: number;
  qty?: number;
  total?: number;
  totalPrice?: number;
  amount?: number;
};

type OrderData = {
  id: string;
  total?: number;
  grand_total?: number;
  totalAmount?: number;
  createdAt?: any;
  status?: string;
  orderStatus?: string;
  paymentStatus?: string;
  items?: OrderItem[];
  products?: OrderItem[];
  cart?: OrderItem[];
};

type ProductData = {
  id: string;
  name?: string;
  productName?: string;
  product_name?: string;
  sku?: string;
  code?: string;
  stock?: number;
  quantity?: number;
  inventory?: number;
  price?: number;
  sellPrice?: number;
  salePrice?: number;
  costPrice?: number;
  cost_price?: number;
  capital_price?: number;
  import_price?: number;
  importPrice?: number;
  purchasePrice?: number;
  minStock?: number;
  min_stock?: number;
};

type RangeOption =
  | "today"
  | "yesterday"
  | "7days"
  | "thisMonth"
  | "lastMonth"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "thisYear"
  | "lastYear";

export default function DashboardPage() {
  const router = useRouter();

  const [checkingPermission, setCheckingPermission] =
    useState(true);

  const [orders, setOrders] =
    useState<OrderData[]>([]);

  const [products, setProducts] =
    useState<ProductData[]>([]);

  const [totalCustomers, setTotalCustomers] =
    useState(0);

  const [branchFilter, setBranchFilter] =
    useState("all");

  const [rangeFilter, setRangeFilter] =
    useState<RangeOption>("7days");

  const [topProductRangeFilter, setTopProductRangeFilter] =
    useState<RangeOption>("7days");

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  const getOrderTotal = (order: any) => {
    return Number(
      order.total ||
        order.grand_total ||
        order.totalAmount ||
        0
    );
  };

  const getOrderItems = (order: any) => {
    return (
      order.items ||
      order.products ||
      order.cart ||
      []
    );
  };

  const getProductName = (item: any) => {
    return (
      item.name ||
      item.productName ||
      item.product_name ||
      "Sản phẩm"
    );
  };

  const getProductSku = (item: any) => {
    return (
      item.sku ||
      item.code ||
      item.productCode ||
      item.product_code ||
      ""
    );
  };

  const getItemQuantity = (item: any) => {
    return Number(
      item.quantity ||
      item.qty ||
      0
    );
  };

  const getProductStock = (product: any) => {
    return Number(
      product.stock ||
      product.quantity ||
      product.inventory ||
      0
    );
  };

  const getProductCost = (product: any) => {
    return Number(
      product.capital_price ??
      product.import_price ??
      product.costPrice ??
      product.cost_price ??
      product.importPrice ??
      product.purchasePrice ??
      0
    );
  };

  const getProductMinStock = (product: any) => {
    return Number(
      product.minStock ||
      product.min_stock ||
      0
    );
  };

  const getOrderDate = (order: any) => {
    if (!order.createdAt) return null;

    if (order.createdAt.seconds) {
      return new Date(order.createdAt.seconds * 1000);
    }

    if (order.createdAt.toDate) {
      return order.createdAt.toDate();
    }

    const date = new Date(order.createdAt);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  const isSameDay = (dateA: Date, dateB: Date) => {
    return (
      dateA.getDate() === dateB.getDate() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getFullYear() === dateB.getFullYear()
    );
  };

  const isDateInRange = (
    date: Date,
    start: Date,
    end: Date
  ) => {
    return (
      date.getTime() >= start.getTime() &&
      date.getTime() <= end.getTime()
    );
  };

  const rangeOptions: {
    value: RangeOption;
    label: string;
  }[] = [
    {
      value: "today",
      label: "Hôm nay",
    },
    {
      value: "yesterday",
      label: "Hôm qua",
    },
    {
      value: "7days",
      label: "7 ngày qua",
    },
    {
      value: "thisMonth",
      label: "Tháng này",
    },
    {
      value: "lastMonth",
      label: "Tháng trước",
    },
    {
      value: "q1",
      label: "Quý 1",
    },
    {
      value: "q2",
      label: "Quý 2",
    },
    {
      value: "q3",
      label: "Quý 3",
    },
    {
      value: "q4",
      label: "Quý 4",
    },
    {
      value: "thisYear",
      label: "Năm nay",
    },
    {
      value: "lastYear",
      label: "Năm trước",
    },
  ];

  const getDateRangeByValue = (value: RangeOption) => {
    const now = new Date();

    const start = new Date(now);
    const end = new Date(now);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (value === "today") {
      return {
        start,
        end,
      };
    }

    if (value === "yesterday") {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    }

    if (value === "7days") {
      start.setDate(now.getDate() - 6);
    }

    if (value === "thisMonth") {
      start.setDate(1);
    }

    if (value === "lastMonth") {
      start.setFullYear(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      end.setFullYear(
        now.getFullYear(),
        now.getMonth(),
        0
      );
    }

    if (value === "q1") {
      start.setFullYear(now.getFullYear(), 0, 1);
      end.setFullYear(now.getFullYear(), 2, 31);
    }

    if (value === "q2") {
      start.setFullYear(now.getFullYear(), 3, 1);
      end.setFullYear(now.getFullYear(), 5, 30);
    }

    if (value === "q3") {
      start.setFullYear(now.getFullYear(), 6, 1);
      end.setFullYear(now.getFullYear(), 8, 30);
    }

    if (value === "q4") {
      start.setFullYear(now.getFullYear(), 9, 1);
      end.setFullYear(now.getFullYear(), 11, 31);
    }

    if (value === "thisYear") {
      start.setFullYear(now.getFullYear(), 0, 1);
      end.setFullYear(now.getFullYear(), 11, 31);
    }

    if (value === "lastYear") {
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start,
      end,
    };
  };

  const getDateRange = () => {
    return getDateRangeByValue(rangeFilter);
  };

  const getRangeDays = () => {
    const { start, end } = getDateRange();

    const diff =
      end.getTime() - start.getTime();

    return Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );
  };

  const getChartStepType = () => {
    const days = getRangeDays();

    if (days <= 31) {
      return "day";
    }

    return "month";
  };

  const formatChartLabel = (date: Date) => {
    const stepType = getChartStepType();

    if (stepType === "day") {
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    }

    return date.toLocaleDateString("vi-VN", {
      month: "2-digit",
      year: "2-digit",
    });
  };

  const RangeSelect = () => {
    return (
      <select
        value={rangeFilter}
        onChange={(e) =>
          setRangeFilter(e.target.value as RangeOption)
        }
        className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white outline-none min-w-[130px] focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {rangeOptions.map((item) => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>
    );
  };

  const TopProductRangeSelect = () => {
    return (
      <select
        value={topProductRangeFilter}
        onChange={(e) =>
          setTopProductRangeFilter(e.target.value as RangeOption)
        }
        className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white outline-none min-w-[130px] focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {rangeOptions.map((item) => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>
    );
  };

  const loadDashboard = async () => {
    const ordersSnapshot =
      await getDocs(
        collection(db, "orders")
      );

    const ordersData: OrderData[] = [];

    ordersSnapshot.forEach((doc) => {
      ordersData.push({
        id: doc.id,
        ...doc.data(),
      } as OrderData);
    });

    setOrders(ordersData);

    const productsSnapshot =
      await getDocs(
        collection(db, "products")
      );

    const productsData: ProductData[] = [];

    productsSnapshot.forEach((doc) => {
      productsData.push({
        id: doc.id,
        ...doc.data(),
      } as ProductData);
    });

    setProducts(productsData);

    const customersSnapshot =
      await getDocs(
        collection(db, "customers")
      );

    setTotalCustomers(
      customersSnapshot.size
    );
  };

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.replace("/login");
          return;
        }

        try {
          const userRef =
            doc(db, "users", user.uid);

          const userSnap =
            await getDoc(userRef);

          if (!userSnap.exists()) {
            router.replace("/login");
            return;
          }

          const userData: any =
            userSnap.data();

          const role =
            String(userData.role || "")
              .trim()
              .toLowerCase();

          const permissions =
            userData.permissions || {};

          const active =
            userData.active !== false;

          if (!active) {
            alert("Tài khoản đã bị khóa");
            router.replace("/login");
            return;
          }

          const isAdmin =
            role === "admin" ||
            permissions.admin === true;

          const canViewDashboard =
            isAdmin ||
            permissions.dashboard === true;

          if (!canViewDashboard) {
            router.replace("/pos");
            return;
          }

          setCheckingPermission(false);
          await loadDashboard();
        } catch (error) {
          console.error(error);
          router.replace("/login");
        }
      });

    return () => unsubscribe();
  }, [router]);

  const todayStats = useMemo(() => {
    const today = new Date();

    const todayOrders = orders.filter((order) => {
      const date = getOrderDate(order);
      return date ? isSameDay(date, today) : false;
    });

    const revenue = todayOrders.reduce((sum, order) => {

  const status = String(
    order.status ||
    order.orderStatus ||
    ""
  ).toLowerCase();

  if ([
    "cancel",
    "cancelled",
    "canceled",
    "huy",
    "hủy"
  ].includes(status)) {
    return sum;
  }

  return sum + getOrderTotal(order);

}, 0);

    const canceled = todayOrders.filter((order) => {
      const status =
        order.status ||
        order.orderStatus ||
        "";

      return [
        "cancel",
        "canceled",
        "cancelled",
        "huy",
        "hủy",
      ].includes(String(status).toLowerCase());
    }).length;

    const returned = todayOrders.filter((order) => {
      const status =
        order.status ||
        order.orderStatus ||
        "";

      return [
        "return",
        "returned",
        "tra-hang",
        "trả hàng",
      ].includes(String(status).toLowerCase());
    }).length;

    return {
      revenue,
      newOrders: todayOrders.filter((order) => {
  const status = String(
    order.status ||
    order.orderStatus ||
    ""
  ).toLowerCase();

  return ![
    "cancel",
    "cancelled",
    "canceled",
    "huy",
    "hủy",
  ].includes(status);
}).length,
      returned,
      canceled,
    };
  }, [orders]);

  const filteredOrdersByRange = useMemo(() => {
    const { start, end } = getDateRange();

    return orders.filter((order) => {
      const orderDate = getOrderDate(order);

      if (!orderDate) {
        return false;
      }

      return isDateInRange(
        orderDate,
        start,
        end
      );
    });
  }, [orders, rangeFilter]);

  const filteredOrdersForTopProducts = useMemo(() => {
    const { start, end } =
      getDateRangeByValue(topProductRangeFilter);

    return orders.filter((order) => {
      const orderDate = getOrderDate(order);

      if (!orderDate) {
        return false;
      }

      return isDateInRange(
        orderDate,
        start,
        end
      );
    });
  }, [orders, topProductRangeFilter]);

  const chartData = useMemo(() => {
    const { start, end } = getDateRange();
    const stepType = getChartStepType();

    const result: {
      label: string;
      revenue: number;
    }[] = [];

    if (stepType === "day") {
      const current = new Date(start);

      while (current <= end) {
        const date = new Date(current);

          const revenue = orders.reduce(
  (sum, order) => {

    const orderDate = getOrderDate(order);

    const status = String(
      order.status ||
      order.orderStatus ||
      ""
    ).toLowerCase();

    if (
      [
        "cancel",
        "cancelled",
        "canceled",
        "huy",
        "hủy"
      ].includes(status)
    ) {
      return sum;
    }

    if (
      orderDate &&
      isSameDay(orderDate, date)
    ) {
      return sum + getOrderTotal(order);
    }

            return sum;
          },
          0
        );

        result.push({
          label: formatChartLabel(date),
          revenue,
        });

        current.setDate(current.getDate() + 1);
      }
    } else {
      const current = new Date(
        start.getFullYear(),
        start.getMonth(),
        1
      );

      while (current <= end) {
        const month = current.getMonth();
        const year = current.getFullYear();

        const revenue = orders.reduce(
  (sum, order) => {
    const orderDate = getOrderDate(order);

    const status = String(
      order.status ||
      order.orderStatus ||
      ""
    ).toLowerCase();

    // Không tính đơn đã hủy
    if (
      [
        "cancel",
        "cancelled",
        "canceled",
        "huy",
        "hủy",
      ].includes(status)
    ) {
      return sum;
    }

    if (
      orderDate &&
      orderDate.getMonth() === month &&
      orderDate.getFullYear() === year
    ) {
      return sum + getOrderTotal(order);
    }

    return sum;
  },
  0
);

        result.push({
          label: formatChartLabel(current),
          revenue,
        });

        current.setMonth(current.getMonth() + 1);
      }
    }

    return result;
  }, [orders, rangeFilter]);

  const maxChartRevenue = useMemo(() => {
    return Math.max(
      ...chartData.map((item) => item.revenue),
      1
    );
  }, [chartData]);

  const chartYAxis = useMemo(() => {
    const max = maxChartRevenue;

    if (max <= 500000) {
      return [
        500000,
        400000,
        300000,
        200000,
        100000,
        0,
      ];
    }

    const step =
      Math.ceil(max / 5 / 500000) * 500000;

    const top = step * 5;

    return [
      top,
      step * 4,
      step * 3,
      step * 2,
      step,
      0,
    ];
  }, [maxChartRevenue]);

  const totalChartRevenue = useMemo(() => {
    return chartData.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
  }, [chartData]);

  const pendingStats = useMemo(() => {
    const countByStatus = (keys: string[]) => {
      return filteredOrdersByRange.filter((order) => {
        const status = String(
          order.status ||
            order.orderStatus ||
            order.paymentStatus ||
            ""
        ).toLowerCase();

        return keys.includes(status);
      }).length;
    };

    return {
      pendingApprove: countByStatus([
        "pending",
        "cho-duyet",
        "chờ duyệt",
      ]),
      pendingPayment: countByStatus([
        "pending_payment",
        "unpaid",
        "cho-thanh-toan",
        "chờ thanh toán",
      ]),
      packing: countByStatus([
        "packing",
        "cho-dong-goi",
        "chờ đóng gói",
      ]),
      waitingPickup: countByStatus([
        "waiting_pickup",
        "cho-lay-hang",
        "chờ lấy hàng",
      ]),
      shipping: countByStatus([
        "shipping",
        "dang-giao-hang",
        "đang giao hàng",
      ]),
      deliveryCanceled: countByStatus([
        "delivery_canceled",
        "huy-giao",
        "hủy giao",
      ]),
    };
  }, [filteredOrdersByRange]);

  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        sku: string;
        quantity: number;
      }
    >();

    filteredOrdersForTopProducts.forEach((order) => {

  const status = String(
    order.status ||
    order.orderStatus ||
    ""
  ).toLowerCase();

  if (
    [
      "cancel",
      "cancelled",
      "canceled",
      "huy",
      "hủy"
    ].includes(status)
  ) {
    return;
  }

  getOrderItems(order).forEach((item: any) => {

    const name = getProductName(item);
    const sku = getProductSku(item);
    const key = sku || name;
    const quantity = getItemQuantity(item);

    if (!map.has(key)) {
      map.set(key, {
        name,
        sku,
        quantity: 0,
      });
    }

    map.get(key)!.quantity += quantity;
  });

});

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrdersForTopProducts]);

  const inventoryStats = useMemo(() => {
    const lowStock = products.filter((product) => {
      const minStock = getProductMinStock(product);

      if (minStock <= 0) {
        return false;
      }

      return getProductStock(product) <= minStock;
    }).length;

    const totalStock = products.reduce(
      (sum, product) =>
        sum + getProductStock(product),
      0
    );

    const inventoryValue = products.reduce(
      (sum, product) =>
        sum +
        getProductStock(product) *
          getProductCost(product),
      0
    );

    return {
      lowStock,
      totalStock,
      inventoryValue,
    };
  }, [products]);

  const StatCard = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: string | number;
    color: string;
  }) => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <p
          className={`text-2xl font-bold mt-2 ${color}`}
        >
          {value}
        </p>
      </div>
    );
  };

  const PendingItem = ({
    icon,
    label,
    value,
  }: {
    icon: string;
    label: string;
    value: number;
  }) => {
    return (
      <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-base shrink-0">
          {icon}
        </div>

        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="font-bold text-lg text-slate-900">
            {value}
          </p>
        </div>
      </div>
    );
  };

  if (checkingPermission) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center text-black">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          <p className="font-semibold text-slate-800">
            Đang kiểm tra quyền truy cập...
          </p>

          <p className="text-sm text-slate-500 mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-4 text-black">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Tổng quan hoạt động bán hàng hôm nay
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/pos")}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
        >
          + Tạo đơn hàng
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <StatCard
          label="Doanh thu hôm nay"
          value={`${formatMoney(todayStats.revenue)}đ`}
          color="text-sky-700"
        />

        <StatCard
          label="Đơn hàng hôm nay"
          value={todayStats.newOrders}
          color="text-emerald-600"
        />

        <StatCard
          label="Khách hàng"
          value={totalCustomers}
          color="text-amber-600"
        />

        <StatCard
          label="Sản phẩm"
          value={products.length}
          color="text-violet-600"
        />
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              Doanh thu bán hàng
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Theo dõi doanh thu theo thời gian
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={branchFilter}
              onChange={(e) =>
                setBranchFilter(e.target.value)
              }
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white outline-none min-w-[140px] focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">
                Tất cả chi nhánh
              </option>
              <option value="default">
                Chi nhánh mặc định
              </option>
            </select>

            <RangeSelect />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.9fr_1fr] gap-4 p-4">
          <div className="min-w-0">
            <div className="h-[245px] relative border-b border-slate-200 overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between text-xs text-slate-500 pointer-events-none">
                {chartYAxis.map((value, index) => (
                  <div
                    key={`${value}-${index}`}
                    className="border-t border-slate-100"
                  >
                    <span className="inline-block w-20 bg-white pr-2">
                      {formatMoney(value)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative z-10 h-full pl-20 pr-3 overflow-hidden">
                <div
                  className="grid h-full items-end gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))`,
                  }}
                >
                  {chartData.map((item) => {
                    const height =
                      item.revenue > 0
                        ? Math.max(
                            6,
                            (item.revenue /
                              chartYAxis[0]) *
                              205
                          )
                        : 0;

                    return (
                      <div
                        key={item.label}
                        className="group flex flex-col items-center justify-end min-w-0 h-full relative"
                      >
                        <div
                          className="absolute hidden group-hover:block bg-white border shadow-lg rounded-lg px-3 py-2 text-sm z-30 whitespace-nowrap"
                          style={{
                            bottom: `${height + 28}px`,
                          }}
                        >
                          <div className="font-semibold mb-1">
                            {item.label}
                          </div>

                          <div>
                            <span className="text-sky-600">
                              ●
                            </span>{" "}
                            Doanh thu:{" "}
                            <b>
                              {formatMoney(item.revenue)}đ
                            </b>
                          </div>
                        </div>

                        <div
                          className="w-full max-w-[28px] bg-sky-400 rounded-t hover:bg-sky-500 transition"
                          style={{
                            height: `${height}px`,
                          }}
                        />

                        <div className="text-xs mt-2 text-slate-700 whitespace-nowrap">
                          {item.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-5 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-sky-400 inline-block rounded" />
                <span>Doanh thu</span>
              </div>
            </div>

            <div className="text-center mt-2 text-sm text-slate-700">
              Tổng doanh thu:{" "}
              <span className="font-bold text-sky-700">
                {formatMoney(totalChartRevenue)}đ
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 min-w-0 h-full">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-bold text-lg text-slate-900">
                  Top sản phẩm
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  5 sản phẩm bán chạy
                </p>
              </div>

              <TopProductRangeSelect />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {topProducts.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {topProducts.map((product, index) => {
                    const maxQuantity =
                      topProducts[0]?.quantity || 1;

                    const percent =
                      Math.max(
                        8,
                        Math.round(
                          (product.quantity / maxQuantity) *
                            100
                        )
                      );

                    return (
                      <div
                        key={`${product.sku}-${product.name}-${index}`}
                        className="px-3 py-2.5 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              index === 0
                                ? "bg-sky-600 text-white"
                                : index === 1
                                ? "bg-sky-100 text-sky-700"
                                : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-semibold text-base text-slate-900 truncate">
                                {product.name}
                              </div>

                              <div className="text-base font-bold text-sky-700 shrink-0">
                                {product.quantity}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 mt-0.5">
                              <div className="text-xs text-slate-500 truncate">
                                Mã: {product.sku || "---"}
                              </div>

                              <div className="text-xs text-slate-400 shrink-0">
                                đã bán
                              </div>
                            </div>

                            <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-600 rounded-full"
                                style={{
                                  width: `${percent}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {Array.from({
                    length: Math.max(
                      0,
                      5 - topProducts.length
                    ),
                  }).map((_, index) => (
                    <div
                      key={`empty-top-product-${index}`}
                      className="px-3 py-2.5 opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-bold shrink-0">
                          {topProducts.length + index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-base text-slate-400">
                              Chưa có dữ liệu
                            </div>

                            <div className="text-base font-bold text-slate-300">
                              0
                            </div>
                          </div>

                          <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-200 rounded-full w-[8%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {Array.from({
                    length: 5,
                  }).map((_, index) => (
                    <div
                      key={`empty-top-product-${index}`}
                      className="px-3 py-2.5 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-bold shrink-0">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-base text-slate-400">
                              Chưa có dữ liệu
                            </div>

                            <div className="text-base font-bold text-slate-300">
                              0
                            </div>
                          </div>

                          <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-200 rounded-full w-[8%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 py-3 border-b border-slate-200">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Đơn hàng chờ xử lý
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Trạng thái đơn hàng trong khoảng thời gian đã chọn
              </p>
            </div>

            <RangeSelect />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
            <PendingItem
              icon="📋"
              label="Chờ duyệt"
              value={pendingStats.pendingApprove}
            />

            <PendingItem
              icon="💳"
              label="Chờ thanh toán"
              value={pendingStats.pendingPayment}
            />

            <PendingItem
              icon="📦"
              label="Chờ đóng gói"
              value={pendingStats.packing}
            />

            <PendingItem
              icon="🚚"
              label="Chờ lấy hàng"
              value={pendingStats.waitingPickup}
            />

            <PendingItem
              icon="🚛"
              label="Đang giao hàng"
              value={pendingStats.shipping}
            />

            <PendingItem
              icon="↩"
              label="Hủy giao - chờ nhận"
              value={pendingStats.deliveryCanceled}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                Thông tin kho
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Tổng quan tồn kho hiện tại
              </p>
            </div>

            <select
              value={branchFilter}
              onChange={(e) =>
                setBranchFilter(e.target.value)
              }
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white outline-none min-w-[140px] focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">
                Tất cả chi nhánh
              </option>
              <option value="default">
                Chi nhánh mặc định
              </option>
            </select>
          </div>

          <div className="p-4 space-y-3">
            <Link
              href="/reports/inventory?filter=low-stock"
              className="bg-slate-50 hover:bg-sky-50 rounded-xl p-4 flex items-center justify-between transition cursor-pointer group"
            >
              <div>
                <div className="text-sm text-slate-500">
                  Sản phẩm dưới định mức
                </div>

                <div className="font-bold text-xl text-rose-600 mt-1">
                  {inventoryStats.lowStock}
                </div>
              </div>

              <span className="text-2xl text-slate-400 group-hover:text-sky-700">
                ›
              </span>
            </Link>

            <Link
              href="/reports/inventory"
              className="bg-slate-50 hover:bg-sky-50 rounded-xl p-4 flex items-center justify-between transition cursor-pointer group"
            >
              <div>
                <div className="text-sm text-slate-500">
                  Tổng số lượng tồn kho
                </div>

                <div className="font-bold text-xl text-sky-700 mt-1">
                  {formatMoney(inventoryStats.totalStock)}
                </div>
              </div>

              <span className="text-2xl text-slate-400 group-hover:text-sky-700">
                ›
              </span>
            </Link>

            <Link
              href="/reports/inventory"
              className="bg-slate-50 hover:bg-sky-50 rounded-xl p-4 flex items-center justify-between transition cursor-pointer group"
            >
              <div>
                <div className="text-sm text-slate-500">
                  Giá trị tồn kho
                </div>

                <div className="font-bold text-xl text-emerald-600 mt-1">
                  {formatMoney(inventoryStats.inventoryValue)}đ
                </div>
              </div>

              <span className="text-2xl text-slate-400 group-hover:text-sky-700">
                ›
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}