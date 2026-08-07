"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ProductSummary = {
  key: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  refundAmount: number;
  returnCount: number;
};

export default function ReturnsByProductPage() {
  const [products, setProducts] =
    useState<ProductSummary[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const formatMoney = (value: any) =>
    Number(value || 0).toLocaleString("vi-VN");

  useEffect(() => {
    const loadProductReturns = async () => {
      try {
        const snapshot =
          await getDocs(
            collection(db, "returns")
          );

        const summary =
          new Map<
            string,
            ProductSummary
          >();

        snapshot.docs.forEach(
          (returnDoc) => {
            const data: any =
              returnDoc.data();

            const items =
              Array.isArray(data.items)
                ? data.items
                : [];

            items.forEach(
              (item: any) => {
                const productId =
                  String(
                    item.productId || ""
                  );

                const productCode =
                  String(
                    item.productCode || ""
                  );

                const productName =
                  String(
                    item.productName ||
                      "Không xác định"
                  );

                const key =
                  productId ||
                  productCode ||
                  productName.toLowerCase();

                const current =
                  summary.get(key) || {
                    key,
                    productId,
                    productCode,
                    productName,
                    unit: String(
                      item.unit || ""
                    ),
                    quantity: 0,
                    refundAmount: 0,
                    returnCount: 0,
                  };

                current.quantity +=
                  Number(
                    item.quantity || 0
                  );

                current.refundAmount +=
                  Number(
                    item.lineRefund || 0
                  );

                current.returnCount += 1;

                summary.set(
                  key,
                  current
                );
              }
            );
          }
        );

        const result =
          Array.from(
            summary.values()
          ).sort(
            (a, b) =>
              b.quantity - a.quantity
          );

        setProducts(result);
      } catch (error) {
        console.error(error);

        alert(
          "Không tải được báo cáo trả hàng theo sản phẩm"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProductReturns();
  }, []);

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return products;
      }

      return products.filter(
        (item) =>
          [
            item.productName,
            item.productCode,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
          )
      );
    }, [products, search]);

  const totalQuantity =
    filteredProducts.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );

  const totalRefund =
    filteredProducts.reduce(
      (sum, item) =>
        sum + item.refundAmount,
      0
    );

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-black">
      <div className="max-w-[1500px] mx-auto space-y-5">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h1 className="text-3xl font-bold text-slate-800">
            Trả hàng theo sản phẩm
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Tổng hợp số lượng và giá trị trả theo từng sản phẩm
          </p>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Tìm tên hoặc mã sản phẩm..."
            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className="text-sm text-slate-500">
              Sản phẩm có trả hàng
            </div>

            <div className="mt-2 text-3xl font-bold text-sky-700">
              {filteredProducts.length}
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
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    Mã sản phẩm
                  </th>

                  <th className="px-4 py-3 text-left">
                    Tên sản phẩm
                  </th>

                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    Đơn vị
                  </th>

                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Số lượt trả
                  </th>

                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Tổng số lượng trả
                  </th>

                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Tổng tiền hoàn
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-slate-500"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-slate-500"
                    >
                      Chưa có dữ liệu trả hàng
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(
                    (item) => (
                      <tr
                        key={item.key}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-sky-700 whitespace-nowrap">
                          {item.productCode ||
                            "---"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.productName}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {item.unit ||
                            "---"}
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">
                          {item.returnCount}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-amber-600">
                          {item.quantity}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                          {formatMoney(
                            item.refundAmount
                          )}
                          đ
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