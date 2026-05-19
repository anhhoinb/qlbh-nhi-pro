"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function PrintOrderPage() {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  const [shopName, setShopName] =
    useState("NhiPro23");

  const [address, setAddress] =
    useState("TP.HCM");

  const [phone, setPhone] =
    useState("0900 000 000");

  const [invoiceTitle, setInvoiceTitle] =
    useState("HÓA ĐƠN BÁN HÀNG");

  const [temporaryTitle, setTemporaryTitle] =
    useState("PHIẾU TẠM TÍNH");

  const [thankYouText, setThankYouText] =
    useState("Cảm ơn quý khách!");

  const [seeYouText, setSeeYouText] =
    useState("Hẹn gặp lại ❤️");

  const [paperSize, setPaperSize] =
    useState("A5");

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString("vi-VN");
  };

  const formatDate = (value: any) => {
    if (!value) return "";

    try {
      const date = value.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

      return date.toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  };

  const getOrderCode = (item: any) => {
    return (
      item?.orderCode ||
      item?.order_code ||
      item?.id ||
      ""
    );
  };

  const getItems = (item: any) => {
    return (
      item?.items ||
      item?.products ||
      item?.cart ||
      []
    );
  };

  const getProductName = (product: any) => {
    return (
      product.name ||
      product.productName ||
      product.product_name ||
      "---"
    );
  };

  const getProductSku = (product: any) => {
    return (
      product.sku ||
      product.code ||
      product.productCode ||
      product.product_code ||
      ""
    );
  };

  const getProductQuantity = (product: any) => {
    return Number(
      product.quantity ||
      product.qty ||
      0
    );
  };

  const getProductUnit = (product: any) => {
    return (
      product.unit ||
      product.unitName ||
      product.donVi ||
      ""
    );
  };

  const getProductPrice = (product: any) => {
    return Number(
      product.price ||
      product.sellPrice ||
      product.salePrice ||
      product.unitPrice ||
      0
    );
  };

  const getProductVat = (product: any) => {
    return Number(
      product.vat ||
      product.tax ||
      0
    );
  };

  const getProductTotal = (product: any) => {
    const directTotal =
      product.total ||
      product.totalPrice ||
      product.amount;

    if (directTotal) {
      return Number(directTotal);
    }

    return (
      getProductQuantity(product) *
      getProductPrice(product)
    );
  };

  const getSubtotal = (item: any) => {
    return Number(
      item?.subtotal ||
      item?.totalBeforeDiscount ||
      item?.total ||
      item?.grand_total ||
      item?.totalAmount ||
      0
    );
  };

  const getVatAmount = (item: any) => {
    return Number(
      item?.vatAmount ||
      item?.vat ||
      0
    );
  };

  const getDiscountAmount = (item: any) => {
    return Number(
      item?.discountAmount ||
      item?.discount ||
      0
    );
  };

  const getGrandTotal = (item: any) => {
    return Number(
      item?.total ||
      item?.grand_total ||
      item?.totalAmount ||
      0
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const params =
          new URLSearchParams(window.location.search);

        const orderCode =
          params.get("orderCode") || "";

        const templateRef =
          doc(
            db,
            "settings",
            "print_template"
          );

        const templateSnap =
          await getDoc(templateRef);

        if (templateSnap.exists()) {
          const data: any =
            templateSnap.data();

          setShopName(
            data.shopName || "NhiPro23"
          );

          setAddress(
            data.address || "TP.HCM"
          );

          setPhone(
            data.phone || "0900 000 000"
          );

          setInvoiceTitle(
            data.invoiceTitle || "HÓA ĐƠN BÁN HÀNG"
          );

          setTemporaryTitle(
            data.temporaryTitle || "PHIẾU TẠM TÍNH"
          );

          setThankYouText(
            data.thankYouText || "Cảm ơn quý khách!"
          );

          setSeeYouText(
            data.seeYouText || "Hẹn gặp lại ❤️"
          );

          setPaperSize(
            data.paperSize || "A5"
          );
        }

        if (!orderCode) {
          setOrder(null);
          return;
        }

        const q1 = query(
          collection(db, "orders"),
          where("orderCode", "==", orderCode),
          limit(1)
        );

        const snap1 = await getDocs(q1);

        if (!snap1.empty) {
          const docItem = snap1.docs[0];

          setOrder({
            id: docItem.id,
            ...docItem.data(),
          });

          return;
        }

        const q2 = query(
          collection(db, "orders"),
          where("order_code", "==", orderCode),
          limit(1)
        );

        const snap2 = await getDocs(q2);

        if (!snap2.empty) {
          const docItem = snap2.docs[0];

          setOrder({
            id: docItem.id,
            ...docItem.data(),
          });

          return;
        }

        const directRef =
          doc(db, "orders", orderCode);

        const directSnap =
          await getDoc(directRef);

        if (directSnap.exists()) {
          setOrder({
            id: directSnap.id,
            ...directSnap.data(),
          });

          return;
        }

        setOrder(null);
      } catch (error) {
        console.log(error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const params =
      new URLSearchParams(window.location.search);

    const autoPrint =
      params.get("autoPrint");

    if (autoPrint !== "1") return;
    if (loading) return;
    if (!order) return;

    const timer = setTimeout(() => {
      window.focus();
      window.print();
    }, 800);

    return () => clearTimeout(timer);
  }, [loading, order]);

  if (loading) {
    return (
      <main className="p-6 text-black">
        Đang tải hóa đơn...
      </main>
    );
  }

  if (!order) {
    return (
      <main className="p-6 text-black">
        Không tìm thấy đơn hàng cần in.
      </main>
    );
  }

  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const type =
    params?.get("type") || "invoice";

  const title =
    type === "temporary"
      ? temporaryTitle
      : invoiceTitle;

  const items = getItems(order);

  return (
    <main className="print-area bg-gray-200 min-h-screen p-6 print:bg-white print:p-0">
      <style jsx global>{`
  @page {
    size: ${paperSize === "K80" ? "80mm auto" : "A5"};
    margin: 8mm;
  }

  @media print {
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      width: 100% !important;
      height: auto !important;
      overflow: visible !important;
    }

    body * {
      visibility: hidden !important;
    }

    .print-area,
    .print-area * {
      visibility: visible !important;
    }

    .print-area {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    .print-box {
      box-shadow: none !important;
      margin: 0 auto !important;
      background: white !important;
    }

    .no-print {
      display: none !important;
    }
  }
`}</style>

      <div
        className={
          paperSize === "K80"
            ? "print-box bg-white mx-auto p-4 shadow w-[80mm] text-[12px] text-black"
            : "print-box bg-white mx-auto p-8 shadow max-w-[680px] text-black"
        }
      >
        <div className="text-center mb-4">
  <div className="font-medium text-base tracking-wide">
    {title}
  </div>

  <div className="text-sm mt-1">
    {formatDate(order.createdAt)} | {getOrderCode(order)}
  </div>
</div>

        <div className="border-t border-gray-700 pt-4 mb-2">
  <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-1">
                  STT
                </th>
                <th className="text-left py-1">
                  SP
                </th>
                <th className="text-center py-1">
                  SL
                </th>
                <th className="text-right py-1">
                  Giá
                </th>
                <th className="text-right py-1">
                  VAT
                </th>
                <th className="text-right py-1">
                  TT
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((product: any, index: number) => (
                <tr key={index}>
                  <td className="py-1 align-top">
                    {index + 1}
                  </td>

                  <td className="py-1 align-top">
                    <div>
                      {getProductName(product)}
                    </div>

                    {getProductSku(product) && (
                      <div className="text-xs">
                        Mã: {getProductSku(product)}
                      </div>
                    )}
                  </td>

                  <td className="py-1 text-center align-top">
                    {getProductQuantity(product)}{" "}
                    {getProductUnit(product)}
                  </td>

                  <td className="py-1 text-right align-top">
                    {formatMoney(
                      getProductPrice(product)
                    )}
                    đ
                  </td>

                  <td className="py-1 text-right align-top">
                    {getProductVat(product)}%
                  </td>

                  <td className="py-1 text-right align-top">
                    {formatMoney(
                      getProductTotal(product)
                    )}
                    đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed border-gray-500 mt-2"></div>
        </div>

        <div className="flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between">
              <span>Tổng:</span>
              <strong>
                {formatMoney(getSubtotal(order))}đ
              </strong>
            </div>

            <div className="flex justify-between">
              <span>VAT:</span>
              <strong>
                {formatMoney(getVatAmount(order))}đ
              </strong>
            </div>

            <div className="flex justify-between">
              <span>Chiết khấu:</span>
              <strong>
                {formatMoney(getDiscountAmount(order))}đ
              </strong>
            </div>

            <div className="flex justify-between text-base mt-1">
              <span className="font-bold">
                Tổng cộng:
              </span>
              <strong>
                {formatMoney(getGrandTotal(order))}đ
              </strong>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <div>{thankYouText}</div>
          <div>{seeYouText}</div>
        </div>
      </div>
    </main>
  );
}