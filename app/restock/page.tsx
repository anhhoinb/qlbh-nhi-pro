"use client";

import { useEffect, useState } from "react";

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
    <main className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-blue-700">
            Nhập hàng
          </h1>

          <p className="text-gray-500 mt-2">
            Chọn sản phẩm, sản phẩm sẽ tự thêm xuống danh sách nhập. Sau đó nhập số lượng và tạo đơn nhập hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 bg-white p-6 rounded-3xl shadow space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Tìm kiếm / chọn sản phẩm cần nhập
              </label>

              <select
                className="w-full border p-4 rounded-2xl text-black bg-white"
                value={selectedProduct}
                onChange={(e) => {
                  const productId =
                    e.target.value;

                  setSelectedProduct(productId);

                  addProductToList(productId);
                }}
              >
                <option value="">
                  Chọn sản phẩm
                </option>

                {availableProducts.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {getProductCode(item)
                        ? ` - ${getProductCode(
                            item
                          )}`
                        : ""}
                    </option>
                  )
                )}
              </select>

              <p className="text-sm text-gray-500 mt-2">
                Chọn sản phẩm xong hệ thống sẽ tự thêm vào danh sách nhập bên dưới.
              </p>
            </div>

            <div className="border rounded-3xl overflow-hidden">
              <div className="bg-blue-700 text-white px-5 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Danh sách sản phẩm nhập
                </h2>

                <span className="text-sm">
                  {items.length} sản phẩm
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4 text-left">
                        Sản phẩm
                      </th>

                      <th className="p-4 text-left">
                        Mã SP
                      </th>

                      <th className="p-4 text-left">
                        Vị trí
                      </th>

                      <th className="p-4 text-left">
                        Tồn hiện tại
                      </th>

                      <th className="p-4 text-left">
                        Số lượng nhập
                      </th>

                      <th className="p-4 text-left">
                        Sau nhập
                      </th>

                      <th className="p-4 text-center">
                        Xóa
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4 font-semibold">
                          {item.productName ||
                            "---"}
                        </td>

                        <td className="p-4">
                          {item.productCode ||
                            "---"}
                        </td>

                        <td className="p-4">
                          {item.productLocation ||
                            "---"}
                        </td>

                        <td className="p-4 font-bold text-blue-700">
                          {item.beforeStock}
                        </td>

                        <td className="p-4">
                          <input
                            type="number"
                            min="1"
                            placeholder="SL"
                            className="w-32 border p-3 rounded-xl text-black"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                item.productId,
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td className="p-4 font-bold text-green-600">
                          {item.afterStock}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(
                                item.productId
                              )
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold"
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
                          className="p-8 text-center text-gray-500"
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
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white p-4 rounded-2xl text-lg font-semibold"
            >
              {loading
                ? "Đang tạo đơn nhập..."
                : "Tạo đơn nhập hàng"}
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow h-fit">
            <h2 className="text-xl font-bold mb-5">
              Tóm tắt đơn nhập
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-sm text-gray-500">
                  Số sản phẩm
                </p>

                <p className="text-3xl font-bold text-blue-700 mt-1">
                  {totalItemCount}
                </p>
              </div>

              <div className="rounded-2xl bg-green-50 p-5">
                <p className="text-sm text-gray-500">
                  Tổng số lượng nhập
                </p>

                <p className="text-3xl font-bold text-green-600 mt-1">
                  {totalQuantity}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-600 leading-6">
                Sau khi nhấn tạo đơn nhập, hệ thống sẽ tự cộng tồn kho cho từng sản phẩm và lưu lại lịch sử theo mã đơn nhập hàng.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}