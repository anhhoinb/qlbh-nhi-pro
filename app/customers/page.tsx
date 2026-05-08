"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function CustomersPage() {

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const loadCustomers = async () => {

    const querySnapshot =
      await getDocs(
        collection(db, "customers")
      );

    const data: any[] = [];

    querySnapshot.forEach((doc) => {

      data.push({
        id: doc.id,
        ...doc.data(),
      });

    });

    setCustomers(data);
  };

  useEffect(() => {

    loadCustomers();

  }, []);

  const filteredCustomers =
    customers.filter((item) => {

      const keyword =
        search.toLowerCase();

      return (
        item.name
          ?.toLowerCase()
          .includes(keyword) ||

        item.phone
          ?.toLowerCase()
          .includes(keyword)
      );

    });

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        Quản lý khách hàng
      </h1>

      <div className="bg-white p-6 rounded-3xl shadow mb-8">

        <input
          type="text"
          placeholder="Tìm tên hoặc số điện thoại..."
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
                Tên khách hàng
              </th>

              <th className="p-4 text-left">
                Số điện thoại
              </th>

              <th className="p-4 text-left">
                Địa chỉ
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredCustomers.map((item) => (

              <tr
                key={item.id}
                className="border-b hover:bg-gray-50"
              >

                <td className="p-4">
                  {item.name || "---"}
                </td>

                <td className="p-4">
                  {item.phone || "---"}
                </td>

                <td className="p-4">
                  {item.address || "---"}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}