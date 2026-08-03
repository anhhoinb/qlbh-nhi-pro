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

const [editOpen, setEditOpen] =
  useState(false);

const [editingUser, setEditingUser] =
  useState<User | null>(null);

const [editForm, setEditForm] =
  useState({
    name: "",
    role: "Nhân viên",
    active: true,
  });

const [savingEdit, setSavingEdit] =
  useState(false);

const [deletingUser, setDeletingUser] =
  useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const [creatingUser, setCreatingUser] = useState(false);

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
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name || !email) {
      alert("Vui lòng nhập tên và email");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      alert("Email không đúng định dạng");
      return;
    }

    if (!password) {
      alert("Vui lòng nhập mật khẩu");
      return;
    }

    if (password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      alert("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      setCreatingUser(true);

      const res = await fetch(
        "/api/admin/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,

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
        password: "",
        confirmPassword: "",
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
    } finally {
      setCreatingUser(false);
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

  const openEditUser = (user: User) => {
    setEditingUser(user);

    setEditForm({
      name: user.name || "",
      role: user.role || "Nhân viên",
      active: user.active !== false,
    });

    setEditOpen(true);
  };

  const closeEditUser = () => {
    if (savingEdit) return;

    setEditOpen(false);
    setEditingUser(null);

    setEditForm({
      name: "",
      role: "Nhân viên",
      active: true,
    });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;

    const name = editForm.name.trim();

    if (!name) {
      alert("Vui lòng nhập tên nhân viên");
      return;
    }

    try {
      setSavingEdit(true);

      const response = await fetch(
        "/api/admin/update-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: editingUser.id,
            name,
            role: editForm.role,
            active: editForm.active,
          }),
        }
      );

      const responseText = await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        console.error(
          "API update-user trả về dữ liệu không phải JSON:",
          responseText
        );
      }

      if (!response.ok || !data?.success) {
        alert(
          data?.error ||
            `Cập nhật nhân viên thất bại (${response.status})`
        );

        return;
      }

      await loadUsers();
      closeEditUser();

      alert("Đã cập nhật thông tin nhân viên");
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi cập nhật nhân viên");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteEmployee = async () => {
    if (!editingUser) return;

    if (editingUser.role === "admin") {
      alert("Không được xóa tài khoản Admin");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa nhân viên "${editingUser.name}" không?\n\n` +
        "Tài khoản đăng nhập trong Firebase Authentication và dữ liệu nhân viên trong Firestore sẽ bị xóa hoàn toàn."
    );

    if (!confirmed) return;

    try {
      setDeletingUser(true);

      const response = await fetch(
        "/api/admin/delete-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: editingUser.id,
          }),
        }
      );

      const responseText = await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        console.error(
          "API delete-user trả về dữ liệu không phải JSON:",
          responseText
        );
      }

      if (!response.ok || !data?.success) {
        alert(
          data?.error ||
            `Xóa nhân viên thất bại (${response.status})`
        );

        return;
      }

      await loadUsers();

      setEditOpen(false);
      setEditingUser(null);

      alert("Đã xóa nhân viên");
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi xóa nhân viên");
    } finally {
      setDeletingUser(false);
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
                  <button
                    type="button"
                    onClick={() => openEditUser(user)}
                    className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                    title="Bấm để sửa thông tin nhân viên"
                  >
                    {user.name}
                  </button>
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
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
              <h2 className="text-xl font-bold mb-4">
                Thêm nhân viên
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Tên nhân viên *
                  </label>

                  <input
                    placeholder="Nhập tên nhân viên"
                    className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Email đăng nhập *
                  </label>

                  <input
                    type="email"
                    placeholder="nhanvien@example.com"
                    className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Mật khẩu *
                    </label>

                    <input
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      autoComplete="new-password"
                      className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
                      value={form.password}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Nhập lại mật khẩu *
                    </label>

                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      autoComplete="new-password"
                      className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Vai trò
                  </label>

                  <select
                    className="w-full rounded-xl border bg-white p-3 outline-none focus:border-blue-500"
                    value={form.role}
                    onChange={(e) => {
                      const role = e.target.value;

                      setForm({
                        ...form,
                        role,
                        permissions:
                          role === "admin"
                            ? {
                                dashboard: true,
                                sales: true,
                                products: true,
                                customers: true,
                                reports: true,
                                system: true,
                                users: true,
                              }
                            : {
                                dashboard: true,
                                sales: true,
                                products: false,
                                customers: true,
                                reports: false,
                                system: false,
                                users: false,
                              },
                      });
                    }}
                  >
                    <option value="Nhân viên">
                      Nhân viên
                    </option>

                    <option value="admin">
                      Admin
                    </option>
                  </select>
                </div>
              </div>

              <div className="mb-4 mt-5">
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
                        disabled={form.role === "admin"}
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

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={creatingUser}
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-gray-300 px-5 py-2 font-semibold hover:bg-gray-400 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={creatingUser}
                  onClick={addUser}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingUser
                    ? "Đang tạo tài khoản..."
                    : "Tạo tài khoản"}
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

      {editOpen && editingUser && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditUser();
            }
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-blue-700 px-6 py-5 text-white">
              <div>
                <h2 className="text-2xl font-bold">
                  Sửa thông tin nhân viên
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  {editingUser.email}
                </p>
              </div>

              <button
                type="button"
                disabled={savingEdit}
                onClick={closeEditUser}
                className="h-10 w-10 rounded-full bg-white/20 text-xl hover:bg-white/30 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Tên nhân viên *
                </label>

                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border p-4 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email đăng nhập
                </label>

                <input
                  type="email"
                  value={editingUser.email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border bg-gray-100 p-4 text-gray-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Email đăng nhập không thay đổi tại form này.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Vai trò
                </label>

                <select
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border bg-white p-4 outline-none focus:border-blue-600"
                >
                  <option value="Nhân viên">
                    Nhân viên
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Trạng thái
                </label>

                <div className="flex flex-wrap gap-5">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="edit-user-active"
                      checked={editForm.active}
                      onChange={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          active: true,
                        }))
                      }
                    />

                    <span>Đang hoạt động</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="edit-user-active"
                      checked={!editForm.active}
                      onChange={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          active: false,
                        }))
                      }
                    />

                    <span>Đã khóa</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {editingUser.role !== "admin" && (
                  <button
                    type="button"
                    disabled={savingEdit || deletingUser}
                    onClick={deleteEmployee}
                    className="rounded-2xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingUser
                      ? "Đang xóa..."
                      : "Xóa nhân viên"}
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={savingEdit || deletingUser}
                  onClick={closeEditUser}
                  className="rounded-2xl bg-gray-200 px-6 py-3 font-semibold hover:bg-gray-300 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={savingEdit || deletingUser}
                  onClick={saveEditUser}
                  className="rounded-2xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {savingEdit
                    ? "Đang lưu..."
                    : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}