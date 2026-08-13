"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ActiveTemplate =
  | "sales_invoice"
  | "warehouse_export"
  | "delivery_note";

type TitleAlign = "left" | "center";
type PaperSize = "A4" | "A5" | "K80";
type FontFamily = "Arial" | "Tahoma" | "Times New Roman";

const DEFAULT_LOGO_MAX_WIDTH = 400;
const DEFAULT_LOGO_MAX_HEIGHT = 200;

export default function PrintTemplatePage() {
  const [shopName, setShopName] = useState("NhiPro23");
  const [address, setAddress] = useState("TP.HCM");
  const [phone, setPhone] = useState("0900 000 000");

  const [invoiceTitle, setInvoiceTitle] = useState("HÓA ĐƠN BÁN HÀNG");
  const [temporaryTitle, setTemporaryTitle] = useState("PHIẾU TẠM TÍNH");
  const [warehouseTitle, setWarehouseTitle] = useState("PHIẾU XUẤT KHO");
  const [deliveryTitle, setDeliveryTitle] = useState("PHIẾU GIAO HÀNG");

  const [thankYouText, setThankYouText] = useState("Cảm ơn quý khách!");
  const [seeYouText, setSeeYouText] = useState("Hẹn gặp lại ❤️");

  const [receiverName, setReceiverName] = useState("Nguyễn Văn A");
  const [receiverPhone, setReceiverPhone] = useState("0909 999 888");
  const [receiverAddress, setReceiverAddress] = useState(
    "123 Nguyễn Trãi, Quận 1, TP.HCM"
  );

  const [logoUrl, setLogoUrl] = useState("");
  const [showLogo, setShowLogo] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showThankYou, setShowThankYou] = useState(true);
  const [showSeeYou, setShowSeeYou] = useState(true);
  const [showReceiver, setShowReceiver] = useState(true);

  const [paperSize, setPaperSize] = useState<PaperSize>("A5");
  const [titleAlign, setTitleAlign] = useState<TitleAlign>("center");
  const [titleFontSize, setTitleFontSize] = useState(18);
  const [bodyFontSize, setBodyFontSize] = useState(12);
  const [fontFamily, setFontFamily] = useState<FontFamily>("Arial");

  const [activeTemplate, setActiveTemplate] =
    useState<ActiveTemplate>("sales_invoice");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const ref = doc(db, "settings", "print_template");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data: any = snap.data();

          setShopName(data.shopName || "NhiPro23");
          setAddress(data.address || "TP.HCM");
          setPhone(data.phone || "0900 000 000");
          setInvoiceTitle(data.invoiceTitle || "HÓA ĐƠN BÁN HÀNG");
          setTemporaryTitle(data.temporaryTitle || "PHIẾU TẠM TÍNH");
          setWarehouseTitle(data.warehouseTitle || "PHIẾU XUẤT KHO");
          setDeliveryTitle(data.deliveryTitle || "PHIẾU GIAO HÀNG");
          setThankYouText(data.thankYouText || "Cảm ơn quý khách!");
          setSeeYouText(data.seeYouText || "Hẹn gặp lại ❤️");
          setReceiverName(data.receiverName || "Nguyễn Văn A");
          setReceiverPhone(data.receiverPhone || "0909 999 888");
          setReceiverAddress(
            data.receiverAddress || "123 Nguyễn Trãi, Quận 1, TP.HCM"
          );

          setLogoUrl(data.logoUrl || "");
          setShowLogo(data.showLogo ?? true);
          setShowAddress(data.showAddress ?? true);
          setShowPhone(data.showPhone ?? true);
          setShowTitle(data.showTitle ?? true);
          setShowThankYou(data.showThankYou ?? true);
          setShowSeeYou(data.showSeeYou ?? true);
          setShowReceiver(data.showReceiver ?? true);

          setPaperSize(
            data.paperSize === "K80"
              ? "K80"
              : data.paperSize === "A4"
              ? "A4"
              : "A5"
          );
          setTitleAlign(data.titleAlign === "left" ? "left" : "center");
          setTitleFontSize(Number(data.titleFontSize) || 18);
          setBodyFontSize(Number(data.bodyFontSize) || 12);
          setFontFamily(
            ["Arial", "Tahoma", "Times New Roman"].includes(data.fontFamily)
              ? data.fontFamily
              : "Arial"
          );
          setActiveTemplate(
            ["sales_invoice", "warehouse_export", "delivery_note"].includes(
              data.activeTemplate
            )
              ? data.activeTemplate
              : "sales_invoice"
          );
        }
      } catch (error) {
        console.error(error);
        alert("Không tải được mẫu in");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, []);

  const saveTemplate = async () => {
    try {
      setSaving(true);

      await setDoc(
        doc(db, "settings", "print_template"),
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
          logoUrl,
          showLogo,
          showAddress,
          showPhone,
          showTitle,
          showThankYou,
          showSeeYou,
          showReceiver,
          paperSize,
          titleAlign,
          titleFontSize,
          bodyFontSize,
          fontFamily,
          activeTemplate,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      alert("Đã lưu mẫu in");
    } catch (error) {
      console.error(error);
      alert("Lưu mẫu in thất bại");
    } finally {
      setSaving(false);
    }
  };

  const resizeLogo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          let width = image.width;
          let height = image.height;
          const ratio = Math.min(
            DEFAULT_LOGO_MAX_WIDTH / width,
            DEFAULT_LOGO_MAX_HEIGHT / height,
            1
          );

          width = Math.round(width * ratio);
          height = Math.round(height * ratio);

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Không thể xử lý ảnh"));
            return;
          }

          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };

        image.onerror = () => reject(new Error("Ảnh không hợp lệ"));
        image.src = String(reader.result);
      };

      reader.onerror = () => reject(new Error("Không đọc được ảnh"));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Logo không được lớn hơn 5MB");
      return;
    }

    try {
      setLogoLoading(true);
      const resizedLogo = await resizeLogo(file);
      setLogoUrl(resizedLogo);
      setShowLogo(true);
    } catch (error) {
      console.error(error);
      alert("Không thể tải logo");
    } finally {
      setLogoLoading(false);
    }
  };

  const templateOptions = [
    {
      key: "sales_invoice",
      title: "Đơn bán hàng",
      description: "Hóa đơn bán hàng cho khách",
    },
    {
      key: "warehouse_export",
      title: "Phiếu xuất kho",
      description: "Phiếu xuất kho nội bộ",
    },
    {
      key: "delivery_note",
      title: "Phiếu giao hàng",
      description: "Phiếu giao cho shipper",
    },
  ] as const;

  const getCurrentTitle = () => {
    if (activeTemplate === "sales_invoice") return invoiceTitle;
    if (activeTemplate === "warehouse_export") return warehouseTitle;
    return deliveryTitle;
  };

  const setCurrentTitle = (value: string) => {
    if (activeTemplate === "sales_invoice") setInvoiceTitle(value);
    if (activeTemplate === "warehouse_export") setWarehouseTitle(value);
    if (activeTemplate === "delivery_note") setDeliveryTitle(value);
  };

  const previewWidth =
    paperSize === "K80"
      ? "80mm"
      : paperSize === "A4"
      ? "190mm"
      : "136mm";

  const previewMinHeight =
    paperSize === "K80"
      ? "auto"
      : paperSize === "A4"
      ? "277mm"
      : "190mm";
  const previewTitleStyle = useMemo(
    () => ({
      textAlign: titleAlign as "left" | "center",
      fontSize: `${titleFontSize}px`,
      fontFamily,
    }),
    [titleAlign, titleFontSize, fontFamily]
  );

  if (loading) {
    return <main className="min-h-screen bg-gray-100 p-6">Đang tải...</main>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-700">Mẫu in</h1>
          <p className="mt-2 text-gray-600">Cấu hình mẫu in cho hệ thống</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-6 rounded-3xl bg-white p-4 shadow">
              <h2 className="mb-4 text-xl font-bold text-black">
                Danh sách mẫu in
              </h2>

              <div className="space-y-3">
                {templateOptions.map((item) => {
                  const isActive = activeTemplate === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveTemplate(item.key)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? "border-blue-700 bg-blue-700 text-white"
                          : "border-gray-200 bg-white text-black hover:border-blue-300"
                      }`}
                    >
                      <div className="text-base font-bold">{item.title}</div>
                      <div
                        className={`mt-1 text-sm ${
                          isActive ? "text-blue-100" : "text-gray-500"
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

          <div className="col-span-12 lg:col-span-9">
            <div className="space-y-6 rounded-3xl bg-white p-6 shadow">
              <div>
                <h2 className="text-3xl font-bold text-black">
                  {getCurrentTitle()}
                </h2>
                <p className="mt-2 text-gray-500">
                  Cấu hình thông tin và giao diện mẫu in
                </p>
              </div>

              <section className="border-t pt-5">
                <h3 className="mb-4 text-2xl font-bold text-black">
                  Thông tin cửa hàng
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <Field label="Tên shop">
                    <input
                      type="text"
                      className="input-control"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </Field>

                  <Field label="Địa chỉ">
                    <input
                      type="text"
                      className="input-control"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </Field>

                  <Field label="Hotline">
                    <input
                      type="text"
                      className="input-control"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-4 text-2xl font-bold text-black">Logo</h3>

                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-28 w-44 items-center justify-center overflow-hidden rounded-2xl border bg-gray-50">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo cửa hàng"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">Chưa có logo</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <label className="cursor-pointer rounded-2xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
                      {logoLoading ? "Đang xử lý..." : "Chọn logo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={logoLoading}
                        onChange={handleLogoChange}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      disabled={!logoUrl}
                      className="rounded-2xl border px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Xóa logo
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-500">
                  Ảnh sẽ được thu nhỏ trước khi lưu để tránh vượt giới hạn Firestore.
                </p>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-4 text-2xl font-bold text-black">
                  Tiêu đề mẫu in
                </h3>

                <Field label="Tiêu đề chính">
                  <input
                    type="text"
                    className="input-control"
                    value={getCurrentTitle()}
                    onChange={(e) => setCurrentTitle(e.target.value)}
                  />
                </Field>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-4 text-2xl font-bold text-black">
                  Nội dung cuối phiếu
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Lời cảm ơn">
                    <input
                      type="text"
                      className="input-control"
                      value={thankYouText}
                      onChange={(e) => setThankYouText(e.target.value)}
                    />
                  </Field>

                  <Field label="Hẹn gặp lại">
                    <input
                      type="text"
                      className="input-control"
                      value={seeYouText}
                      onChange={(e) => setSeeYouText(e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              {activeTemplate === "delivery_note" && (
                <section className="border-t pt-5">
                  <h3 className="mb-4 text-2xl font-bold text-black">
                    Thông tin người nhận
                  </h3>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <Field label="Người nhận">
                      <input
                        type="text"
                        className="input-control"
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                      />
                    </Field>

                    <Field label="Số điện thoại">
                      <input
                        type="text"
                        className="input-control"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                      />
                    </Field>

                    <Field label="Địa chỉ">
                      <input
                        type="text"
                        className="input-control"
                        value={receiverAddress}
                        onChange={(e) => setReceiverAddress(e.target.value)}
                      />
                    </Field>
                  </div>
                </section>
              )}

              <section className="border-t pt-5">
                <h3 className="mb-4 text-2xl font-bold text-black">
                  Bật / tắt hiển thị
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Toggle
                    label="Hiện logo"
                    checked={showLogo}
                    onChange={setShowLogo}
                  />
                  <Toggle
                    label="Hiện địa chỉ"
                    checked={showAddress}
                    onChange={setShowAddress}
                  />
                  <Toggle
                    label="Hiện hotline"
                    checked={showPhone}
                    onChange={setShowPhone}
                  />
                  <Toggle
                    label="Hiện tiêu đề"
                    checked={showTitle}
                    onChange={setShowTitle}
                  />
                  <Toggle
                    label="Hiện lời cảm ơn"
                    checked={showThankYou}
                    onChange={setShowThankYou}
                  />
                  <Toggle
                    label="Hiện hẹn gặp lại"
                    checked={showSeeYou}
                    onChange={setShowSeeYou}
                  />
                  {activeTemplate === "delivery_note" && (
                    <Toggle
                      label="Hiện người nhận"
                      checked={showReceiver}
                      onChange={setShowReceiver}
                    />
                  )}
                </div>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-4 text-2xl font-bold text-black">
                  Giao diện hóa đơn
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <Field label="Khổ giấy">
                    <select
                      className="input-control"
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    >
                      <option value="K80">K80 - Máy in nhiệt 80mm</option>
                      <option value="A5">A5</option>
                      <option value="A4">A4</option>
                    </select>
                  </Field>

                  <Field label="Căn tiêu đề">
                    <select
                      className="input-control"
                      value={titleAlign}
                      onChange={(e) =>
                        setTitleAlign(e.target.value as TitleAlign)
                      }
                    >
                      <option value="center">Căn giữa</option>
                      <option value="left">Căn trái</option>
                    </select>
                  </Field>

                  <Field label="Font chữ">
                    <select
                      className="input-control"
                      value={fontFamily}
                      onChange={(e) =>
                        setFontFamily(e.target.value as FontFamily)
                      }
                    >
                      <option value="Arial">Arial</option>
                      <option value="Tahoma">Tahoma</option>
                      <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </Field>

                  <Field label={`Cỡ chữ tiêu đề: ${titleFontSize}px`}>
                    <input
                      type="range"
                      min="14"
                      max="32"
                      value={titleFontSize}
                      onChange={(e) => setTitleFontSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </Field>

                  <Field label={`Cỡ chữ nội dung: ${bodyFontSize}px`}>
                    <input
                      type="range"
                      min="9"
                      max="18"
                      value={bodyFontSize}
                      onChange={(e) => setBodyFontSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </Field>
                </div>
              </section>

              <section className="border-t pt-5">
                <h3 className="mb-4 text-2xl font-bold text-black">
                  Xem trước
                </h3>

                <div className="overflow-x-auto rounded-3xl bg-gray-100 p-4 md:p-8">
                  <div
                    className="mx-auto bg-white p-5 text-black shadow"
                    style={{
                      width: previewWidth,
                      minHeight: previewMinHeight,
                      fontFamily,
                      fontSize: `${bodyFontSize}px`,
                    }}
                  >
                    <div className="text-center">
                      {showLogo && logoUrl && (
                        <img
                          src={logoUrl}
                          alt="Logo xem trước"
                          className="mx-auto mb-2 max-h-20 max-w-[160px] object-contain"
                        />
                      )}

                      <div className="text-xl font-bold">{shopName}</div>

                      {(showAddress || showPhone) && (
                        <div className="mt-1 text-[0.9em]">
                          {showAddress && <span>{address}</span>}
                          {showAddress && showPhone && <span> | </span>}
                          {showPhone && <span>Hotline: {phone}</span>}
                        </div>
                      )}
                    </div>

                    {showTitle && (
                      <div className="mt-4 border-y border-dashed py-3">
                        <div className="font-bold" style={previewTitleStyle}>
                          {getCurrentTitle()}
                        </div>
                        <div className="mt-1 text-center text-[0.85em]">
                          30/07/2026 23:00 | Mã đơn: HD0001
                        </div>
                      </div>
                    )}

                    {activeTemplate === "delivery_note" && showReceiver && (
                      <div className="mt-3 rounded border p-3 text-[0.9em]">
                        <div>
                          <strong>Người nhận:</strong> {receiverName}
                        </div>
                        <div>
                          <strong>Điện thoại:</strong> {receiverPhone}
                        </div>
                        <div>
                          <strong>Địa chỉ:</strong> {receiverAddress}
                        </div>
                      </div>
                    )}

                    <table className="mt-3 w-full border-collapse text-[0.85em]">
                      <thead>
                        <tr>
                          <th className="border p-1">STT</th>
                          <th className="border p-1 text-left">Sản phẩm</th>
                          <th className="border p-1">SL</th>
                          <th className="border p-1 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-1 text-center">1</td>
                          <td className="border p-1">Sản phẩm mẫu</td>
                          <td className="border p-1 text-center">2</td>
                          <td className="border p-1 text-right">100.000đ</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-3 ml-auto w-[220px] max-w-full space-y-1 text-[0.9em]">
                      <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <strong>100.000đ</strong>
                      </div>
                      <div className="flex justify-between border-t pt-1 text-[1.1em]">
                        <span className="font-bold">Tổng cộng:</span>
                        <strong>100.000đ</strong>
                      </div>
                    </div>

                    {(showThankYou || showSeeYou) && (
                      <div className="mt-6 space-y-1 text-center">
                        {showThankYou && <div>{thankYouText}</div>}
                        {showSeeYou && <div>{seeYouText}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex justify-end border-t pt-5">
                <button
                  type="button"
                  onClick={saveTemplate}
                  disabled={saving || logoLoading}
                  className="rounded-2xl bg-blue-700 px-8 py-4 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu mẫu in"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-control {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 1rem;
          padding: 1rem;
          color: #111827;
          background: white;
          outline: none;
        }

        .input-control:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block font-semibold text-black">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-black">
      <span className="font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />
    </label>
  );
}