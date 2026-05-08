"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function RestockHistoryPage() {

  const [history, setHistory] =
    useState<any[]>([]);

  const loadHistory = async () => {

    const querySnapshot =
      await getDocs(
        collection(db, "restocks")
      );

    const data: any[] = [];

    querySnapshot.forEach((docItem) => {

      data.push({
        id: docItem.id,
        ...docItem.data(),
      });

    });

    setHistory(data);
  };

  useEffect(() => {

    loadHistory();

  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        Lịch sử nhập hàng
      </h1>

      <div className="bg-white rounded-3xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-blue-700 text-white">

            <tr>

              <th className="p-4 text-left">
                Sản phẩm
              </th>

              <th className="p-4 text-left">
                Số lượng
              </th>

              <th className="p-4 text-left">
                Ngày nhập
              </th>

            </tr>

          </thead>

          <tbody>

            {history.map((item) => (

              <tr
                key={item.id}
                className="border-b"
              >

                <td className="p-4 font-semibold">
                  {item.productName}
                </td>

                <td className="p-4 text-green-600 font-bold">
                  +{item.quantity}
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