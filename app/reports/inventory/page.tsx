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

  const exportInventoryReport = () => {

  const exportData =
    products.map(
      (product, index) => {

        const stock =
          getProductStock(product);

        const price =
          getProductPrice(product);

        const total =
          stock * price;

        return {
          STT: index + 1,
          "Tên sản phẩm":
            getProductName(product),
          SKU:
            getProductSku(product),
          "Vị trí":
            getProductLocation(product),
          "Giá bán":
            price,
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

      const stock =
        getProductStock(product);

      const price =
        getProductPrice(product);

      totalInventoryValue +=
        stock * price;

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
        stockA * getProductPrice(a);

      const valueB =
        stockB * getProductPrice(b);

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
              ? "text-blue-700"
              : "text-gray-400"
          }
        >
          ▲
        </span>

        <span
          className={
            sortConfig.key === key &&
            sortConfig.direction === "asc"
              ? "text-blue-700"
              : "text-gray-400"
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

              <div className="text-sm text-gray-500">
                SKU: {getProductSku(product)}
              </div>

              <div className="text-sm text-gray-500">
                Vị trí: {getProductLocation(product)}
              </div>

              <div className="text-sm">
                Tồn kho:{" "}
                <span
                  className={`font-bold ${
                    getProductStock(product) === 0
                      ? "text-red-600"
                      : "text-orange-600"
                  }`}
                >
                  {getProductStock(product)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">
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
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Báo cáo tồn kho
            </h1>

            <p className="text-gray-500 mt-1">
              Theo dõi tồn kho, giá trị tồn, sản phẩm hết hàng và sản phẩm dưới định mức
            </p>
          </div>

          <div className="flex items-center gap-3">

  <div className="flex items-center gap-3">

  <button
    onClick={exportInventoryReport}
    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
  >
    Xuất file Excel
  </button>

  <button
    onClick={loadProducts}
    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
  >
    Tải lại báo cáo
  </button>

</div>

</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500 mb-2">
              Tổng sản phẩm
            </p>

            <p className="text-3xl font-bold text-blue-700">
              {products.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500 mb-2">
              Giá trị tồn kho
            </p>

            <p className="text-3xl font-bold text-green-600">
              {formatMoney(inventoryValue)}đ
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5 relative group">
            <p className="text-gray-500 mb-2">
              Sản phẩm hết hàng
            </p>

            <button
              type="button"
              onClick={() =>
                setPopupType("out")
              }
              className="text-3xl font-bold text-red-600 cursor-pointer"
            >
              {outOfStockProducts.length}
            </button>

            <p className="text-sm text-gray-500 mt-3">
              {outOfStockProducts.length > 0
                ? `${outOfStockProducts.length} sản phẩm hết hàng`
                : "Không có sản phẩm hết hàng"}
            </p>

            <div className="hidden group-hover:block absolute right-0 top-24 z-50 w-96 bg-white border rounded-2xl shadow-xl p-4">
              <h3 className="font-bold text-red-600 mb-3">
                Danh sách sản phẩm hết hàng
              </h3>

              {renderProductList(
                outOfStockProducts,
                "Không có sản phẩm hết hàng"
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5 relative group">
            <p className="text-gray-500 mb-2">
              Sản phẩm dưới định mức
            </p>

            <button
              type="button"
              onClick={() =>
                setPopupType("low")
              }
              className="text-3xl font-bold text-orange-600 cursor-pointer"
            >
              {lowStockProducts.length}
            </button>

            <p className="text-sm text-gray-500 mt-3">
              {lowStockProducts.length > 0
                ? `${lowStockProducts.length} sản phẩm còn từ 1 - 5`
                : "Không có sản phẩm dưới định mức"}
            </p>

            <div className="hidden group-hover:block absolute right-0 top-24 z-50 w-96 bg-white border rounded-2xl shadow-xl p-4">
              <h3 className="font-bold text-orange-600 mb-3">
                Danh sách sản phẩm dưới định mức
              </h3>

              {renderProductList(
                lowStockProducts,
                "Không có sản phẩm dưới định mức"
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold">
                Danh sách tồn kho
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Hiển thị 20 sản phẩm mỗi trang
              </p>
            </div>

            <div className="text-sm text-gray-600">
              Tổng sản phẩm:{" "}
              <span className="font-bold text-black">
                {products.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
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
                    Giá bán
                  </th>

                  <th className="text-right p-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleSort("stock")
                      }
                      className="inline-flex items-center justify-end font-bold hover:text-blue-700"
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
                      className="inline-flex items-center justify-end font-bold hover:text-blue-700"
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

                    const price =
                      getProductPrice(product);

                    const total =
                      stock * price;

                    const isOut =
                      stock === 0;

                    const isLow =
                      stock >= 1 &&
                      stock <= 5;

                    return (
                      <tr
                        key={product.id || index}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          {inventoryStartIndex +
                            index +
                            1}
                        </td>

                        <td className="p-3 font-semibold">
                          {getProductName(product)}
                        </td>

                        <td className="p-3">
                          {getProductSku(product)}
                        </td>

                        <td className="p-3">
                          {getProductLocation(product)}
                        </td>

                        <td className="p-3 text-right">
                          {formatMoney(price)}đ
                        </td>

                        <td
                          className={`p-3 text-right font-bold ${
                            isOut
                              ? "text-red-600"
                              : isLow
                              ? "text-orange-600"
                              : "text-black"
                          }`}
                        >
                          {stock}
                        </td>

                        <td className="p-3 text-right font-bold text-blue-700">
                          {formatMoney(total)}đ
                        </td>

                        <td className="p-3 text-center">
                          {isOut ? (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Hết hàng
                            </span>
                          ) : isLow ? (
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Dưới định mức
                            </span>
                          ) : (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
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
                      className="p-6 text-center text-gray-500"
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
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
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
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">
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
                  <tr className="bg-gray-50 border-b">
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
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          {index + 1}
                        </td>

                        <td className="p-3 font-semibold">
                          {getProductName(product)}
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
                              ? "text-red-600"
                              : "text-orange-600"
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
                        className="p-6 text-center text-gray-500"
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