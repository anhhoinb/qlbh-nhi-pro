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

  const [paperSize, setPaperSize] =
    useState("A5");

  const [activeTemplate, setActiveTemplate] =
    useState<ActiveTemplate>("sales_invoice");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const params =
      new URLSearchParams(window.location.search);

    const autoPrint =
      params.get("autoPrint");

    if (autoPrint === "1" && !loading) {
      const timer =
        setTimeout(() => {
          window.print();
        }, 800);

      return () =>
        clearTimeout(timer);
    }
  }, [loading]);

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

            warehouseTitle:
              warehouseTitle.trim(),

            deliveryTitle:
              deliveryTitle.trim(),

            thankYouText:
              thankYouText.trim(),

            seeYouText:
              seeYouText.trim(),

            paperSize:
              paperSize || "A5",

            activeTemplate:
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
        "Dùng để in hóa đơn bán hàng cho khách sau khi thanh toán.",
      previewTitle:
        invoiceTitle || "HÓA ĐƠN BÁN HÀNG",
    },
    {
      key: "warehouse_export",
      title: "Phiếu xuất kho",
      description:
        "Dùng để in phiếu xuất kho nội bộ khi xuất hàng khỏi kho.",
      previewTitle:
        warehouseTitle || "PHIẾU XUẤT KHO",
    },
    {
      key: "delivery_note",
      title: "Phiếu giao hàng",
      description:
        "Dùng để in phiếu giao hàng cho nhân viên giao hàng hoặc đơn vị vận chuyển.",
      previewTitle:
        deliveryTitle || "PHIẾU GIAO HÀNG",
    },
  ] as const;

  const getActiveTemplateName = () => {
    if (activeTemplate === "sales_invoice") {
      return "Đơn bán hàng";
    }

    if (activeTemplate === "warehouse_export") {
      return "Phiếu xuất kho";
    }

    if (activeTemplate === "delivery_note") {
      return "Phiếu giao hàng";
    }

    return "Đơn bán hàng";
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
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-700">
              Mẫu in
            </h1>

            <p className="text-gray-600 mt-2">
              Cấu hình thông tin cửa hàng và chọn mẫu in đang sử dụng.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow px-5 py-4 text-black">
            <p className="text-sm text-gray-500">
              Mẫu đang dùng
            </p>

            <p className="font-bold text-blue-700">
              {getActiveTemplateName()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
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
                className={`text-left rounded-3xl border-2 p-5 shadow bg-white transition ${
                  isActive
                    ? "border-blue-700 ring-4 ring-blue-100"
                    : "border-transparent hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-black">
                      {item.title}
                    </h2>

                    <p className="text-gray-500 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold ${
                      isActive
                        ? "bg-blue-700 text-white border-blue-700"
                        : "bg-white text-gray-400 border-gray-300"
                    }`}
                  >
                    {isActive ? "✓" : ""}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 border p-4 text-black">
                  <div className="text-center border-b pb-3 mb-3">
                    <p className="font-bold">
                      {shopName || "Tên shop"}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {address || "Địa chỉ"}
                    </p>

                    <p className="text-xs text-gray-500">
                      Hotline: {phone || "Số điện thoại"}
                    </p>
                  </div>

                  <p className="text-center font-bold text-blue-700">
                    {item.previewTitle}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        Mã đơn:
                      </span>

                      <strong>
                        DH0001
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>
                        Khách hàng:
                      </span>

                      <strong>
                        Khách lẻ
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>
                        Tổng tiền:
                      </span>

                      <strong>
                        500.000đ
                      </strong>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl shadow p-6 space-y-5">
          <h2 className="text-2xl font-bold text-black">
            Thông tin chung trên mẫu in
          </h2>

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
              Tiêu đề từng loại mẫu
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
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

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Tiêu đề phiếu giao hàng
                </label>

                <input
                  type="text"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={deliveryTitle}
                  onChange={(e) =>
                    setDeliveryTitle(
                      e.target.value
                    )
                  }
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

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t pt-5">
            <div className="text-gray-600">
              Sau khi lưu, hệ thống sẽ dùng mẫu{" "}
              <strong className="text-blue-700">
                {getActiveTemplateName()}
              </strong>{" "}
              khi in đơn hàng.
            </div>

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