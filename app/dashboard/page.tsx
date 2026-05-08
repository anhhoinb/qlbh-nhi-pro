"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function DashboardPage() {

  const [totalRevenue, setTotalRevenue] =
    useState(0);

  const [totalOrders, setTotalOrders] =
    useState(0);

  const [totalProducts, setTotalProducts] =
    useState(0);

  const [totalCustomers, setTotalCustomers] =
    useState(0);

  const loadDashboard = async () => {

    // Orders
    const ordersSnapshot =
      await getDocs(
        collection(db, "orders")
      );

    let revenue = 0;

    ordersSnapshot.forEach((doc) => {

      const data = doc.data();

      revenue += Number(
        data.total || 0
      );

    });

    setTotalRevenue(revenue);

    setTotalOrders(
      ordersSnapshot.size
    );

    // Products
    const productsSnapshot =
      await getDocs(
        collection(db, "products")
      );

    setTotalProducts(
      productsSnapshot.size
    );

    // Customers
    const customersSnapshot =
      await getDocs(
        collection(db, "customers")
      );

    setTotalCustomers(
      customersSnapshot.size
    );

  };

  useEffect(() => {

    loadDashboard();

  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        Dashboard
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Doanh thu
          </h2>

          <p className="text-3xl font-bold text-blue-700 mt-3">
            {totalRevenue.toLocaleString()}đ
          </p>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Đơn hàng
          </h2>

          <p className="text-3xl font-bold text-green-600 mt-3">
            {totalOrders}
          </p>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Sản phẩm
          </h2>

          <p className="text-3xl font-bold text-orange-500 mt-3">
            {totalProducts}
          </p>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Khách hàng
          </h2>

          <p className="text-3xl font-bold text-purple-600 mt-3">
            {totalCustomers}
          </p>

        </div>

      </div>

    </main>
  );
}