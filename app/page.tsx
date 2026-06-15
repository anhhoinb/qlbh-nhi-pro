"use client";

import { useEffect, useState } from "react";

import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function Home() {

  const [totalProducts, setTotalProducts] =
    useState(0);

  useEffect(() => {

    const loadData = async () => {

      try {

        const productSnapshot =
          await getDocs(
            collection(db, "products")
          );

        setTotalProducts(
          productSnapshot.size
        );

      } catch (error) {

        console.log(error);

      }

    };

    loadData();

  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <div className="flex justify-between items-center mb-8">

        <h2 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h2>

        <button className="bg-blue-700 text-white px-5 py-3 rounded-xl">
          + Tạo đơn hàng
        </button>

      </div>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-2xl shadow">

          <p className="text-gray-500">
            Doanh thu
          </p>

          <h3 className="text-3xl font-bold text-blue-700 mt-3">
            0đ
          </h3>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow">

          <p className="text-gray-500">
            Đơn hàng
          </p>

          <h3 className="text-3xl font-bold text-green-600 mt-3">
            0
          </h3>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow">

          <p className="text-gray-500">
            Khách hàng
          </p>

          <h3 className="text-3xl font-bold text-orange-500 mt-3">
            0
          </h3>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow">

          <p className="text-gray-500">
            Sản phẩm
          </p>

          <h3 className="text-3xl font-bold text-purple-600 mt-3">
            {totalProducts}
          </h3>

        </div>

      </div>

    </main>
  );
}