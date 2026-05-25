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

  const [warehouseTitle, setWarehouseTitle] =
    useState("PHIẾU XUẤT KHO");

  const [thankYouText, setThankYouText] =
    useState("Cảm ơn quý khách!");

  const [seeYouText, setSeeYouText] =
    useState("Hẹn gặp lại ❤️");

  const [paperSize, setPaperSize] =
    useState("A5");

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

            setWarehouseTitle(
              data.warehouseTitle ||
                "PHIẾU XUẤT KHO"
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

            warehouseTitle:
              warehouseTitle.trim(),

            thankYouText:
              thankYouText.trim(),

            seeYouText:
              seeYouText.trim(),

            paperSize:
              paperSize || "A5",

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
            </style>
          </head>

          <body>
            <div class="page">

              <div class="center">
                <div class="shop-name">
                  ${shopName}
                </div>

                <div>
                  ${address}
                </div>

                <div>
                  Hotline: ${phone}
                </div>
              </div>

              <div class="divider"></div>

              <div class="title">
                ${warehouseTitle}
              </div>

              <div class="line">
                <span>Mã phiếu:</span>
                <strong>PXK0001</strong>
              </div>

              <div class="line">
                <span>Người nhận:</span>
                <strong>Khách lẻ</strong>
              </div>

              <div class="line">
                <span>Ngày xuất:</span>
                <strong>
                  ${new Date().toLocaleString(
                    "vi-VN"
                  )}
                </strong>
              </div>

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
                    <td>Arduino Uno</td>
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

              <div class="line">
                <strong>Tổng giá trị:</strong>
                <strong>680.000đ</strong>
              </div>

              <div style="margin-top:40px; display:flex; justify-content:space-between; text-align:center;">
                <div>
                  <strong>Người giao</strong>
                  <div style="margin-top:60px;">
                    (Ký tên)
                  </div>
                </div>

                <div>
                  <strong>Người nhận</strong>
                  <div style="margin-top:60px;">
                    (Ký tên)
                  </div>
                </div>
              </div>

              <div class="footer">
                <div>
                  ${thankYouText}
                </div>

                <div>
                  ${seeYouText}
                </div>
              </div>

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
              Phiếu xuất kho
            </h1>

            <p className="text-gray-600 mt-2">
              Cấu hình mẫu phiếu xuất kho.
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

              <input
                type="text"
                className="w-full border p-4 rounded-2xl text-black"
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
              Tiêu đề phiếu xuất kho
            </label>

            <input
              type="text"
              className="w-full border p-4 rounded-2xl text-black"
              value={warehouseTitle}
              onChange={(e) =>
                setWarehouseTitle(
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

                <input
                  type="text"
                  className="w-full border p-4 rounded-2xl text-black"
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

                <input
                  type="text"
                  className="w-full border p-4 rounded-2xl text-black"
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