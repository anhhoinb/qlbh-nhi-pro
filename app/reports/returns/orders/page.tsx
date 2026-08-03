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
            if (value?.seconds) return value.seconds * 1000;

            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

  const filteredReturns = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return returns;

    return returns.filter((item) =>
      [
        item.orderCode,
        item.customerName,
        item.customerPhone,
        item.reason,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
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

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-blue-700">
            Trả hàng theo đơn hàng
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Danh sách các phiếu trả hàng đã phát sinh
          </p>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm mã đơn, khách hàng, số điện thoại hoặc lý do..."
            className="mt-5 w-full rounded-2xl border p-4 outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Phiếu trả hàng</div>
            <div className="mt-2 text-3xl font-bold text-blue-700">
              {filteredReturns.length}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Tổng số lượng trả</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">
              {totalQuantity}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Tổng tiền hoàn</div>
            <div className="mt-2 text-3xl font-bold text-red-600">
              {formatMoney(totalRefund)}đ
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="p-4 text-left">Thời gian</th>
                  <th className="p-4 text-left">Mã đơn</th>
                  <th className="p-4 text-left">Khách hàng</th>
                  <th className="p-4 text-right">Số lượng trả</th>
                  <th className="p-4 text-right">Tiền hoàn</th>
                  <th className="p-4 text-left">Lý do</th>
                  <th className="p-4 text-center">Nhập lại kho</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-500">
                      Chưa có dữ liệu trả hàng
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="p-4 font-bold text-blue-700">
                        {item.orderCode || "---"}
                      </td>

                      <td className="p-4">
                        <div className="font-semibold">
                          {item.customerName || "Khách lẻ"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {item.customerPhone || ""}
                        </div>
                      </td>

                      <td className="p-4 text-right font-semibold">
                        {Number(item.totalQuantity || 0)}
                      </td>

                      <td className="p-4 text-right font-bold text-red-600">
                        {formatMoney(item.totalRefund)}đ
                      </td>

                      <td className="p-4">
                        {item.reason || "---"}
                      </td>

                      <td className="p-4 text-center">
                        {item.restocked ? "Có" : "Không"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}