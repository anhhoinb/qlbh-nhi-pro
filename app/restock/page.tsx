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

export default function RestockPage() {

  const [products, setProducts] =
    useState<any[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

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
  };

  useEffect(() => {

    loadProducts();

  }, []);

  const handleRestock = async () => {

    if (!selectedProduct || !quantity) {

      alert("Nhập đầy đủ thông tin");

      return;
    }

    const product = products.find(
      (item) =>
        item.id === selectedProduct
    );

    if (!product) return;

    const newStock =
      Number(product.stock || 0) +
      Number(quantity);

    // UPDATE KHO

    await updateDoc(
      doc(db, "products", product.id),
      {
        stock: newStock,
      }
    );

    // LƯU LỊCH SỬ NHẬP

    await addDoc(
      collection(db, "restocks"),
      {
        productId: product.id,
        productName: product.name,
        quantity: Number(quantity),
        createdAt: new Date(),
      }
    );

    alert("Nhập hàng thành công");

    setSelectedProduct("");
    setQuantity("");

    loadProducts();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow">

        <h1 className="text-4xl font-bold text-blue-700 mb-8">
          Nhập hàng
        </h1>

        <div className="space-y-5">

          <select
            className="w-full border p-4 rounded-2xl text-black"
            value={selectedProduct}
            onChange={(e) =>
              setSelectedProduct(
                e.target.value
              )
            }
          >

            <option value="">
              Chọn sản phẩm
            </option>

            {products.map((item) => (

              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>

            ))}

          </select>

          <input
            type="number"
            placeholder="Số lượng nhập"
            className="w-full border p-4 rounded-2xl text-black"
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
          />

          <button
            onClick={handleRestock}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-2xl text-lg font-semibold"
          >
            Nhập hàng
          </button>

        </div>

      </div>

    </main>
  );
}