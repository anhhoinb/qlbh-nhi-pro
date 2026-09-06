"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type Quotation = {
  id: string;
  quotationCode?: string;
  quotation_code?: string;
  quotationDate?: string;
  createdAt?: any;
  updatedAt?: any;
  buyer?: {
    companyName?: string;
    contactName?: string;
    phone?: string;
    email?: string;
  };
  subtotal?: number;
  vatAmount?: number;
  total?: number;
  status?: string;
  orderId?: string;
  orderCode?: string;
  paidAt?: any;
  items?: any[];
};

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: unknown) {
  return toNumber(value).toLocaleString("vi-VN");
}

function formatDate(value: any, fallback?: string) {
  if (value) {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value?.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("vi-VN");
    }
  }

  if (fallback) {
    const date = new Date(`${fallback}T00:00:00`);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("vi-VN");
    }
  }

  return "---";
}

function getQuotationCode(item: Quotation) {
  return item.quotationCode || item.quotation_code || item.id;
}

function getStatusLabel(status?: string) {
  if (status === "paid") return "Đã thanh toán";
  if (status === "confirmed") return "Đã xác nhận";
  if (status === "cancelled") return "Đã hủy";
  return "Bản nháp";
}

function getStatusClass(status?: string) {
  if (status === "paid") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "confirmed") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-gray-700";
}

export default function QuotationsPage() {
  const router = useRouter();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [payingId, setPayingId] = useState("");
  const [paymentQuotation, setPaymentQuotation] = useState<Quotation | null>(null);
  const [search, setSearch] = useState("");

  const loadQuotations = async () => {
    try {
      setLoading(true);

      let snapshot;

      try {
        snapshot = await getDocs(
          query(
            collection(db, "quotations"),
            orderBy("createdAt", "desc")
          )
        );
      } catch {
        snapshot = await getDocs(collection(db, "quotations"));
      }

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Quotation[];

      data.sort((a, b) => {
        const aTime =
          a.createdAt?.seconds ||
          a.updatedAt?.seconds ||
          0;

        const bTime =
          b.createdAt?.seconds ||
          b.updatedAt?.seconds ||
          0;

        return bTime - aTime;
      });

      setQuotations(data);
    } catch (error) {
      console.error(error);
      alert("Không tải được danh sách báo giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const filteredQuotations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return quotations;
    }

    return quotations.filter((item) => {
      const values = [
        getQuotationCode(item),
        item.buyer?.companyName,
        item.buyer?.contactName,
        item.buyer?.phone,
        item.buyer?.email,
        item.status,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [quotations, search]);

  const markAsPaid = async (
    item: Quotation,
    paymentMethod: "cash" | "bank"
  ) => {
    if (item.status === "paid") {
      alert("Báo giá này đã được thanh toán và đã tạo đơn hàng.");
      return;
    }

    const paymentMethodText =
      paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản";

    try {
      setPaymentQuotation(null);
      setPayingId(item.id);

      const quotationRef = doc(db, "quotations", item.id);
      const orderRef = doc(collection(db, "orders"));
      const orderCounterRef = doc(db, "settings", "order_counter");

      let createdOrderCode = "";

      await runTransaction(db, async (transaction) => {
        const quotationSnap = await transaction.get(quotationRef);

        if (!quotationSnap.exists()) {
          throw new Error("Không tìm thấy báo giá");
        }

        const quotationData: any = quotationSnap.data();

        if (quotationData.status === "paid" || quotationData.orderId) {
          throw new Error("Báo giá này đã được chuyển thành đơn hàng trước đó");
        }

        const quotationItems = Array.isArray(quotationData.items)
          ? quotationData.items
          : [];

        if (quotationItems.length === 0) {
          throw new Error("Báo giá không có sản phẩm");
        }

        const stockItems = quotationItems.filter(
          (product: any) => !product.isManual
        );

        const counterSnap = await transaction.get(orderCounterRef);
        const nextNumber = counterSnap.exists()
          ? Number(counterSnap.data()?.current || 0) + 1
          : 1;

        createdOrderCode = `SON${String(nextNumber).padStart(5, "0")}`;

        const productRefs = stockItems.map((product: any) =>
          doc(db, "products", String(product.id || ""))
        );

        const productSnapshots: DocumentSnapshot<DocumentData>[] = [];

        for (const productRef of productRefs) {
          productSnapshots.push(await transaction.get(productRef));
        }

        productSnapshots.forEach((snapshot, index) => {
          const quotationProduct = stockItems[index];

          if (!quotationProduct) {
            throw new Error("Dữ liệu sản phẩm báo giá không hợp lệ");
          }

          const productName =
            quotationProduct.printName ||
            quotationProduct.short_name ||
            quotationProduct.main_name ||
            quotationProduct.name ||
            "Không xác định";

          if (!snapshot.exists()) {
            throw new Error(`Không tìm thấy sản phẩm trong kho: ${productName}`);
          }

          const currentStock = Number(snapshot.data()?.stock || 0);
          const quantity = Number(quotationProduct.quantity || 0);

          if (quantity <= 0) {
            throw new Error(`Số lượng không hợp lệ: ${productName}`);
          }

          if (quantity > currentStock) {
            throw new Error(
              `Sản phẩm "${productName}" không đủ tồn kho. Tồn hiện tại: ${currentStock}, cần: ${quantity}`
            );
          }
        });

        const orderItems = quotationItems.map((product: any) => ({
          ...product,
          productId: product.isManual ? "" : String(product.id || ""),
          productCode: product.product_code || product.productCode || "",
          product_code: product.product_code || product.productCode || "",
          name: product.name || product.printName || "",
          main_name:
            product.main_name || product.name || product.printName || "",
          short_name:
            product.short_name ||
            product.main_name ||
            product.name ||
            product.printName ||
            "",
          printName:
            product.printName ||
            product.short_name ||
            product.main_name ||
            product.name ||
            "",
          quantity: Number(product.quantity || 0),
          qty: Number(product.quantity || 0),
          price: Number(product.price || 0),
          unitPrice: Number(product.price || 0),
          sellPrice: Number(product.price || 0),
          tax: Number(product.tax || 0),
          vat: Number(product.tax || 0),
          unit: product.unit || "cái",
          total: Number(product.lineSubtotal || 0),
          lineSubtotal: Number(product.lineSubtotal || 0),
          lineVat: Number(product.lineVat || 0),
          lineTotal: Number(product.lineTotal || 0),
        }));

        const buyer = quotationData.buyer || {};
        const orderTotal = Number(quotationData.total || 0);
        const cashAmount = paymentMethod === "cash" ? orderTotal : 0;
        const transferAmount = paymentMethod === "bank" ? orderTotal : 0;

        transaction.set(orderRef, {
          orderCode: createdOrderCode,
          order_code: createdOrderCode,

          source: "quotation",
          quotationId: item.id,
          quotationCode:
            quotationData.quotationCode ||
            quotationData.quotation_code ||
            item.id,

          customer: {
            name: buyer.companyName || "Khách lẻ",
            companyName: buyer.companyName || "",
            phone: buyer.phone || "",
            address: buyer.address || "",
            email: buyer.email || "",
            taxCode: buyer.taxCode || "",
          },
          customerId: "",
          customerName: buyer.companyName || "Khách lẻ",
          customer_name: buyer.companyName || "Khách lẻ",
          customerPhone: buyer.phone || "",
          customer_phone: buyer.phone || "",
          customerCompanyName: buyer.companyName || "",
          customerAddress: buyer.address || "",
          customer_address: buyer.address || "",
          customerEmail: buyer.email || "",
          customerTaxCode: buyer.taxCode || "",

          items: orderItems,
          list: orderItems,

          subtotal: Number(quotationData.subtotal || 0),
          vatAmount: Number(quotationData.vatAmount || 0),
          useProductVat: Number(quotationData.vatAmount || 0) > 0,
          discountType: "value",
          discountValue: 0,
          discountCode: "",
          discountAmount: 0,
          discount: 0,

          total: orderTotal,
          finalTotal: orderTotal,
          final_total: orderTotal,
          grand_total: orderTotal,
          totalAmount: orderTotal,

          paymentMethod,
          payment_method: paymentMethod,
          paymentMethodText,
          payment_method_text: paymentMethodText,

          splitPayment: {
            cash: cashAmount,
            bank: transferAmount,
          },
          cashAmount,
          cash_amount: cashAmount,
          moneyCash: cashAmount,
          transferAmount,
          transfer_amount: transferAmount,
          bankAmount: transferAmount,
          bank_amount: transferAmount,
          moneyBank: transferAmount,

          paidAmount: orderTotal,
          paid_amount: orderTotal,
          customerPay: orderTotal,
          customer_pay: orderTotal,
          changeAmount: 0,
          change_amount: 0,
          remainingAmount: 0,
          remaining_amount: 0,
          debtAmount: 0,

          payments: [
            {
              method: paymentMethod === "bank" ? "transfer" : "cash",
              methodText: paymentMethodText,
              amount: orderTotal,
            },
          ],

          status: "completed",
          stockDeducted: true,
          stockDeductedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        stockItems.forEach((product: any, index: number) => {
          const snapshot = productSnapshots[index];
          const productRef = productRefs[index];

          if (!snapshot || !productRef) {
            throw new Error("Không tìm thấy dữ liệu sản phẩm để trừ kho");
          }

          const productData: any = snapshot.data();
          const currentStock = Number(productData?.stock || 0);
          const quantity = Number(product.quantity || 0);
          const newStock = currentStock - quantity;

          transaction.update(productRef, {
            stock: newStock,
            updatedAt: serverTimestamp(),
          });

          const movementRef = doc(collection(db, "inventory_movements"));

          transaction.set(movementRef, {
            productId: String(product.id || ""),
            productCode:
              product.product_code || product.productCode || "",
            productName:
              product.printName ||
              product.short_name ||
              product.main_name ||
              product.name ||
              "",
            productMainName:
              product.main_name || product.name || product.printName || "",
            type: "sale",
            direction: "out",
            quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            orderId: orderRef.id,
            orderCode: createdOrderCode,
            customerId: "",
            customerName: buyer.companyName || "Khách lẻ",
            customerPhone: buyer.phone || "",
            reason: "Bán hàng",
            note: `Tự động trừ kho từ báo giá ${
              quotationData.quotationCode ||
              quotationData.quotation_code ||
              item.id
            }`,
            createdAt: serverTimestamp(),
          });
        });

        transaction.set(
          orderCounterRef,
          { current: nextNumber },
          { merge: true }
        );

        transaction.update(quotationRef, {
          status: "paid",
          orderId: orderRef.id,
          orderCode: createdOrderCode,
          paymentMethod,
          paymentMethodText,
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      setQuotations((prev) =>
        prev.map((quotation) =>
          quotation.id === item.id
            ? {
                ...quotation,
                status: "paid",
                orderId: orderRef.id,
                orderCode: createdOrderCode,
              }
            : quotation
        )
      );

      alert(
        `Đã thanh toán ${getQuotationCode(item)}.\n\nĐã tạo đơn hàng: ${createdOrderCode}\nĐã trừ tồn kho các sản phẩm trong kho.`
      );
    } catch (error: any) {
      console.error("PAY QUOTATION ERROR:", error);
      alert(
        `Không thể chuyển báo giá thành đơn hàng.\n\n${
          error?.message || "Lỗi không xác định"
        }`
      );
    } finally {
      setPayingId("");
    }
  };

  const deleteQuotation = async (item: Quotation) => {
    if (item.status === "paid") {
      alert("Báo giá đã thanh toán không thể xóa.");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa báo giá ${getQuotationCode(item)} không?\n\nThao tác này không thể hoàn tác.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);

      await deleteDoc(doc(db, "quotations", item.id));

      setQuotations((prev) =>
        prev.filter((quotation) => quotation.id !== item.id)
      );

      alert("Đã xóa báo giá");
    } catch (error) {
      console.error(error);
      alert("Không xóa được báo giá");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-black">
      <div className="mx-auto w-full max-w-[1800px]">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sky-700">
              Quản lý báo giá
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Xem lại, in lại và quản lý các bảng báo giá đã lưu.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/quotations/create")}
            className="rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-sky-700"
          >
            + Tạo báo giá
          </button>
        </div>

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã báo giá, tên công ty, số điện thoại hoặc email..."
            className="w-full rounded-xl border p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Mã báo giá</th>
                  <th className="px-4 py-3 text-left">Ngày tạo</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-center">Số sản phẩm</th>
                  <th className="px-4 py-3 text-right">Tiền hàng</th>
                  <th className="px-4 py-3 text-right">VAT</th>
                  <th className="px-4 py-3 text-right">Tổng cộng</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="w-[360px] px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-10 text-center text-slate-500"
                    >
                      Đang tải danh sách báo giá...
                    </td>
                  </tr>
                ) : filteredQuotations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-10 text-center text-slate-500"
                    >
                      Chưa có báo giá nào
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-semibold text-sky-700">
                        {getQuotationCode(item)}
                      </td>

                      <td className="p-3">
                        {formatDate(
                          item.createdAt || item.updatedAt,
                          item.quotationDate
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold">
                          {item.buyer?.companyName || "---"}
                        </div>

                        {(item.buyer?.phone || item.buyer?.email) && (
                          <div className="mt-1 text-xs text-slate-500">
                            {[item.buyer?.phone, item.buyer?.email]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.items?.length || 0}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatMoney(item.subtotal)}đ
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatMoney(item.vatAmount)}đ
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-red-600">
                        {formatMoney(item.total)}đ
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/quotations/print?id=${encodeURIComponent(
                                  item.id
                                )}`,
                                "_blank"
                              )
                            }
                            className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-blue-50"
                          >
                            Xem
                          </button>

                          {item.status !== "paid" && (
                            <button
                              type="button"
                              disabled={payingId === item.id}
                              onClick={() => setPaymentQuotation(item)}
                              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                            >
                              {payingId === item.id
                                ? "Đang xử lý..."
                                : "Thanh toán"}
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={item.status === "paid"}
                            onClick={() => {
                              if (item.status === "paid") return;

                              router.push(
                                `/quotations/create?id=${encodeURIComponent(
                                  item.id
                                )}`
                              );
                            }}
                            className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `/quotations/print?id=${encodeURIComponent(
                                  item.id
                                )}&print=1`,
                                "_blank"
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            In lại
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId === item.id || item.status === "paid"
                            }
                            onClick={() => deleteQuotation(item)}
                            className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-70"
                          >
                            {deletingId === item.id
                              ? "Đang xóa..."
                              : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">
          Tổng số báo giá:{" "}
          <strong>{filteredQuotations.length}</strong>
        </div>
      </div>

      {paymentQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800">
              Xác nhận thanh toán
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Báo giá <strong>{getQuotationCode(paymentQuotation)}</strong>
            </p>

            <p className="mt-3 text-sm text-slate-600">
              Chọn phương thức khách hàng đã thanh toán. Sau khi chọn, hệ thống
              sẽ tạo đơn hàng và trừ tồn kho các sản phẩm trong kho.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => markAsPaid(paymentQuotation, "cash")}
                className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700"
              >
                Tiền mặt
              </button>

              <button
                type="button"
                onClick={() => markAsPaid(paymentQuotation, "bank")}
                className="rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700"
              >
                Chuyển khoản
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPaymentQuotation(null)}
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </main>
  );
}