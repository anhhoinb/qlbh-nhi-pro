"use client";

import { useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

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

  const getProductPrice = (product: any) => {
    return Number(
      product.price ||
      product.sellPrice ||
      product.salePrice ||
      product.costPrice ||
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

  const getDateRange = () => {
    const now = new Date();

    const start = new Date(now);
    const end = new Date(now);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (rangeFilter === "today") {
      return {
        start,
        end,
      };
    }

    if (rangeFilter === "yesterday") {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    }

    if (rangeFilter === "7days") {
      start.setDate(now.getDate() - 6);
    }

    if (rangeFilter === "thisMonth") {
      start.setDate(1);
    }

    if (rangeFilter === "lastMonth") {
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

    if (rangeFilter === "q1") {
      start.setFullYear(now.getFullYear(), 0, 1);
      end.setFullYear(now.getFullYear(), 2, 31);
    }

    if (rangeFilter === "q2") {
      start.setFullYear(now.getFullYear(), 3, 1);
      end.setFullYear(now.getFullYear(), 5, 30);
    }

    if (rangeFilter === "q3") {
      start.setFullYear(now.getFullYear(), 6, 1);
      end.setFullYear(now.getFullYear(), 8, 30);
    }

    if (rangeFilter === "q4") {
      start.setFullYear(now.getFullYear(), 9, 1);
      end.setFullYear(now.getFullYear(), 11, 31);
    }

    if (rangeFilter === "thisYear") {
      start.setFullYear(now.getFullYear(), 0, 1);
      end.setFullYear(now.getFullYear(), 11, 31);
    }

    if (rangeFilter === "lastYear") {
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
      label: "7 ngày",
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

  const RangeSelect = () => {
    return (
      <select
        value={rangeFilter}
        onChange={(e) =>
          setRangeFilter(e.target.value as RangeOption)
        }
        className="border rounded px-4 py-2 text-sm bg-white"
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
    loadDashboard();
  }, []);

  const todayStats = useMemo(() => {
    const today = new Date();

    const todayOrders = orders.filter((order) => {
      const date = getOrderDate(order);
      return date ? isSameDay(date, today) : false;
    });

    const revenue = todayOrders.reduce(
      (sum, order) => sum + getOrderTotal(order),
      0
    );

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
      newOrders: todayOrders.length,
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

    if (max <= 0) {
      return [
        0,
        0,
        0,
        0,
        0,
        0,
      ];
    }

    const step =
      Math.ceil(max / 5 / 1000) * 1000 || 1000;

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

    filteredOrdersByRange.forEach((order) => {
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
  }, [filteredOrdersByRange]);

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
          getProductPrice(product),
      0
    );

    return {
      lowStock,
      totalStock,
      inventoryValue,
    };
  }, [products]);

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
  }) => {
    return (
      <div className="flex items-center gap-4 px-6 py-5 border-r last:border-r-0">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-xl ${color}`}
        >
          {icon}
        </div>

        <div>
          <div className="font-semibold text-gray-800">
            {label}
          </div>

          <div className="text-blue-700 font-bold mt-1">
            {value}
          </div>
        </div>
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
      <div className="flex flex-col items-center justify-center py-5 border-r last:border-r-0">
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl mb-2">
          {icon}
        </div>

        <div className="text-sm text-gray-700">
          {label}
        </div>

        <div className="font-bold text-lg">
          {value}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-100 p-4 space-y-5">
      {/* KẾT QUẢ KINH DOANH */}
      <section className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="font-bold text-lg text-gray-800 uppercase">
            Kết quả kinh doanh trong ngày
          </h2>

          <select
            value={branchFilter}
            onChange={(e) =>
              setBranchFilter(e.target.value)
            }
            className="border rounded px-4 py-2 text-sm bg-white min-w-[190px]"
          >
            <option value="all">
              Tất cả chi nhánh
            </option>
            <option value="default">
              Chi nhánh mặc định
            </option>
          </select>
        </div>

        <div className="grid grid-cols-4">
          <StatCard
            icon="💰"
            label="Doanh thu"
            value={formatMoney(todayStats.revenue)}
            color="bg-blue-500"
          />

          <StatCard
            icon="🧾"
            label="Đơn hàng mới"
            value={todayStats.newOrders}
            color="bg-green-500"
          />

          <StatCard
            icon="↩"
            label="Đơn trả hàng"
            value={todayStats.returned}
            color="bg-yellow-500"
          />

          <StatCard
            icon="✖"
            label="Đơn hủy"
            value={todayStats.canceled}
            color="bg-red-500"
          />
        </div>
      </section>

      {/* BIỂU ĐỒ */}
      <section className="bg-white shadow-sm">
        <div className="flex items-center justify-between border-b">
          <div className="flex">
            <button
              type="button"
              className="px-5 py-4 font-bold text-blue-700 border-b-2 border-blue-700"
            >
              DOANH THU BÁN HÀNG
            </button>
          </div>

          <div className="flex items-center gap-3 pr-4">
            <select
              value={branchFilter}
              onChange={(e) =>
                setBranchFilter(e.target.value)
              }
              className="border rounded px-4 py-2 text-sm bg-white min-w-[190px]"
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

        <div className="px-8 pt-8 pb-4">
          <div className="h-[300px] flex items-end border-b border-gray-300 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-full flex flex-col justify-between text-xs text-gray-500 pointer-events-none">
              {chartYAxis.map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className="border-t"
                >
                  {formatMoney(value)}
                </div>
              ))}
            </div>

            <div className="relative z-10 flex items-end gap-4 w-full h-full pl-20 pr-8 overflow-x-auto">
              {chartData.map((item) => {
                const height =
                  item.revenue > 0
                    ? Math.max(
                        8,
                        (item.revenue /
                          maxChartRevenue) *
                          260
                      )
                    : 0;

                return (
                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-end min-w-[55px] flex-1 h-full"
                  >
                    <div
                      className="w-full max-w-[70px] bg-blue-400 rounded-t"
                      style={{
                        height: `${height}px`,
                      }}
                      title={`${item.label}: ${formatMoney(
                        item.revenue
                      )}đ`}
                    />

                    <div className="text-xs mt-3 text-gray-700 whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-4 text-sm text-gray-700">
            Tổng doanh thu:{" "}
            <span className="font-semibold">
              {formatMoney(totalChartRevenue)}
            </span>
          </div>
        </div>
      </section>

      {/* ĐƠN HÀNG CHỜ XỬ LÝ */}
      <section className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="font-bold text-lg text-gray-800 uppercase">
            Đơn hàng chờ xử lý
          </h2>

          <RangeSelect />
        </div>

        <div className="grid grid-cols-6">
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
      </section>

      {/* BOTTOM */}
      <section className="grid grid-cols-2 gap-5">
        {/* TOP SẢN PHẨM */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="font-bold text-lg text-gray-800 uppercase">
              Top sản phẩm
            </h2>

            <div className="flex gap-2">
              <RangeSelect />

              <button
                type="button"
                className="border rounded px-4 py-2"
              >
                ...
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div
                  key={`${product.sku}-${product.name}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0
                          ? "bg-blue-500"
                          : index === 1
                          ? "bg-green-400"
                          : index === 2
                          ? "bg-yellow-400"
                          : index === 3
                          ? "bg-red-300"
                          : "bg-sky-300"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div>
                      <div className="font-semibold">
                        {product.name}
                      </div>

                      <div className="text-xs text-gray-500">
                        {product.sku || "---"}
                      </div>
                    </div>
                  </div>

                  <div className="font-bold">
                    {product.quantity}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">
                Chưa có dữ liệu sản phẩm bán chạy
              </div>
            )}
          </div>
        </div>

        {/* THÔNG TIN KHO */}
        <div className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="font-bold text-lg text-gray-800 uppercase">
              Thông tin kho
            </h2>

            <select
              value={branchFilter}
              onChange={(e) =>
                setBranchFilter(e.target.value)
              }
              className="border rounded px-4 py-2 text-sm bg-white min-w-[190px]"
            >
              <option value="all">
                Tất cả chi nhánh
              </option>
              <option value="default">
                Chi nhánh mặc định
              </option>
            </select>
          </div>

          <div className="p-5 space-y-4">
            <div className="bg-blue-50 rounded p-4 flex items-center justify-between">
              <div>
                <div className="text-gray-500">
                  Sản phẩm dưới định mức
                </div>

                <div className="font-bold text-lg">
                  {inventoryStats.lowStock}
                </div>
              </div>

              <span className="text-xl text-gray-500">
                ›
              </span>
            </div>

            <div className="bg-blue-50 rounded p-4 flex items-center justify-between">
              <div>
                <div className="text-gray-500">
                  Số tồn kho chi nhánh
                </div>

                <div className="font-bold text-lg">
                  {formatMoney(inventoryStats.totalStock)}
                </div>
              </div>

              <span className="text-xl text-gray-500">
                ›
              </span>
            </div>

            <div className="bg-blue-50 rounded p-4 flex items-center justify-between">
              <div>
                <div className="text-gray-500">
                  Giá trị tồn kho chi nhánh
                </div>

                <div className="font-bold text-lg">
                  {formatMoney(inventoryStats.inventoryValue)}
                </div>
              </div>

              <span className="text-xl text-gray-500">
                ›
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}