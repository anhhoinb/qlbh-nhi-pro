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

  const [department, setDepartment] =
    useState("Kho hàng");

  const [address, setAddress] =
    useState("TP.HCM");

  const [phone, setPhone] =
    useState("0900 000 000");

  const [warehouseTitle, setWarehouseTitle] =
    useState("PHIẾU XUẤT KHO");

  const [reason, setReason] =
    useState("Xuất bán hàng");

  const [receiver, setReceiver] =
    useState("Nguyễn Văn A");

  const [receiverDepartment, setReceiverDepartment] =
    useState("Phòng kinh doanh");

  const [exportPlace, setExportPlace] =
    useState("Kho chính");

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

            setDepartment(
              data.department || "Kho hàng"
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

            setReason(
              data.reason ||
                "Xuất bán hàng"
            );

            setReceiver(
              data.receiver ||
                "Nguyễn Văn A"
            );

            setReceiverDepartment(
              data.receiverDepartment ||
                "Phòng kinh doanh"
            );

            setExportPlace(
              data.exportPlace ||
                "Kho chính"
            );

            setPaperSize(
              data.paperSize || "A5"
            );
          }
        } catch (error) {
          console.log(error);
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
            shopName,
            department,
            address,
            phone,
            warehouseTitle,
            reason,
            receiver,
            receiverDepartment,
            exportPlace,
            paperSize,
            updatedAt:
              new Date(),
          },
          {
            merge: true,
          }
        );

        alert(
          "Đã lưu mẫu phiếu xuất kho"
        );
      } catch (error) {
        console.log(error);

        alert(
          "Lưu thất bại"
        );
      }
    };

  const printTestTemplate =
    () => {
      const printWindow =
        window.open(
          "",
          "_blank",
          "width=1000,height=900"
        );

      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>Phiếu xuất kho</title>

            <style>
              body{
                font-family: Times New Roman;
                padding:20px;
                color:#000;
              }

              .page{
                width:900px;
                margin:auto;
              }

              .top{
                display:flex;
                justify-content:space-between;
              }

              .center{
                text-align:center;
              }

              .title{
                font-size:32px;
                font-weight:bold;
                margin-top:20px;
              }

              .line{
                margin:8px 0;
              }

              table{
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
              }

              table,
              th,
              td{
                border:1px solid #000;
              }

              th,
              td{
                padding:8px;
                text-align:center;
              }

              .sign{
                margin-top:50px;
                display:grid;
                grid-template-columns:
                repeat(5,1fr);
                gap:20px;
                text-align:center;
              }

              .sign-title{
                font-weight:bold;
              }

              .sign-note{
                font-style:italic;
              }

              @media print{
                body{
                  padding:0;
                }

                .page{
                  width:100%;
                }
              }
            </style>
          </head>

          <body>

            <div class="page">

              <div class="top">

                <div>
                  <div>
                    <strong>
                      Đơn vị:
                    </strong>
                    ${shopName}
                  </div>

                  <div>
                    <strong>
                      Bộ phận:
                    </strong>
                    ${department}
                  </div>
                </div>

                <div class="center">
                  <div>
                    <strong>
                      Mẫu số 02 - VT
                    </strong>
                  </div>

                  <div>
                    (Ban hành theo TT200)
                  </div>
                </div>

              </div>

              <div class="center">
                <div class="title">
                  ${warehouseTitle}
                </div>

                <div>
                  Ngày ${new Date().getDate()}
                  tháng ${
                    new Date().getMonth() + 1
                  }
                  năm ${new Date().getFullYear()}
                </div>
              </div>

              <div class="line">
                Họ tên người nhận hàng:
                ${receiver}
              </div>

              <div class="line">
                Bộ phận:
                ${receiverDepartment}
              </div>

              <div class="line">
                Lý do xuất kho:
                ${reason}
              </div>

              <div class="line">
                Xuất tại kho:
                ${exportPlace}
              </div>

              <table>

                <thead>
                  <tr>
                    <th>
                      STT
                    </th>

                    <th>
                      Tên hàng hóa
                    </th>

                    <th>
                      ĐVT
                    </th>

                    <th>
                      SL
                    </th>

                    <th>
                      Đơn giá
                    </th>

                    <th>
                      Thành tiền
                    </th>
                  </tr>
                </thead>

                <tbody>

                  <tr>
                    <td>1</td>
                    <td>Arduino Uno</td>
                    <td>Cái</td>
                    <td>2</td>
                    <td>250.000</td>
                    <td>500.000</td>
                  </tr>

                  <tr>
                    <td>2</td>
                    <td>ESP32</td>
                    <td>Cái</td>
                    <td>1</td>
                    <td>180.000</td>
                    <td>180.000</td>
                  </tr>

                  <tr>
                    <td colspan="5">
                      <strong>
                        Tổng cộng
                      </strong>
                    </td>

                    <td>
                      <strong>
                        680.000
                      </strong>
                    </td>
                  </tr>

                </tbody>

              </table>

              <div class="line" style="margin-top:20px;">
                Tổng số tiền:
                680.000đ
              </div>

              <div class="sign">

                <div>
                  <div class="sign-title">
                    Người lập phiếu
                  </div>

                  <div class="sign-note">
                    (Ký, họ tên)
                  </div>
                </div>

                <div>
                  <div class="sign-title">
                    Người nhận hàng
                  </div>

                  <div class="sign-note">
                    (Ký, họ tên)
                  </div>
                </div>

                <div>
                  <div class="sign-title">
                    Thủ kho
                  </div>

                  <div class="sign-note">
                    (Ký, họ tên)
                  </div>
                </div>

                <div>
                  <div class="sign-title">
                    Kế toán
                  </div>

                  <div class="sign-note">
                    (Ký, họ tên)
                  </div>
                </div>

                <div>
                  <div class="sign-title">
                    Giám đốc
                  </div>

                  <div class="sign-note">
                    (Ký, họ tên)
                  </div>
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
      <main className="p-10">
        Đang tải...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow p-8 space-y-6">

        <h1 className="text-4xl font-bold text-blue-700">
          Mẫu phiếu xuất kho
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          <div>
            <label className="font-semibold block mb-2">
              Tên đơn vị
            </label>

            <input
              className="w-full border rounded-2xl p-4"
              value={shopName}
              onChange={(e) =>
                setShopName(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Bộ phận
            </label>

            <input
              className="w-full border rounded-2xl p-4"
              value={department}
              onChange={(e) =>
                setDepartment(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Người nhận hàng
            </label>

            <input
              className="w-full border rounded-2xl p-4"
              value={receiver}
              onChange={(e) =>
                setReceiver(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Bộ phận nhận
            </label>

            <input
              className="w-full border rounded-2xl p-4"
              value={receiverDepartment}
              onChange={(e) =>
                setReceiverDepartment(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Lý do xuất kho
            </label>

            <input
              className="w-full border rounded-2xl p-4"
              value={reason}
              onChange={(e) =>
                setReason(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Xuất tại kho
            </label>

            <input
              className="w-full border rounded-2xl p-4"
              value={exportPlace}
              onChange={(e) =>
                setExportPlace(
                  e.target.value
                )
              }
            />
          </div>

        </div>

        <div className="flex justify-between pt-6">

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
            Lưu mẫu
          </button>

        </div>

      </div>

    </main>
  );
}