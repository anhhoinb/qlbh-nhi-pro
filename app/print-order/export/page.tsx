"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function PrintOrderPage() {

  const [loading, setLoading] =
    useState(true);

  const [order, setOrder] =
    useState<any>(null);

  const [shopName, setShopName] =
    useState("NhiPro23");

  const [shopAddress, setShopAddress] =
    useState("");

  const [shopPhone, setShopPhone] =
    useState("");

  const [shopTaxCode, setShopTaxCode] =
    useState("");

  const [showAddress, setShowAddress] =
    useState(true);

  const [showPhone, setShowPhone] =
    useState(true);

  const [showTaxCode, setShowTaxCode] =
    useState(true);

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

  const formatMoney = (
    value: any
  ) => {

    return Number(
      value || 0
    ).toLocaleString("vi-VN");
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

  const getCustomerName = (item: any) => {
    const customer =
      typeof item?.customer === "object" && item.customer
        ? item.customer
        : {};

    return (
      customer.name ||
      customer.fullName ||
      customer.full_name ||
      (typeof item?.customer_name === "string"
        ? item.customer_name
        : "") ||
      item?.customerName ||
      "Khách lẻ"
    );
  };

  const getCustomerBuyerName = (item: any) => {
    const customer =
      typeof item?.customer === "object" && item.customer
        ? item.customer
        : {};

    return (
      customer.buyerName ||
      customer.buyer_name ||
      customer.contactName ||
      customer.contact_name ||
      customer.representative ||
      item?.buyerName ||
      item?.buyer_name ||
      item?.contactName ||
      item?.contact_name ||
      item?.customerBuyerName ||
      item?.customer_buyer_name ||
      ""
    );
  };

  const getCustomerPhone = (item: any) => {
    const customer =
      typeof item?.customer === "object" && item.customer
        ? item.customer
        : {};

    return (
      customer.phone ||
      customer.phoneNumber ||
      customer.tel ||
      item?.customer_phone ||
      item?.customerPhone ||
      item?.phone ||
      ""
    );
  };

  const getCustomerAddress = (item: any) => {
    const customer =
      typeof item?.customer === "object" && item.customer
        ? item.customer
        : {};

    return (
      customer.address ||
      item?.customer_address ||
      item?.customerAddress ||
      item?.address ||
      ""
    );
  };

  const getCustomerCompanyName = (item: any) => {
    const customer =
      typeof item?.customer === "object" && item.customer
        ? item.customer
        : {};

    return (
      customer.companyName ||
      customer.company_name ||
      customer.company ||
      customer.companyTitle ||
      item?.companyName ||
      item?.company_name ||
      item?.customerCompanyName ||
      item?.customer_company_name ||
      item?.company ||
      ""
    );
  };

  const getCustomerTaxCode = (item: any) => {
    const customer =
      typeof item?.customer === "object" && item.customer
        ? item.customer
        : {};

    return (
      customer.taxCode ||
      customer.tax_code ||
      customer.taxId ||
      customer.mst ||
      item?.taxCode ||
      item?.tax_code ||
      item?.taxId ||
      item?.mst ||
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
      getProductQuantity(product) *
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

          const orderId =
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

            setShopAddress(
              data.address || ""
            );

            setShopPhone(
              data.phone || ""
            );

            setShopTaxCode(
              data.taxCode || ""
            );

            setShowAddress(
              data.showAddress ?? true
            );

            setShowPhone(
              data.showPhone ?? true
            );

            setShowTaxCode(
              data.showTaxCode ?? true
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
          }

          if (!orderId) {

            setOrder(null);

            return;
          }

          const orderRef =
            doc(
              db,
              "orders",
              orderId
            );

          const orderSnap =
            await getDoc(
              orderRef
            );

          if (
            orderSnap.exists()
          ) {

            setOrder({
              id: orderSnap.id,
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

  // Tạm tính = tổng tiền hàng trước VAT
  const subtotal = items.reduce(
    (sum: number, product: any) =>
      sum + getProductTotal(product),
    0
  );

  // VAT = tổng thanh toán - tiền hàng.
  // Cách này giữ đúng số tiền thực tế của đơn hàng,
  // kể cả khi mỗi sản phẩm có mức VAT khác nhau.
  const vatAmount = Math.max(
    0,
    getGrandTotal(order) - subtotal
  );

  // Chỉ hiển thị VAT trên phiếu xuất kho khi đơn hàng thực tế có tính VAT.
  // Không dựa vào VAT mặc định của sản phẩm vì đơn bán có thể chọn "Chưa VAT".
  const hasVat = vatAmount > 0;

  return (

    <main className="fixed inset-0 z-[999999] bg-white overflow-auto">

      <style jsx global>{`
        html,
        body {
          background: white !important;
          margin: 0 !important;
          overflow: auto !important;
        }

        aside,
        nav,
        header,
        .sidebar,
        .dashboard-sidebar {
          display: none !important;
        }

        @page {
          margin: 8mm;
        }

        @media print {
          body {
            background: white !important;
          }

          .print-box {
            box-shadow: none !important;
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }

          .print-box table {
            width: 100% !important;
          }
        }
      `}</style>

      <div className="print-box bg-white w-full max-w-[194mm] mx-auto px-[5mm] py-[7mm] text-black">

        <div className="flex justify-between items-start text-[11px] leading-4">

          <div>

            <div>
              <strong>
                Đơn vị:
              </strong>{" "}
              {shopName}
              <div className="mt-1 space-y-0.5 text-[0.9em]">
                {showAddress && shopAddress && <div><strong>Địa chỉ:</strong> {shopAddress}</div>}
                {showPhone && shopPhone && <div><strong>Điện thoại:</strong> {shopPhone}</div>}
                {showTaxCode && shopTaxCode && <div><strong>MST:</strong> {shopTaxCode}</div>}
              </div>
            </div>

            <div className="mt-1">
              <strong>
                Bộ phận:
              </strong>{" "}
              {department}
            </div>

          </div>

          <div className="text-center text-[10px]">

            <div className="font-bold">
              Mẫu số 02 - VT
            </div>

            <div>
              (Ban hành theo TT200)
            </div>

          </div>

        </div>

        <div className="text-center mt-5">

          <div className="text-[20px] font-bold">
            {warehouseTitle}
          </div>

          <div className="mt-1 text-[10px] flex justify-center gap-2">

            <span>
              {String(
                new Date().getDate()
              ).padStart(2, "0")}
              -
              {String(
                new Date().getMonth() + 1
              ).padStart(2, "0")}
              -
              {new Date().getFullYear()}
            </span>

            <span>|</span>

            <span>
              Mã đơn:
              {" "}
              <strong>
                {getOrderCode(order)}
              </strong>
            </span>

          </div>

        </div>

        <div className="mt-3 flex justify-center">

          <div className="w-full flex justify-between text-[11px] leading-5">

            <div className="space-y-[2px]">

              <div className="flex gap-2">
                <span>
                  Khách hàng:
                </span>

                <strong>
                  {getCustomerCompanyName(order) ||
                    getCustomerName(order) ||
                    receiver}
                </strong>
              </div>

              {getCustomerBuyerName(order) && (
                <div className="flex gap-2">
                  <span>
                    Người nhận:
                  </span>

                  <strong>
                    {getCustomerBuyerName(order)}
                  </strong>
                </div>
              )}

              {getCustomerPhone(order) && (
                <div className="flex gap-2">
                  <span>
                    Điện thoại:
                  </span>

                  <strong>
                    {getCustomerPhone(order)}
                  </strong>
                </div>
              )}

              {getCustomerAddress(order) && (
                <div className="flex gap-2">
                  <span>
                    Địa chỉ:
                  </span>

                  <strong>
                    {getCustomerAddress(order)}
                  </strong>
                </div>
              )}

              {getCustomerTaxCode(order) && (
                <div className="flex gap-2">
                  <span>
                    MST:
                  </span>

                  <strong>
                    {getCustomerTaxCode(order)}
                  </strong>
                </div>
              )}

            </div>

            <div className="space-y-[2px] text-right">

              <div className="flex gap-2 justify-end">
                <span>
                  Lý do xuất kho:
                </span>

                <strong>
                  {reason}
                </strong>
              </div>

              <div className="flex gap-2 justify-end">
                <span>
                  Xuất tại kho:
                </span>

                <strong>
                  {exportPlace}
                </strong>
              </div>

            </div>

          </div>

        </div>

        <table className="w-full border-collapse border border-gray-300 mt-3 text-[11px]">

          <thead>

            <tr>

              <th className="border border-gray-400 p-1 w-[38px]">
                STT
              </th>

              <th className="border border-gray-400 p-1 min-w-[220px]">
                Tên hàng hóa
              </th>

              <th className="border border-gray-400 p-1 w-[45px]">
                ĐVT
              </th>

              <th className="border border-gray-400 p-1 w-[40px]">
                SL
              </th>

              <th className="border border-gray-400 p-1 w-[80px]">
                Đơn giá
              </th>

              <th className="border border-gray-400 p-1 w-[38px]">
                VAT
              </th>

              <th className="border border-gray-400 p-1 w-[90px]">
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

                <tr key={index}>

                  <td className="border border-gray-400 p-1 text-center">
                    {index + 1}
                  </td>

                  <td className="border border-gray-400 p-1 align-top">

                    <div className="leading-4 break-words">
                      {getProductName(product)}
                    </div>

                    <div className="text-[7px] text-gray-500 mt-[1px] leading-3">
                      MSP:
                      {" "}
                      {product.code ||
                        product.productCode ||
                        product.sku ||
                        "---"}
                    </div>

                  </td>

                  <td className="border border-gray-400 p-1 text-center">
                    {getProductUnit(product)}
                  </td>

                  <td className="border border-gray-400 p-1 text-center">
                    {getProductQuantity(product)}
                  </td>

                  <td className="border border-gray-400 p-1 text-right">
                    {formatMoney(
                      getProductPrice(product)
                    )}
                  </td>

                  <td className="border border-gray-400 p-1 text-center text-[10px]">
                    {hasVat
                      ? `${Number(
                          product.vat ??
                            product.tax ??
                            0
                        )}%`
                      : ""}
                  </td>

                  <td className="border border-gray-400 p-1 text-right">
                    {formatMoney(
                      getProductTotal(product)
                    )}
                  </td>

                </tr>
              )
            )}

            <tr>

              <td
                colSpan={6}
                className="border border-gray-400 p-1 text-right"
              >
                Tạm tính
              </td>

              <td className="border border-gray-400 p-1 text-right">
                {formatMoney(subtotal)}
              </td>

            </tr>

            {hasVat && (
              <tr>
                <td
                  colSpan={6}
                  className="border border-gray-400 p-1 text-right"
                >
                  VAT
                </td>

                <td className="border border-gray-400 p-1 text-right">
                  {formatMoney(vatAmount)}
                </td>
              </tr>
            )}

            <tr>

              <td
                colSpan={6}
                className="border border-gray-400 p-1 text-right font-bold"
              >
                Tổng cộng
              </td>

              <td className="border border-gray-400 p-1 text-right font-bold">
                {formatMoney(
                  getGrandTotal(order)
                )}
              </td>

            </tr>

          </tbody>

        </table>

        <div className="grid grid-cols-5 gap-2 text-center mt-12 text-[11px]">

          <div>
            <div className="font-bold">
              Người lập phiếu
            </div>

            <div className="italic text-[10px]">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Người nhận hàng
            </div>

            <div className="italic text-[10px]">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Thủ kho
            </div>

            <div className="italic text-[10px]">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Kế toán
            </div>

            <div className="italic text-[10px]">
              (Ký, họ tên)
            </div>
          </div>

          <div>
            <div className="font-bold">
              Giám đốc
            </div>

            <div className="italic text-[10px]">
              (Ký, họ tên)
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}