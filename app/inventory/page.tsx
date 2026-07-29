"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function InventoryPage() {
  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [canViewCostPrice, setCanViewCostPrice] =
    useState(false);

  const [popupType, setPopupType] =
    useState<"out" | "low" | null>(null);

  const loadProducts = async () => {
    setLoading(true);

    const querySnapshot =
      await getDocs(
        collection(db, "products")
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
    a.createdAt?.seconds
      ? a.createdAt.seconds
      : new Date(a.createdAt || 0).getTime();

  const timeB =
    b.createdAt?.seconds
      ? b.createdAt.seconds
      : new Date(b.createdAt || 0).getTime();

  return timeB - timeA;

});

    setProducts(data);

    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("currentUserInfo") || "{}"
    );

    setCanViewCostPrice(
      user.permissions?.viewCostPrice === true
    );
  }, []);

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString(
      "vi-VN"
    );
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Hết hàng",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (stock >= 1 && stock <= 5) {
      return {
        label: "Dưới định mức",
        className:
          "bg-orange-100 text-orange-700",
      };
    }

    return {
      label: "Bình thường",
      className:
        "bg-green-100 text-green-700",
    };
  };

  const totalInventoryValue =
    products.reduce(
      (sum, item) =>
        sum +
        Number(item.stock || 0) *
          Number(item.capital_price || 0),
      0
    );

  const outOfStockProducts =
    products.filter(
      (item) => Number(item.stock || 0) === 0
    );

  const lowStockProducts =
    products.filter((item) => {
      const stock =
        Number(item.stock || 0);

      return stock >= 1 && stock <= 5;
    });

  const popupProducts =
    popupType === "out"
      ? outOfStockProducts
      : popupType === "low"
      ? lowStockProducts
      : [];

  const popupTitle =
    popupType === "out"
      ? "Danh sách sản phẩm hết hàng"
      : "Danh sách sản phẩm dưới định mức";

  const popupColor =
    popupType === "out"
      ? "bg-red-600"
      : "bg-orange-600";

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-700">
              Quản lý tồn kho
            </h1>

            <p className="text-gray-500 mt-2">
              Trang này chỉ dùng để xem tồn kho. Muốn tăng tồn kho hãy vào trang Nhập hàng.
            </p>
          </div>

          <button
            onClick={loadProducts}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-semibold"
          >
            Tải lại tồn kho
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
  <div className="bg-white rounded-2xl shadow p-4 min-h-[95px]">
    <p className="text-gray-500 text-sm mb-2">
      Tổng sản phẩm
    </p>

    <p className="text-2xl font-bold text-blue-700">
      {products.length}
    </p>
  </div>

  <div className="bg-white rounded-2xl shadow p-4 min-h-[95px]">
    <p className="text-gray-500 text-sm mb-2">
      Tổng giá trị tồn kho
    </p>

    <p className="text-2xl font-bold text-purple-700">
      {formatMoney(totalInventoryValue)}đ
    </p>
  </div>

  <button
    type="button"
    onClick={() =>
      setPopupType("out")
    }
    className="bg-white rounded-2xl shadow p-4 min-h-[95px] text-left hover:shadow-md transition cursor-pointer"
  >
    <p className="text-gray-500 text-sm mb-2">
      Sản phẩm hết hàng
    </p>

    <p className="text-2xl font-bold text-red-600">
      {outOfStockProducts.length}
    </p>

    <p className="text-xs text-gray-400 mt-2">
      Click để xem danh sách
    </p>
  </button>

  <button
    type="button"
    onClick={() =>
      setPopupType("low")
    }
    className="bg-white rounded-2xl shadow p-4 min-h-[95px] text-left hover:shadow-md transition cursor-pointer"
  >
    <p className="text-gray-500 text-sm mb-2">
      Sản phẩm dưới định mức
    </p>

    <p className="text-2xl font-bold text-orange-600">
      {lowStockProducts.length}
    </p>

    <p className="text-xs text-gray-400 mt-2">
      Click để xem danh sách
    </p>
  </button>
</div>

        {loading ? (
          <div className="bg-white rounded-3xl shadow p-8 text-lg">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow overflow-hidden">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Danh sách tồn kho
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Tồn kho được cập nhật từ nhập hàng và bán hàng, không chỉnh trực tiếp tại đây.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-blue-700 text-white">
                  <tr>
                    <th className="p-4 text-left">
                      Sản phẩm
                    </th>

                    <th className="p-4 text-left">
                      Giá bán
                    </th>

                    {canViewCostPrice && (
                    <th className="p-4 text-left">
                      Giá vốn
                    </th>
)}

                    <th className="p-4 text-left">
                      Tồn kho
                    </th>

                    {canViewCostPrice && (
                    <th className="p-4 text-left">
                      Tổng tồn
                    </th>
)}

                    <th className="p-4 text-left">
                      Trạng thái
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((item) => {
                    const stock =
                      Number(item.stock || 0);

                    const inventoryValue =
                      stock *
                      Number(
                        item.capital_price || 0
                      );

                    const status =
                      getStockStatus(stock);

                    return (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4 font-semibold text-black">
                          {item.name || "---"}
                        </td>

                        <td className="p-4 text-blue-700">
                          {formatMoney(item.price)}đ
                        </td>

                        {canViewCostPrice && (
                        <td className="p-4 text-orange-600 font-semibold">
                          {formatMoney(
                            item.capital_price
                          )}
                          đ
                        </td>
)}

                        <td
                          className={`p-4 font-bold ${
                            stock === 0
                              ? "text-red-600"
                              : stock <= 5
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {stock}
                          {stock <= 5 && " ⚠️"}
                        </td>

                        {canViewCostPrice && (
                        <td className="p-4 font-bold text-purple-700">
                          {formatMoney(
                            inventoryValue
                          )}
                          đ
                        </td>
)}

                        <td className="p-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {products.length === 0 && (
                    <tr>
                      <td
                        colSpan={canViewCostPrice ? 6 : 4}
                        className="p-8 text-center text-gray-500"
                      >
                        Chưa có dữ liệu tồn kho
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {popupType && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden">
            <div
              className={`${popupColor} text-white px-6 py-5 flex items-center justify-between`}
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {popupTitle}
                </h2>

                <p className="text-sm opacity-90 mt-1">
                  Tổng cộng: {popupProducts.length} sản phẩm
                </p>
              </div>

              <button
                onClick={() =>
                  setPopupType(null)
                }
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">
                      STT
                    </th>

                    <th className="p-3 text-left">
                      Sản phẩm
                    </th>

                    <th className="p-3 text-left">
                      Giá bán
                    </th>

                    {canViewCostPrice && (
                    <th className="p-3 text-left">
                      Giá vốn
                    </th>
)}

                    <th className="p-3 text-left">
                      Tồn kho
                    </th>

                    {canViewCostPrice && (
                    <th className="p-3 text-left">
                      Tổng tồn
                    </th>
)}
                  </tr>
                </thead>

                <tbody>
                  {popupProducts.map(
                    (item, index) => {
                      const stock =
                        Number(item.stock || 0);

                      const inventoryValue =
                        stock *
                        Number(
                          item.capital_price || 0
                        );

                      return (
                        <tr
                          key={item.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">
                            {index + 1}
                          </td>

                          <td className="p-3 font-semibold">
                            {item.name || "---"}
                          </td>

                          <td className="p-3 text-blue-700">
                            {formatMoney(
                              item.price
                            )}
                            đ
                          </td>

                          {canViewCostPrice && (
                          <td className="p-3 text-orange-600 font-semibold">
                            {formatMoney(
                              item.capital_price
                            )}
                            đ
                          </td>
)}

                          <td
                            className={`p-3 font-bold ${
                              stock === 0
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {stock}
                            {stock <= 5 && " ⚠️"}
                          </td>

                          {canViewCostPrice && (
                          <td className="p-3 font-bold text-purple-700">
                            {formatMoney(
                              inventoryValue
                            )}
                            đ
                          </td>
)}
                        </tr>
                      );
                    }
                  )}

                  {popupProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={canViewCostPrice ? 6 : 4}
                        className="p-8 text-center text-gray-500"
                      >
                        Không có sản phẩm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t flex justify-end">
              <button
                onClick={() =>
                  setPopupType(null)
                }
                className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}