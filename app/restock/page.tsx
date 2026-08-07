"use client";

import { useEffect, useRef, useState } from "react";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type RestockItem = {
  productId: string;
  productName: string;
  productCode: string;
  productLocation: string;
  beforeStock: number;
  quantity: string;
  afterStock: number;
};

export default function RestockPage() {
  const [products, setProducts] =
    useState<any[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [productSearch, setProductSearch] =
    useState("");

  const [showProductDropdown, setShowProductDropdown] =
    useState(false);

  const productPickerRef =
    useRef<HTMLDivElement | null>(null);

  const productSearchRef =
    useRef<HTMLInputElement | null>(null);

  const [items, setItems] =
    useState<RestockItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const loadProducts = async () => {
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

    data.sort((a, b) =>
      String(a.name || "").localeCompare(
        String(b.name || ""),
        "vi"
      )
    );

    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        productPickerRef.current &&
        !productPickerRef.current.contains(target)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const getProductCode = (item: any) => {
    return (
      item?.product_code ||
      item?.productCode ||
      item?.sku ||
      item?.code ||
      ""
    );
  };

  const getProductLocation = (item: any) => {
    return (
      item?.product_location ||
      item?.location ||
      item?.position ||
      item?.place ||
      ""
    );
  };

  const generateRestockCode = () => {
    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(now.getMonth() + 1).padStart(
        2,
        "0"
      );

    const day =
      String(now.getDate()).padStart(
        2,
        "0"
      );

    const hour =
      String(now.getHours()).padStart(
        2,
        "0"
      );

    const minute =
      String(now.getMinutes()).padStart(
        2,
        "0"
      );

    const second =
      String(now.getSeconds()).padStart(
        2,
        "0"
      );

    return `PNH-${year}${month}${day}-${hour}${minute}${second}`;
  };

  const availableProducts =
    products.filter(
      (product) =>
        !items.some(
          (item) =>
            item.productId === product.id
        )
    );

  const filteredAvailableProducts =
    productSearch.trim() === ""
      ? availableProducts.slice(0, 30)
      : availableProducts
          .filter((product) => {
            const keyword =
              productSearch.trim().toLowerCase();

            const name =
              String(product.name || "").toLowerCase();

            const code =
              String(getProductCode(product) || "").toLowerCase();

            return (
              name.includes(keyword) ||
              code.includes(keyword)
            );
          })
          .slice(0, 30);

  const totalQuantity =
    items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );

  const totalItemCount =
    items.length;

  const addProductToList = (
    productId: string
  ) => {
    if (!productId) {
      return;
    }

    const product =
      products.find(
        (item) => item.id === productId
      );

    if (!product) {
      alert("Không tìm thấy sản phẩm");
      setSelectedProduct("");
      return;
    }

    const existed =
      items.some(
        (item) =>
          item.productId === product.id
      );

    if (existed) {
      alert("Sản phẩm này đã có trong đơn nhập");
      setSelectedProduct("");
      return;
    }

    const beforeStock =
      Number(product.stock || 0);

    const newItem: RestockItem = {
      productId: product.id,
      productName: product.name || "",
      productCode: getProductCode(product),
      productLocation:
        getProductLocation(product),
      beforeStock,
      quantity: "",
      afterStock: beforeStock,
    };

    setItems((prev) => [
      ...prev,
      newItem,
    ]);

    setSelectedProduct("");
  };

  const updateItemQuantity = (
    productId: string,
    quantity: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) {
          return item;
        }

        const numberQuantity =
          Number(quantity || 0);

        return {
          ...item,
          quantity,
          afterStock:
            item.beforeStock +
            numberQuantity,
        };
      })
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          item.productId !== productId
      )
    );
  };

  const handleRestock = async () => {
    if (items.length === 0) {
      alert("Vui lòng chọn sản phẩm cần nhập");
      return;
    }

    const invalidItem =
      items.find(
        (item) =>
          Number(item.quantity || 0) <= 0
      );

    if (invalidItem) {
      alert(
        `Vui lòng nhập số lượng hợp lệ cho sản phẩm: ${invalidItem.productName}`
      );
      return;
    }

    try {
      setLoading(true);

      const restockCode =
        generateRestockCode();

      const finalItems =
        items.map((item) => {
          const quantity =
            Number(item.quantity || 0);

          return {
            productId: item.productId,
            productName: item.productName,
            productCode: item.productCode,
            productLocation:
              item.productLocation,
            beforeStock:
              Number(item.beforeStock || 0),
            quantity,
            afterStock:
              Number(item.beforeStock || 0) +
              quantity,
          };
        });

      for (const item of finalItems) {
        await updateDoc(
          doc(db, "products", item.productId),
          {
            stock: item.afterStock,
          }
        );
      }

      await addDoc(
        collection(db, "restocks"),
        {
          code: restockCode,
          type: "restock_order",
          itemCount: finalItems.length,
          totalQuantity:
            finalItems.reduce(
              (sum, item) =>
                sum + item.quantity,
              0
            ),
          items: finalItems,
          createdAt: new Date(),
        }
      );

      alert(
        `Tạo đơn nhập hàng thành công: ${restockCode}`
      );

      setItems([]);
      setSelectedProduct("");

      await loadProducts();
    } catch (error) {
      console.log(error);
      alert("Nhập hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-black">
      <div className="max-w-[1400px] mx-auto space-y-5">
        <div>
          <h1 className="text-4xl font-bold text-blue-700">
            Nhập hàng
          </h1>

          <p className="text-slate-500 mt-1">
            Chọn sản phẩm, sản phẩm sẽ tự thêm xuống danh sách nhập. Sau đó nhập số lượng và tạo đơn nhập hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="xl:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-slate-700">
                Tìm kiếm / chọn sản phẩm cần nhập
              </label>

              <div
                ref={productPickerRef}
                className="relative"
              >
                <input
                  ref={productSearchRef}
                  type="text"
                  value={productSearch}
                  onFocus={() =>
                    setShowProductDropdown(true)
                  }
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  placeholder="Tìm theo tên hoặc mã sản phẩm..."
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl text-black bg-white outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />

                {showProductDropdown && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredAvailableProducts.length > 0 ? (
                      filteredAvailableProducts.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() => {
                            addProductToList(item.id);
                            setProductSearch("");
                            setShowProductDropdown(false);

                            setTimeout(() => {
                              productSearchRef.current?.blur();
                            }, 0);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-sky-50 last:border-b-0"
                        >
                          <div className="font-semibold text-slate-800">
                            {item.name || "---"}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-500">
                            {getProductCode(item)
                              ? `Mã: ${getProductCode(item)}`
                              : "Chưa có mã sản phẩm"}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-sm text-slate-500">
                        Không tìm thấy sản phẩm phù hợp
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-sm text-slate-500 mt-2">
                Chọn sản phẩm xong hệ thống sẽ tự thêm vào danh sách nhập bên dưới.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Danh sách sản phẩm nhập
                </h2>

                <span className="text-sm">
                  {items.length} sản phẩm
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        Sản phẩm
                      </th>

                      <th className="px-4 py-3 text-center">
                        Mã SP
                      </th>

                      <th className="px-4 py-3 text-left">
                        Vị trí
                      </th>

                      <th className="px-4 py-3 text-left">
                        Tồn hiện tại
                      </th>

                      <th className="px-4 py-3 text-left">
                        Số lượng nhập
                      </th>

                      <th className="px-4 py-3 text-left">
                        Sau nhập
                      </th>

                      <th className="px-4 py-3 text-center">
                        Xóa
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.productName ||
                            "---"}
                        </td>

                        <td className="px-4 py-3">
                          {item.productCode ||
                            "---"}
                        </td>

                        <td className="px-4 py-3">
                          {item.productLocation ||
                            "---"}
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-sky-700">
                          {item.beforeStock}
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="SL"
                            className="w-28 border border-slate-300 px-3 py-2 rounded-xl text-black outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                item.productId,
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-emerald-600">
                          {item.afterStock}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                item.productId
                              )
                            }
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl font-semibold transition"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-slate-500"
                        >
                          Chưa có sản phẩm nào trong đơn nhập
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={handleRestock}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-3.5 rounded-xl text-base font-semibold transition"
            >
              {loading
                ? "Đang tạo đơn nhập..."
                : "Tạo đơn nhập hàng"}
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Tóm tắt đơn nhập
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4">
                <p className="text-sm text-slate-500">
                  Số sản phẩm
                </p>

                <p className="text-3xl font-bold text-sky-700 mt-1">
                  {totalItemCount}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-sm text-slate-500">
                  Tổng số lượng nhập
                </p>

                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {totalQuantity}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 leading-6">
                Sau khi nhấn tạo đơn nhập, hệ thống sẽ tự cộng tồn kho cho từng sản phẩm và lưu lại lịch sử theo mã đơn nhập hàng.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}