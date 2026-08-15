"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";
import * as XLSX from "xlsx";

import { db } from "@/lib/firebase";

export default function InventoryReportPage() {
  const [products, setProducts] =
    useState<any[]>([]);

  const [inventoryValue, setInventoryValue] =
    useState(0);

  const [outOfStockProducts, setOutOfStockProducts] =
    useState<any[]>([]);

  const [lowStockProducts, setLowStockProducts] =
    useState<any[]>([]);

  const [inventoryPage, setInventoryPage] =
    useState(1);

  const [popupType, setPopupType] =
    useState<"out" | "low" | null>(null);

  const [sortConfig, setSortConfig] =
    useState<{
      key: "stock" | "value" | null;
      direction: "asc" | "desc";
    }>({
      key: null,
      direction: "desc",
    });

  const inventoryPerPage = 20;

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString(
      "vi-VN"
    );
  };

  const getProductName = (product: any) => {
    return (
      product.name ||
      product.productName ||
      product.product_name ||
      "Không có tên"
    );
  };

  const getProductSecondaryName = (product: any) => {
    const primaryName = String(
      getProductName(product) || ""
    )
      .trim()
      .toLocaleLowerCase("vi-VN");

    const candidates = [
      product.short_name,
      product.shortName,
      product.sell_name,
      product.sellName,
      product.main_name,
      product.mainName,
      product.full_name,
      product.fullName,
    ];

    return (
      candidates.find((value) => {
        const name = String(value || "").trim();

        return (
          name &&
          name.toLocaleLowerCase("vi-VN") !==
            primaryName
        );
      }) || ""
    );
  };

  const getProductSku = (product: any) => {
    return (
      product.product_code ||
      product.productCode ||
      product.sku ||
      product.code ||
      "---"
    );
  };

  const getProductLocation = (product: any) => {
    return (
      product.product_location ||
      product.location ||
      product.position ||
      product.place ||
      product.locationName ||
      "---"
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
        0
    );
  };

  const getProductCapitalPrice = (product: any) => {
  const value =
    product.capital_price ??
    product.capitalPrice ??
    product.import_price ??
    product.importPrice ??
    0;

  return Number(value) || 0;
};

  const exportInventoryReport = () => {

  const exportData =
    products.map(
      (product, index) => {

        const stock =
          getProductStock(product);

        const capitalPrice =
  getProductCapitalPrice(product);

const total =
  stock * capitalPrice;

        return {
          STT: index + 1,
          "Tên sản phẩm":
            getProductName(product),
          SKU:
            getProductSku(product),
          "Vị trí":
            getProductLocation(product),
          "Giá bán":
            getProductPrice(product),
          "Giá vốn":
            capitalPrice,
          "Tồn kho":
            stock,
          "Giá trị tồn":
            total,
          "Trạng thái":
            stock === 0
              ? "Hết hàng"
              : stock <= 5
              ? "Dưới định mức"
              : "Bình thường",
        };
      }
    );

  const worksheet =
    XLSX.utils.json_to_sheet(
      exportData
    );

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 40 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
  ];

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "BaoCaoTonKho"
  );

  XLSX.writeFile(
    workbook,
    `bao-cao-ton-kho-${new Date()
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-")}.xlsx`
  );
};
  const handleSort = (
    key: "stock" | "value"
  ) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction:
            prev.direction === "desc"
              ? "asc"
              : "desc",
        };
      }

      return {
        key,
        direction: "desc",
      };
    });

    setInventoryPage(1);
  };

  const loadProducts = async () => {
    const productSnapshot =
      await getDocs(
        collection(db, "products")
      );

    const productData: any[] = [];

    let totalInventoryValue = 0;

    const outStockList: any[] = [];
    const lowStockList: any[] = [];

    productSnapshot.forEach((docItem) => {
      const product = {
        id: docItem.id,
        ...docItem.data(),
      };

      const stock = Math.max(
  0,
  Number(getProductStock(product))
);

const capitalPrice = Math.max(
  0,
  Number(getProductCapitalPrice(product))
);

totalInventoryValue += stock * capitalPrice;

      if (stock === 0) {
        outStockList.push(product);
      }

      if (stock >= 1 && stock <= 5) {
        lowStockList.push(product);
      }

      productData.push(product);
    });

    productData.sort((a, b) => {
      return getProductName(a).localeCompare(
        getProductName(b),
        "vi"
      );
    });

    outStockList.sort((a, b) => {
      return getProductName(a).localeCompare(
        getProductName(b),
        "vi"
      );
    });

    lowStockList.sort((a, b) => {
      return (
        getProductStock(a) -
        getProductStock(b)
      );
    });

    setProducts(productData);

    setInventoryValue(
      totalInventoryValue
    );

    setOutOfStockProducts(
      outStockList
    );

    setLowStockProducts(
      lowStockList
    );

    setInventoryPage(1);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const inventoryTotalPages =
    Math.ceil(
      products.length / inventoryPerPage
    ) || 1;

  const inventoryStartIndex =
    (inventoryPage - 1) *
    inventoryPerPage;

  const sortedProducts = [...products].sort(
    (a, b) => {
      if (!sortConfig.key) {
        return 0;
      }

      const stockA =
        getProductStock(a);

      const stockB =
        getProductStock(b);

      const valueA =
  stockA *
  getProductCapitalPrice(a);

const valueB =
  stockB *
  getProductCapitalPrice(b);

      const compareValue =
        sortConfig.key === "stock"
          ? stockA - stockB
          : valueA - valueB;

      return sortConfig.direction === "asc"
        ? compareValue
        : -compareValue;
    }
  );

  const currentInventoryProducts =
    sortedProducts.slice(
      inventoryStartIndex,
      inventoryStartIndex +
        inventoryPerPage
    );

  const renderSortIcon = (
    key: "stock" | "value"
  ) => {
    return (
      <span className="flex flex-col leading-none text-[10px] ml-1">
        <span
          className={
            sortConfig.key === key &&
            sortConfig.direction === "desc"
              ? "text-sky-700"
              : "text-slate-400"
          }
        >
          ▲
        </span>

        <span
          className={
            sortConfig.key === key &&
            sortConfig.direction === "asc"
              ? "text-sky-700"
              : "text-slate-400"
          }
        >
          ▼
        </span>
      </span>
    );
  };

  const renderProductList = (
    list: any[],
    emptyText: string
  ) => {
    return (
      <div className="max-h-80 overflow-y-auto space-y-3">
        {list.length > 0 ? (
          list.map((product, index) => (
            <div
              key={product.id || index}
              className="border-b pb-2 last:border-b-0"
            >
              <div className="font-semibold">
                {getProductName(product)}
              </div>

              {getProductSecondaryName(product) && (
                <div className="mt-0.5 text-xs text-slate-500">
                  {getProductSecondaryName(product)}
                </div>
              )}

              <div className="text-sm text-slate-500">
                SKU: {getProductSku(product)}
              </div>

              <div className="text-sm text-slate-500">
                Vị trí: {getProductLocation(product)}
              </div>

              <div className="text-sm">
                Tồn kho:{" "}
                <span
                  className={`font-bold ${
                    getProductStock(product) === 0
                      ? "text-rose-600"
                      : "text-amber-600"
                  }`}
                >
                  {getProductStock(product)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500">
            {emptyText}
          </p>
        )}
      </div>
    );
  };

  const popupProducts =
    popupType === "out"
      ? outOfStockProducts
      : popupType === "low"
      ? lowStockProducts
      : [];

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-black">
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Báo cáo tồn kho
            </h1>

            <p className="text-slate-500 mt-1">
              Theo dõi tồn kho, giá trị tồn, sản phẩm hết hàng và sản phẩm dưới định mức
            </p>
          </div>

          <div className="flex items-center gap-3">

  <button
    onClick={exportInventoryReport}
    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
  >
    Xuất file Excel
  </button>

  <button
    onClick={loadProducts}
    className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-semibold transition"
  >
    Tải lại báo cáo
  </button>

</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-slate-500 mb-2">
              Tổng sản phẩm
            </p>

            <p className="text-3xl font-bold text-sky-700">
              {products.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-slate-500 mb-2">
              Giá trị tồn kho
            </p>

            <p className="text-3xl font-bold text-emerald-600">
              {formatMoney(inventoryValue)}đ
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative group">
            <p className="text-slate-500 mb-2">
              Sản phẩm hết hàng
            </p>

            <button
              type="button"
              onClick={() =>
                setPopupType("out")
              }
              className="text-3xl font-bold text-rose-600 cursor-pointer"
            >
              {outOfStockProducts.length}
            </button>

            <p className="text-sm text-slate-500 mt-3">
              {outOfStockProducts.length > 0
                ? `${outOfStockProducts.length} sản phẩm hết hàng`
                : "Không có sản phẩm hết hàng"}
            </p>

            <div className="hidden group-hover:block absolute right-0 top-24 z-50 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
              <h3 className="font-bold text-rose-600 mb-3">
                Danh sách sản phẩm hết hàng
              </h3>

              {renderProductList(
                outOfStockProducts,
                "Không có sản phẩm hết hàng"
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative group">
            <p className="text-slate-500 mb-2">
              Sản phẩm dưới định mức
            </p>

            <button
              type="button"
              onClick={() =>
                setPopupType("low")
              }
              className="text-3xl font-bold text-amber-600 cursor-pointer"
            >
              {lowStockProducts.length}
            </button>

            <p className="text-sm text-slate-500 mt-3">
              {lowStockProducts.length > 0
                ? `${lowStockProducts.length} sản phẩm còn từ 1 - 5`
                : "Không có sản phẩm dưới định mức"}
            </p>

            <div className="hidden group-hover:block absolute right-0 top-24 z-50 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
              <h3 className="font-bold text-amber-600 mb-3">
                Danh sách sản phẩm dưới định mức
              </h3>

              {renderProductList(
                lowStockProducts,
                "Không có sản phẩm dưới định mức"
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Danh sách tồn kho
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Hiển thị 20 sản phẩm mỗi trang
              </p>
            </div>

            <div className="text-sm text-slate-600">
              Tổng sản phẩm:{" "}
              <span className="font-bold text-black">
                {products.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="text-left p-3">
                    STT
                  </th>

                  <th className="text-left p-3">
                    Tên sản phẩm
                  </th>

                  <th className="text-left p-3">
                    SKU
                  </th>

                  <th className="text-left p-3">
                    Vị trí
                  </th>

                  <th className="text-right p-3">
                    Giá vốn
                  </th>

                  <th className="text-right p-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleSort("stock")
                      }
                      className="inline-flex items-center justify-end font-bold hover:text-sky-300"
                    >
                      Tồn kho
                      {renderSortIcon("stock")}
                    </button>
                  </th>

                  <th className="text-right p-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleSort("value")
                      }
                      className="inline-flex items-center justify-end font-bold hover:text-sky-300"
                    >
                      Giá trị tồn
                      {renderSortIcon("value")}
                    </button>
                  </th>

                  <th className="text-center p-3">
                    Trạng thái
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentInventoryProducts.map(
                  (product, index) => {
                    const stock =
                      getProductStock(product);

                    const capitalPrice =
  getProductCapitalPrice(product);

const total =
  stock * capitalPrice;

                    const isOut =
                      stock === 0;

                    const isLow =
                      stock >= 1 &&
                      stock <= 5;

                    return (
                      <tr
                        key={product.id || index}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="p-3">
                          {inventoryStartIndex +
                            index +
                            1}
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-900">
                            {getProductName(product)}
                          </div>

                          {getProductSecondaryName(product) && (
                            <div className="mt-1 text-xs font-normal text-slate-500">
                              {getProductSecondaryName(product)}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          {getProductSku(product)}
                        </td>

                        <td className="p-3">
                          {getProductLocation(product)}
                        </td>

                        <td className="p-3 text-right">
                          {formatMoney(capitalPrice)}đ
                        </td>

                        <td
                          className={`p-3 text-right font-bold ${
                            isOut
                              ? "text-rose-600"
                              : isLow
                              ? "text-orange-600"
                              : "text-black"
                          }`}
                        >
                          {stock}
                        </td>

                        <td className="p-3 text-right font-bold text-sky-700">
                          {formatMoney(total)}đ
                        </td>

                        <td className="p-3 text-center">
                          {isOut ? (
                            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Hết hàng
                            </span>
                          ) : isLow ? (
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Dưới định mức
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Bình thường
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-slate-500"
                    >
                      Chưa có dữ liệu tồn kho
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {products.length > 0 && (
            <div className="flex items-center justify-between mt-5">
              <button
                disabled={inventoryPage === 1}
                onClick={() =>
                  setInventoryPage(
                    inventoryPage - 1
                  )
                }
                className={`px-4 py-2 rounded-xl font-semibold ${
                  inventoryPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                Trước
              </button>

              <div className="font-semibold">
                Trang {inventoryPage} /{" "}
                {inventoryTotalPages}
              </div>

              <button
                disabled={
                  inventoryPage ===
                  inventoryTotalPages
                }
                onClick={() =>
                  setInventoryPage(
                    inventoryPage + 1
                  )
                }
                className={`px-4 py-2 rounded-xl font-semibold ${
                  inventoryPage ===
                  inventoryTotalPages
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>

      {popupType && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden">
            <div
              className={`px-6 py-4 text-white flex justify-between items-center ${
                popupType === "out"
                  ? "bg-red-600"
                  : "bg-orange-600"
              }`}
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {popupType === "out"
                    ? "Sản phẩm hết hàng"
                    : "Sản phẩm dưới định mức"}
                </h2>

                <p className="text-sm opacity-90">
                  Tổng cộng:{" "}
                  {popupProducts.length} sản phẩm
                </p>
              </div>

              <button
                onClick={() =>
                  setPopupType(null)
                }
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="text-left p-3">
                      STT
                    </th>

                    <th className="text-left p-3">
                      Sản phẩm
                    </th>

                    <th className="text-left p-3">
                      SKU
                    </th>

                    <th className="text-left p-3">
                      Vị trí
                    </th>

                    <th className="text-right p-3">
                      Tồn kho
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {popupProducts.map(
                    (product, index) => (
                      <tr
                        key={
                          product.id ||
                          index
                        }
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="p-3">
                          {index + 1}
                        </td>

                        <td className="p-3">
                          <div className="font-semibold text-slate-900">
                            {getProductName(product)}
                          </div>

                          {getProductSecondaryName(product) && (
                            <div className="mt-1 text-xs font-normal text-slate-500">
                              {getProductSecondaryName(product)}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          {getProductSku(product)}
                        </td>

                        <td className="p-3">
                          {getProductLocation(product)}
                        </td>

                        <td
                          className={`p-3 text-right font-bold ${
                            getProductStock(product) === 0
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {getProductStock(product)}
                        </td>
                      </tr>
                    )
                  )}

                  {popupProducts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-6 text-center text-slate-500"
                      >
                        Không có sản phẩm nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end">
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