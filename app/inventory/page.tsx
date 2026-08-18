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

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

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
          "bg-rose-100 text-rose-700",
      };
    }

    if (stock >= 1 && stock <= 5) {
      return {
        label: "Dưới định mức",
        className:
          "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "Bình thường",
      className:
        "bg-emerald-100 text-emerald-700",
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

  const popupColor = "bg-slate-800";

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(products.length / itemsPerPage)
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedProducts =
    products.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // EXPORT EXCEL (.XLS)
  const exportInventoryToExcel = () => {
    if (products.length === 0) {
      alert("Chưa có sản phẩm để xuất file");
      return;
    }

    const rows = products.map((item, index) => {
      const stock = Number(item.stock || 0);
      const capitalPrice = Number(item.capital_price || 0);
      const inventoryValue = stock * capitalPrice;

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${String(item.main_name || item.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
          <td>${String(item.short_name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
          <td>${String(item.product_code || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
          <td>${Number(item.price || 0)}</td>
          ${canViewCostPrice ? `<td>${capitalPrice}</td>` : ""}
          <td>${stock}</td>
          ${canViewCostPrice ? `<td>${inventoryValue}</td>` : ""}
          <td>${getStockStatus(stock).label}</td>
        </tr>
      `;
    }).join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên chính</th>
                <th>Tên phụ</th>
                <th>Mã sản phẩm</th>
                <th>Giá bán</th>
                ${canViewCostPrice ? "<th>Giá vốn</th>" : ""}
                <th>Tồn kho</th>
                ${canViewCostPrice ? "<th>Tổng tồn</th>" : ""}
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob(
      ["\uFEFF", html],
      { type: "application/vnd.ms-excel;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `danh-sach-ton-kho-${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-black">
      <div className="max-w-[1400px] mx-auto space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Quản lý tồn kho
            </h1>

            <p className="text-slate-500 mt-1">
              Trang này chỉ dùng để xem tồn kho. Muốn tăng tồn kho hãy vào trang Nhập hàng.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportInventoryToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
            >
              Xuất Excel
            </button>

            <button
              type="button"
              onClick={loadProducts}
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
            >
              Tải lại tồn kho
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
          canViewCostPrice ? "xl:grid-cols-4" : "xl:grid-cols-3"
        }`}>
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-h-[92px]">
    <p className="text-slate-500 text-sm mb-2">
      Tổng sản phẩm
    </p>

    <p className="text-2xl font-bold text-sky-700">
      {products.length}
    </p>
  </div>

  {canViewCostPrice && (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-h-[92px]">
    <p className="text-slate-500 text-sm mb-2">
      Tổng giá trị tồn kho
    </p>

    <p className="text-2xl font-bold text-violet-700">
      {formatMoney(totalInventoryValue)}đ
    </p>
  </div>
  )}

  <button
    type="button"
    onClick={() =>
      setPopupType("out")
    }
    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-h-[92px] text-left hover:shadow-md hover:border-slate-300 transition cursor-pointer"
  >
    <p className="text-slate-500 text-sm mb-2">
      Sản phẩm hết hàng
    </p>

    <p className="text-2xl font-bold text-rose-600">
      {outOfStockProducts.length}
    </p>

    <p className="text-xs text-slate-400 mt-2">
      Click để xem danh sách
    </p>
  </button>

  <button
    type="button"
    onClick={() =>
      setPopupType("low")
    }
    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-h-[92px] text-left hover:shadow-md hover:border-slate-300 transition cursor-pointer"
  >
    <p className="text-slate-500 text-sm mb-2">
      Sản phẩm dưới định mức
    </p>

    <p className="text-2xl font-bold text-amber-600">
      {lowStockProducts.length}
    </p>

    <p className="text-xs text-slate-400 mt-2">
      Click để xem danh sách
    </p>
  </button>
</div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-lg">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Danh sách tồn kho
                </h2>

                <p className="text-slate-500 text-sm mt-1">
                  Tồn kho được cập nhật từ nhập hàng và bán hàng, không chỉnh trực tiếp tại đây.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Sản phẩm
                    </th>

                    <th className="px-4 py-3 text-left">
                      Giá bán
                    </th>

                    {canViewCostPrice && (
                      <th className="px-4 py-3 text-left">
                        Giá vốn
                      </th>
                    )}

                    <th className="px-4 py-3 text-left">
                      Tồn kho
                    </th>

                    {canViewCostPrice && (
                      <th className="px-4 py-3 text-left">
                        Tổng tồn
                      </th>
                    )}

                    <th className="px-4 py-3 text-left">
                      Trạng thái
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.map((item) => {
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
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">
                              {item.main_name || item.name || "---"}
                            </span>
                            {item.short_name && (
                              <span className="text-sm text-slate-500 mt-0.5">
                                {item.short_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sky-700 font-medium">
                          {formatMoney(item.price)}đ
                        </td>

                        {canViewCostPrice && (
                          <td className="px-4 py-3 text-amber-600 font-semibold">
                            {formatMoney(item.capital_price)}đ
                          </td>
                        )}

                        <td
                          className={`px-4 py-3 font-bold ${
                            stock === 0
                              ? "text-rose-600"
                              : stock <= 5
                              ? "text-orange-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {stock}
                          {stock <= 5 && " ⚠️"}
                        </td>

                        {canViewCostPrice && (
                          <td className="px-4 py-3 font-bold text-violet-700">
                            {formatMoney(inventoryValue)}đ
                          </td>
                        )}

                        <td className="px-4 py-3">
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
                        className="p-8 text-center text-slate-500"
                      >
                        Chưa có dữ liệu tồn kho
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {products.length > 0 && (
              <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span>
                    Hiển thị{" "}
                    <span className="font-semibold text-slate-900">
                      {startIndex + 1}
                    </span>
                    {" "}đến{" "}
                    <span className="font-semibold text-slate-900">
                      {Math.min(
                        startIndex + itemsPerPage,
                        products.length
                      )}
                    </span>
                    {" "}trong tổng{" "}
                    <span className="font-semibold text-slate-900">
                      {products.length}
                    </span>
                    {" "}sản phẩm
                  </span>

                  <label className="flex items-center gap-2">
                    <span>Hiển thị:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-slate-300 bg-white rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value={15}>15 sản phẩm</option>
                      <option value={50}>50 sản phẩm</option>
                      <option value={100}>100 sản phẩm</option>
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.max(prev - 1, 1)
                      )
                    }
                    className={`px-4 py-2 rounded-xl font-semibold ${
                      currentPage === 1
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    Trước
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-10 px-3 py-2 rounded-xl font-semibold ${
                        currentPage === page
                          ? "bg-sky-600 text-white"
                          : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, totalPages)
                      )
                    }
                    className={`px-4 py-2 rounded-xl font-semibold ${
                      currentPage === totalPages
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-white border border-slate-300 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {popupType && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden">
            <div
              className={`${popupColor} text-white px-6 py-5 flex items-center justify-between`}
            >
              <div>
                <h2 className="text-2xl font-bold text-white">
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

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-slate-100 text-slate-700">
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
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="p-3">
                            {index + 1}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                {item.main_name || item.name || "---"}
                              </span>
                              {item.short_name && (
                                <span className="text-xs text-slate-500 mt-0.5">
                                  {item.short_name}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-sky-700">
                            {formatMoney(
                              item.price
                            )}
                            đ
                          </td>

                          {canViewCostPrice && (
                            <td className="p-3 text-amber-600 font-semibold">
                              {formatMoney(item.capital_price)}đ
                            </td>
                          )}

                          <td
                            className={`p-3 font-bold ${
                              stock === 0
                                ? "text-rose-600"
                                : "text-orange-600"
                            }`}
                          >
                            {stock}
                            {stock <= 5 && " ⚠️"}
                          </td>

                          {canViewCostPrice && (
                            <td className="p-3 font-bold text-violet-700">
                              {formatMoney(inventoryValue)}đ
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
                        className="p-8 text-center text-slate-500"
                      >
                        Không có sản phẩm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() =>
                  setPopupType(null)
                }
                className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
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
