"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function InventoryPage() {

  const [products, setProducts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

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

    setProducts(data);

    setLoading(false);
  };

  useEffect(() => {

    loadProducts();

  }, []);

  const updateStock = async (
    id: string,
    stock: number
  ) => {

    await updateDoc(
      doc(db, "products", id),
      {
        stock,
      }
    );

    loadProducts();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        Quản lý tồn kho
      </h1>

      {loading ? (

        <div className="text-lg">
          Đang tải dữ liệu...
        </div>

      ) : (

        <div className="bg-white rounded-3xl shadow overflow-hidden">

          <table className="w-full">

            <thead className="bg-blue-700 text-white">

              <tr>

                <th className="p-4 text-left">
                  Sản phẩm
                </th>

                <th className="p-4 text-left">
                  Giá
                </th>

                <th className="p-4 text-left">
                  Tồn kho
                </th>

                <th className="p-4 text-left">
                  Cập nhật
                </th>

              </tr>

            </thead>

            <tbody>

              {products.map((item) => (

                <tr
                  key={item.id}
                  className="border-b"
                >

                  <td className="p-4 font-semibold">

                    {item.name}

                  </td>

                  <td className="p-4 text-blue-700">

                    {Number(
                      item.price || 0
                    ).toLocaleString()}đ

                  </td>

                  <td
                    className={`p-4 font-bold ${
                      Number(item.stock || 0) <= 5
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >

                    {item.stock || 0}

                    {Number(item.stock || 0) <= 5 &&
                      " ⚠️"}

                  </td>

                  <td className="p-4">

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          updateStock(
                            item.id,
                            Number(item.stock || 0) + 1
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl"
                      >
                        +1
                      </button>

                      <button
                        onClick={() =>
                          updateStock(
                            item.id,
                            Math.max(
                              0,
                              Number(item.stock || 0) - 1
                            )
                          )
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
                      >
                        -1
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </main>
  );
}