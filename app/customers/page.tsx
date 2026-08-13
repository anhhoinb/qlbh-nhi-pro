"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const [editCustomer, setEditCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    companyName: "",
    taxCode: "",
    email: "",
  });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    companyName: "",
    taxCode: "",
    email: "",
  });

  const [saving, setSaving] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);
  const [showInactiveCustomers, setShowInactiveCustomers] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadCustomers = async () => {
    const querySnapshot = await getDocs(collection(db, "customers"));

    const data: any[] = [];

    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    const getCreatedTime = (value: any) => {
      if (!value) return 0;

      if (typeof value?.toDate === "function") {
        return value.toDate().getTime();
      }

      if (value?.seconds) {
        return Number(value.seconds) * 1000;
      }

      const date = new Date(value);

      return Number.isNaN(date.getTime())
        ? 0
        : date.getTime();
    };

    data.sort(
      (a, b) =>
        getCreatedTime(b.createdAt) -
        getCreatedTime(a.createdAt)
    );

    setCustomers(data);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((item) => {
    const keyword = search.toLowerCase();
    const matchesStatus =
      showInactiveCustomers || item.active !== false;

    const matchesKeyword =
      item.code?.toLowerCase().includes(keyword) ||
      item.name?.toLowerCase().includes(keyword) ||
      item.phone?.toLowerCase().includes(keyword) ||
      item.address?.toLowerCase().includes(keyword) ||
      item.companyName?.toLowerCase().includes(keyword) ||
      item.taxCode?.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword);

    return matchesStatus && matchesKeyword;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, showInactiveCustomers, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;

  const paginatedCustomers = filteredCustomers.slice(
    startIndex,
    startIndex + pageSize
  );

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
        active: true,
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

  const getOrderTime = (value: any) => {
    if (!value) return 0;

    if (typeof value?.toDate === "function") {
      return value.toDate().getTime();
    }

    if (value?.seconds) {
      return Number(value.seconds) * 1000;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const formatMoney = (value: any) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const loadCustomerOrders = async (customer: any) => {
    if (!customer?.id) return;

    try {
      setLoadingCustomerOrders(true);
      setCustomerOrders([]);

      const ordersMap = new Map<string, any>();

      const directSnapshot = await getDocs(
        query(
          collection(db, "orders"),
          where("customerId", "==", customer.id)
        )
      );

      directSnapshot.forEach((orderDoc) => {
        ordersMap.set(orderDoc.id, {
          id: orderDoc.id,
          ...orderDoc.data(),
        });
      });

      const nestedSnapshot = await getDocs(
        query(
          collection(db, "orders"),
          where("customer.id", "==", customer.id)
        )
      );

      nestedSnapshot.forEach((orderDoc) => {
        ordersMap.set(orderDoc.id, {
          id: orderDoc.id,
          ...orderDoc.data(),
        });
      });

      const orders = Array.from(ordersMap.values()).sort(
        (a, b) =>
          getOrderTime(b.createdAt || b.orderDate) -
          getOrderTime(a.createdAt || a.orderDate)
      );

      setCustomerOrders(orders);
    } catch (error) {
      console.error("Không tải được lịch sử mua hàng:", error);
      setCustomerOrders([]);
    } finally {
      setLoadingCustomerOrders(false);
    }
  };

  const openCustomerHistory = async (customer: any) => {
    setEditingCustomer(customer);
    setShowCustomerHistory(true);
    await loadCustomerOrders(customer);
  };

  const openEditCustomer = (customer: any) => {
    setShowCustomerHistory(false);
    setEditingCustomer(customer);

    setEditCustomer({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      companyName: customer.companyName || "",
      taxCode: customer.taxCode || "",
      email: customer.email || "",
    });
  };

  const closeEditCustomer = () => {
    if (savingEdit) return;

    setEditingCustomer(null);
    setShowCustomerHistory(false);
    setCustomerOrders([]);
    setSelectedOrder(null);

    setEditCustomer({
      name: "",
      phone: "",
      address: "",
      companyName: "",
      taxCode: "",
      email: "",
    });
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer?.id) return;

    const name = editCustomer.name.trim();
    const phone = editCustomer.phone.trim();
    const address = editCustomer.address.trim();
    const companyName = editCustomer.companyName.trim();
    const taxCode = editCustomer.taxCode.trim();
    const email = editCustomer.email.trim();

    if (!name) {
      alert("Vui lòng nhập tên khách hàng");
      return;
    }

    if (!phone) {
      alert("Vui lòng nhập số điện thoại");
      return;
    }

    try {
      setSavingEdit(true);

      await updateDoc(
        doc(db, "customers", editingCustomer.id),
        {
          name,
          phone,
          address,
          companyName,
          taxCode,
          email,
          updatedAt: serverTimestamp(),
        }
      );

      await loadCustomers();
      closeEditCustomer();

      alert("Đã cập nhật khách hàng");
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi cập nhật khách hàng");
    } finally {
      setSavingEdit(false);
    }
  };

  const customerHasOrders = async (customerId: string) => {
    const directQuery = query(
      collection(db, "orders"),
      where("customerId", "==", customerId),
      limit(1)
    );

    const directSnapshot = await getDocs(directQuery);

    if (!directSnapshot.empty) {
      return true;
    }

    const nestedQuery = query(
      collection(db, "orders"),
      where("customer.id", "==", customerId),
      limit(1)
    );

    const nestedSnapshot = await getDocs(nestedQuery);

    return !nestedSnapshot.empty;
  };

  const handleDeleteOrDeactivateCustomer = async () => {
    if (!editingCustomer?.id) return;

    const customerName =
      editCustomer.name.trim() || "khách hàng này";

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa/ngừng sử dụng ${customerName} không?\n\n` +
        "Nếu khách hàng đã có đơn hàng, hệ thống sẽ giữ lại dữ liệu và chuyển sang trạng thái Ngừng sử dụng."
    );

    if (!confirmed) return;

    try {
      setDeletingCustomer(true);

      const hasOrders = await customerHasOrders(editingCustomer.id);

      if (hasOrders) {
        await updateDoc(
          doc(db, "customers", editingCustomer.id),
          {
            active: false,
            deactivatedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );

        await loadCustomers();
        closeEditCustomer();

        alert(
          "Khách hàng đã có giao dịch nên không bị xóa. Hệ thống đã chuyển khách hàng sang trạng thái Ngừng sử dụng."
        );
        return;
      }

      await deleteDoc(
        doc(db, "customers", editingCustomer.id)
      );

      await loadCustomers();
      closeEditCustomer();

      alert("Đã xóa khách hàng");
    } catch (error) {
      console.error(error);
      alert("Không thể xóa hoặc ngừng sử dụng khách hàng");
    } finally {
      setDeletingCustomer(false);
    }
  };

  const formatCustomerDate = (value: any) => {
    if (!value) return "---";

    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value?.seconds
        ? new Date(Number(value.seconds) * 1000)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "---";
    }

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReactivateCustomer = async () => {
    if (!editingCustomer?.id) return;

    try {
      setSavingEdit(true);

      await updateDoc(
        doc(db, "customers", editingCustomer.id),
        {
          active: true,
          reactivatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      await loadCustomers();

      setEditingCustomer((prev: any) =>
        prev
          ? {
              ...prev,
              active: true,
            }
          : prev
      );

      alert("Đã kích hoạt lại khách hàng");
    } catch (error) {
      console.error(error);
      alert("Không thể kích hoạt lại khách hàng");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-black">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-4xl font-bold text-sky-700">
            Quản lý khách hàng
          </h1>

          <p className="text-slate-500 mt-1">
            Quản lý thông tin khách hàng, công ty và liên hệ
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-sm transition"
        >
          + Thêm khách hàng
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4">
        <input
          type="text"
          placeholder="Tìm mã KH, tên, số điện thoại, công ty, email hoặc mã số thuế..."
          className="w-full border border-slate-300 bg-white px-4 py-3 rounded-xl text-black outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            checked={showInactiveCustomers}
            onChange={(event) =>
              setShowInactiveCustomers(event.target.checked)
            }
          />

          Hiện khách hàng đã ngừng sử dụng
        </label>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Danh sách khách hàng
            </h2>

            <p className="text-xs text-slate-500 mt-0.5">
              Tổng khách hàng:{" "}
              <span className="font-semibold text-sky-700">
                {filteredCustomers.length}
              </span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] table-fixed">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-3 py-3 text-left w-[12%] whitespace-nowrap">
                  Mã KH
                </th>

                <th className="px-4 py-3 text-left w-[35%]">
                  Khách hàng
                </th>

                <th className="px-3 py-3 text-left w-[13%]">
                  Liên hệ
                </th>

                <th className="px-3 py-3 text-left w-[13%]">
                  Thông tin công ty
                </th>

                <th className="px-3 py-3 text-left w-[27%]">
                  Địa chỉ
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedCustomers.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-3 py-3 align-top w-[12%]">
                    <div className="font-semibold text-slate-700 whitespace-nowrap">
                      {item.code || "---"}
                    </div>

                    <div className="mt-1 text-xs text-slate-500 whitespace-nowrap">
                      {formatCustomerDate(item.createdAt)}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top w-[35%]">
                    <div>
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => openCustomerHistory(item)}
                          className="block w-full text-left font-bold text-sky-700 hover:text-sky-800 hover:underline whitespace-nowrap overflow-hidden text-ellipsis"
                          title={item.name || "Bấm để xem lịch sử mua hàng"}
                        >
                          {item.name || "---"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditCustomer(item)}
                          className="shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          title="Sửa thông tin khách hàng"
                        >
                          Sửa
                        </button>

                        {item.active === false && (
                          <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                            Ngừng sử dụng
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.companyName || "Chưa có tên công ty"}
                      </p>
                    </div>
                  </td>

                  <td className="px-3 py-3 align-top w-[13%]">
                    <p className="font-semibold text-slate-900 whitespace-nowrap">
                      {item.phone || "---"}
                    </p>

                    <p className="text-sm text-sky-700 mt-1">
                      {item.email || "Chưa có email"}
                    </p>
                  </td>

                  <td className="px-3 py-3 align-top w-[13%]">
                    <p className="text-sm text-slate-500">
                      Mã số thuế
                    </p>

                    <p className="font-semibold text-slate-900 mt-1">
                      {item.taxCode || "---"}
                    </p>
                  </td>

                  <td className="px-3 py-3 align-top text-slate-700 w-[27%]">
                    <p
                      className="overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                      title={item.address || ""}
                    >
                      {item.address || "---"}
                    </p>
                  </td>

                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500"
                  >
                    Không có khách hàng phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>Hiển thị</span>

            <select
              value={pageSize}
              onChange={(event) =>
                setPageSize(Number(event.target.value))
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-sky-500"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <span>khách / trang</span>

            <span className="text-slate-400">•</span>

            <span>
              {filteredCustomers.length === 0
                ? "0"
                : `${startIndex + 1}-${Math.min(
                    startIndex + pageSize,
                    filteredCustomers.length
                  )}`}{" "}
              / {filteredCustomers.length} khách
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.max(1, prev - 1)
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            )
              .filter((page) => {
                if (totalPages <= 7) return true;

                return (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
                );
              })
              .map((page, index, visiblePages) => {
                const previousPage =
                  index > 0
                    ? visiblePages[index - 1]
                    : null;

                return (
                  <div
                    key={page}
                    className="flex items-center gap-2"
                  >
                    {previousPage !== null &&
                      page - previousPage > 1 && (
                        <span className="px-1 text-slate-400">
                          ...
                        </span>
                      )}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold ${
                        currentPage === page
                          ? "bg-sky-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                );
              })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1)
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Thêm khách hàng mới
                </h2>

                <p className="text-sm text-slate-300 mt-1">
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
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
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
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
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
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
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
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
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
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
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
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
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
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  resetNewCustomer();
                  setShowAddModal(false);
                }}
                className="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold disabled:opacity-60 transition"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleAddCustomer}
                className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-60 transition"
              >
                {saving ? "Đang lưu..." : "Lưu khách hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-800 px-6 py-5 text-white">
              <div>
                <h2 className="text-2xl font-bold">
                  Chi tiết đơn hàng
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  {selectedOrder.orderCode ||
                    selectedOrder.code ||
                    selectedOrder.invoiceCode ||
                    selectedOrder.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-10 w-10 rounded-full bg-white/20 text-xl hover:bg-white/30"
              >
                ×
              </button>
            </div>

            <div className="overflow-auto p-6">
              <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Ngày mua</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {formatCustomerDate(
                      selectedOrder.createdAt ||
                        selectedOrder.orderDate
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Khách hàng</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedOrder.customerName ||
                      selectedOrder.customer?.name ||
                      editingCustomer?.name ||
                      "---"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Thanh toán</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedOrder.paymentMethodText ||
                      selectedOrder.paymentMethod ||
                      selectedOrder.payment_method ||
                      "---"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Trạng thái</p>
                  <p className="mt-1 font-bold text-slate-800">
                    {selectedOrder.status || "---"}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-3 text-center">STT</th>
                      <th className="px-4 py-3 text-left">Mã SP</th>
                      <th className="px-4 py-3 text-left">Sản phẩm</th>
                      <th className="px-4 py-3 text-center">SL</th>
                      <th className="px-4 py-3 text-right">Đơn giá</th>
                      <th className="px-4 py-3 text-center">VAT</th>
                      <th className="px-4 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(Array.isArray(selectedOrder.items)
                      ? selectedOrder.items
                      : Array.isArray(selectedOrder.list)
                      ? selectedOrder.list
                      : []
                    ).map((item: any, index: number) => {
                      const quantity = Number(item.quantity || 0);
                      const price = Number(item.price || 0);
                      const tax = Number(item.tax || 0);

                      const lineSubtotal =
                        quantity * price;

                      const lineTotal =
                        lineSubtotal +
                        lineSubtotal * (tax / 100);

                      return (
                        <tr
                          key={`${item.id || item.productId || index}-${index}`}
                          className="border-t border-slate-200 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-center">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3">
                            {item.product_code ||
                              item.productCode ||
                              item.code ||
                              item.sku ||
                              "---"}
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            {item.printName ||
                              item.short_name ||
                              item.main_name ||
                              item.name ||
                              "---"}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {quantity}
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {formatMoney(price)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {tax}%
                          </td>

                          <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                            {formatMoney(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {(!Array.isArray(selectedOrder.items) ||
                selectedOrder.items.length === 0) &&
                (!Array.isArray(selectedOrder.list) ||
                  selectedOrder.list.length === 0) && (
                  <div className="rounded-b-2xl border border-t-0 border-slate-200 p-8 text-center text-slate-500">
                    Đơn hàng chưa có dữ liệu sản phẩm
                  </div>
                )}

              <div className="mt-5 flex justify-end">
                <div className="w-full max-w-sm space-y-2 rounded-2xl bg-slate-50 p-4">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">
                      Tiền hàng
                    </span>
                    <strong>
                      {formatMoney(
                        selectedOrder.subtotal || 0
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">
                      VAT
                    </span>
                    <strong>
                      {formatMoney(
                        selectedOrder.vatAmount ||
                          selectedOrder.vat ||
                          0
                      )}
                    </strong>
                  </div>

                  {Number(
                    selectedOrder.discountAmount || 0
                  ) > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-600">
                        Chiết khấu
                      </span>
                      <strong>
                        -{formatMoney(
                          selectedOrder.discountAmount
                        )}
                      </strong>
                    </div>
                  )}

                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg">
                    <span className="font-bold">
                      Tổng cộng
                    </span>

                    <strong className="text-emerald-700">
                      {formatMoney(
                        selectedOrder.total ??
                          selectedOrder.finalTotal ??
                          selectedOrder.final_total ??
                          0
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-2xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        showCustomerHistory ? (
          <div
            className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeEditCustomer();
              }
            }}
          >
            <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-800 text-white px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Lịch sử mua hàng
                  </h2>
                  <p className="text-sm text-slate-300 mt-1">
                    {editingCustomer.name || "---"} • {editingCustomer.code || "Chưa có mã KH"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditCustomer}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 overflow-auto">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-5">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Số đơn hàng</p>
                    <p className="mt-1 text-2xl font-bold text-sky-700">
                      {customerOrders.length}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Tổng mua hàng</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      {formatMoney(
                        customerOrders.reduce(
                          (sum, order) =>
                            sum +
                            Number(
                              order.total ||
                                order.grandTotal ||
                                order.totalAmount ||
                                0
                            ),
                          0
                        )
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Số điện thoại</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {editingCustomer.phone || "---"}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[850px]">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left">Ngày mua</th>
                        <th className="px-4 py-3 text-left">Mã đơn</th>
                        <th className="px-4 py-3 text-center">Sản phẩm</th>
                        <th className="px-4 py-3 text-right">Tổng tiền</th>
                        <th className="px-4 py-3 text-left">Thanh toán</th>
                        <th className="px-4 py-3 text-left">Trạng thái</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingCustomerOrders ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500"
                          >
                            Đang tải lịch sử mua hàng...
                          </td>
                        </tr>
                      ) : customerOrders.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500"
                          >
                            Khách hàng chưa có đơn hàng
                          </td>
                        </tr>
                      ) : (
                        customerOrders.map((order) => {
                          const items = Array.isArray(order.items)
                            ? order.items
                            : [];

                          const total =
                            order.total ??
                            order.grandTotal ??
                            order.totalAmount ??
                            0;

                          return (
                            <tr
                              key={order.id}
                              className="border-t border-slate-200 hover:bg-slate-50"
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                {formatCustomerDate(
                                  order.createdAt || order.orderDate
                                )}
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedOrder(order)
                                  }
                                  className="font-bold text-sky-700 hover:text-sky-800 hover:underline"
                                  title="Bấm để xem chi tiết đơn hàng trong popup"
                                >
                                  {order.orderCode ||
                                    order.code ||
                                    order.invoiceCode ||
                                    order.id}
                                </button>
                              </td>

                              <td className="px-4 py-3 text-center font-semibold">
                                {items.reduce(
                                  (sum: number, item: any) =>
                                    sum + Number(item.quantity || 0),
                                  0
                                )}
                              </td>

                              <td className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                {formatMoney(total)}
                              </td>

                              <td className="px-4 py-3">
                                {order.paymentMethod ||
                                  order.payment_method ||
                                  "---"}
                              </td>

                              <td className="px-4 py-3">
                                {order.status || "---"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerHistory(false);
                    setEditCustomer({
                      name: editingCustomer.name || "",
                      phone: editingCustomer.phone || "",
                      address: editingCustomer.address || "",
                      companyName: editingCustomer.companyName || "",
                      taxCode: editingCustomer.taxCode || "",
                      email: editingCustomer.email || "",
                    });
                  }}
                  className="px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Sửa thông tin
                </button>

                <button
                  type="button"
                  onClick={closeEditCustomer}
                  className="px-6 py-3 rounded-2xl bg-slate-800 text-white font-semibold hover:bg-slate-900"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
        <div
          className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditCustomer();
            }
          }}
        >
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Sửa thông tin khách hàng
                </h2>

                <p className="text-sm text-slate-300 mt-1">
                  Cập nhật thông tin và lưu lại hệ thống
                </p>
              </div>

              <button
                type="button"
                disabled={savingEdit}
                onClick={closeEditCustomer}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-xl disabled:opacity-60"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={editCustomer.name}
                    onChange={(event) =>
                      setEditCustomer((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    value={editCustomer.phone}
                    onChange={(event) =>
                      setEditCustomer((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Tên công ty
                  </label>

                  <input
                    type="text"
                    value={editCustomer.companyName}
                    onChange={(event) =>
                      setEditCustomer((prev) => ({
                        ...prev,
                        companyName: event.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Mã số thuế
                  </label>

                  <input
                    type="text"
                    value={editCustomer.taxCode}
                    onChange={(event) =>
                      setEditCustomer((prev) => ({
                        ...prev,
                        taxCode: event.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={editCustomer.email}
                    onChange={(event) =>
                      setEditCustomer((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Địa chỉ
                  </label>

                  <textarea
                    value={editCustomer.address}
                    onChange={(event) =>
                      setEditCustomer((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 resize-y"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200">
              <div>
                {editingCustomer.active === false ? (
                  <button
                    type="button"
                    disabled={savingEdit || deletingCustomer}
                    onClick={handleReactivateCustomer}
                    className="px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60"
                  >
                    Kích hoạt lại
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={savingEdit || deletingCustomer}
                    onClick={handleDeleteOrDeactivateCustomer}
                    className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-60 transition"
                  >
                    {deletingCustomer
                      ? "Đang xử lý..."
                      : "Xóa / Ngừng sử dụng"}
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={savingEdit || deletingCustomer}
                  onClick={closeEditCustomer}
                  className="px-6 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold disabled:opacity-60 transition"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={savingEdit || deletingCustomer}
                  onClick={handleUpdateCustomer}
                  className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold disabled:opacity-60 transition"
                >
                  {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
          </>
        )
      )}
    </main>
  );
}