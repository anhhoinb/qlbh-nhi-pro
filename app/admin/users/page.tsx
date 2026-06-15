"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function UsersPage() {
  const [users, setUsers] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadUsers = async () => {
    setLoading(true);

    const snapshot =
      await getDocs(
        collection(db, "users")
      );

    const data = snapshot.docs.map(
      (item) => ({
        id: item.id,
        ...item.data(),
      })
    );

    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleActive = async (
    id: string,
    current: boolean
  ) => {
    await updateDoc(
      doc(db, "users", id),
      {
        active: !current,
      }
    );

    loadUsers();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black">

      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-6">

          <h1 className="text-4xl font-bold text-blue-700">
            Quản lý nhân viên
          </h1>

          <button
            onClick={loadUsers}
            className="bg-blue-700 text-white px-5 py-3 rounded-xl"
          >
            Tải lại
          </button>

        </div>

        <div className="bg-white rounded-3xl shadow overflow-hidden">

          {loading ? (

            <div className="p-10">
              Đang tải...
            </div>

          ) : (

            <table className="w-full">

              <thead className="bg-blue-700 text-white">

                <tr>
                  <th className="p-4 text-left">
                    Tên
                  </th>

                  <th className="p-4 text-left">
                    Email
                  </th>

                  <th className="p-4 text-left">
                    Vai trò
                  </th>

                  <th className="p-4 text-left">
                    Trạng thái
                  </th>

                  <th className="p-4 text-left">
                    Thao tác
                  </th>
                </tr>

              </thead>

              <tbody>

                {users.map((user) => (

                  <tr
                    key={user.id}
                    className="border-b"
                  >

                    <td className="p-4">
                      {user.name}
                    </td>

                    <td className="p-4">
                      {user.email}
                    </td>

                    <td className="p-4">
                      {user.role}
                    </td>

                    <td className="p-4">

                      {user.active ? (

                        <span className="text-green-600 font-bold">
                          Hoạt động
                        </span>

                      ) : (

                        <span className="text-red-600 font-bold">
                          Đã khóa
                        </span>

                      )}

                    </td>

                    <td className="p-4">

                      <button
                        onClick={() =>
                          toggleActive(
                            user.id,
                            user.active
                          )
                        }
                        className={`px-4 py-2 rounded-xl text-white ${
                          user.active
                            ? "bg-red-600"
                            : "bg-green-600"
                        }`}
                      >
                        {user.active
                          ? "Khóa"
                          : "Mở khóa"}
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </main>
  );
}