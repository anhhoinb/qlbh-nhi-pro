"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function OrdersPage() {

  const [orders, setOrders] =
    useState<any[]>([]);

  const loadOrders = async () => {

    const querySnapshot =
      await getDocs(
        collection(db, "orders")
      );

    const data: any[] = [];

    querySnapshot.forEach((doc) => {

      data.push({
        id: doc.id,
        ...doc.data(),
      });

    });

    setOrders(data);
  };

  useEffect(() => {

    loadOrders();

  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        Lịch sử bán hàng
      </h1>

      <div className="bg-white rounded-3xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-blue-700 text-white">

            <tr>

              <th className="p-4 text-left">
                Mã đơn
              </th>

              <th className="p-4 text-left">
                Khách hàng
              </th>

              <th className="p-4 text-left">
                Tổng tiền
              </th>

              <th className="p-4 text-left">
                Ngày tạo
              </th>

            </tr>

          </thead>

          <tbody>

            {orders.map((item) => (

              <tr
                key={item.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-4">
                  {item.id}
                </td>

                <td className="p-4">

                  {typeof item.customer_name === "object"
                    ? item.customer_name?.name

                    : typeof item.customer === "object"
                    ? item.customer?.name

                    : item.customer_name ||
                      item.customer ||
                      "---"}

                </td>

                <td className="p-4">

                  {Number(
                    item.total ||
                    item.grand_total ||
                    0
                  ).toLocaleString()}đ

                </td>

                <td className="p-4">

                  {item.createdAt
                    ? new Date(
                        item.createdAt.seconds
                          ? item.createdAt.seconds * 1000
                          : item.createdAt
                      ).toLocaleString()
                    : "---"}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}