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

  const [filteredOrders, setFilteredOrders] =
    useState<any[]>([]);

  const [revenue, setRevenue] =
    useState(0);

  const [cashRevenue, setCashRevenue] =
    useState(0);

  const [bankRevenue, setBankRevenue] =
    useState(0);

  const [orderCount, setOrderCount] =
    useState(0);

  const [todayRevenue, setTodayRevenue] =
    useState(0);

  const [topProducts, setTopProducts] =
    useState<any[]>([]);

  const [filterType, setFilterType] =
    useState("today");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [selectedOrder, setSelectedOrder] =
    useState<any>(null);

  const getOrderDate = (order: any) => {

    if (!order.createdAt) {
      return null;
    }

    if (order.createdAt.toDate) {
      return order.createdAt.toDate();
    }

    if (order.createdAt.seconds) {
      return new Date(
        order.createdAt.seconds * 1000
      );
    }

    return new Date(order.createdAt);
  };

  const formatDateTime = (order: any) => {

    const date = getOrderDate(order);

    if (!date) {
      return "Chưa có giờ";
    }

    return date.toLocaleString(
      "vi-VN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  };

  const getOrderCode = (order: any) => {

    return (
      order.orderCode ||
      order.orderCodePam ||
      order.displayOrderCode ||
      order.code ||
      order.id ||
      "Không có mã"
    );
  };

  const isSameDay = (
    date1: Date,
    date2: Date
  ) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getPaymentMethodText = (order: any) => {

    if (
      order.paymentMethod === "bank" ||
      order.paymentMethod === "Chuyển khoản"
    ) {
      return "Chuyển khoản";
    }

    if (
      order.paymentMethod === "cash" ||
      order.paymentMethod === "Tiền mặt"
    ) {
      return "Tiền mặt";
    }

    return "Chưa có";
  };

  const applyFilter = (
    list: any[],
    type: string,
    from: string,
    to: string
  ) => {

    const now = new Date();

    const result =
      list.filter((order) => {

        const orderDate =
          getOrderDate(order);

        if (!orderDate) {
          return false;
        }

        if (type === "today") {
          return isSameDay(
            orderDate,
            now
          );
        }

        if (type === "month") {
          return (
            orderDate.getMonth() ===
              now.getMonth() &&
            orderDate.getFullYear() ===
              now.getFullYear()
          );
        }

        if (type === "year") {
          return (
            orderDate.getFullYear() ===
            now.getFullYear()
          );
        }

        if (type === "custom") {

          if (!from || !to) {
            return true;
          }

          const fromTime =
            new Date(from);

          const toTime =
            new Date(to);

          fromTime.setHours(
            0,
            0,
            0,
            0
          );

          toTime.setHours(
            23,
            59,
            59,
            999
          );

          return (
            orderDate >= fromTime &&
            orderDate <= toTime
          );
        }

        return true;
      });

    setFilteredOrders(result);

    calculateSummary(result);
  };

  const calculateSummary = (
    list: any[]
  ) => {

    let totalRevenue = 0;

    let cashTotal = 0;

    let bankTotal = 0;

    const productMap: any = {};

    list.forEach((order) => {

      const orderTotal =
        Number(order.total || 0);

      totalRevenue += orderTotal;

      const paymentText =
        getPaymentMethodText(order);

      if (paymentText === "Tiền mặt") {
        cashTotal += orderTotal;
      }

      if (paymentText === "Chuyển khoản") {
        bankTotal += orderTotal;
      }

      if (order.items) {

        order.items.forEach(
          (item: any) => {

            if (!productMap[item.name]) {
              productMap[item.name] = 0;
            }

            productMap[item.name] +=
              Number(item.quantity || 0);

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

    setRevenue(totalRevenue);

    setCashRevenue(cashTotal);

    setBankRevenue(bankTotal);

    setOrderCount(list.length);

    setTopProducts(sortedProducts);
  };

  const loadReports = async () => {

    const querySnapshot =
      await getDocs(
        collection(db, "orders")
      );

    const data: any[] = [];

    querySnapshot.forEach((docItem) => {

      const order = {
        id: docItem.id,
        ...docItem.data(),
      };

      data.push(order);

    });

    data.sort((a, b) => {

      const dateA =
        getOrderDate(a)?.getTime() || 0;

      const dateB =
        getOrderDate(b)?.getTime() || 0;

      return dateB - dateA;

    });

    setOrders(data);

    const today =
      new Date();

    const todayTotal =
      data.reduce(
        (sum, order) => {

          const orderDate =
            getOrderDate(order);

          if (
            orderDate &&
            isSameDay(
              orderDate,
              today
            )
          ) {
            return (
              sum +
              Number(order.total || 0)
            );
          }

          return sum;
        },
        0
      );

    setTodayRevenue(todayTotal);

    applyFilter(
      data,
      filterType,
      fromDate,
      toDate
    );
  };

  useEffect(() => {

    loadReports();

  }, []);

  useEffect(() => {

    applyFilter(
      orders,
      filterType,
      fromDate,
      toDate
    );

  }, [
    filterType,
    fromDate,
    toDate,
    orders,
  ]);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black">

      <h1 className="text-4xl font-bold text-blue-700 mb-8">
        Báo cáo doanh thu
      </h1>

      <div className="bg-white rounded-3xl shadow p-6 mb-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <div>
            <label className="block mb-2 font-semibold">
              Lọc báo cáo
            </label>

            <select
              className="w-full border p-3 rounded-xl"
              value={filterType}
              onChange={(e) =>
                setFilterType(
                  e.target.value
                )
              }
            >
              <option value="today">
                Hôm nay
              </option>

              <option value="month">
                Tháng này
              </option>

              <option value="year">
                Năm này
              </option>

              <option value="custom">
                Tùy chọn
              </option>

              <option value="all">
                Tất cả
              </option>
            </select>
          </div>

          {filterType === "custom" && (
            <>

              <div>
                <label className="block mb-2 font-semibold">
                  Từ ngày
                </label>

                <input
                  type="date"
                  className="w-full border p-3 rounded-xl"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold">
                  Đến ngày
                </label>

                <input
                  type="date"
                  className="w-full border p-3 rounded-xl"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                />
              </div>

            </>
          )}

          <div className="flex items-end">
            <button
              onClick={loadReports}
              className="w-full bg-blue-600 text-white p-3 rounded-xl font-semibold"
            >
              Tải lại báo cáo
            </button>
          </div>

        </div>

      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">

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
            Tiền mặt
          </h2>

          <p className="text-3xl font-bold text-green-600 mt-3">
            {cashRevenue.toLocaleString()}đ
          </p>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Chuyển khoản
          </h2>

          <p className="text-3xl font-bold text-purple-600 mt-3">
            {bankRevenue.toLocaleString()}đ
          </p>

        </div>

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Số đơn hàng
          </h2>

          <p className="text-3xl font-bold text-orange-600 mt-3">
            {orderCount}
          </p>

        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">

        <div className="bg-white p-6 rounded-3xl shadow">

          <h2 className="text-gray-500">
            Doanh thu hôm nay
          </h2>

          <p className="text-3xl font-bold text-green-600 mt-3">
            {todayRevenue.toLocaleString()}đ
          </p>

        </div>

        <div className="bg-white rounded-3xl shadow p-6">

          <h2 className="text-2xl font-bold mb-6">
            Top sản phẩm bán chạy
          </h2>

          <div className="space-y-4">

            {topProducts.map(
              (item, index) => (

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

              )
            )}

            {topProducts.length === 0 && (
              <p className="text-gray-500">
                Chưa có dữ liệu sản phẩm
              </p>
            )}

          </div>

        </div>

      </div>

      <div className="bg-white rounded-3xl shadow p-6">

        <h2 className="text-2xl font-bold mb-6">
          Danh sách đơn hàng
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full border-collapse">

            <thead>

              <tr className="border-b bg-gray-50">

                <th className="text-left p-3">
                  Mã đơn
                </th>

                <th className="text-left p-3">
                  Ngày giờ
                </th>

                <th className="text-left p-3">
                  Thanh toán
                </th>

                <th className="text-right p-3">
                  Tổng tiền
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredOrders.map(
                (order, index) => {

                  return (
                    <tr
                      key={
                        order.id || index
                      }
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-3">
                        <button
                          onClick={() =>
                            setSelectedOrder(order)
                          }
                          className="text-blue-700 font-bold hover:underline"
                        >
                          {getOrderCode(order)}
                        </button>
                      </td>

                      <td className="p-3">
                        {formatDateTime(order)}
                      </td>

                      <td className="p-3">
                        {getPaymentMethodText(
                          order
                        )}
                      </td>

                      <td className="p-3 text-right font-semibold">
                        {Number(
                          order.total || 0
                        ).toLocaleString()}
                        đ
                      </td>

                    </tr>
                  );
                }
              )}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-gray-500"
                  >
                    Không có đơn hàng trong khoảng thời gian này
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">

            <div className="flex justify-between items-start mb-6">

              <div>
                <h2 className="text-2xl font-bold text-blue-700">
                  Chi tiết đơn hàng
                </h2>

                <p className="mt-2 text-gray-600">
                  Mã đơn:{" "}
                  <span className="font-bold text-black">
                    {getOrderCode(selectedOrder)}
                  </span>
                </p>

                <p className="text-gray-600">
                  Ngày giờ:{" "}
                  <span className="font-semibold text-black">
                    {formatDateTime(selectedOrder)}
                  </span>
                </p>

                <p className="text-gray-600">
                  Thanh toán:{" "}
                  <span className="font-semibold text-black">
                    {getPaymentMethodText(selectedOrder)}
                  </span>
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Đóng
              </button>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full border-collapse">

                <thead>

                  <tr className="border-b bg-gray-50">

                    <th className="text-left p-3">
                      STT
                    </th>

                    <th className="text-left p-3">
                      Sản phẩm
                    </th>

                    <th className="text-left p-3">
                      Mã SP
                    </th>

                    <th className="text-right p-3">
                      SL
                    </th>

                    <th className="text-right p-3">
                      Giá
                    </th>

                    <th className="text-right p-3">
                      VAT
                    </th>

                    <th className="text-right p-3">
                      Thành tiền
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {selectedOrder.items &&
                    selectedOrder.items.map(
                      (item: any, index: number) => {

                        const price =
                          Number(item.price || 0);

                        const quantity =
                          Number(item.quantity || 0);

                        const tax =
                          Number(item.tax || 0);

                        const itemTotal =
                          price * quantity;

                        const itemVat =
                          itemTotal * tax / 100;

                        const finalTotal =
                          itemTotal + itemVat;

                        return (
                          <tr
                            key={index}
                            className="border-b"
                          >

                            <td className="p-3">
                              {index + 1}
                            </td>

                            <td className="p-3 font-semibold">
                              {item.name}
                            </td>

                            <td className="p-3">
                              {item.product_code ||
                                item.productCode ||
                                ""}
                            </td>

                            <td className="p-3 text-right">
                              {quantity}{" "}
                              {item.unit || ""}
                            </td>

                            <td className="p-3 text-right">
                              {price.toLocaleString()}đ
                            </td>

                            <td className="p-3 text-right">
                              {tax}%
                            </td>

                            <td className="p-3 text-right font-bold">
                              {finalTotal.toLocaleString()}đ
                            </td>

                          </tr>
                        );
                      }
                    )}

                  {(!selectedOrder.items ||
                    selectedOrder.items.length === 0) && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-6 text-center text-gray-500"
                      >
                        Đơn hàng này chưa có danh sách sản phẩm
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

            <div className="mt-6 flex justify-end">

              <div className="w-full md:w-80 space-y-2 text-right">

                <div className="flex justify-between">
                  <span>
                    Tạm tính:
                  </span>

                  <span className="font-semibold">
                    {Number(
                      selectedOrder.subtotal || 0
                    ).toLocaleString()}
                    đ
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>
                    VAT:
                  </span>

                  <span className="font-semibold">
                    {Number(
                      selectedOrder.vatAmount || 0
                    ).toLocaleString()}
                    đ
                  </span>
                </div>

                <div className="flex justify-between text-xl font-bold text-blue-700 border-t pt-3">
                  <span>
                    Tổng cộng:
                  </span>

                  <span>
                    {Number(
                      selectedOrder.total || 0
                    ).toLocaleString()}
                    đ
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}