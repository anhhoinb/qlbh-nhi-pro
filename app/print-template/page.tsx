"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type ActiveTemplate =
  | "sales_invoice"
  | "warehouse_export"
  | "delivery_note";

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

  const [warehouseTitle, setWarehouseTitle] =
    useState("PHIẾU XUẤT KHO");

  const [deliveryTitle, setDeliveryTitle] =
    useState("PHIẾU GIAO HÀNG");

  const [thankYouText, setThankYouText] =
    useState("Cảm ơn quý khách!");

  const [seeYouText, setSeeYouText] =
    useState("Hẹn gặp lại ❤️");

  const [receiverName, setReceiverName] =
    useState("Nguyễn Văn A");

  const [receiverPhone, setReceiverPhone] =
    useState("0909 999 888");

  const [receiverAddress, setReceiverAddress] =
    useState(
      "123 Nguyễn Trãi, Quận 1, TP.HCM"
    );

  const [paperSize, setPaperSize] =
    useState("A5");

  const [activeTemplate, setActiveTemplate] =
    useState<ActiveTemplate>("sales_invoice");

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

            setWarehouseTitle(
              data.warehouseTitle ||
                "PHIẾU XUẤT KHO"
            );

            setDeliveryTitle(
              data.deliveryTitle ||
                "PHIẾU GIAO HÀNG"
            );

            setThankYouText(
              data.thankYouText ||
                "Cảm ơn quý khách!"
            );

            setSeeYouText(
              data.seeYouText ||
                "Hẹn gặp lại ❤️"
            );

            setReceiverName(
              data.receiverName ||
                "Nguyễn Văn A"
            );

            setReceiverPhone(
              data.receiverPhone ||
                "0909 999 888"
            );

            setReceiverAddress(
              data.receiverAddress ||
                "123 Nguyễn Trãi, Quận 1, TP.HCM"
            );

            setPaperSize(
              data.paperSize || "A5"
            );

            setActiveTemplate(
              data.activeTemplate ||
                "sales_invoice"
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
            shopName,
            address,
            phone,
            invoiceTitle,
            temporaryTitle,
            warehouseTitle,
            deliveryTitle,
            thankYouText,
            seeYouText,
            receiverName,
            receiverPhone,
            receiverAddress,
            paperSize,
            activeTemplate,
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

  const templateOptions = [
    {
      key: "sales_invoice",
      title: "Đơn bán hàng",
      description:
        "Hóa đơn bán hàng cho khách",
    },

    {
      key: "warehouse_export",
      title: "Phiếu xuất kho",
      description:
        "Phiếu xuất kho nội bộ",
    },

    {
      key: "delivery_note",
      title: "Phiếu giao hàng",
      description:
        "Phiếu giao cho shipper",
    },
  ] as const;

  const getCurrentTitle = () => {

    if (
      activeTemplate ===
      "sales_invoice"
    ) {
      return invoiceTitle;
    }

    if (
      activeTemplate ===
      "warehouse_export"
    ) {
      return warehouseTitle;
    }

    return deliveryTitle;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        Đang tải...
      </main>
    );
  }

  return (

    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-blue-700">
            Mẫu in
          </h1>

          <p className="text-gray-600 mt-2">
            Cấu hình mẫu in cho hệ thống
          </p>

        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* LEFT */}

          <div className="col-span-12 lg:col-span-3">

            <div className="bg-white rounded-3xl shadow p-4 sticky top-6">

              <h2 className="text-xl font-bold text-black mb-4">
                Danh sách mẫu in
              </h2>

              <div className="space-y-3">

                {templateOptions.map((item) => {

                  const isActive =
                    activeTemplate === item.key;

                  return (

                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setActiveTemplate(item.key)
                      }
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        isActive
                          ? "bg-blue-700 border-blue-700 text-white"
                          : "bg-white border-gray-200 hover:border-blue-300 text-black"
                      }`}
                    >

                      <div className="font-bold text-base">
                        {item.title}
                      </div>

                      <div
                        className={`text-sm mt-1 ${
                          isActive
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {item.description}
                      </div>

                    </button>
                  );
                })}

              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="col-span-12 lg:col-span-9">

            <div className="bg-white rounded-3xl shadow p-6 space-y-5">

              <div>

                <h2 className="text-3xl font-bold text-black">
                  {getCurrentTitle()}
                </h2>

                <p className="text-gray-500 mt-2">
                  Cấu hình thông tin mẫu in
                </p>

              </div>

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

                <h2 className="text-2xl font-bold text-black mb-4">
                  Tiêu đề mẫu in
                </h2>

                <div className="space-y-5">

                  <div>

                    <label className="block mb-2 font-semibold text-black">
                      Tiêu đề chính
                    </label>

                    <input
                      type="text"
                      className="w-full border p-4 rounded-2xl text-black"
                      value={getCurrentTitle()}
                      onChange={(e) => {

                        if (
                          activeTemplate ===
                          "sales_invoice"
                        ) {
                          setInvoiceTitle(
                            e.target.value
                          );
                        }

                        if (
                          activeTemplate ===
                          "warehouse_export"
                        ) {
                          setWarehouseTitle(
                            e.target.value
                          );
                        }

                        if (
                          activeTemplate ===
                          "delivery_note"
                        ) {
                          setDeliveryTitle(
                            e.target.value
                          );
                        }
                      }}
                    />

                  </div>

                </div>

              </div>

              <div className="border-t pt-5">

                <h2 className="text-2xl font-bold text-black mb-4">
                  Nội dung cuối phiếu
                </h2>

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
                      Hẹn gặp lại
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

              {activeTemplate ===
                "delivery_note" && (

                <div className="border-t pt-5">

                  <h2 className="text-2xl font-bold text-black mb-4">
                    Thông tin người nhận
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    <div>

                      <label className="block mb-2 font-semibold text-black">
                        Người nhận
                      </label>

                      <input
                        type="text"
                        className="w-full border p-4 rounded-2xl text-black"
                        value={receiverName}
                        onChange={(e) =>
                          setReceiverName(
                            e.target.value
                          )
                        }
                      />

                    </div>

                    <div>

                      <label className="block mb-2 font-semibold text-black">
                        Số điện thoại
                      </label>

                      <input
                        type="text"
                        className="w-full border p-4 rounded-2xl text-black"
                        value={receiverPhone}
                        onChange={(e) =>
                          setReceiverPhone(
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
                        value={receiverAddress}
                        onChange={(e) =>
                          setReceiverAddress(
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>

                </div>
              )}

              <div className="border-t pt-5">

                <label className="block mb-2 font-semibold text-black">
                  Khổ giấy
                </label>

                <select
                  className="w-full md:w-72 border p-4 rounded-2xl text-black"
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

              <div className="flex justify-end border-t pt-5">

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

        </div>

      </div>

    </main>
  );
}