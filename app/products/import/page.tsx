"use client";

import { useState } from "react";

import {
  addDoc,
  collection,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function ImportProductsPage() {

  const [loading, setLoading] = useState(false);

  const handleFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    setLoading(true);

    try {

      const text = await file.text();

      const parsed = JSON.parse(text);

      // Đọc đúng cấu trúc file export
      const productsRoot =
        parsed.products || {};

      const firstShopKey =
        Object.keys(productsRoot)[0];

      const jsonData =
        Object.values(
          productsRoot[firstShopKey] || {}
        );

      if (!Array.isArray(jsonData)) {

        alert("JSON không hợp lệ");

        setLoading(false);

        return;
      }

      for (const item of jsonData as any[]) {

        await addDoc(collection(db, "products"), {

          name:
            item.name ||
            item.product_name ||
            "Không tên",

          price:
            Number(
              item.price ||
              item.saleprice ||
              0
            ),

          barcode:
            item.barcode || "",

          stock:
            Number(
              item.stock || 0
            ),

          createdAt: new Date(),

        });

      }

      alert("Import thành công");

    } catch (error) {

      console.log(error);

      alert("Lỗi file JSON");

    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow">

        <h1 className="text-4xl font-bold text-blue-700 mb-8">
          Import sản phẩm JSON
        </h1>

        <input
          type="file"
          accept=".json"
          onChange={handleFile}
          className="w-full border p-4 rounded-2xl text-black"
        />

        {loading && (
          <div className="mt-5 text-blue-700 font-semibold">
            Đang import dữ liệu...
          </div>
        )}

      </div>

    </main>
  );
}