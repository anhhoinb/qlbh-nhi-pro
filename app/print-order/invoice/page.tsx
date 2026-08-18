"use client";

import { useEffect, useRef, useState } from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function InvoicePage() {
  const hasPrintedRef =
    useRef(false);

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

  const [shopTaxCode, setShopTaxCode] =
    useState("");

  const [invoiceTitle, setInvoiceTitle] =
    useState("HÓA ĐƠN BÁN HÀNG");

    const [temporaryTitle, setTemporaryTitle] =
  useState("PHIẾU TẠM TÍNH");

const [isTemporary, setIsTemporary] =
  useState(false);

  const [thankYouText, setThankYouText] =
    useState("Cảm ơn quý khách!");

  const [seeYouText, setSeeYouText] =
    useState("Hẹn gặp lại ❤️");

  const [paperSize, setPaperSize] =
    useState("A5");

  const [bodyFontSize, setBodyFontSize] =
    useState(13);

  const [showShopName, setShowShopName] =
    useState(true);

  const [showAddress, setShowAddress] =
    useState(true);

  const [showPhone, setShowPhone] =
    useState(true);

  const [showTaxCode, setShowTaxCode] =
    useState(true);

  const [showTitle, setShowTitle] =
    useState(true);

  const [showDate, setShowDate] =
    useState(true);

  const [showOrderCode, setShowOrderCode] =
    useState(true);

  const [showProductCode, setShowProductCode] =
    useState(true);

  const [showVat, setShowVat] =
    useState(true);

  const [showDiscount, setShowDiscount] =
    useState(true);

  const [showCustomerPaid, setShowCustomerPaid] =
    useState(true);

  const [showChange, setShowChange] =
    useState(true);

  const [showThankYou, setShowThankYou] =
    useState(true);

  const [showSeeYou, setShowSeeYou] =
    useState(true);

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
    product.printName ||
    product.print_name ||
    product.short_name ||
    product.main_name ||
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

  const hasAppliedVat = (item: any) => {
    // Ưu tiên các cờ VAT nếu POS có lưu.
    const explicitFlag =
      item?.applyVat ??
      item?.applyVAT ??
      item?.includeVat ??
      item?.includeVAT ??
      item?.vatEnabled ??
      item?.taxEnabled ??
      item?.withVat ??
      item?.hasVat;

    if (explicitFlag !== undefined && explicitFlag !== null) {
      return explicitFlag === true;
    }

    // Với đơn cũ chưa có cờ VAT: chỉ coi là có tính VAT
    // khi chính đơn hàng đã lưu số tiền VAT > 0.
    return getVatAmount(item) > 0;
  };

  const getVatBreakdown = (
    item: any
  ) => {
    const breakdown = new Map<number, number>();

    getItems(item).forEach((product: any) => {
      const rate = Number(
        product?.tax ??
          product?.vat ??
          product?.vatRate ??
          product?.taxRate ??
          0
      );

      if (!Number.isFinite(rate) || rate <= 0) {
        return;
      }

      const lineSubtotal =
        getProductQuantity(product) *
        getProductPrice(product);

      const vatAmount =
        lineSubtotal * rate / 100;

      breakdown.set(
        rate,
        (breakdown.get(rate) || 0) + vatAmount
      );
    });

    return Array.from(breakdown.entries())
      .map(([rate, amount]) => ({
        rate,
        amount,
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => a.rate - b.rate);
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

const type =
  params.get("type") || "";

const temporary =
  type === "temporary";

const requestedPaper =
  (params.get("paper") || "").toUpperCase();

setIsTemporary(temporary);

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

            setShopTaxCode(
              data.shopTaxCode || data.taxCode || ""
            );

            setInvoiceTitle(
              data.invoiceTitle ||
                "HÓA ĐƠN BÁN HÀNG"
            );

            setTemporaryTitle(
  data.temporaryTitle ||
    "PHIẾU TẠM TÍNH"
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
              requestedPaper === "K80" ||
              requestedPaper === "A5" ||
              requestedPaper === "A4"
                ? requestedPaper
                : data.paperSize || "A5"
            );

            setBodyFontSize(
              Number(data.bodyFontSize) || 13
            );

            setShowShopName(data.showShopName ?? true);
            setShowAddress(data.showAddress ?? true);
            setShowPhone(data.showPhone ?? true);
            setShowTaxCode(data.showTaxCode ?? true);
            setShowTitle(data.showTitle ?? true);
            setShowDate(data.showDate ?? true);
            setShowOrderCode(data.showOrderCode ?? true);
            setShowProductCode(data.showProductCode ?? true);
            setShowVat(data.showVat ?? true);
            setShowDiscount(data.showDiscount ?? true);
            setShowCustomerPaid(data.showCustomerPaid ?? true);
            setShowChange(data.showChange ?? true);
            setShowThankYou(data.showThankYou ?? true);
            setShowSeeYou(data.showSeeYou ?? true);
          }

          if (
            requestedPaper === "K80" ||
            requestedPaper === "A5" ||
            requestedPaper === "A4"
          ) {
            setPaperSize(requestedPaper);
          }

          if (temporary) {
  const savedTemporaryOrder =
    sessionStorage.getItem(
      "temporary_invoice_order"
    );

  if (savedTemporaryOrder) {
    try {
      setOrder(
        JSON.parse(
          savedTemporaryOrder
        )
      );
    } catch {
      setOrder(null);
    }
  } else {
    setOrder(null);
  }

  setLoading(false);
  return;
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
    if (loading || !order) return;

    const params =
      new URLSearchParams(
        window.location.search
      );

    const shouldPrint =
      params.get("print") === "1";

    if (!shouldPrint) return;

    const printWindow =
      window as typeof window & {
        __invoicePrintStarted?: boolean;
      };

    if (
      hasPrintedRef.current ||
      printWindow.__invoicePrintStarted
    ) {
      return;
    }

    hasPrintedRef.current = true;
    printWindow.__invoicePrintStarted = true;

    const handleAfterPrint = () => {
      window.removeEventListener(
        "afterprint",
        handleAfterPrint
      );

      setTimeout(() => {
        try {
          window.close();
        } catch {
          // Trình duyệt có thể chặn đóng tab.
        }

        if (!window.closed) {
          window.history.back();
        }
      }, 100);
    };

    window.addEventListener(
      "afterprint",
      handleAfterPrint
    );

    const timer = window.setTimeout(() => {
      window.print();
    }, 700);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "afterprint",
        handleAfterPrint
      );
    };
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

  const vatBreakdown =
    getVatBreakdown(order);

  const customerName =
    order.customerName ||
    order.customer?.name ||
    "Khách lẻ";

  const customerCompany =
    order.customerCompanyName ||
    order.customer?.companyName ||
    "";

  const customerPhone =
    order.customerPhone ||
    order.customer?.phone ||
    "";

  const customerEmail =
    order.customerEmail ||
    order.customer?.email ||
    "";

  const customerTaxCode =
    order.customerTaxCode ||
    order.customer?.taxCode ||
    "";

  const customerAddress =
    order.customerAddress ||
    order.customer?.address ||
    "";

  const getDisplayProductCode = (product: any) =>
    product.product_code ||
    product.productCode ||
    product.code ||
    product.sku ||
    "---";

  return (
    <main className="print-root min-h-screen bg-white">
      <style>{`
        /*
         * Không cố định @page size.
         * Khổ giấy do người dùng chọn trực tiếp trong Print Preview.
         * Layout tự thay đổi dựa trên chiều rộng vùng in.
         */
        @page {
          margin: 6mm;
        }

        html,
        body {
          background: #fff;
        }

        .invoice-paper {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          color: #000;
          font-family: Arial, sans-serif;
        }

        .invoice-header {
          display: block;
          border-bottom: 2px solid #111;
          padding-bottom: 14px;
          text-align: center;
        }

        .shop-block {
          width: 100%;
          text-align: center;
        }

        .title-block {
          width: 100%;
          text-align: center;
        }

        .shop-name {
          font-size: 28px;
          line-height: 1.1;
          font-weight: 700;
        }

        .invoice-title {
          font-size: 24px;
          line-height: 1.15;
          font-weight: 700;
          text-transform: uppercase;
        }

        .shop-meta,
        .invoice-meta {
          margin-top: 6px;
          font-size: 12px;
          line-height: 1.5;
        }

        .customer-box {
          margin-top: 16px;
          border: 0;
          border-radius: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.55;
        }

        .customer-grid {
          display: block;
        }

        .customer-grid > div {
          margin-top: 3px;
        }

        .customer-address {
          display: block;
        }

        .items-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          margin-top: 18px;
          font-size: 12px;
        }

        .items-table th {
          background: #f1f5f9;
          border: 1px solid #64748b;
          padding: 8px 7px;
          font-weight: 700;
        }

        .items-table td {
          border: 1px solid #cbd5e1;
          padding: 8px 7px;
          vertical-align: top;
        }

        .col-stt { width: 6%; text-align: center; }
        .col-code { width: 14%; }
        .col-name { width: auto; }
        .col-qty { width: 8%; text-align: center; }
        .col-price { width: 16%; text-align: right; }
        .col-total { width: 17%; text-align: right; }

        .summary-wrap {
          display: flex;
          justify-content: flex-end;
          margin-top: 18px;
        }

        .summary {
          width: 340px;
          max-width: 100%;
          font-size: 12px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 4px;
        }

        .summary-total {
          margin-top: 7px;
          padding-top: 7px;
          border-top: 1px solid #475569;
          font-size: 17px;
          font-weight: 700;
        }

        .invoice-footer {
          margin-top: 28px;
          text-align: center;
          font-size: 11px;
          line-height: 1.5;
        }

        .break-all {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-root {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
          }

          .invoice-paper {
            padding: 0;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }
        }

        /*
         * K80: vùng in rất hẹp.
         * Chrome sẽ đánh giá lại media query khi đổi khổ giấy trong Print Preview.
         */
        @media print and (max-width: 110mm) {
          @page {
            margin: 3mm;
          }

          .invoice-paper {
            font-size: ${bodyFontSize}px;
          }

          .invoice-header {
            display: block;
            border-bottom: 1px dashed #111;
            padding-bottom: 7px;
          }

          .shop-block,
          .title-block {
            width: 100%;
            text-align: center;
          }

          .shop-name {
            font-size: 20px;
          }

          .invoice-title {
            margin-top: 5px;
            font-size: 18px;
          }

          .shop-meta,
          .invoice-meta {
            margin-top: 3px;
            font-size: 0.88em;
            line-height: 1.35;
          }

          .customer-box {
            margin-top: 8px;
            border: 0;
            border-radius: 0;
            padding: 0;
            font-size: 0.9em;
            line-height: 1.4;
          }

          .customer-grid {
            display: block;
          }

          .customer-grid > div {
            margin-top: 2px;
          }

          .items-table {
            margin-top: 10px;
            font-size: 0.86em;
          }

          .items-table th,
          .items-table td {
            border-left: 0;
            border-right: 0;
            border-top: 0;
            border-bottom: 1px dashed #999;
            padding: 5px 2px;
          }

          .items-table th {
            background: transparent;
          }

          .col-stt { width: 8%; }
          .col-code { display: none; }
          .col-name { width: 45%; }
          .col-qty { width: 10%; }
          .col-price { width: 17%; }
          .col-total { width: 20%; }

          .summary-wrap {
            margin-top: 9px;
          }

          .summary {
            width: 100%;
            font-size: 0.95em;
          }

          .summary-total {
            font-size: 1.25em;
          }

          .invoice-footer {
            margin-top: 18px;
            font-size: 0.92em;
          }
        }

        /*
         * A5: vùng in trung bình.
         */
        @media print and (min-width: 111mm) and (max-width: 170mm) {
          .invoice-header {
            gap: 16px;
            padding-bottom: 11px;
          }

          .shop-name {
            font-size: 22px;
          }

          .invoice-title {
            font-size: 18px;
          }

          .shop-meta,
          .invoice-meta,
          .customer-box,
          .items-table,
          .summary {
            font-size: 10px;
          }

          .customer-box {
            margin-top: 12px;
            padding: 0;
          }

          .customer-grid {
            display: block;
          }

          .items-table {
            margin-top: 13px;
          }

          .items-table th,
          .items-table td {
            padding: 6px 5px;
          }

          .col-stt { width: 7%; }
          .col-code { width: 15%; }
          .col-qty { width: 9%; }
          .col-price { width: 17%; }
          .col-total { width: 19%; }

          .summary-wrap {
            margin-top: 13px;
          }

          .summary {
            width: 260px;
          }

          .summary-total {
            font-size: 14px;
          }

          .invoice-footer {
            margin-top: 22px;
            font-size: 10px;
          }
        }

        /*
         * A4 trở lên dùng layout rộng mặc định.
         */
        @media print and (min-width: 171mm) {
          .invoice-paper {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="invoice-paper">
        {(showShopName ||
          showAddress ||
          showPhone ||
          showTaxCode ||
          showTitle ||
          showDate ||
          showOrderCode) && (
          <div className="invoice-header">
            <div className="shop-block">
              {showShopName && (
                <div className="shop-name">
                  {shopName}
                </div>
              )}

              {(showAddress || showPhone || showTaxCode) && (
                <div className="shop-meta">
                  {showAddress && (
                    <div className="whitespace-pre-line">
                      {address}
                    </div>
                  )}

                  {(showPhone || showTaxCode) && (
                    <div>
                      {showPhone && (
                        <span>Hotline: {phone}</span>
                      )}
                      {showPhone && showTaxCode && (
                        <span> | </span>
                      )}
                      {showTaxCode && (
                        <span>
                          MST: {shopTaxCode || "---"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="title-block">
              {showTitle && (
                <div className="invoice-title">
                  {isTemporary
                    ? temporaryTitle
                    : invoiceTitle}
                </div>
              )}

              {(showDate || showOrderCode) && (
                <div className="invoice-meta">
                  {showOrderCode && (
                    <span>
                      Mã đơn:{" "}
                      <strong>
                        {getOrderCode(order)}
                      </strong>
                    </span>
                  )}

                  {showOrderCode && showDate && (
                    <span> | </span>
                  )}

                  {showDate && (
                    <span>
                      {formatDate(order.createdAt)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(customerName ||
          customerPhone ||
          customerCompany ||
          customerTaxCode ||
          customerEmail ||
          customerAddress) && (
          <div className="customer-box">
            <div className="customer-grid">
              <div>
                - <strong>Khách hàng:</strong>{" "}
                {customerName}
              </div>

              {customerPhone && (
                <div>
                  - <strong>Điện thoại:</strong>{" "}
                  {customerPhone}
                </div>
              )}

              {customerCompany && (
                <div>
                  - <strong>Công ty:</strong>{" "}
                  {customerCompany}
                </div>
              )}

              {customerTaxCode && (
                <div>
                  - <strong>MST:</strong>{" "}
                  {customerTaxCode}
                </div>
              )}

              {customerEmail && (
                <div className="break-all">
                  - <strong>Email:</strong>{" "}
                  {customerEmail}
                </div>
              )}

              {customerAddress && (
                <div className="customer-address">
                  - <strong>Địa chỉ:</strong>{" "}
                  {customerAddress}
                </div>
              )}
            </div>
          </div>
        )}

        <table className="items-table">
          <thead>
            <tr>
              <th className="col-stt">STT</th>

              {showProductCode && (
                <th className="col-code">
                  Mã SP
                </th>
              )}

              <th className="col-name">
                Sản phẩm
              </th>

              <th className="col-qty">
                SL
              </th>

              <th className="col-price">
                Đơn giá
              </th>

              <th className="col-total">
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
                  <td className="col-stt">
                    {index + 1}
                  </td>

                  {showProductCode && (
                    <td className="col-code break-all">
                      {getDisplayProductCode(
                        product
                      )}
                    </td>
                  )}

                  <td className="col-name break-all">
                    {getProductName(product)}
                  </td>

                  <td className="col-qty">
                    {getProductQuantity(
                      product
                    )}
                  </td>

                  <td className="col-price">
                    {formatMoney(
                      getProductPrice(
                        product
                      )
                    )}
                    đ
                  </td>

                  <td className="col-total">
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

        <div className="summary-wrap">
          <div className="summary">
            <div className="summary-row">
              <span>Tạm tính:</span>
              <strong>
                {formatMoney(
                  getSubtotal(order)
                )}
                đ
              </strong>
            </div>

            {showVat &&
              hasAppliedVat(order) &&
              vatBreakdown.map(
                ({ rate, amount }) => (
                  <div
                    key={rate}
                    className="summary-row"
                  >
                    <span>
                      VAT ({rate}%):
                    </span>
                    <strong>
                      {formatMoney(amount)}đ
                    </strong>
                  </div>
                )
              )}

            {showDiscount && (
              <div className="summary-row">
                <span>Giảm giá:</span>
                <strong>
                  {formatMoney(
                    getDiscountAmount(order)
                  )}
                  đ
                </strong>
              </div>
            )}

            <div className="summary-row summary-total">
              <span>Tổng cộng:</span>
              <span>
                {formatMoney(
                  getGrandTotal(order)
                )}
                đ
              </span>
            </div>

            {!isTemporary &&
              showCustomerPaid && (
                <div className="summary-row">
                  <span>Khách trả:</span>
                  <strong>
                    {formatMoney(
                      getCustomerPaid(order)
                    )}
                    đ
                  </strong>
                </div>
              )}

            {!isTemporary &&
              showChange && (
                <div className="summary-row">
                  <span>Tiền thừa:</span>
                  <strong>
                    {formatMoney(
                      getChange(order)
                    )}
                    đ
                  </strong>
                </div>
              )}
          </div>
        </div>

        {(showThankYou || showSeeYou) && (
          <div className="invoice-footer">
            {showThankYou && (
              <div className="whitespace-pre-line">
                {thankYouText}
              </div>
            )}

            {showSeeYou && (
              <div className="whitespace-pre-line">
                {seeYouText}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}