"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function InvoicePage() {
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

  const [invoiceTitle, setInvoiceTitle] =
    useState("HÓA ĐƠN BÁN HÀNG");

  const [thankYouText, setThankYouText] =
    useState("Cảm ơn quý khách!");

  const [seeYouText, setSeeYouText] =
    useState("Hẹn gặp lại ❤️");

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
      const date = value?.seconds
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
      item?.code ||
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
      item?.list ||
      []
    );
  };

  const getProductName = (
    product: any
  ) => {
    return (
      product.name ||
      product.productName ||
      product.product_name ||
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
        product.sellprice ||
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

  const getSubtotal = (
    item: any
  ) => {
    return Number(
      item?.subtotal ||
        item?.totalBeforeDiscount ||
        item?.total ||
        0
    );
  };

  const getVatAmount = (
    item: any
  ) => {
    return Number(
      item?.vatAmount ||
        item?.vat ||
        0
    );
  };

  const getDiscountAmount =
    (item: any) => {
      return Number(
        item?.discountAmount ||
          item?.discount ||
          0
      );
    };

  const getGrandTotal = (
    item: any
  ) => {
    return Number(
      item?.total ||
        item?.grand_total ||
        item?.totalAmount ||
        item?.total_amount ||
        0
    );
  };

  const getCustomerPaid = (
    item: any
  ) => {
    return Number(
      item?.customerPaid ||
        item?.paid ||
        item?.paidAmount ||
        getGrandTotal(item)
    );
  };

  const getChange = (
    item: any
  ) => {
    return Math.max(
      getCustomerPaid(item) -
        getGrandTotal(item),
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

          const id =
            params.get("id") || "";

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

            setInvoiceTitle(
              data.invoiceTitle ||
                "HÓA ĐƠN BÁN HÀNG"
            );

            setThankYouText(
              data.thankYouText ||
                "Cảm ơn quý khách!"
            );

            setSeeYouText(
              data.seeYouText ||
                "Hẹn gặp lại ❤️"
            );

            setPaperSize(
              data.paperSize ||
                "A5"
            );
          }

          if (!id) {
            setLoading(false);
            return;
          }

          const orderRef =
            doc(
              db,
              "orders",
              id
            );

          const orderSnap =
            await getDoc(
              orderRef
            );

          if (
            orderSnap.exists()
          ) {
            setOrder({
              id:
                orderSnap.id,
              ...orderSnap.data(),
            });
          } else {
            setOrder(null);
          }
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
    if (
      !loading &&
      order
    ) {
      document.body.style.background =
        "white";

      document.body.style.margin =
        "0";

      const timer =
        setTimeout(() => {
          window.print();
        }, 700);

      return () =>
        clearTimeout(timer);
    }
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
    <main className="fixed inset-0 z-[999999] bg-white overflow-auto">

      <style jsx global>{`
        html,
        body {
          background: white !important;
          overflow: auto !important;
        }

        #__next,
        main {
          background: white !important;
        }

        aside,
        nav,
        header,
        .sidebar,
        .dashboard-sidebar {
          display: none !important;
        }

        @page {
          size: ${
            paperSize === "K80"
              ? "80mm auto"
              : "A5"
          };
          margin: 6mm;
        }

        @media print {
          body {
            background: white !important;
          }

          .print-box {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        style={{
          margin: "0 auto",
        }}
        className={
          paperSize === "K80"
            ? "print-box bg-white p-3 w-[80mm] text-[11px] text-black"
            : "print-box bg-white w-[136mm] min-h-[190mm] p-[8mm] text-black text-[12px]"
        }
      >

        <div className="text-center">

          <div className="text-[22px] font-bold leading-none">
            {shopName}
          </div>

          <div className="mt-1 text-[11px] flex items-center justify-center gap-1">
            <span>{address}</span>

            <span>|</span>

            <span>
              Hotline: {phone}
            </span>
          </div>

        </div>

        <div className="border-t border border-dashed border-gray-300 mt-1 pt-1 text-center">

          <div className="text-[16px] font-bold">
            {invoiceTitle}
          </div>

          <div className="mt-1 text-[11px] flex items-center justify-center gap-1">
            <span>
              {formatDate(
                order.createdAt
              )}
            </span>

            <span>|</span>

            <span>
              Mã đơn:
              {" "}
              <strong>
                {getOrderCode(
                  order
                )}
              </strong>
            </span>
          </div>

        </div>

        <table className="w-full border-collapse border border border-dashed border-gray-300 mt-3 text-[10px]">

          <thead>

            <tr>

              <th className="border border border-dashed border-gray-300 px-1 py-2 w-[30px]">
                STT
              </th>

              <th className="border border border-dashed border-gray-300 px-2 py-2">
                Sản phẩm
              </th>

              <th className="border border border-dashed border-gray-300 px-1 py-2 w-[40px]">
                SL
              </th>

              <th className="border border border-dashed border-gray-300 px-2 py-2 w-[70px]">
                Giá
              </th>

              <th className="border border border-dashed border-gray-300 px-2 py-2 w-[80px]">
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

                  <td className="border border border-dashed border-gray-300 px-1 py-2 text-center">
                    {index + 1}
                  </td>

                  <td className="border border border-dashed border-gray-300 px-2 py-2">

  <div>
    {getProductName(
      product
    )}
  </div>

  <div className="text-[8px] text-gray-600 mt-[2px]">
    MSP:
    {" "}
    {product.code ||
      product.productCode ||
      product.sku ||
      "---"}
  </div>

</td>

                  <td className="border border border-dashed border-gray-300 px-1 py-2 text-center">
                    {getProductQuantity(
                      product
                    )}
                  </td>

                  <td className="border border border-dashed border-gray-300 px-2 py-2 text-right">
                    {formatMoney(
                      getProductPrice(
                        product
                      )
                    )}
                    đ
                  </td>

                  <td className="border border border-dashed border-gray-300 px-2 py-2 text-right">
                    {formatMoney(
                      getProductTotal(
                        product
                      )
                    )}
                    đ
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

        <div className="flex justify-end mt-3">

          <div className="w-[230px] space-y-[1px] text-[10px]">

            <div className="flex justify-between gap-2">
              <span className="pl-2">
                Tạm tính:
              </span>

              <strong>
                {formatMoney(
                  getSubtotal(
                    order
                  )
                )}
                đ
              </strong>
            </div>

            <div className="flex justify-between gap-2">
              <span className="pl-2">
                VAT:
              </span>

              <strong>
                {formatMoney(
                  getVatAmount(
                    order
                  )
                )}
                đ
              </strong>
            </div>

            <div className="flex justify-between gap-2">
              <span className="pl-2">
                Giảm giá:
              </span>

              <strong>
                {formatMoney(
                  getDiscountAmount(
                    order
                  )
                )}
                đ
              </strong>
            </div>

            <div className="flex justify-between text-[14px] font-bold border-t border-gray-300 pt-1 mt-1">
              <span className="pl-2">
                Tổng cộng:
              </span>

              <span>
                {formatMoney(
                  getGrandTotal(
                    order
                  )
                )}
                đ
              </span>
            </div>

            <div className="flex justify-between gap-2 mt-1">
              <span className="pl-2">
                Khách trả:
              </span>

              <strong>
                {formatMoney(
                  getCustomerPaid(
                    order
                  )
                )}
                đ
              </strong>
            </div>

            <div className="flex justify-between gap-2">
              <span className="pl-2">
                Tiền thừa:
              </span>

              <strong>
                {formatMoney(
                  getChange(order)
                )}
                đ
              </strong>
            </div>

          </div>

        </div>

        <div className="text-center mt-6 space-y-1 text-[11px]">

          <div>
            {thankYouText}
          </div>

          <div>
            {seeYouText}
          </div>

        </div>

      </div>

    </main>
  );
}