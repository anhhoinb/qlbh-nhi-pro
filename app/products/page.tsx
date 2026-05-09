"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  db,
  storage,
} from "@/lib/firebase";

export default function ProductsPage() {

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

  const [imageFile, setImageFile] =
    useState<any>(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [products, setProducts] =
    useState<any[]>([]);

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {

        const data: any[] = [];

        snapshot.forEach((docItem) => {

          data.push({
            id: docItem.id,
            ...docItem.data(),
          });

        });

        setProducts(data);

        setLoading(false);
      }
    );

    return () => unsubscribe();

  }, []);

  const addProduct = async () => {

    if (!name || !price) {

      alert("Nhập đầy đủ thông tin");

      return;
    }

    const normalizedName =
      name.trim().toLowerCase();

    const checkDuplicate =
      products.find(
        (item) =>
          item.name
            ?.trim()
            ?.toLowerCase() ===
          normalizedName
      );

    if (checkDuplicate) {

      alert("Sản phẩm đã tồn tại");

      return;
    }

  let imageUrl = "";

try {

  if (imageFile) {

    const imageRef = ref(
      storage,
      `products/${Date.now()}-${imageFile.name}`
    );

    await uploadBytes(
      imageRef,
      imageFile
    );

    imageUrl =
      await getDownloadURL(
        imageRef
      );
  }

} catch (error) {

  console.log(error);

  alert(
    "Upload ảnh lỗi, sản phẩm vẫn sẽ được thêm"
  );
}

    await addDoc(
      collection(db, "products"),
      {
        name: name.trim(),

        price: Number(price),

        import_price:
          Number(importPrice || 0),

        capital_price:
          Number(capitalPrice || 0),

        stock: Number(stock || 0),

        image: imageUrl,

        createdAt: new Date(),
      }
    );

    setName("");

    setPrice("");

    setImportPrice("");

    setCapitalPrice("");

    setStock("");

    setImageFile(null);
  };

  const deleteProduct = async (
    id: string
  ) => {

    const confirmDelete = confirm(
      "Bạn có chắc muốn xóa?"
    );

    if (!confirmDelete) return;

    await deleteDoc(
      doc(db, "products", id)
    );
  };

  const filteredProducts =
    products.filter(
      (item) =>
        item.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

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

        <div className="bg-white p-6 rounded-3xl shadow mb-8">

          <div className="grid md:grid-cols-2 gap-4">

            <input
              type="text"
              placeholder="Tên sản phẩm"
              className="border p-4 rounded-2xl text-black"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Giá bán"
              className="border p-4 rounded-2xl text-black"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value)
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
                setStock(e.target.value)
              }
            />

            <input
              type="file"
              accept="image/*"
              className="border p-4 rounded-2xl text-black"
              onChange={(e) =>
                setImageFile(
                  e.target.files?.[0]
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

        <div className="bg-white p-6 rounded-3xl shadow mb-6">

          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full border p-4 rounded-2xl text-black"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="bg-white rounded-3xl shadow overflow-hidden">

          <table className="w-full">

            <thead className="bg-blue-700 text-white">

              <tr>

                <th className="p-4 text-left">
                  Ảnh
                </th>

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
                (item) => (

                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50"
                  >

                    <td className="p-4">

                      {item.image ? (

                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-xl"
loading="lazy"
                        />

                      ) : (

                        <div className="w-20 h-20 bg-gray-200 rounded-xl" />

                      )}

                    </td>

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

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}