"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "@/lib/firebase";

export default function ProductsPage() {

  // ADD PRODUCT

  const [name, setName] =
    useState("");

  const [costPrice, setCostPrice] =
    useState("");

  const [productCode, setProductCode] =
    useState("");

  const [productLocation, setProductLocation] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [importPrice, setImportPrice] =
    useState("");

  const [capitalPrice, setCapitalPrice] =
    useState("");

  const [stock, setStock] =
    useState("");

  const [unit, setUnit] =
    useState("");

  const [tax, setTax] =
    useState("");

  // SEARCH

  const [search, setSearch] =
    useState("");

  // DATA

  const [loading, setLoading] =
    useState(true);

  const [products, setProducts] =
    useState<any[]>([]);

  // EDIT MODAL

  const [editingProduct, setEditingProduct] =
    useState<any>(null);

  const [editName, setEditName] =
    useState("");

  const [editProductCode, setEditProductCode] =
    useState("");

  const [editProductLocation, setEditProductLocation] =
    useState("");

  const [editPrice, setEditPrice] =
    useState("");

  const [editImportPrice, setEditImportPrice] =
    useState("");

  const [editCapitalPrice, setEditCapitalPrice] =
    useState("");

  const [editStock, setEditStock] =
    useState("");

  const [editUnit, setEditUnit] =
    useState("");

  const [editTax, setEditTax] =
    useState("");

  // LOAD PRODUCTS

  const loadProducts =
    async () => {

      try {

        const querySnapshot =
          await getDocs(
            collection(
              db,
              "products"
            )
          );

        const data: any[] = [];

        querySnapshot.forEach(
          (docItem) => {

            data.push({
              id: docItem.id,
              ...docItem.data(),
            });

          }
        );

        setProducts(data);

      } catch (error) {

        console.log(error);

        alert(
          "Không tải được sản phẩm"
        );

      }

      setLoading(false);
    };

  useEffect(() => {

    loadProducts();

  }, []);

  // ADD PRODUCT

  const addProduct = async () => {

    try {

      if (!name || !price) {

        alert(
          "Nhập đầy đủ thông tin"
        );

        return;
      }

      const normalizedName =
        name
          .trim()
          .toLowerCase();

      const duplicate =
        products.find(
          (item: any) =>
            item.name
              ?.trim()
              ?.toLowerCase() ===
            normalizedName
        );

      if (duplicate) {

        alert(
          "Sản phẩm đã tồn tại"
        );

        return;
      }

      await addDoc(
        collection(
          db,
          "products"
        ),
        {

          name:
            name.trim(),

          product_code:
            productCode.trim(),

          product_location:
            productLocation.trim(),

          price:
            Number(price || 0),

          import_price:
            Number(importPrice || 0),

          capital_price:
            Number(costPrice || 0),

          stock:
            Number(stock || 0),

          unit:
            unit.trim() || "cái",

          tax:
            Number(tax || 0),

          createdAt:
            new Date(),

        }
      );

      alert(
        "Thêm sản phẩm thành công"
      );

      setName("");

      setProductCode("");

      setProductLocation("");

      setPrice("");

      setImportPrice("");

      setCapitalPrice("");

      setCostPrice("");

      setStock("");

      setUnit("");

      setTax("");

      loadProducts();

    } catch (error) {

      console.log(error);

      alert(
        "Không thể thêm sản phẩm"
      );

    }

  };

  // OPEN EDIT MODAL

  const openEditModal =
    (item: any) => {

      setEditingProduct(item);

      setEditName(
        item.name || ""
      );

      setEditProductCode(
        item.product_code || ""
      );

      setEditProductLocation(
        item.product_location || ""
      );

      setEditPrice(
        String(item.price || 0)
      );

      setEditImportPrice(
        String(
          item.import_price || 0
        )
      );

      setEditCapitalPrice(
        String(
          item.capital_price || 0
        )
      );

      setEditStock(
        String(item.stock || 0)
      );

      setEditUnit(
        typeof item.unit === "string"
          ? item.unit
          : item.unit?.name || "cái"
      );

      setEditTax(
        String(item.tax || 0)
      );

    };

  // SAVE EDIT

  const saveEditProduct =
    async () => {

      if (!editingProduct)
        return;

      try {

        await updateDoc(
          doc(
            db,
            "products",
            editingProduct.id
          ),
          {

            name:
              editName.trim(),

            product_code:
              editProductCode.trim(),

            product_location:
              editProductLocation.trim(),

            price:
              Number(editPrice || 0),

            import_price:
              Number(
                editImportPrice || 0
              ),

            capital_price:
              Number(
                editCapitalPrice || 0
              ),

            stock:
              Number(editStock || 0),

            unit:
              editUnit.trim() || "cái",

            tax:
              Number(editTax || 0),

          }
        );

        alert(
          "Cập nhật thành công"
        );

        setEditingProduct(null);

        loadProducts();

      } catch (error) {

        console.log(error);

        alert(
          "Cập nhật thất bại"
        );

      }

    };

  // DELETE PRODUCT

  const deleteProduct =
    async (
      id: string
    ) => {

      const confirmDelete =
        confirm(
          "Bạn có chắc muốn xóa?"
        );

      if (!confirmDelete)
        return;

      try {

        await deleteDoc(
          doc(
            db,
            "products",
            id
          )
        );

        loadProducts();

      } catch (error) {

        console.log(error);

        alert(
          "Xóa sản phẩm thất bại"
        );

      }

    };

  // SEARCH

  const filteredProducts =
    products.filter(
      (item: any) => {

        const keyword =
          search.toLowerCase();

        const itemName =
          item.name
            ?.toLowerCase() || "";

        const itemCode =
          item.product_code
            ?.toLowerCase() || "";

        const itemLocation =
          item.product_location
            ?.toLowerCase() || "";

        return (
          itemName.includes(keyword) ||
          itemCode.includes(keyword) ||
          itemLocation.includes(keyword)
        );

      }
    );

  // LOADING

  if (loading) {

    return (
      <div className="p-10 text-2xl">
        Đang tải sản phẩm...
      </div>
    );

  }

  return (

    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold text-blue-700 mb-8">
          Quản lý sản phẩm
        </h1>

        {/* ADD FORM */}

        <div className="bg-white p-6 rounded-3xl shadow mb-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-semibold text-black">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                placeholder="Nhập tên sản phẩm"
                className="w-full border p-4 rounded-2xl text-black"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                Mã sản phẩm
              </label>

              <input
                type="text"
                placeholder="Nhập mã sản phẩm"
                className="w-full border p-4 rounded-2xl text-black"
                value={productCode}
                onChange={(e) =>
                  setProductCode(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                Vị trí sản phẩm
              </label>

              <input
                type="text"
                placeholder="VD: Kệ A1, Ngăn B2"
                className="w-full border p-4 rounded-2xl text-black"
                value={productLocation}
                onChange={(e) =>
                  setProductLocation(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                Giá bán <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                placeholder="Nhập giá bán"
                className="w-full border p-4 rounded-2xl text-black"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                Giá nhập
              </label>

              <input
                type="number"
                placeholder="Nhập giá nhập"
                className="w-full border p-4 rounded-2xl text-black"
                value={importPrice}
                onChange={(e) =>
                  setImportPrice(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                Giá vốn
              </label>

              <input
                type="number"
                placeholder="Nhập giá vốn"
                className="w-full border p-4 rounded-2xl text-black"
                value={costPrice}
                onChange={(e) =>
                  setCostPrice(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                Tồn kho <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                placeholder="Nhập tồn kho"
                className="w-full border p-4 rounded-2xl text-black"
                value={stock}
                onChange={(e) =>
                  setStock(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                Đơn vị
              </label>

              <input
                type="text"
                placeholder="VD: cái, bộ, mét..."
                className="w-full border p-4 rounded-2xl text-black"
                value={unit}
                onChange={(e) =>
                  setUnit(e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-black">
                VAT
              </label>

              <select
                className="w-full border p-4 rounded-2xl text-black"
                value={tax}
                onChange={(e) =>
                  setTax(e.target.value)
                }
              >
                <option value="">
                  Chọn VAT
                </option>

                <option value="0">
                  VAT 0%
                </option>

                <option value="8">
                  VAT 8%
                </option>

                <option value="10">
                  VAT 10%
                </option>
              </select>
            </div>

          </div>

          <button
            onClick={addProduct}
            className="mt-5 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl"
          >
            + Thêm sản phẩm
          </button>

        </div>

        {/* SEARCH */}

        <div className="bg-white p-6 rounded-3xl shadow mb-6">

          <input
            type="text"
            placeholder="Tìm theo tên, mã sản phẩm hoặc vị trí..."
            autoComplete="off"
            className="w-full border p-4 rounded-2xl text-black"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </div>

        {/* TABLE */}

        <div className="bg-white rounded-3xl shadow overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-blue-700 text-white">

              <tr>

                <th className="p-4 text-left">
                  Tên sản phẩm
                </th>

                <th className="p-4 text-left">
                  Mã SP
                </th>

                <th className="p-4 text-left">
                  Vị trí
                </th>

                <th className="p-4 text-left">
                  Giá nhập
                </th>

                <th className="p-4 text-left">
                  Giá bán
                </th>

                <th className="p-4 text-left">
                  Giá vốn
                </th>

                <th className="p-4 text-left">
                  Tồn kho
                </th>

                <th className="p-4 text-left">
                  Đơn vị
                </th>

                <th className="p-4 text-left">
                  VAT
                </th>

                <th className="p-4 text-left">
                  Hành động
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredProducts.map(
                (item: any) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4 text-black">
                      {item.name}
                    </td>

                    <td className="p-4 text-black">
                      {item.product_code || "---"}
                    </td>

                    <td className="p-4 text-black">
                      {item.product_location || "---"}
                    </td>

                    <td className="p-4 text-black">
                      {Number(
                        item.import_price || 0
                      ).toLocaleString()}đ
                    </td>

                    <td className="p-4 text-black">
                      {Number(
                        item.price || 0
                      ).toLocaleString()}đ
                    </td>

                    <td className="p-4 text-black">
                      {Number(
                        item.capital_price || 0
                      ).toLocaleString()}đ
                    </td>

                    <td className="p-4 text-black">
                      {item.stock || 0}
                    </td>

                    <td className="p-4 text-black">
                      {typeof item.unit === "string"
                        ? item.unit
                        : item.unit?.name || "cái"}
                    </td>

                    <td className="p-4 text-black">
                      {Number(item.tax || 0)}%
                    </td>

                    <td className="p-4">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            openEditModal(
                              item
                            )
                          }
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl"
                        >
                          Sửa
                        </button>

                        <button
                          onClick={() =>
                            deleteProduct(
                              item.id
                            )
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
                        >
                          Xóa
                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* EDIT MODAL */}

      {editingProduct && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">

          <div className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-gray-100 px-7 py-5">

              <div>

                <h2 className="text-3xl font-bold text-black">
                  Sửa sản phẩm
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Cập nhật thông tin sản phẩm, giá bán, giá vốn và tồn kho
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setEditingProduct(
                    null
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-2xl leading-none text-gray-500 hover:bg-gray-200 hover:text-black"
              >
                ×
              </button>

            </div>

            <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-7 py-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">

                  <div className="mb-5 flex items-center justify-between">

                    <h3 className="text-lg font-bold text-blue-700">
                      Thông tin sản phẩm
                    </h3>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      Cơ bản
                    </span>

                  </div>

                  <div className="space-y-4">

                    <div>

                      <label className="block mb-2 text-sm font-semibold text-black">
                        Tên sản phẩm
                      </label>

                      <input
                        type="text"
                        placeholder="Tên sản phẩm"
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={editName}
                        onChange={(e) =>
                          setEditName(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div>

                      <label className="block mb-2 text-sm font-semibold text-black">
                        Mã sản phẩm
                      </label>

                      <input
                        type="text"
                        placeholder="VD: SP0001, LED12V..."
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={editProductCode}
                        onChange={(e) =>
                          setEditProductCode(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div>

                      <label className="block mb-2 text-sm font-semibold text-black">
                        Vị trí sản phẩm
                      </label>

                      <input
                        type="text"
                        placeholder="VD: Kệ A1, Ngăn B2..."
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={editProductLocation}
                        onChange={(e) =>
                          setEditProductLocation(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div>

                      <label className="block mb-2 text-sm font-semibold text-black">
                        Đơn vị
                      </label>

                      <input
                        type="text"
                        placeholder="VD: cái, bộ, mét, cuộn..."
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={editUnit}
                        onChange={(e) =>
                          setEditUnit(
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">

                  <div className="mb-5 flex items-center justify-between">

                    <h3 className="text-lg font-bold text-blue-700">
                      Giá bán & tồn kho
                    </h3>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Bán hàng
                    </span>

                  </div>

                  <div className="space-y-4">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div>

                        <label className="block mb-2 text-sm font-semibold text-black">
                          Giá bán
                        </label>

                        <input
                          type="number"
                          placeholder="Giá bán"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          value={editPrice}
                          onChange={(e) =>
                            setEditPrice(
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div>

                        <label className="block mb-2 text-sm font-semibold text-black">
                          Giá nhập
                        </label>

                        <input
                          type="number"
                          placeholder="Giá nhập"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          value={editImportPrice}
                          onChange={(e) =>
                            setEditImportPrice(
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div>

                        <label className="block mb-2 text-sm font-semibold text-black">
                          Giá vốn
                        </label>

                        <input
                          type="number"
                          placeholder="Giá vốn"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          value={editCapitalPrice}
                          onChange={(e) =>
                            setEditCapitalPrice(
                              e.target.value
                            )
                          }
                        />

                      </div>

                      <div>

                        <label className="block mb-2 text-sm font-semibold text-black">
                          Tồn kho
                        </label>

                        <input
                          type="number"
                          placeholder="Tồn kho"
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          value={editStock}
                          onChange={(e) =>
                            setEditStock(
                              e.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                    <div>

                      <label className="block mb-2 text-sm font-semibold text-black">
                        VAT
                      </label>

                      <select
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-black outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        value={editTax}
                        onChange={(e) =>
                          setEditTax(
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Chọn VAT
                        </option>

                        <option value="0">
                          VAT 0%
                        </option>

                        <option value="8">
                          VAT 8%
                        </option>

                        <option value="10">
                          VAT 10%
                        </option>

                      </select>

                    </div>

                    <div className="rounded-2xl bg-white p-4 border border-gray-100">

                      <p className="text-sm text-gray-500">
                        Gợi ý
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        Giá vốn dùng để tính lợi nhuận. Tồn kho sẽ hiển thị trong quản lý kho và POS.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-white px-7 py-5">

              <button
                onClick={() =>
                  setEditingProduct(
                    null
                  )
                }
                className="rounded-2xl bg-gray-200 px-7 py-3 font-semibold text-gray-700 hover:bg-gray-300"
              >
                Hủy
              </button>

              <button
                onClick={saveEditProduct}
                className="rounded-2xl bg-blue-700 px-8 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Lưu thay đổi
              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  );

}