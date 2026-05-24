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

export default function PrintOrderPage() {
  const [loading, setLoading] =
    useState(true);

  const [order, setOrder] =
    useState<any>(null);

  const [shopName, setShopName] =
    useState("NhiPro23");

  const [department, setDepartment] =
    useState("Kho hàng");

  const [warehouseTitle, setWarehouseTitle] =
    useState("PHIẾU XUẤT KHO");

  const [receiver, setReceiver] =
    useState("Khách hàng");

  const [receiverDepartment, setReceiverDepartment] =
    useState("Kinh doanh");

  const [reason, setReason] =
    useState("Xuất bán hàng");

  const [exportPlace, setExportPlace] =
    useState("Kho chính");

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

      return `${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
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

  const getProductUnit = (
    product: any
  ) => {
    return (
      product.unit ||
      product.unitName ||
      "Cái"
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

            setDepartment(
              data.department ||
                "Kho hàng"
            );

            setWarehouseTitle(
              data.warehouseTitle ||
                "PHIẾU XUẤT KHO"
            );

            setReceiver(
              data.receiver ||
                "Khách hàng"
            );

            setReceiverDepartment(
              data.receiverDepartment ||
                "Kinh doanh"
            );

            setReason(
              data.reason ||
                "Xuất bán hàng"
            );

            setExportPlace(
              data.exportPlace ||
                "Kho chính"
            );

            setPaperSize(
              data.paperSize ||
                "A5"
            );
          }

          if (!orderCode) {
            setOrder(null);
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

      <div className="print-box bg-white max-w-[900px] mx-auto p-10 text-black shadow">

        <div className="flex justify-between">

          <div>
            <div>
              <strong>
                Đơn vị:
              </strong>{" "}
              {shopName}
            </div>

            <div>
              <strong>
                Bộ phận:
              </strong>{" "}
              {department}
            </div>
          </div>

          <div className="text-center text-sm">
            <div className="font-bold">
              Mẫu số 02 - VT
            </div>

            <div>
              (Ban hành theo
              TT200)
            </div>
          </div>

        </div>

        <div className="text-center mt-8">

          <div className="text-3xl font-bold">
            {warehouseTitle}
          </div>

          <div className="mt-2 italic">
            Ngày{" "}
            {new Date().getDate()}
            {" "}tháng{" "}
            {new Date().getMonth() +
              1}
            {" "}năm{" "}
            {new Date().getFullYear()}
          </div>

        </div>

        <div className="mt-8 space-y-2 text-[16px]">

          <div>
            Họ tên người nhận
            hàng:{" "}
            <strong>
              {receiver}
            </strong>
          </div>

          <div>
            Bộ phận:{" "}
            <strong>
              {
                receiverDepartment
              }
            </strong>
          </div>

          <div>
            Lý do xuất kho:{" "}
            <strong>
              {reason}
            </strong>
          </div>

          <div>
            Xuất tại kho:{" "}
            <strong>
              {exportPlace}
            </strong>
          </div>

          <div>
            Mã đơn:{" "}
            <strong>
              {getOrderCode(
                order
              )}
            </strong>
          </div>

        </div>

        <table className="w-full border-collapse border border-black mt-6 text-sm">

          <thead>

            <tr>

              <th className="border border-black p-2">
                STT
              </th>

              <th className="border border-black p-2">
                Tên hàng hóa
              </th>

              <th className="border border-black p-2">
                ĐVT
              </th>

              <th className="border border-black p-2">
                SL
              </th>

              <th className="border border-black p-2">
                Đơn giá
              </th>

              <th className="border border-black p-2">
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

                  <td className="border border-black p-2 text-center">
                    {index + 1}
                  </td>

                  <td className="border border-black p-2">
                    {getProductName(
                      product
                    )}
                  </td>

                  <td className="border border-black p-2 text-center">
                    {getProductUnit(
                      product
                    )}
                  </td>

                  <td className="border border-black p-2 text-center">
                    {getProductQuantity(
                      product
                    )}
                  </td>

                  <td className="border border-black p-2 text-right">
                    {formatMoney(
                      getProductPrice(
                        product
                      )
                    )}
                  </td>

                  <td className="border border-black p-2 text-right">
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
                colSpan={5}
                className="border border-black p-2 text-right font-bold"
              >
                Tổng cộng
              </td>

              <td className="border border-black p-2 text-right font-bold">
                {formatMoney(
                  getGrandTotal(
                    order
                  )
                )}
              </td>

            </tr>

          </tbody>

        </table>

        <div className="mt-5 text-[16px]">

          Tổng số tiền:{" "}
          <strong>
            {formatMoney(
              getGrandTotal(
                order
              )
            )}
            đ
          </strong>

        </div>

        <div className="grid grid-cols-5 gap-6 text-center mt-20">

          <div>
            <div className="font-bold">
              Người lập phiếu
            </div>

            <div className="italic text-sm">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Người nhận hàng
            </div>

            <div className="italic text-sm">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Thủ kho
            </div>

            <div className="italic text-sm">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Kế toán
            </div>

            <div className="italic text-sm">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Giám đốc
            </div>

            <div className="italic text-sm">
              (Ký, họ tên)
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}