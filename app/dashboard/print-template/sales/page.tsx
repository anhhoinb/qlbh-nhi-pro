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

  const [showShopName, setShowShopName] =
    useState(true);

  const [showAddress, setShowAddress] =
    useState(true);

  const [showPhone, setShowPhone] =
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

            setShowShopName(
              data.showShopName ?? true
            );

            setShowAddress(
              data.showAddress ?? true
            );

            setShowPhone(
              data.showPhone ?? true
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

            showShopName,
            showAddress,
            showPhone,
            showTitle,
            showDate,
            showOrderCode,
            showProductCode,
            showVat,
            showDiscount,
            showCustomerPaid,
            showChange,
            showThankYou,
            showSeeYou,

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

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-5xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-4xl font-bold text-blue-700">
              Đơn bán hàng
            </h1>

            <p className="text-gray-600 mt-2">
              Cấu hình mẫu đơn bán hàng.
            </p>

          </div>

        </div>

        <div className="bg-white rounded-3xl shadow p-6 space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <div>
              <label className="block mb-2 font-semibold text-black">
                Tên shop
              </label>

              <input
                type="text"
                className="w-full border p-4 rounded-2xl text-black"
                value={shopName}
                onChange={(e) =>
                  setShopName(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-black">
                Địa chỉ
              </label>

              <textarea
                rows={3}
                className="w-full border p-4 rounded-2xl text-black resize-y"
                value={address}
                onChange={(e) =>
                  setAddress(
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-black">
                Hotline
              </label>

              <input
                type="text"
                className="w-full border p-4 rounded-2xl text-black"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
              />
            </div>

          </div>

          <div className="border-t pt-5">

            <label className="block mb-2 font-semibold text-black">
              Tiêu đề đơn bán hàng
            </label>

            <input
              type="text"
              className="w-full border p-4 rounded-2xl text-black"
              value={invoiceTitle}
              onChange={(e) =>
                setInvoiceTitle(
                  e.target.value
                )
              }
            />

          </div>

          <div className="border-t pt-5">

            <label className="block mb-2 font-semibold text-black">
              Tiêu đề phiếu tạm tính
            </label>

            <input
              type="text"
              className="w-full border p-4 rounded-2xl text-black"
              value={temporaryTitle}
              onChange={(e) =>
                setTemporaryTitle(
                  e.target.value
                )
              }
            />

          </div>

          <div className="border-t pt-5">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Lời cảm ơn
                </label>

                <textarea
                  rows={4}
                  className="w-full border p-4 rounded-2xl text-black resize-y"
                  value={thankYouText}
                  onChange={(e) =>
                    setThankYouText(
                      e.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Dòng hẹn gặp lại
                </label>

                <textarea
                  rows={4}
                  className="w-full border p-4 rounded-2xl text-black resize-y"
                  value={seeYouText}
                  onChange={(e) =>
                    setSeeYouText(
                      e.target.value
                    )
                  }
                />
              </div>

            </div>

          </div>

          <div className="border-t pt-5">

            <label className="block mb-2 font-semibold text-black">
              Khổ giấy
            </label>

            <select
              className="w-full md:w-80 border p-4 rounded-2xl text-black"
              value={paperSize}
              onChange={(e) =>
                setPaperSize(
                  e.target.value
                )
              }
            >
              <option value="A5">
                A5
              </option>

              <option value="K80">
                K80
              </option>
            </select>

          </div>

          <div className="border-t pt-5">

            <h2 className="text-2xl font-bold text-black mb-4">
              Hiển thị trên hóa đơn
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {[
                ["Hiện tên shop", showShopName, setShowShopName],
                ["Hiện địa chỉ", showAddress, setShowAddress],
                ["Hiện Hotline", showPhone, setShowPhone],
                ["Hiện tiêu đề hóa đơn", showTitle, setShowTitle],
                ["Hiện ngày giờ", showDate, setShowDate],
                ["Hiện mã đơn", showOrderCode, setShowOrderCode],
                ["Hiện mã sản phẩm (MSP)", showProductCode, setShowProductCode],
                ["Hiện VAT", showVat, setShowVat],
                ["Hiện giảm giá", showDiscount, setShowDiscount],
                ["Hiện khách trả", showCustomerPaid, setShowCustomerPaid],
                ["Hiện tiền thừa", showChange, setShowChange],
                ["Hiện lời cảm ơn", showThankYou, setShowThankYou],
                ["Hiện hẹn gặp lại", showSeeYou, setShowSeeYou],
              ].map(([label, checked, setter]: any) => (
                <label
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-2xl border p-4 text-black cursor-pointer"
                >
                  <span className="font-medium">
                    {label}
                  </span>

                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setter(e.target.checked)
                    }
                    className="w-5 h-5"
                  />
                </label>
              ))}

            </div>

          </div>

          <div className="flex justify-end gap-4 border-t pt-5">

            <button
              type="button"
              onClick={printTestTemplate}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-semibold"
            >
              In thử mẫu
            </button>

            <button
              type="button"
              onClick={saveTemplate}
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-2xl font-semibold"
            >
              Lưu mẫu in
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}