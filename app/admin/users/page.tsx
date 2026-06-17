"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  permissions?: {
    dashboard: boolean;
    sales: boolean;
    products: boolean;
    customers: boolean;
    reports: boolean;
    system: boolean;
    users: boolean;
  };
};

const permissionLabels: Record<
  string,
  string
> = {
  admin: "Quản trị hệ thống",
  dashboard: "Dashboard",
  pos: "POS bán hàng",
  orders: "Đơn hàng",
  products: "Sản phẩm",
  customers: "Khách hàng",
  reports: "Báo cáo",
  finance: "Tài chính",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] =
  useState(false);

const [selectedUser, setSelectedUser] =
  useState<User | null>(null);

const [permissionForm, setPermissionForm] =
  useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Nhân viên",
    permissions: {
      dashboard: true,
      sales: true,
      products: false,
      customers: true,
      reports: false,
      system: false,
      users: false,
    },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const snapshot = await getDocs(
        collection(db, "users")
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<User, "id">),
      }));

      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function addUser() {
    if (!form.name || !form.email) {
      alert("Vui lòng nhập tên và email");
      return;
    }

    try {
      const res = await fetch(
        "/api/admin/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,

            password: "123456",

            role: form.role,

            permissions:
              form.permissions,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(
          data.error || "Tạo nhân viên thất bại"
        );
        return;
      }

      await loadUsers();

      setOpen(false);

      setForm({
        name: "",
        email: "",
        role: "Nhân viên",
        permissions: {
          dashboard: true,
          sales: true,
          products: false,
          customers: true,
          reports: false,
          system: false,
          users: false,
        },
      });

      alert("Tạo nhân viên thành công");
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra");
    }
  }

  const toggleStatus = async (
  id: string,
  active: boolean
) => {
  try {

    await updateDoc(
      doc(db, "users", id),
      {
        active: !active,
      }
    );

    await loadUsers();

  } catch (error) {

    console.error(error);

    alert(
      "Không cập nhật được trạng thái tài khoản"
    );
  }
};

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="bg-white rounded-3xl shadow p-10">
        <h1 className="text-4xl font-bold text-blue-700">
          Quản lý tài khoản nhân viên
        </h1>

        <p className="text-gray-500 mt-3">
          Tạo nhân viên, phân quyền và
          khóa tài khoản tại đây.
        </p>

        <div className="mt-8">
          <button
            onClick={() =>
              setOpen(true)
            }
            className="bg-blue-600 text-white px-5 py-2 rounded-xl"
          >
            + Thêm nhân viên
          </button>
        </div>

        <table className="w-full mt-6 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">
                Tên
              </th>

              <th className="p-3 text-left">
                Email
              </th>

              <th className="p-3 text-left">
                Vai trò
              </th>

              <th className="p-3 text-left">
                Trạng thái
              </th>

              <th className="p-3 text-left">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t"
              >
                <td className="p-3">
                  {user.name}
                </td>

                <td className="p-3">
                  {user.email}
                </td>

                <td className="p-3">
                  {user.role}
                </td>

                <td className="p-3">
                  {user.active
                    ? "Đang hoạt động"
                    : "Đã khóa"}
                </td>

                <td className="p-3">
  <div className="flex gap-2">

    {user.role !== "admin" && (
  <button
    onClick={() => {
      setSelectedUser(user);

      setPermissionForm(
        user.permissions || {}
      );

      setPermissionOpen(true);
    }}
    className="bg-blue-600 text-white px-3 py-1 rounded"
  >
    Phân quyền
  </button>
)}

    {user.role !== "admin" && (
  <button
    onClick={() =>
      toggleStatus(
        user.id,
        user.active
      )
    }
    className="bg-red-500 text-white px-3 py-1 rounded"
  >
    {user.active
      ? "Khóa"
      : "Mở khóa"}
  </button>
)}

  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>

        {open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[500px]">
              <h2 className="text-xl font-bold mb-4">
                Thêm nhân viên
              </h2>

              <input
                placeholder="Tên"
                className="border p-2 w-full mb-3"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Email"
                className="border p-2 w-full mb-3"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email:
                      e.target.value,
                  })
                }
              />

              <div className="mb-4">
                <p className="font-semibold mb-2">
                  Phân quyền
                </p>

                {Object.entries(
                  form.permissions
                ).map(
                  ([key, value]) => (
                    <label
                      key={key}
                      className="block"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(
                          e
                        ) =>
                          setForm({
                            ...form,
                            permissions:
                              {
                                ...form.permissions,
                                [key]:
                                  e
                                    .target
                                    .checked,
                              },
                          })
                        }
                      />{" "}
                      {permissionLabels[key] || key}
                    </label>
                  )
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Lưu
                </button>

                <button
                  onClick={() =>
                    setOpen(false)
                  }
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {permissionOpen &&
 selectedUser && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

  <div className="bg-white rounded-2xl p-6 w-[500px]">

    <h2 className="text-xl font-bold mb-4">
      Phân quyền: {selectedUser.name}
    </h2>

    <div className="space-y-2">

      {permissionForm &&
  Object.entries(permissionForm).map(
    ([key, value]) => (
      <label
        key={key}
        className="block"
      >
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) =>
            setPermissionForm({
              ...permissionForm,
              [key]:
                e.target.checked,
            })
          }
        />

        {" "}
        {permissionLabels[key] || key}
      </label>
    )
)}

    </div>

    <div className="flex gap-3 mt-5">

      <button
        onClick={async () => {

          if (!selectedUser)
            return;

          await updateDoc(
            doc(
              db,
              "users",
              selectedUser.id
            ),
            {
              permissions:
                permissionForm,
            }
          );

          await loadUsers();

          setPermissionOpen(false);

          alert(
            "Cập nhật quyền thành công"
          );
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Lưu quyền
      </button>

      <button
        onClick={() =>
          setPermissionOpen(false)
        }
        className="bg-gray-300 px-4 py-2 rounded"
      >
        Hủy
      </button>

    </div>

  </div>

</div>

)}
    </main>
  );
}