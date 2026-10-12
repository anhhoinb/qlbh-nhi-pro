
"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type RestockItem = {
  productId: string;
  productName: string;
  productCode: string;
  productLocation: string;
  beforeStock: number;
  quantity: number;
  afterStock: number;
  unitPrice?: number;
  lineTotal?: number;
};

type RestockOrder = {
  id: string;
  code: string;
  itemCount: number;
  totalQuantity: number;
  totalAmount?: number;
  items: RestockItem[];
  createdAt?: any;
  createdBy?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdByRole?: string;
};

type FilterMode = "month" | "year" | "all";

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN");

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

function toDate(value: any): Date | null {
  if (!value) return null;

  let date: Date;

  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (typeof value.seconds === "number") {
    date = new Date(value.seconds * 1000);
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: any): string {
  const date = toDate(value);

  return date
    ? date.toLocaleString("vi-VN")
    : "Chưa có ngày";
}

function readCanViewCostPrice(): boolean {
  try {
    const raw = localStorage.getItem("currentUserInfo");

    if (!raw) return false;

    const user = JSON.parse(raw);

    const isAdmin =
      String(user.role || "").toLowerCase() === "admin" ||
      user.permissions?.admin === true;

    return (
      isAdmin ||
      user.viewCostPrice === true ||
      user.permissions?.viewCostPrice === true
    );
  } catch (error) {
    console.error("Không đọc được quyền tài khoản:", error);
    return false;
  }
}

function hasValidPrice(item: RestockItem): boolean {
  return (
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice >= 0
  );
}

function getOrderAmount(
  order: RestockOrder
): number | null {
  if (order.items.length > 0) {
    if (!order.items.every(hasValidPrice)) {
      return null;
    }

    return order.items.reduce(
      (sum, item) =>
        sum + item.quantity * Number(item.unitPrice),
      0
    );
  }

  if (
    typeof order.totalAmount === "number" &&
    Number.isFinite(order.totalAmount) &&
    order.totalAmount >= 0
  ) {
    return order.totalAmount;
  }

  return null;
}

function getCreatorName(order: RestockOrder): string {
  return (
    order.createdByName?.trim() ||
    order.createdByUsername?.trim() ||
    order.createdBy?.trim() ||
    "Chưa ghi nhận"
  );
}

function getCreatorRole(order: RestockOrder): string {
  const role = String(order.createdByRole || "")
    .trim()
    .toLowerCase();

  if (role === "admin") return "Admin";

  if (
    role === "staff" ||
    role === "employee" ||
    role === "user" ||
    role === "nhanvien"
  ) {
    return "Nhân viên";
  }

  return order.createdByRole || "";
}

function normalizeOrder(
  id: string,
  raw: any
): RestockOrder {
  const rawItems: any[] = Array.isArray(raw.items)
    ? raw.items
    : raw.productId ||
        raw.productName ||
        raw.quantity !== undefined
      ? [
          {
            productId: raw.productId,
            productName: raw.productName,
            productCode: raw.productCode,
            productLocation: raw.productLocation,
            beforeStock:
              raw.beforeStock ?? raw.stockBefore,
            quantity: raw.quantity,
            afterStock:
              raw.afterStock ?? raw.stockAfter,
            unitPrice: raw.unitPrice,
            lineTotal: raw.lineTotal,
          },
        ]
      : [];

  const items: RestockItem[] = rawItems.map(
    (item: any) => {
      const unitPrice =
        item.unitPrice !== undefined &&
        item.unitPrice !== null &&
        item.unitPrice !== "" &&
        Number.isFinite(Number(item.unitPrice))
          ? Number(item.unitPrice)
          : undefined;

      const lineTotal =
        item.lineTotal !== undefined &&
        item.lineTotal !== null &&
        Number.isFinite(Number(item.lineTotal))
          ? Number(item.lineTotal)
          : undefined;

      return {
        productId: String(item.productId || ""),
        productName: String(
          item.productName || "Không xác định"
        ),
        productCode: String(item.productCode || ""),
        productLocation: String(
          item.productLocation || ""
        ),
        beforeStock: Number(
          item.beforeStock ?? item.stockBefore ?? 0
        ),
        quantity: Number(item.quantity || 0),
        afterStock: Number(
          item.afterStock ?? item.stockAfter ?? 0
        ),
        unitPrice,
        lineTotal,
      };
    }
  );

  const totalQuantity = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const rawAmount =
    raw.totalAmount !== undefined &&
    raw.totalAmount !== null &&
    Number.isFinite(Number(raw.totalAmount))
      ? Number(raw.totalAmount)
      : undefined;

  return {
    id,
    code: String(raw.code || id),
    itemCount: Number(raw.itemCount ?? items.length),
    totalQuantity: Number(
      raw.totalQuantity ?? totalQuantity
    ),
    totalAmount: rawAmount,
    items,
    createdAt: raw.createdAt,
    createdBy:
      typeof raw.createdBy === "string"
        ? raw.createdBy
        : undefined,
    createdByName:
      typeof raw.createdByName === "string"
        ? raw.createdByName
        : undefined,
    createdByUsername:
      typeof raw.createdByUsername === "string"
        ? raw.createdByUsername
        : undefined,
    createdByRole:
      typeof raw.createdByRole === "string"
        ? raw.createdByRole
        : undefined,
  };
}

export default function RestockHistoryPage() {
  const [orders, setOrders] = useState<RestockOrder[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<
    string[]
  >([]);

  const [canViewCostPrice, setCanViewCostPrice] =
    useState(false);

  const [filterMode, setFilterMode] =
    useState<FilterMode>("month");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  useEffect(() => {
    setCanViewCostPrice(readCanViewCostPrice());
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(
        collection(db, "restocks")
      );

      const result = snapshot.docs.map((item) =>
        normalizeOrder(item.id, item.data())
      );

      result.sort((a, b) => {
        const timeA =
          toDate(a.createdAt)?.getTime() || 0;
        const timeB =
          toDate(b.createdAt)?.getTime() || 0;

        return timeB - timeA;
      });

      setOrders(result);
    } catch (error) {
      console.error("Lỗi tải lịch sử nhập hàng:", error);
      alert("Không tải được lịch sử nhập hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filterMode === "all") return true;

      const date = toDate(order.createdAt);
      if (!date) return false;

      if (date.getFullYear() !== selectedYear) {
        return false;
      }

      if (
        filterMode === "month" &&
        date.getMonth() + 1 !== selectedMonth
      ) {
        return false;
      }

      return true;
    });
  }, [
    orders,
    filterMode,
    selectedMonth,
    selectedYear,
  ]);

  const years = useMemo(() => {
    const result = new Set<number>([
      new Date().getFullYear(),
      selectedYear,
    ]);

    orders.forEach((order) => {
      const date = toDate(order.createdAt);
      if (date) result.add(date.getFullYear());
    });

    return Array.from(result).sort((a, b) => b - a);
  }, [orders, selectedYear]);

  const summary = useMemo(() => {
    let totalQuantity = 0;
    let totalAmount = 0;
    let unpricedOrders = 0;

    filteredOrders.forEach((order) => {
      totalQuantity += order.totalQuantity;

      const amount = getOrderAmount(order);

      if (amount === null) {
        unpricedOrders++;
      } else {
        totalAmount += amount;
      }
    });

    return {
      totalOrders: filteredOrders.length,
      totalQuantity,
      totalAmount,
      unpricedOrders,
    };
  }, [filteredOrders]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-slate-900">
      <div className="w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-sky-700">
              Lịch sử nhập hàng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi các đơn nhập, người tạo đơn và
              số lượng nhập kho.
            </p>
          </div>

          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? "Đang tải..." : "Tải lại"}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              Báo cáo nhập hàng
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterMode}
                onChange={(e) =>
                  setFilterMode(
                    e.target.value as FilterMode
                  )
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="month">Theo tháng</option>
                <option value="year">Theo năm</option>
                <option value="all">Toàn bộ</option>
              </select>

              {filterMode === "month" && (
                <select
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(
                      Number(e.target.value)
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {Array.from(
                    { length: 12 },
                    (_, index) => (
                      <option
                        key={index + 1}
                        value={index + 1}
                      >
                        Tháng {index + 1}
                      </option>
                    )
                  )}
                </select>
              )}

              {filterMode !== "all" && (
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(
                      Number(e.target.value)
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {years.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      Năm {year}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div
            className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
              canViewCostPrice
                ? "xl:grid-cols-4"
                : "xl:grid-cols-2"
            }`}
          >
            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">
                Tổng đơn nhập
              </p>
              <p className="mt-1 text-2xl font-bold text-sky-700">
                {formatNumber(summary.totalOrders)}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-sm text-slate-500">
                Tổng số lượng nhập
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {formatNumber(summary.totalQuantity)}
              </p>
            </div>

            {canViewCostPrice && (
              <>
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="text-sm text-slate-500">
                    Tổng tiền nhập đã ghi nhận
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-700">
                    {formatMoney(summary.totalAmount)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">
                    Đơn chưa có dữ liệu giá
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-700">
                    {formatNumber(
                      summary.unpricedOrders
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          {canViewCostPrice &&
            summary.unpricedOrders > 0 && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Có {summary.unpricedOrders} đơn nhập
                chưa có đủ dữ liệu giá. Tổng tiền
                báo cáo chỉ tính những đơn đã có đủ
                giá nhập.
              </p>
            )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-bold text-slate-800">
              Danh sách đơn nhập
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Hiển thị {filteredOrders.length} đơn.
              Bấm vào mã đơn hoặc nút Xem để mở chi tiết.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-800 text-sm text-white">
                <tr>
                  <th className="px-4 py-3 text-left">
                    Mã đơn nhập
                  </th>

                  <th className="px-4 py-3 text-left">
                    Người nhập
                  </th>

                  <th className="px-4 py-3 text-center">
                    Số sản phẩm
                  </th>

                  <th className="px-4 py-3 text-center">
                    Tổng SL
                  </th>

                  {canViewCostPrice && (
                    <th className="px-4 py-3 text-right">
                      Tổng tiền đơn nhập
                    </th>
                  )}

                  <th className="px-4 py-3 text-left">
                    Ngày nhập
                  </th>

                  <th className="px-4 py-3 text-center">
                    Chi tiết
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <RestockOrderRow
                    key={order.id}
                    order={order}
                    expanded={expandedIds.includes(
                      order.id
                    )}
                    canViewCostPrice={
                      canViewCostPrice
                    }
                    onToggle={() =>
                      toggleExpand(order.id)
                    }
                  />
                ))}

                {!loading &&
                  filteredOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          canViewCostPrice ? 7 : 6
                        }
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Chưa có đơn nhập nào trong
                        kỳ đã chọn.
                      </td>
                    </tr>
                  )}

                {loading && (
                  <tr>
                    <td
                      colSpan={
                        canViewCostPrice ? 7 : 6
                      }
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Đang tải lịch sử nhập hàng...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function RestockOrderRow({
  order,
  expanded,
  canViewCostPrice,
  onToggle,
}: {
  order: RestockOrder;
  expanded: boolean;
  canViewCostPrice: boolean;
  onToggle: () => void;
}) {
  const creatorName = getCreatorName(order);
  const creatorRole = getCreatorRole(order);
  const amount = canViewCostPrice
    ? getOrderAmount(order)
    : null;

  return (
    <>
      <tr className="border-b border-slate-200 hover:bg-slate-50">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="font-semibold text-sky-700 hover:text-sky-900 hover:underline"
            title="Bấm để xem chi tiết đơn nhập"
          >
            {order.code}
          </button>
        </td>

        <td className="px-4 py-3">
          {creatorName === "Chưa ghi nhận" ? (
            <span className="text-slate-400">
              Chưa ghi nhận
            </span>
          ) : (
            <div>
              <p className="font-semibold text-slate-800">
                {creatorName}
              </p>

              {creatorRole && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {creatorRole}
                </p>
              )}
            </div>
          )}
        </td>

        <td className="px-4 py-3 text-center">
          {formatNumber(order.itemCount)}
        </td>

        <td className="px-4 py-3 text-center">
          {formatNumber(order.totalQuantity)}
        </td>

        {canViewCostPrice && (
          <td className="px-4 py-3 text-right font-semibold">
            {amount === null ? (
              <span className="text-slate-500">
                Chưa có giá
              </span>
            ) : (
              <span className="text-amber-700">
                {formatMoney(amount)}
              </span>
            )}
          </td>
        )}

        <td className="px-4 py-3">
          {formatDate(order.createdAt)}
        </td>

        <td className="px-4 py-3 text-center">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="rounded-lg bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-700 hover:bg-sky-200"
          >
            {expanded ? "Thu gọn" : "Xem"}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50">
          <td
            colSpan={canViewCostPrice ? 7 : 6}
            className="p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800">
                  Chi tiết đơn: {order.code}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Người nhập: {creatorName}
                  {creatorRole
                    ? ` (${creatorRole})`
                    : ""}
                </p>
              </div>

              {canViewCostPrice && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Tổng tiền đơn nhập
                  </p>

                  <p className="text-lg font-bold text-amber-700">
                    {amount === null
                      ? "Chưa có giá"
                      : formatMoney(amount)}
                  </p>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-100 text-sm text-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      Sản phẩm
                    </th>

                    <th className="px-3 py-2 text-left">
                      Mã SP
                    </th>

                    <th className="px-3 py-2 text-left">
                      Vị trí
                    </th>

                    <th className="px-3 py-2 text-right">
                      Tồn trước
                    </th>

                    <th className="px-3 py-2 text-right">
                      SL nhập
                    </th>

                    <th className="px-3 py-2 text-right">
                      Tồn sau
                    </th>

                    {canViewCostPrice && (
                      <>
                        <th className="px-3 py-2 text-right">
                          Giá nhập
                        </th>

                        <th className="px-3 py-2 text-right">
                          Thành tiền
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={`${item.productId}-${index}`}
                      className="border-t border-slate-100"
                    >
                      <td className="px-3 py-2 font-medium">
                        {item.productName}
                      </td>

                      <td className="px-3 py-2">
                        {item.productCode || "---"}
                      </td>

                      <td className="px-3 py-2">
                        {item.productLocation || "---"}
                      </td>

                      <td className="px-3 py-2 text-right">
                        {formatNumber(
                          item.beforeStock
                        )}
                      </td>

                      <td className="px-3 py-2 text-right font-semibold">
                        {formatNumber(item.quantity)}
                      </td>

                      <td className="px-3 py-2 text-right">
                        {formatNumber(item.afterStock)}
                      </td>

                      {canViewCostPrice && (
                        <>
                          <td className="px-3 py-2 text-right">
                            {hasValidPrice(item)
                              ? formatMoney(
                                  Number(
                                    item.unitPrice
                                  )
                                )
                              : "Chưa có giá"}
                          </td>

                          <td className="px-3 py-2 text-right font-semibold">
                            {hasValidPrice(item)
                              ? formatMoney(
                                  item.quantity *
                                    Number(
                                      item.unitPrice
                                    )
                                )
                              : "Chưa có giá"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {order.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          canViewCostPrice ? 8 : 6
                        }
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        Không có dữ liệu sản phẩm
                        trong đơn nhập này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
