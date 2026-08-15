"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function PrintTemplatePage() {
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

  const [thankYouText, setThankYouText] =
    useState("Cảm ơn quý khách!");

  const [seeYouText, setSeeYouText] =
    useState("Hẹn gặp lại ❤️");

  const [paperSize, setPaperSize] =
    useState("A5");

  const [bodyFontSize, setBodyFontSize] =
    useState(13);

  const [editingTemplate, setEditingTemplate] =
    useState<"invoice" | "temporary" | null>(null);

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

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadTemplate =
      async () => {
        try {
          const ref =
            doc(
              db,
              "settings",
              "print_template"
            );

          const snap =
            await getDoc(ref);

          if (snap.exists()) {
            const data: any =
              snap.data();

            setShopName(
              data.shopName || "NhiPro23"
            );

            setAddress(
              data.address || "TP.HCM"
            );

            setPhone(
              data.phone || "0900 000 000"
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
              data.paperSize || "A5"
            );

            setBodyFontSize(
              Number(data.bodyFontSize) || 13
            );

            setShowShopName(
              data.showShopName ?? true
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

            setShowTitle(
              data.showTitle ?? true
            );

            setShowDate(
              data.showDate ?? true
            );

            setShowOrderCode(
              data.showOrderCode ?? true
            );

            setShowProductCode(
              data.showProductCode ?? true
            );

            setShowVat(
              data.showVat ?? true
            );

            setShowDiscount(
              data.showDiscount ?? true
            );

            setShowCustomerPaid(
              data.showCustomerPaid ?? true
            );

            setShowChange(
              data.showChange ?? true
            );

            setShowThankYou(
              data.showThankYou ?? true
            );

            setShowSeeYou(
              data.showSeeYou ?? true
            );
          }
        } catch (error) {
          console.log(error);

          alert(
            "Không tải được mẫu in"
          );
        }

        setLoading(false);
      };

    loadTemplate();
  }, []);

  const saveTemplate =
    async () => {
      try {
        await setDoc(
          doc(
            db,
            "settings",
            "print_template"
          ),
          {
            shopName:
              shopName.trim(),

            address:
              address.trim(),

            phone:
              phone.trim(),

            shopTaxCode:
              shopTaxCode.trim(),

            invoiceTitle:
              invoiceTitle.trim(),

            temporaryTitle:
              temporaryTitle.trim(),

            thankYouText:
              thankYouText.trim(),

            seeYouText:
              seeYouText.trim(),

            paperSize:
              paperSize || "A5",

            bodyFontSize,

            showShopName,
            showAddress,
            showPhone,
            showTaxCode,
            showTitle,
            showDate,
            showOrderCode,
            showProductCode,
            showVat,
            showDiscount,
            showCustomerPaid,
            showChange,
            showThankYou,
            showSeeYou: false,

            updatedAt:
              new Date(),
          },
          {
            merge: true,
          }
        );

        alert(
          "Đã lưu mẫu in"
        );
      } catch (error) {
        console.log(error);

        alert(
          "Lưu mẫu in thất bại"
        );
      }
    };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const printTestTemplate =
    () => {
      const printWindow =
        window.open(
          "",
          "_blank",
          "width=900,height=900"
        );

      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>In thử mẫu</title>

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                padding: 20px;
                background: #f3f4f6;
                font-family: Arial, sans-serif;

                display: flex;
                justify-content: center;
              }

              .page {
                width: ${
                  paperSize === "K80"
                    ? "80mm"
                    : "148mm"
                };

                background: white;

                padding: 18px;
                color: #000;
                font-size: 14px;
              }

              .center {
                text-align: center;
              }

              .shop-name {
                font-size: 28px;
                font-weight: bold;
              }

              .title {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 18px 0;
              }

              .divider {
                border-top: 1px dashed #999;
                margin: 12px 0;
              }

              .line {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                margin: 7px 0;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }

              th {
                text-align: left;
                padding: 8px 0;
                border-bottom: 1px dashed #ccc;
              }

              td {
                padding: 8px 0;
                border-bottom: 1px dashed #eee;
              }

              .footer {
                margin-top: 18px;
                text-align: center;
                line-height: 1.8;
              }

              .multiline {
                white-space: pre-line;
                overflow-wrap: anywhere;
              }
            </style>
          </head>

          <body>
            <div class="page">

              <div class="center">
                ${
                  showShopName
                    ? `<div class="shop-name">${escapeHtml(shopName)}</div>`
                    : ""
                }

                ${
                  showAddress
                    ? `<div>${escapeHtml(address)}</div>`
                    : ""
                }

                ${
                  showPhone
                    ? `<div>Hotline: ${escapeHtml(phone)}</div>`
                    : ""
                }
              </div>

              <div class="divider"></div>

              ${
                showTitle
                  ? `<div class="title">${escapeHtml(invoiceTitle)}</div>`
                  : ""
              }

              ${
                showOrderCode
                  ? `<div class="line"><span>Mã đơn:</span><strong>DH0001</strong></div>`
                  : ""
              }

              <div class="line">
                <span>Khách hàng:</span>
                <strong>Khách lẻ</strong>
              </div>

              ${
                showDate
                  ? `<div class="line"><span>Ngày:</span><strong>${new Date().toLocaleString("vi-VN")}</strong></div>`
                  : ""
              }

              <div class="divider"></div>

              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th>Giá</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>
                      Arduino Uno
                      ${
                        showProductCode
                          ? `<div style="font-size:11px;color:#666;margin-top:2px;">MSP: ARD-UNO</div>`
                          : ""
                      }
                    </td>
                    <td>2</td>
                    <td>250.000đ</td>
                  </tr>

                  <tr>
                    <td>ESP32</td>
                    <td>1</td>
                    <td>180.000đ</td>
                  </tr>
                </tbody>
              </table>

              <div class="divider"></div>

              ${
                showVat
                  ? `<div class="line"><span>VAT:</span><strong>0đ</strong></div>`
                  : ""
              }

              ${
                showDiscount
                  ? `<div class="line"><span>Giảm giá:</span><strong>0đ</strong></div>`
                  : ""
              }

              <div class="line">
                <strong>Tổng tiền:</strong>
                <strong>680.000đ</strong>
              </div>

              ${
                showCustomerPaid
                  ? `<div class="line"><span>Khách trả:</span><strong>680.000đ</strong></div>`
                  : ""
              }

              ${
                showChange
                  ? `<div class="line"><span>Tiền thừa:</span><strong>0đ</strong></div>`
                  : ""
              }

              ${
                showThankYou || showSeeYou
                  ? `<div class="footer">
                      ${
                        showThankYou
                          ? `<div class="multiline">${escapeHtml(thankYouText)}</div>`
                          : ""
                      }
                      ${
                        showSeeYou
                          ? `<div class="multiline">${escapeHtml(seeYouText)}</div>`
                          : ""
                      }
                    </div>`
                  : ""
              }

            </div>

            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 300);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="text-2xl text-black">
          Đang tải mẫu in...
        </div>
      </main>
    );
  }

  const currentTitle =
    editingTemplate === "temporary"
      ? temporaryTitle
      : invoiceTitle;

  const setCurrentTitle = (value: string) => {
    if (editingTemplate === "temporary") {
      setTemporaryTitle(value);
      return;
    }

    setInvoiceTitle(value);
  };

  const previewWidth =
    paperSize === "K80"
      ? "80mm"
      : paperSize === "A4"
      ? "185mm"
      : "136mm";

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        {editingTemplate === null ? (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-blue-700">
                Đơn bán hàng
              </h1>

              <p className="mt-2 text-gray-600">
                Chọn mẫu cần chỉnh sửa.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Mẫu bán hàng
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-black">
                      {invoiceTitle || "HÓA ĐƠN BÁN HÀNG"}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Khổ {paperSize}
                      </span>

                      {paperSize === "K80" && (
                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          Chữ {bodyFontSize}px
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingTemplate("invoice")}
                    className="shrink-0 rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800"
                  >
                    Sửa
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                      Phiếu tạm tính
                    </div>

                    <h2 className="mt-2 text-2xl font-bold text-black">
                      {temporaryTitle || "PHIẾU TẠM TÍNH"}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Khổ {paperSize}
                      </span>

                      {paperSize === "K80" && (
                        <span className="rounded-full bg-gray-100 px-3 py-1">
                          Chữ {bodyFontSize}px
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingTemplate("temporary")}
                    className="shrink-0 rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800"
                  >
                    Sửa
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="mb-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                  ← Quay lại danh sách mẫu
                </button>

                <h1 className="text-3xl font-bold text-blue-700">
                  Chỉnh sửa {editingTemplate === "temporary" ? "phiếu tạm tính" : "hóa đơn bán hàng"}
                </h1>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={printTestTemplate}
                  className="rounded-xl border border-green-600 bg-white px-5 py-2.5 font-semibold text-green-700 hover:bg-green-50"
                >
                  In thử
                </button>

                <button
                  type="button"
                  onClick={saveTemplate}
                  className="rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)]">
              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-black">
                      Nội dung mẫu
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Các thay đổi được xem trước ngay bên phải.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-black">
                        Tiêu đề
                      </label>

                      <input
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-black">
                        MST
                      </label>

                      <input
                        type="text"
                        value={shopTaxCode}
                        onChange={(e) => setShopTaxCode(e.target.value)}
                        placeholder="Mã số thuế cửa hàng"
                        className="w-full rounded-xl border px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-black">
                        Tên shop
                      </label>

                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-black">
                        Hotline
                      </label>

                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-black">
                        Địa chỉ
                      </label>

                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full resize-y rounded-xl border px-3 py-2.5 text-sm text-black outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-black">
                        Khổ giấy
                      </label>

                      <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="w-full rounded-xl border bg-white p-3 text-black outline-none"
                      >
                        <option value="K80">K80</option>
                        <option value="A5">A5</option>
                        <option value="A4">A4</option>
                      </select>
                    </div>

                    {paperSize === "K80" && (
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-black">
                          Cỡ chữ K80
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setBodyFontSize((value) =>
                                Math.max(10, value - 1)
                              )
                            }
                            className="h-11 w-11 rounded-xl border text-xl font-bold text-black hover:bg-gray-50"
                          >
                            −
                          </button>

                          <div className="flex h-11 min-w-[78px] items-center justify-center rounded-xl border bg-gray-50 px-3 font-bold text-black">
                            {bodyFontSize}px
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setBodyFontSize((value) =>
                                Math.min(18, value + 1)
                              )
                            }
                            className="h-11 w-11 rounded-xl border text-xl font-bold text-black hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-semibold text-black">
                        Lời cảm ơn
                      </label>

                      <textarea
                        rows={2}
                        value={thankYouText}
                        onChange={(e) => setThankYouText(e.target.value)}
                        className="w-full resize-y rounded-xl border p-3 text-black outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="mb-3 text-base font-bold text-black">
                      Hiển thị trên hóa đơn
                    </h3>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[
                        ["Tên shop", showShopName, setShowShopName],
                        ["Địa chỉ", showAddress, setShowAddress],
                        ["Hotline", showPhone, setShowPhone],
                        ["MST", showTaxCode, setShowTaxCode],
                        ["Tiêu đề", showTitle, setShowTitle],
                        ["Ngày giờ", showDate, setShowDate],
                        ["Mã đơn", showOrderCode, setShowOrderCode],
                        ["Mã SP", showProductCode, setShowProductCode],
                        ["VAT", showVat, setShowVat],
                        ["Giảm giá", showDiscount, setShowDiscount],
                        ["Khách trả", showCustomerPaid, setShowCustomerPaid],
                        ["Tiền thừa", showChange, setShowChange],
                        ["Lời cảm ơn", showThankYou, setShowThankYou],
                      ].map(([label, checked, setter]: any) => (
                        <label
                          key={label}
                          className="flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs text-black hover:bg-gray-50"
                        >
                          <span className="truncate font-medium">
                            {label}
                          </span>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setter(e.target.checked)}
                            className="h-4 w-4 shrink-0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-black">
                      Xem trước
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Mô phỏng bố cục khi in.
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
                    {paperSize}
                  </span>
                </div>

                <div className="overflow-auto rounded-2xl bg-gray-100 p-4">
                  <div
                    className="mx-auto overflow-hidden bg-white text-black shadow"
                    style={{
                      width: previewWidth,
                      maxWidth: "100%",
                      minHeight:
                        paperSize === "K80"
                          ? "auto"
                          : paperSize === "A4"
                          ? "262mm"
                          : "185mm",
                      padding:
                        paperSize === "K80"
                          ? "3mm"
                          : paperSize === "A4"
                          ? "12mm"
                          : "8mm",
                      fontSize:
                        paperSize === "K80"
                          ? `${bodyFontSize}px`
                          : paperSize === "A4"
                          ? "13px"
                          : "12px",
                      lineHeight: 1.4,
                      boxSizing: "border-box",
                    }}
                  >
                    {(showShopName || showAddress || showPhone) && (
                      <div className="text-center">
                        {showShopName && (
                          <div className="text-[1.35em] font-bold">
                            {shopName || "Tên shop"}
                          </div>
                        )}

                        {(showAddress || showPhone || showTaxCode) && (
                          <div className="mt-1 text-[0.9em]">
                            {paperSize === "K80" ? (
                              <div>
                                {showAddress && <span>{address || "Địa chỉ"}</span>}
                                {showAddress && (showPhone || showTaxCode) && <span> | </span>}
                                {showPhone && <span>Hotline: {phone || "---"}</span>}
                                {showPhone && showTaxCode && <span> | </span>}
                                {showTaxCode && (
                                  <span>MST: {shopTaxCode || "---"}</span>
                                )}
                              </div>
                            ) : (
                              <>
                                {showAddress && (
                                  <div>{address || "Địa chỉ"}</div>
                                )}

                                {(showPhone || showTaxCode) && (
                                  <div className="mt-1">
                                    {showPhone && (
                                      <span>Hotline: {phone || "---"}</span>
                                    )}
                                    {showPhone && showTaxCode && <span> | </span>}
                                    {showTaxCode && (
                                      <span>MST: {shopTaxCode || "---"}</span>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {showTitle && (
                      <div className="mt-3 text-center text-[1.3em] font-bold">
                        {currentTitle || "TIÊU ĐỀ"}
                      </div>
                    )}

                    {(showDate || showOrderCode) && (
                      <div className="mt-1 text-center text-[0.85em]">
                        {showDate && <span>15/08/2026 23:30</span>}
                        {showDate && showOrderCode && <span> | </span>}
                        {showOrderCode && <span>Mã đơn: SON00132</span>}
                      </div>
                    )}

                    <div className="mt-3 text-left text-[0.9em]">
                      <div>
                        <strong>Khách hàng:</strong> Nguyễn Văn A
                      </div>
                      <div className="mt-1">
                        <strong>Điện thoại:</strong> 0901234567
                      </div>
                    </div>

                    <table className="mt-3 w-full table-fixed border-collapse text-[0.85em]">
                      <colgroup>
                        <col style={{ width: "8%" }} />
                        <col style={{ width: "54%" }} />
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "28%" }} />
                      </colgroup>

                      <thead className="border-y border-dashed border-black">
                        <tr>
                          <th className="px-1 py-1 text-center">STT</th>
                          <th className="px-1 py-1 text-left">Sản phẩm</th>
                          <th className="px-1 py-1 text-center">SL</th>
                          <th className="px-1 py-1 text-right">Thành tiền</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr className="border-b border-dashed border-gray-300">
                          <td className="px-1 py-2 text-center align-top">1</td>

                          <td className="min-w-0 px-1 py-2 align-top">
                            <div className="break-words whitespace-normal">
                              Module điều khiển động cơ DC
                            </div>

                            {showProductCode && (
                              <div className="mt-0.5 break-words text-[0.8em] text-gray-500">
                                MSP: A21
                              </div>
                            )}
                          </td>

                          <td className="px-1 py-2 text-center align-top">1</td>

                          <td className="px-1 py-2 text-right align-top whitespace-nowrap">
                            45.000đ
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div
                      className={`ml-auto mt-3 w-full space-y-1 text-[0.9em] ${
                        paperSize === "K80"
                          ? "max-w-full"
                          : paperSize === "A4"
                          ? "max-w-[280px]"
                          : "max-w-[240px]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="shrink-0">Tạm tính:</span>
                        <strong className="whitespace-nowrap">45.000đ</strong>
                      </div>

                      {showVat && (
                        <div className="flex items-start justify-between gap-4">
                          <span className="shrink-0">VAT (8%):</span>
                          <strong className="whitespace-nowrap">3.600đ</strong>
                        </div>
                      )}

                      {showDiscount && (
                        <div className="flex items-start justify-between gap-4">
                          <span className="shrink-0">Giảm giá:</span>
                          <strong className="whitespace-nowrap">0đ</strong>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-4 border-t pt-1 text-[1.15em] font-bold">
                        <span className="shrink-0">Tổng cộng:</span>
                        <span className="whitespace-nowrap">48.600đ</span>
                      </div>

                      {showCustomerPaid && (
                        <div className="flex justify-between">
                          <span>Khách trả:</span>
                          <strong>48.600đ</strong>
                        </div>
                      )}

                      {showChange && (
                        <div className="flex justify-between">
                          <span>Tiền thừa:</span>
                          <strong>0đ</strong>
                        </div>
                      )}
                    </div>

                    {showThankYou && (
                      <div className="mt-6 whitespace-pre-line text-center text-[0.9em]">
                        {thankYouText}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}