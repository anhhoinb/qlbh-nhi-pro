"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function ReportsPage() {

  const [orders, setOrders] =
    useState<any[]>([]);

  const [revenue, setRevenue] =
    useState(0);

  const [todayRevenue, setTodayRevenue] =
    useState(0);

  const [topProducts, setTopProducts] =
    useState<any[]>([]);

  const loadReports = async () => {

    const querySnapshot =
      await getDocs(
        collection(db, "orders")
      );

    const data: any[] = [];

    let totalRevenue = 0;

    let todayTotal = 0;

    const productMap: any = {};

    querySnapshot.forEach((docItem) => {

      const order = docItem.data();

      data.push(order);

      totalRevenue += Number(
        order.total || 0
      );

      // Hôm nay

      if (order.createdAt) {

        const orderDate =
          new Date(
            order.createdAt.seconds
              ? order.createdAt.seconds * 1000
              : order.createdAt
          );

        const today =
          new Date();

        if (
          orderDate.toDateString() ===
          today.toDateString()
        ) {

          todayTotal += Number(
            order.total || 0
          );

        }

      }

      // TOP PRODUCTS

      if (order.items) {

        order.items.forEach(
          (item: any) => {

            if (!productMap[item.name]) {

              productMap[item.name] = 0;

            }

            productMap[item.name] +=
              item.quantity;

          }
        );

      }

    });

    const sortedProducts =
      Object.entries(productMap)
        .map(([name, qty]) => ({
          name,
          qty,
        }))
        .sort(
          (a: any, b: any) =>
            b.qty - a.qty
        )
        .slice(0, 5);

    setOrders(data);

    setRevenue(totalRevenue);

    setTodayRevenue(todayTotal);

    setTopProducts(sortedProducts);
  };

  useEffect(() => {

    loadReports();

  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        Báo cáo doanh thu
      </h1>

      <div className="grid md:grid-cols-2 gap-6 mb-8">

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Tổng doanh thu
          </h2>

          <p className="text-3xl font-bold text-blue-700 mt-3">
            {revenue.toLocaleString()}đ
          </p>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Doanh thu hôm nay
          </h2>

          <p className="text-3xl font-bold text-green-600 mt-3">
            {todayRevenue.toLocaleString()}đ
          </p>

        </div>

      </div>

      <div className="bg-white rounded-3xl shadow p-6">

        <h2 className="text-2xl font-bold mb-6">
          Top sản phẩm bán chạy
        </h2>

        <div className="space-y-4">

          {topProducts.map((item, index) => (

            <div
              key={index}
              className="flex justify-between border-b pb-3"
            >

              <span className="font-semibold">
                {item.name}
              </span>

              <span className="text-blue-700 font-bold">
                {item.qty} sản phẩm
              </span>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}