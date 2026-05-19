"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function RestockHistoryPage() {
  const [history, setHistory] =
    useState<any[]>([]);

  const [openId, setOpenId] =
    useState<string | null>(null);

  const loadHistory = async () => {
    const querySnapshot =
      await getDocs(
        collection(db, "restocks")
      );

    const data: any[] = [];

    querySnapshot.forEach((docItem) => {
      data.push({
        id: docItem.id,
        ...docItem.data(),
      });
    });

    data.sort((a, b) => {
      const timeA =
        a.createdAt?.toDate
          ? a.createdAt.toDate().getTime()
          : a.createdAt?.seconds
          ? a.createdAt.seconds * 1000
          : new Date(a.createdAt || 0).getTime();

      const timeB =
        b.createdAt?.toDate
          ? b.createdAt.toDate().getTime()
          : b.createdAt?.seconds
          ? b.createdAt.seconds * 1000
          : new Date(b.createdAt || 0).getTime();

      return timeB - timeA;
    });

    setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatDate = (value: any) => {
    if (!value) return "---";

    const date =
      value?.toDate
        ? value.toDate()
        : value?.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

    if (isNaN(date.getTime())) {
      return "---";
    }

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getRestockCode = (item: any) => {
    if (item.code) {
      return item.code;
    }

    return `PNH-CU-${String(item.id || "").slice(0, 6).toUpperCase()}`;
  };

  const getItems = (item: any) => {
    if (Array.isArray(item.items)) {
      return item.items;
    }

    return [
      {
        productId: item.productId || "",
        productName: item.productName || "",
        productCode: item.productCode || "",
        productLocation: item.productLocation || "",
        beforeStock:
          Number(item.beforeStock || 0),
        quantity:
          Number(item.quantity || 0),
        afterStock:
          Number(
            item.afterStock ||
              Number(item.beforeStock || 0) +
                Number(item.quantity || 0)
          ),
      },
    ];
  };

  const getTotalQuantity = (item: any) => {
    if (item.totalQuantity !== undefined) {
      return Number(item.totalQuantity || 0);
    }

    return getItems(item).reduce(
      (sum: number, product: any) =>
        sum + Number(product.quantity || 0),
      0
    );
  };

  const getItemCount = (item: any) => {
    if (item.itemCount !== undefined) {
      return Number(item.itemCount || 0);
    }

    return getItems(item).length;
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-blue-700">
            Lịch sử nhập hàng
          </h1>

          <p className="text-gray-500 mt-2">
            Danh sách đơn nhập hàng, đơn mới nhất sẽ hiển thị trên đầu.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow overflow-hidden">
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Danh sách đơn nhập
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Click vào mũi tên để xem chi tiết sản phẩm trong đơn nhập.
              </p>
            </div>

            <button
              onClick={loadHistory}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              Tải lại
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-blue-700 text-white">
                <tr>
                  <th className="p-4 text-left">
                    Mã đơn nhập
                  </th>

                  <th className="p-4 text-left">
                    Tổng sản phẩm
                  </th>

                  <th className="p-4 text-left">
                    Tổng số lượng
                  </th>

                  <th className="p-4 text-left">
                    Ngày nhập
                  </th>

                  <th className="p-4 text-center">
                    Chi tiết
                  </th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => {
                  const isOpen =
                    openId === item.id;

                  const items =
                    getItems(item);

                  return (
                    <>
                      <tr
                        key={item.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4 font-bold text-blue-700">
                          {getRestockCode(item)}
                        </td>

                        <td className="p-4 font-semibold">
                          {getItemCount(item)}
                        </td>

                        <td className="p-4 text-green-600 font-bold">
                          +{getTotalQuantity(item)}
                        </td>

                        <td className="p-4">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenId(
                                isOpen
                                  ? null
                                  : item.id
                              )
                            }
                            className="bg-gray-100 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-bold"
                          >
                            {isOpen ? "▲" : "▼"}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td
                            colSpan={5}
                            className="bg-gray-50 p-5"
                          >
                            <div className="rounded-2xl border bg-white overflow-hidden">
                              <div className="px-5 py-3 bg-gray-100 font-bold">
                                Chi tiết sản phẩm nhập
                              </div>

                              <table className="w-full min-w-[900px]">
                                <thead>
                                  <tr className="border-b">
                                    <th className="p-3 text-left">
                                      Sản phẩm
                                    </th>

                                    <th className="p-3 text-left">
                                      Mã SP
                                    </th>

                                    <th className="p-3 text-left">
                                      Vị trí
                                    </th>

                                    <th className="p-3 text-left">
                                      Tồn cũ
                                    </th>

                                    <th className="p-3 text-left">
                                      Số lượng nhập
                                    </th>

                                    <th className="p-3 text-left">
                                      Tồn mới
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {items.map(
                                    (
                                      product: any,
                                      index: number
                                    ) => (
                                      <tr
                                        key={`${item.id}-${product.productId}-${index}`}
                                        className="border-b hover:bg-gray-50"
                                      >
                                        <td className="p-3 font-semibold">
                                          {product.productName ||
                                            "---"}
                                        </td>

                                        <td className="p-3">
                                          {product.productCode ||
                                            "---"}
                                        </td>

                                        <td className="p-3">
                                          {product.productLocation ||
                                            "---"}
                                        </td>

                                        <td className="p-3 font-bold text-blue-700">
                                          {Number(
                                            product.beforeStock ||
                                              0
                                          )}
                                        </td>

                                        <td className="p-3 font-bold text-green-600">
                                          +
                                          {Number(
                                            product.quantity ||
                                              0
                                          )}
                                        </td>

                                        <td className="p-3 font-bold text-purple-700">
                                          {Number(
                                            product.afterStock ||
                                              0
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {history.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-500"
                    >
                      Chưa có lịch sử nhập hàng
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