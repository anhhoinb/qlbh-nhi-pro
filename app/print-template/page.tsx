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
              data.invoiceTitle || "HÓA ĐƠN BÁN HÀNG"
            );

            setTemporaryTitle(
              data.temporaryTitle || "PHIẾU TẠM TÍNH"
            );

            setThankYouText(
              data.thankYouText || "Cảm ơn quý khách!"
            );

            setSeeYouText(
              data.seeYouText || "Hẹn gặp lại ❤️"
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

            updatedAt:
              new Date(),

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

      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-blue-700 mb-8">
          Mẫu in
        </h1>

        <div className="bg-white rounded-3xl shadow p-6 space-y-5">

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

          <div>

            <label className="block mb-2 font-semibold text-black">
              Tiêu đề hóa đơn
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

          <div>

            <label className="block mb-2 font-semibold text-black">
              Tiêu đề tạm tính
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

          <div>

            <label className="block mb-2 font-semibold text-black">
              Khổ giấy
            </label>

            <select
              className="w-full border p-4 rounded-2xl text-black"
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

          <button
            onClick={saveTemplate}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-4 rounded-2xl font-semibold"
          >
            Lưu mẫu in
          </button>

        </div>

      </div>

    </main>

  );

}