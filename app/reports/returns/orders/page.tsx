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
  const [returns, setReturns] =
    useState<ReturnRecord[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

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
        const snapshot =
          await getDocs(
            collection(db, "returns")
          );

        const data =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as ReturnRecord[];

        data.sort((a, b) => {
          const getTime = (value: any) => {
            if (!value) return 0;

            if (
              typeof value?.toDate === "function"
            ) {
              return value
                .toDate()
                .getTime();
            }

            if (value?.seconds) {
              return value.seconds * 1000;
            }

            const date =
              new Date(value);

            return Number.isNaN(
              date.getTime()
            )
              ? 0
              : date.getTime();
          };

          return (
            getTime(b.createdAt) -
            getTime(a.createdAt)
          );
        });

        setReturns(data);
      } catch (error) {
        console.error(error);

        alert(
          "Không tải được báo cáo trả hàng"
        );
      } finally {
        setLoading(false);
      }
    };

    loadReturns();
  }, []);

  const filteredReturns =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return returns;
      }

      return returns.filter((item) =>
        [
          item.orderCode,
          item.customerName,
          item.customerPhone,
          item.reason,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword)
        )
      );
    }, [returns, search]);

  const totalRefund =
    filteredReturns.reduce(
      (sum, item) =>
        sum +
        Number(item.totalRefund || 0),
      0
    );

  const totalQuantity =
    filteredReturns.reduce(
      (sum, item) =>
        sum +
        Number(item.totalQuantity || 0),
      0
    );

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
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Tìm mã đơn, khách hàng, số điện thoại hoặc lý do..."
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
                  filteredReturns.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {formatDate(
                            item.createdAt
                          )}
                        </td>

                        <td className="px-4 py-3 font-bold text-sky-700 whitespace-nowrap">
                          {item.orderCode ||
                            "---"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {item.customerName ||
                              "Khách lẻ"}
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.customerPhone ||
                              ""}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">
                          {Number(
                            item.totalQuantity ||
                              0
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                          {formatMoney(
                            item.totalRefund
                          )}
                          đ
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {item.reason ||
                            "---"}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              item.restocked
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.restocked
                              ? "Có"
                              : "Không"}
                          </span>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}