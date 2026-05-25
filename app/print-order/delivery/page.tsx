"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function DeliveryPage() {
  const [loading, setLoading] =
    useState(true);

  const [order, setOrder] =
    useState<any>(null);

  const [shopName, setShopName] =
    useState("NhiPro23");

  const [address, setAddress] =
    useState("TP.HCM");

  const [phone, setPhone] =
    useState("0900 000 000");

  const [paperSize, setPaperSize] =
    useState("A5");

  const formatMoney = (
    value: any
  ) => {
    return Number(
      value || 0
    ).toLocaleString("vi-VN");
  };

  const formatDate = (
    value: any
  ) => {
    if (!value) return "";

    try {
      const date = value.seconds
        ? new Date(
            value.seconds * 1000
          )
        : new Date(value);

      return date.toLocaleString(
        "vi-VN"
      );
    } catch {
      return "";
    }
  };

  const getOrderCode = (
    item: any
  ) => {
    return (
      item?.orderCode ||
      item?.order_code ||
      item?.id ||
      ""
    );
  };

  const getItems = (
    item: any
  ) => {
    return (
      item?.items ||
      item?.products ||
      item?.cart ||
      []
    );
  };

  const getProductName = (
    product: any
  ) => {
    return (
      product.name ||
      product.productName ||
      "---"
    );
  };

  const getProductQuantity = (
    product: any
  ) => {
    return Number(
      product.quantity ||
        product.qty ||
        0
    );
  };

  const getProductPrice = (
    product: any
  ) => {
    return Number(
      product.price ||
        product.sellPrice ||
        0
    );
  };

  const getProductTotal = (
    product: any
  ) => {
    return (
      getProductQuantity(
        product
      ) *
      getProductPrice(product)
    );
  };

  const getGrandTotal = (
    item: any
  ) => {
    return Number(
      item?.total ||
        item?.grand_total ||
        item?.totalAmount ||
        0
    );
  };

  const getCustomerName = (
    item: any
  ) => {
    return (
      item?.customerName ||
      item?.customer?.name ||
      "Khách hàng"
    );
  };

  const getCustomerPhone = (
    item: any
  ) => {
    return (
      item?.customerPhone ||
      item?.customer?.phone ||
      ""
    );
  };

  const getCustomerAddress =
    (item: any) => {
      return (
        item?.customerAddress ||
        item?.customer?.address ||
        ""
      );
    };

  const getCustomerNote = (
    item: any
  ) => {
    return (
      item?.note ||
      item?.customerNote ||
      ""
    );
  };

  useEffect(() => {
    const loadData =
      async () => {
        try {
          const params =
            new URLSearchParams(
              window.location.search
            );

          const orderCode =
            params.get(
              "orderCode"
            ) || "";

          const templateRef =
            doc(
              db,
              "settings",
              "print_template"
            );

          const templateSnap =
            await getDoc(
              templateRef
            );

          if (
            templateSnap.exists()
          ) {
            const data: any =
              templateSnap.data();

            setShopName(
              data.shopName ||
                "NhiPro23"
            );

            setAddress(
              data.address ||
                "TP.HCM"
            );

            setPhone(
              data.phone ||
                "0900 000 000"
            );

            setPaperSize(
              data.paperSize ||
                "A5"
            );
          }

          if (!orderCode) {
            setOrder({
              orderCode:
                "DH0001",

              total:
                680000,

              customerName:
                "Nguyễn Văn A",

              customerPhone:
                "0909123456",

              customerAddress:
                "123 Nguyễn Trãi, Q1, TP.HCM",

              note:
                "Giao giờ hành chính",

              items: [
                {
                  name: "Arduino Uno",
                  quantity: 2,
                  price: 250000,
                },

                {
                  name: "ESP32",
                  quantity: 1,
                  price: 180000,
                },
              ],
            });

            setLoading(false);

            return;
          }

          const q1 = query(
            collection(
              db,
              "orders"
            ),
            where(
              "orderCode",
              "==",
              orderCode
            ),
            limit(1)
          );

          const snap1 =
            await getDocs(q1);

          if (!snap1.empty) {
            const docItem =
              snap1.docs[0];

            setOrder({
              id: docItem.id,
              ...docItem.data(),
            });

            return;
          }

          const directRef =
            doc(
              db,
              "orders",
              orderCode
            );

          const directSnap =
            await getDoc(
              directRef
            );

          if (
            directSnap.exists()
          ) {
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
      new URLSearchParams(
        window.location.search
      );

    const autoPrint =
      params.get("autoPrint");

    if (
      autoPrint !== "1"
    )
      return;

    if (loading) return;

    if (!order) return;

    const timer =
      setTimeout(() => {
        window.focus();

        window.print();
      }, 800);

    return () =>
      clearTimeout(timer);
  }, [loading, order]);

  if (loading) {
    return (
      <main className="p-6">
        Đang tải...
      </main>
    );
  }

  if (!order) {
    return (
      <main className="p-6">
        Không tìm thấy đơn hàng.
      </main>
    );
  }

  const items =
    getItems(order);

  return (
    <main className="print-area bg-gray-200 min-h-screen p-6 print:bg-white print:p-0">

      <style jsx global>{`
        @page {
          size: A5 portrait;
          margin: 10mm;
        }

        @media print {
          body {
            background: white !important;
          }

          .print-area {
            padding: 0 !important;
            background: white !important;
          }

          .print-box {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="print-box bg-white w-[148mm] min-h-[210mm] mx-auto p-[12mm] text-black shadow text-[15px]">

        <div className="flex justify-between">

          <div>
            <div className="text-2xl font-bold">
              {shopName}
            </div>

            <div className="mt-1">
              {address}
            </div>

            <div>
              Hotline: {phone}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">
              PHIẾU GIAO HÀNG
            </div>

            <div className="mt-2">
              {formatDate(
                order.createdAt
              )}
            </div>

            <div className="mt-1">
              Mã đơn:{" "}
              <strong>
                {getOrderCode(
                  order
                )}
              </strong>
            </div>
          </div>

        </div>

        <div className="border border-black mt-6 p-4 space-y-3">

          <div>
            <strong>
              Người nhận:
            </strong>{" "}
            {getCustomerName(
              order
            )}
          </div>

          <div>
            <strong>
              SĐT:
            </strong>{" "}
            {getCustomerPhone(
              order
            )}
          </div>

          <div>
            <strong>
              Địa chỉ:
            </strong>{" "}
            {getCustomerAddress(
              order
            )}
          </div>

          <div>
            <strong>
              Ghi chú:
            </strong>{" "}
            {getCustomerNote(
              order
            )}
          </div>

        </div>

        <table className="w-full border-collapse border border-black mt-6 text-[15px]">

          <thead>

            <tr>

              <th className="border border-black px-2 py-3">
                STT
              </th>

              <th className="border border-black px-2 py-3">
                Sản phẩm
              </th>

              <th className="border border-black px-2 py-3">
                SL
              </th>

              <th className="border border-black px-2 py-3">
                Giá
              </th>

              <th className="border border-black px-2 py-3">
                Thành tiền
              </th>

            </tr>

          </thead>

          <tbody>

            {items.map(
              (
                product: any,
                index: number
              ) => (
                <tr
                  key={index}
                >

                  <td className="border border-black px-2 py-3 text-center">
                    {index + 1}
                  </td>

                  <td className="border border-black px-2 py-3">
                    {getProductName(
                      product
                    )}
                  </td>

                  <td className="border border-black px-2 py-3 text-center">
                    {getProductQuantity(
                      product
                    )}
                  </td>

                  <td className="border border-black px-2 py-3 text-right">
                    {formatMoney(
                      getProductPrice(
                        product
                      )
                    )}
                  </td>

                  <td className="border border-black px-2 py-3 text-right">
                    {formatMoney(
                      getProductTotal(
                        product
                      )
                    )}
                  </td>

                </tr>
              )
            )}

            <tr>

              <td
                colSpan={4}
                className="border border-black px-2 py-3 text-right font-bold"
              >
                Tổng cộng
              </td>

              <td className="border border-black px-2 py-3 text-right font-bold">
                {formatMoney(
                  getGrandTotal(
                    order
                  )
                )}
                đ
              </td>

            </tr>

          </tbody>

        </table>

        <div className="mt-10 grid grid-cols-2 gap-10 text-center">

          <div>

            <div className="font-bold">
              Người giao hàng
            </div>

            <div className="italic text-sm mt-1">
              (Ký, họ tên)
            </div>

          </div>

          <div>

            <div className="font-bold">
              Người nhận hàng
            </div>

            <div className="italic text-sm mt-1">
              (Ký, họ tên)
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}