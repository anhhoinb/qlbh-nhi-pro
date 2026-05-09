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

  const [price, setPrice] =
    useState("");

  const [importPrice, setImportPrice] =
    useState("");

  const [capitalPrice, setCapitalPrice] =
    useState("");

  const [stock, setStock] =
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

  const [editPrice, setEditPrice] =
    useState("");

  const [editImportPrice, setEditImportPrice] =
    useState("");

  const [editCapitalPrice, setEditCapitalPrice] =
    useState("");

  const [editStock, setEditStock] =
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

          price:
            Number(price),

          import_price:
            Number(importPrice || 0),

          capital_price:
            Number(capitalPrice || 0),

          stock:
            Number(stock || 0),

          createdAt:
            new Date(),

        }
      );

      alert(
        "Thêm sản phẩm thành công"
      );

      setName("");

      setPrice("");

      setImportPrice("");

      setCapitalPrice("");

      setStock("");

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
              editName,

            price:
              Number(editPrice),

            import_price:
              Number(
                editImportPrice
              ),

            capital_price:
              Number(
                editCapitalPrice
              ),

            stock:
              Number(editStock),

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
      (item: any) =>
        item.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
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

          <div className="grid md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="Tên sản phẩm"
              className="border p-4 rounded-2xl text-black"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Giá bán"
              className="border p-4 rounded-2xl text-black"
              value={price}
              onChange={(e) =>
                setPrice(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Giá nhập"
              className="border p-4 rounded-2xl text-black"
              value={importPrice}
              onChange={(e) =>
                setImportPrice(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Giá vốn"
              className="border p-4 rounded-2xl text-black"
              value={capitalPrice}
              onChange={(e) =>
                setCapitalPrice(
                  e.target.value
                )
              }
            />

            <input
              type="number"
              placeholder="Tồn kho"
              className="border p-4 rounded-2xl text-black"
              value={stock}
              onChange={(e) =>
                setStock(
                  e.target.value
                )
              }
            />

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
            placeholder="Tìm kiếm sản phẩm..."
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

        <div className="bg-white rounded-3xl shadow overflow-hidden">

          <table className="w-full">

            <thead className="bg-blue-700 text-white">

              <tr>

                <th className="p-4 text-left">
                  Tên sản phẩm
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

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white p-8 rounded-3xl w-full max-w-xl">

            <h2 className="text-3xl font-bold mb-6 text-black">
              Sửa sản phẩm
            </h2>

            <div className="space-y-4">

  <div>

    <label className="block mb-2 font-semibold text-black">
      Tên sản phẩm
    </label>

    <input
      type="text"
      placeholder="Tên sản phẩm"
      className="w-full border p-4 rounded-2xl text-black"
      value={editName}
      onChange={(e) =>
        setEditName(
          e.target.value
        )
      }
    />

  </div>

  <div>

    <label className="block mb-2 font-semibold text-black">
      Giá bán
    </label>

    <input
      type="number"
      placeholder="Giá bán"
      className="w-full border p-4 rounded-2xl text-black"
      value={editPrice}
      onChange={(e) =>
        setEditPrice(
          e.target.value
        )
      }
    />

  </div>

  <div>

    <label className="block mb-2 font-semibold text-black">
      Giá nhập
    </label>

    <input
      type="number"
      placeholder="Giá nhập"
      className="w-full border p-4 rounded-2xl text-black"
      value={editImportPrice}
      onChange={(e) =>
        setEditImportPrice(
          e.target.value
        )
      }
    />

  </div>

  <div>

    <label className="block mb-2 font-semibold text-black">
      Giá vốn
    </label>

    <input
      type="number"
      placeholder="Giá vốn"
      className="w-full border p-4 rounded-2xl text-black"
      value={editCapitalPrice}
      onChange={(e) =>
        setEditCapitalPrice(
          e.target.value
        )
      }
    />

  </div>

  <div>

    <label className="block mb-2 font-semibold text-black">
      Tồn kho
    </label>

    <input
      type="number"
      placeholder="Tồn kho"
      className="w-full border p-4 rounded-2xl text-black"
      value={editStock}
      onChange={(e) =>
        setEditStock(
          e.target.value
        )
      }
    />

  </div>

</div>

            <div className="flex gap-3 mt-6">

              <button
                onClick={saveEditProduct}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl"
              >
                Lưu
              </button>

              <button
                onClick={() =>
                  setEditingProduct(
                    null
                  )
                }
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-2xl"
              >
                Hủy
              </button>

            </div>

          </div>

        </div>

      )}

    </main>

  );

}