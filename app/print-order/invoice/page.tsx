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

  const productCode = (product: any) =>
    product.product_code ||
    product.productCode ||
    product.code ||
    product.sku ||
    "---";

  const summaryBlock = (
    size: "K80" | "A5" | "A4"
  ) => (
    <div
      className={
        size === "K80"
          ? "w-full space-y-1 text-[1em]"
          : size === "A4"
          ? "ml-auto w-[340px] space-y-1 text-[12px]"
          : "ml-auto w-[260px] space-y-1 text-[11px]"
      }
    >
      <div className="flex justify-between gap-3">
        <span>Tạm tính:</span>
        <strong>{formatMoney(getSubtotal(order))}đ</strong>
      </div>

      {showVat &&
        hasAppliedVat(order) &&
        vatBreakdown.map(({ rate, amount }) => (
          <div
            key={rate}
            className="flex justify-between gap-3"
          >
            <span>VAT ({rate}%):</span>
            <strong>{formatMoney(amount)}đ</strong>
          </div>
        ))}

      {showDiscount && (
        <div className="flex justify-between gap-3">
          <span>Giảm giá:</span>
          <strong>
            {formatMoney(getDiscountAmount(order))}đ
          </strong>
        </div>
      )}

      <div
        className={
          size === "K80"
            ? "mt-1 flex justify-between gap-3 border-t border-black pt-1 text-[1.25em] font-bold"
            : size === "A4"
            ? "mt-2 flex justify-between gap-3 border-t border-slate-500 pt-2 text-[17px] font-bold"
            : "mt-2 flex justify-between gap-3 border-t border-slate-500 pt-2 text-[14px] font-bold"
        }
      >
        <span>Tổng cộng:</span>
        <span>{formatMoney(getGrandTotal(order))}đ</span>
      </div>

      {!isTemporary && showCustomerPaid && (
        <div className="flex justify-between gap-3">
          <span>Khách trả:</span>
          <strong>{formatMoney(getCustomerPaid(order))}đ</strong>
        </div>
      )}

      {!isTemporary && showChange && (
        <div className="flex justify-between gap-3">
          <span>Tiền thừa:</span>
          <strong>{formatMoney(getChange(order))}đ</strong>
        </div>
      )}
    </div>
  );

  const footerBlock = (compact = false) =>
    (showThankYou || showSeeYou) ? (
      <div
        className={
          compact
            ? "mt-5 space-y-1 text-center text-[1em]"
            : "mt-8 space-y-1 text-center text-[11px]"
        }
      >
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
    ) : null;

  const K80Template = () => (
    <div
      className="print-template print-k80 mx-auto box-border w-[80mm] bg-white p-[3mm] text-black leading-[1.35]"
      style={{ fontSize: `${bodyFontSize}px` }}
    >
      {(showShopName || showAddress || showPhone || showTaxCode) && (
        <div className="text-center">
          {showShopName && (
            <div className="text-[20px] font-bold leading-tight">
              {shopName}
            </div>
          )}

          <div className="mt-1 text-[0.92em] leading-[1.35]">
            {showAddress && (
              <div className="whitespace-pre-line">{address}</div>
            )}
            {(showPhone || showTaxCode) && (
              <div>
                {showPhone && <span>Hotline: {phone}</span>}
                {showPhone && showTaxCode && <span> | </span>}
                {showTaxCode && (
                  <span>MST: {shopTaxCode || "---"}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {(showTitle || showDate || showOrderCode) && (
        <div className="mt-2 border-y border-dashed border-black py-2 text-center">
          {showTitle && (
            <div className="text-[18px] font-bold">
              {isTemporary ? temporaryTitle : invoiceTitle}
            </div>
          )}

          {(showDate || showOrderCode) && (
            <div className="mt-1 text-[0.88em]">
              {showDate && <span>{formatDate(order.createdAt)}</span>}
              {showDate && showOrderCode && <span> | </span>}
              {showOrderCode && (
                <span>
                  Mã đơn: <strong>{getOrderCode(order)}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {(customerName ||
        customerPhone ||
        customerCompany ||
        customerTaxCode ||
        customerEmail ||
        customerAddress) && (
        <div className="mt-2 text-[0.92em] leading-[1.4]">
          <div>
            <strong>Khách hàng:</strong> {customerName}
          </div>
          {customerCompany && (
            <div><strong>Công ty:</strong> {customerCompany}</div>
          )}
          {customerPhone && (
            <div><strong>Điện thoại:</strong> {customerPhone}</div>
          )}
          {customerTaxCode && (
            <div><strong>MST:</strong> {customerTaxCode}</div>
          )}
          {customerEmail && (
            <div className="break-all">
              <strong>Email:</strong> {customerEmail}
            </div>
          )}
          {customerAddress && (
            <div><strong>Địa chỉ:</strong> {customerAddress}</div>
          )}
        </div>
      )}

      <table className="mt-3 w-full table-fixed border-collapse text-[0.88em]">
        <thead className="border-y border-dashed border-black">
          <tr>
            <th className="w-[8%] py-1 text-center">STT</th>
            <th className="w-[46%] py-1 text-left">Sản phẩm</th>
            <th className="w-[10%] py-1 text-center">SL</th>
            <th className="w-[17%] py-1 text-right">Giá</th>
            <th className="w-[19%] py-1 text-right">T.Tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product: any, index: number) => (
            <tr
              key={index}
              className="border-b border-dashed border-gray-400"
            >
              <td className="px-1 py-1.5 text-center align-top">
                {index + 1}
              </td>
              <td className="px-1 py-1.5 align-top break-words">
                <div>{getProductName(product)}</div>
                {showProductCode && (
                  <div className="mt-0.5 text-[0.82em] text-gray-600">
                    MSP: {productCode(product)}
                  </div>
                )}
              </td>
              <td className="px-1 py-1.5 text-center align-top">
                {getProductQuantity(product)}
              </td>
              <td className="px-1 py-1.5 text-right align-top whitespace-nowrap">
                {formatMoney(getProductPrice(product))}
              </td>
              <td className="px-1 py-1.5 text-right align-top whitespace-nowrap">
                {formatMoney(getProductTotal(product))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3">{summaryBlock("K80")}</div>
      {footerBlock(true)}
    </div>
  );

  const A5Template = () => (
    <div className="print-template print-a5 mx-auto box-border w-[148mm] min-h-[210mm] bg-white px-[8mm] py-[7mm] text-black">
      <div className="flex items-start justify-between gap-5 border-b-2 border-slate-700 pb-4">
        <div className="max-w-[58%]">
          {showShopName && (
            <div className="text-[22px] font-bold leading-tight">
              {shopName}
            </div>
          )}
          <div className="mt-1 text-[10px] leading-[1.45] text-slate-700">
            {showAddress && (
              <div className="whitespace-pre-line">{address}</div>
            )}
            {showPhone && <div>Hotline: {phone}</div>}
            {showTaxCode && (
              <div>MST: {shopTaxCode || "---"}</div>
            )}
          </div>
        </div>

        <div className="min-w-[42%] text-right">
          {showTitle && (
            <div className="text-[18px] font-bold uppercase">
              {isTemporary ? temporaryTitle : invoiceTitle}
            </div>
          )}
          <div className="mt-1 text-[10px] leading-[1.45]">
            {showOrderCode && (
              <div>
                Mã đơn: <strong>{getOrderCode(order)}</strong>
              </div>
            )}
            {showDate && <div>{formatDate(order.createdAt)}</div>}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded border border-slate-300 p-3 text-[10px] leading-[1.5]">
        <div className="grid grid-cols-2 gap-x-5 gap-y-1">
          <div><strong>Khách hàng:</strong> {customerName}</div>
          {customerPhone && (
            <div><strong>Điện thoại:</strong> {customerPhone}</div>
          )}
          {customerCompany && (
            <div><strong>Công ty:</strong> {customerCompany}</div>
          )}
          {customerTaxCode && (
            <div><strong>MST:</strong> {customerTaxCode}</div>
          )}
          {customerEmail && (
            <div className="break-all">
              <strong>Email:</strong> {customerEmail}
            </div>
          )}
          {customerAddress && (
            <div className="col-span-2">
              <strong>Địa chỉ:</strong> {customerAddress}
            </div>
          )}
        </div>
      </div>

      <table className="mt-4 w-full table-fixed border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="w-[7%] border border-slate-400 px-2 py-2 text-center">STT</th>
            {showProductCode && (
              <th className="w-[15%] border border-slate-400 px-2 py-2 text-left">Mã SP</th>
            )}
            <th className="border border-slate-400 px-2 py-2 text-left">Sản phẩm</th>
            <th className="w-[9%] border border-slate-400 px-2 py-2 text-center">SL</th>
            <th className="w-[17%] border border-slate-400 px-2 py-2 text-right">Đơn giá</th>
            <th className="w-[19%] border border-slate-400 px-2 py-2 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product: any, index: number) => (
            <tr key={index}>
              <td className="border border-slate-300 px-2 py-2 text-center align-top">
                {index + 1}
              </td>
              {showProductCode && (
                <td className="border border-slate-300 px-2 py-2 align-top break-words">
                  {productCode(product)}
                </td>
              )}
              <td className="border border-slate-300 px-2 py-2 align-top break-words">
                {getProductName(product)}
              </td>
              <td className="border border-slate-300 px-2 py-2 text-center align-top">
                {getProductQuantity(product)}
              </td>
              <td className="border border-slate-300 px-2 py-2 text-right align-top whitespace-nowrap">
                {formatMoney(getProductPrice(product))}đ
              </td>
              <td className="border border-slate-300 px-2 py-2 text-right align-top whitespace-nowrap">
                {formatMoney(getProductTotal(product))}đ
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">{summaryBlock("A5")}</div>
      {footerBlock(false)}
    </div>
  );

  const A4Template = () => (
    <div className="print-template print-a4 mx-auto box-border w-[210mm] min-h-[297mm] bg-white px-[12mm] py-[10mm] text-black">
      <div className="flex items-start justify-between gap-8 border-b-2 border-black pb-5">
        <div className="max-w-[58%]">
          {showShopName && (
            <div className="text-[28px] font-bold leading-tight">
              {shopName}
            </div>
          )}
          <div className="mt-2 text-[12px] leading-[1.55]">
            {showAddress && (
              <div className="whitespace-pre-line">{address}</div>
            )}
            {(showPhone || showTaxCode) && (
              <div>
                {showPhone && <span>Hotline: {phone}</span>}
                {showPhone && showTaxCode && <span> | </span>}
                {showTaxCode && (
                  <span>MST: {shopTaxCode || "---"}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-[40%] text-right">
          {showTitle && (
            <div className="text-[24px] font-bold uppercase">
              {isTemporary ? temporaryTitle : invoiceTitle}
            </div>
          )}
          <div className="mt-2 text-[12px] leading-[1.55]">
            {showOrderCode && (
              <div>
                Mã đơn: <strong>{getOrderCode(order)}</strong>
              </div>
            )}
            {showDate && <div>Ngày: {formatDate(order.createdAt)}</div>}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-slate-400 p-4 text-[12px] leading-[1.6]">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <div><strong>Khách hàng:</strong> {customerName}</div>
          {customerPhone && (
            <div><strong>Điện thoại:</strong> {customerPhone}</div>
          )}
          {customerCompany && (
            <div><strong>Công ty:</strong> {customerCompany}</div>
          )}
          {customerTaxCode && (
            <div><strong>MST:</strong> {customerTaxCode}</div>
          )}
          {customerEmail && (
            <div className="break-all">
              <strong>Email:</strong> {customerEmail}
            </div>
          )}
          {customerAddress && (
            <div className="col-span-2">
              <strong>Địa chỉ:</strong> {customerAddress}
            </div>
          )}
        </div>
      </div>

      <table className="mt-5 w-full table-fixed border-collapse text-[12px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="w-[6%] border border-slate-500 px-3 py-2.5 text-center">STT</th>
            {showProductCode && (
              <th className="w-[14%] border border-slate-500 px-3 py-2.5 text-left">Mã SP</th>
            )}
            <th className="border border-slate-500 px-3 py-2.5 text-left">Tên sản phẩm</th>
            <th className="w-[8%] border border-slate-500 px-3 py-2.5 text-center">SL</th>
            <th className="w-[16%] border border-slate-500 px-3 py-2.5 text-right">Đơn giá</th>
            <th className="w-[17%] border border-slate-500 px-3 py-2.5 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product: any, index: number) => (
            <tr key={index}>
              <td className="border border-slate-300 px-3 py-2.5 text-center align-top">
                {index + 1}
              </td>
              {showProductCode && (
                <td className="border border-slate-300 px-3 py-2.5 align-top break-words">
                  {productCode(product)}
                </td>
              )}
              <td className="border border-slate-300 px-3 py-2.5 align-top break-words">
                {getProductName(product)}
              </td>
              <td className="border border-slate-300 px-3 py-2.5 text-center align-top">
                {getProductQuantity(product)}
              </td>
              <td className="border border-slate-300 px-3 py-2.5 text-right align-top whitespace-nowrap">
                {formatMoney(getProductPrice(product))}đ
              </td>
              <td className="border border-slate-300 px-3 py-2.5 text-right align-top whitespace-nowrap">
                {formatMoney(getProductTotal(product))}đ
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5">{summaryBlock("A4")}</div>
      {footerBlock(false)}
    </div>
  );

  return (
    <main className="min-h-screen bg-white">
      <style>{`
        @page {
          size: ${
            paperSize === "K80"
              ? "80mm auto"
              : paperSize === "A4"
              ? "A4 portrait"
              : "A5 portrait"
          };
          margin: 0;
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

          main {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            background: #fff !important;
          }

          .print-template {
            box-shadow: none !important;
          }

          .print-k80 {
            width: 80mm !important;
            max-width: 80mm !important;
            min-height: 0 !important;
            margin: 0 auto !important;
            padding: 3mm !important;
          }

          .print-a5 {
            width: 148mm !important;
            min-height: 210mm !important;
            margin: 0 auto !important;
            padding: 7mm 8mm !important;
          }

          .print-a4 {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            padding: 10mm 12mm !important;
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

        @media screen {
          .print-k80,
          .print-a5,
          .print-a4 {
            box-shadow: 0 1px 10px rgba(0, 0, 0, 0.08);
          }
        }
      `}</style>

      {paperSize === "K80" ? (
        <K80Template />
      ) : paperSize === "A4" ? (
        <A4Template />
      ) : (
        <A5Template />
      )}
    </main>
  );
}