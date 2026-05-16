"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    companyName: "",
    taxCode: "",
    email: "",
  });

  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    const querySnapshot = await getDocs(collection(db, "customers"));

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

  const filteredCustomers = customers.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.name?.toLowerCase().includes(keyword) ||
      item.phone?.toLowerCase().includes(keyword) ||
      item.address?.toLowerCase().includes(keyword) ||
      item.companyName?.toLowerCase().includes(keyword) ||
      item.taxCode?.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword)
    );
  });

  const resetNewCustomer = () => {
    setNewCustomer({
      name: "",
      phone: "",
      address: "",
      companyName: "",
      taxCode: "",
      email: "",
    });
  };

  const handleAddCustomer = async () => {
    const name = newCustomer.name.trim();
    const phone = newCustomer.phone.trim();
    const address = newCustomer.address.trim();
    const companyName = newCustomer.companyName.trim();
    const taxCode = newCustomer.taxCode.trim();
    const email = newCustomer.email.trim();

    if (!name) {
      alert("Vui lòng nhập tên khách hàng");
      return;
    }

    if (!phone) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "customers"), {
        name,
        phone,
        address,
        companyName,
        taxCode,
        email,
        createdAt: serverTimestamp(),
      });

      resetNewCustomer();
      setShowAddModal(false);
      await loadCustomers();

      alert("Đã thêm khách hàng mới");
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi thêm khách hàng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-blue-700">
            Quản lý khách hàng
          </h1>

          <p className="text-gray-500 mt-2">
            Quản lý thông tin khách hàng, công ty và liên hệ
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-semibold shadow"
        >
          + Thêm khách hàng
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow mb-6">
        <input
          type="text"
          placeholder="Tìm tên, số điện thoại, công ty, email hoặc mã số thuế..."
          className="w-full border p-4 rounded-2xl text-black outline-none focus:border-blue-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Danh sách khách hàng
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Tổng khách hàng:{" "}
              <span className="font-semibold text-blue-700">
                {filteredCustomers.length}
              </span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-blue-700 text-white">
              <tr>
                <th className="p-4 text-left w-[260px]">
                  Khách hàng
                </th>

                <th className="p-4 text-left w-[260px]">
                  Liên hệ
                </th>

                <th className="p-4 text-left w-[260px]">
                  Thông tin công ty
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
                  <td className="p-4 align-top">
                    <p className="font-bold text-gray-900">
                      {item.name || "---"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {item.companyName || "Chưa có tên công ty"}
                    </p>
                  </td>

                  <td className="p-4 align-top">
                    <p className="font-semibold text-gray-900">
                      {item.phone || "---"}
                    </p>

                    <p className="text-sm text-blue-700 mt-1">
                      {item.email || "Chưa có email"}
                    </p>
                  </td>

                  <td className="p-4 align-top">
                    <p className="text-sm text-gray-500">
                      Mã số thuế
                    </p>

                    <p className="font-semibold text-gray-900 mt-1">
                      {item.taxCode || "---"}
                    </p>
                  </td>

                  <td className="p-4 align-top text-gray-700">
                    {item.address || "---"}
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-gray-500"
                  >
                    Không có khách hàng phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-blue-700 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Thêm khách hàng mới
                </h2>

                <p className="text-sm text-blue-100 mt-1">
                  Nhập thông tin khách hàng vào hệ thống
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (saving) return;
                  resetNewCustomer();
                  setShowAddModal(false);
                }}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: 0987654321"
                    className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Tên công ty
                  </label>

                  <input
                    type="text"
                    value={newCustomer.companyName}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: Công ty TNHH ABC"
                    className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Mã số thuế
                  </label>

                  <input
                    type="text"
                    value={newCustomer.taxCode}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        taxCode: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: 0101234567"
                    className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Ví dụ: khachhang@email.com"
                    className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Địa chỉ
                  </label>

                  <textarea
                    value={newCustomer.address}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Nhập địa chỉ khách hàng"
                    rows={3}
                    className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  resetNewCustomer();
                  setShowAddModal(false);
                }}
                className="px-6 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 font-semibold disabled:opacity-60"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleAddCustomer}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-semibold disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu khách hàng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}