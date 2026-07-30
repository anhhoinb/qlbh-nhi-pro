"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type QuotationItem = {
  id?: string;
  name?: string;
  main_name?: string;
  short_name?: string;
  printName?: string;
  product_code?: string;
  unit?: string;
  quantity?: number;
  price?: number;
  tax?: number;
  note?: string;
};

type QuotationData = {
  id?: string;
  quotationCode?: string;
  quotationDate?: string;
  validDays?: number;
  createdAt?: {
    toDate?: () => Date;
  };
  seller?: {
    companyName?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
    bankName?: string;
    bankBranch?: string;
    bankAccount?: string;
    bankOwner?: string;
  };
  buyer?: {
    companyName?: string;
    contactName?: string;
    address?: string;
    taxCode?: string;
    phone?: string;
    email?: string;
  };
  items?: QuotationItem[];
  subtotal?: number;
  vatAmount?: number;
  total?: number;
};

const DEFAULT_SELLER = {
  companyName:
    "CÔNG TY TNHH CÔNG NGHỆ NHIPRO",
  taxCode: "0317504408",
  phone: "0911201091",
  email: "hhcompany.info@gmail.com",
  address:
    "40/12 Lữ Gia, Phường Phú Thọ, Thành phố Hồ Chí Minh, Việt Nam",
  bankName:
    "Ngân hàng TMCP Á Châu (ACB)",
  bankBranch:
    "Chi nhánh Lê Đại Hành",
  bankAccount: "12345078",
  bankOwner:
    "CÔNG TY TNHH CÔNG NGHỆ NHIPRO",
};

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number)
    ? number
    : 0;
}

function formatMoney(value: unknown) {
  return toNumber(value).toLocaleString(
    "vi-VN"
  );
}

function parseDate(value?: string) {
  if (!value) return new Date();

  const date = new Date(
    `${value}T00:00:00`
  );

  return Number.isNaN(
    date.getTime()
  )
    ? new Date()
    : date;
}

function getItemName(
  item: QuotationItem
) {
  return (
    item.printName ||
    item.short_name ||
    item.main_name ||
    item.name ||
    ""
  );
}

function QuotationPrintContent() {
  const searchParams =
    useSearchParams();

  const quotationId =
    searchParams.get("id");

  const autoPrint =
    searchParams.get("print") === "1";

  const [quotation, setQuotation] =
    useState<QuotationData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadQuotation =
      async () => {
        try {
          setLoading(true);
          setError("");

          if (quotationId) {
            const quotationRef =
              doc(
                db,
                "quotations",
                quotationId
              );

            const snapshot =
              await getDoc(
                quotationRef
              );

            if (!snapshot.exists()) {
              throw new Error(
                "Không tìm thấy báo giá"
              );
            }

            setQuotation({
              id: snapshot.id,
              ...snapshot.data(),
            } as QuotationData);

            return;
          }

          const temporary =
            sessionStorage.getItem(
              "temporary_quotation"
            );

          if (!temporary) {
            throw new Error(
              "Không có dữ liệu báo giá"
            );
          }

          setQuotation(
            JSON.parse(temporary)
          );
        } catch (loadError) {
          console.error(loadError);

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không tải được báo giá"
          );
        } finally {
          setLoading(false);
        }
      };

    loadQuotation();
  }, [quotationId]);

  useEffect(() => {
    if (
      !loading &&
      quotation &&
      autoPrint
    ) {
      const timer =
        window.setTimeout(() => {
          window.print();
        }, 500);

      return () =>
        window.clearTimeout(timer);
    }
  }, [
    loading,
    quotation,
    autoPrint,
  ]);

  const seller = {
    ...DEFAULT_SELLER,
    ...(quotation?.seller || {}),
  };

  const items =
    quotation?.items || [];

  const calculatedSubtotal =
    useMemo(
      () =>
        items.reduce(
          (sum, item) =>
            sum +
            toNumber(
              item.quantity
            ) *
              toNumber(
                item.price
              ),
          0
        ),
      [items]
    );

  const calculatedVat =
    useMemo(
      () =>
        items.reduce(
          (sum, item) => {
            const lineSubtotal =
              toNumber(
                item.quantity
              ) *
              toNumber(
                item.price
              );

            return (
              sum +
              lineSubtotal *
                (
                  toNumber(
                    item.tax
                  ) / 100
                )
            );
          },
          0
        ),
      [items]
    );

  const subtotal =
    quotation?.subtotal ??
    calculatedSubtotal;

  const vatAmount =
    quotation?.vatAmount ??
    calculatedVat;

  const total =
    quotation?.total ??
    subtotal + vatAmount;

  const vatRates = Array.from(
    new Set(
      items.map((item) =>
        Number(item.tax || 0)
      )
    )
  ).filter((rate) => rate > 0);

  const quotationDate =
    quotation?.createdAt?.toDate?.() ??
    (quotation?.quotationDate
      ? parseDate(quotation.quotationDate)
      : new Date());

  const validDays =
    toNumber(
      quotation?.validDays || 3
    );

  const displayedItems =
    items.length > 0
      ? items
      : [
          {
            printName: "",
            unit: "",
            quantity: 1,
            price: 0,
            tax: 0,
            note: "",
          },
        ];

  if (loading) {
    return (
      <main className="screen-message">
        Đang tải báo giá...
      </main>
    );
  }

  if (
    error ||
    !quotation
  ) {
    return (
      <main className="screen-message error">
        {error ||
          "Không có dữ liệu báo giá"}
      </main>
    );
  }

  return (
    <>
      <div className="screen-toolbar">
        <button
          type="button"
          onClick={() =>
            window.history.back()
          }
        >
          Quay lại
        </button>

        <button
          type="button"
          className="primary"
          onClick={() =>
            window.print()
          }
        >
          In / Lưu PDF
        </button>
      </div>

      <main className="quotation-page">
        <header className="seller-header">
          <div className="logo-box">
  <img
    src="/images/logo.png"
    alt="Logo NhiPro"
    className="company-logo"
  />
</div>

          <div className="seller-information">
            <h1>
              {seller.companyName}
            </h1>

            <div>
              <strong>MST:</strong>{" "}
              {seller.taxCode}
            </div>

            <div className="seller-contact-row">
              <span>
                <strong>SĐT:</strong>{" "}
                {seller.phone}
              </span>

              <span>
                <strong>Email:</strong>{" "}
                {seller.email}
              </span>
            </div>

            <div>
              <strong>
                Địa Chỉ:
              </strong>{" "}
              {seller.address}
            </div>
          </div>
        </header>

        <div className="double-rule" />

        <div className="document-date">
          TP. HCM, ngày{" "}
          {String(
            quotationDate.getDate()
          ).padStart(2, "0")}{" "}
          tháng{" "}
          {String(
            quotationDate.getMonth() +
              1
          ).padStart(2, "0")}{" "}
          năm{" "}
          {quotationDate.getFullYear()}
        </div>

        <div className="document-title">
          BẢNG BÁO GIÁ &amp; XÁC NHẬN
          ĐẶT HÀNG
        </div>

        <section className="buyer-section">
          <div className="buyer-row">
            <span className="buyer-label">
              Kính gửi :
            </span>

            <span>
              {quotation.buyer
                ?.companyName || ""}
            </span>
          </div>

          <div className="buyer-row">
            <span className="buyer-label">
              Địa chỉ :
            </span>

            <span>
              {quotation.buyer
                ?.address || ""}
            </span>
          </div>

          <div className="buyer-row">
            <span className="buyer-label">
              MST:
            </span>

            <span>
              {quotation.buyer
                ?.taxCode || ""}
            </span>
          </div>

          <div className="buyer-contact-grid">
            <div className="buyer-row">
              <span className="buyer-label">
                SĐT :
              </span>

              <span>
                {quotation.buyer
                  ?.phone || ""}
              </span>
            </div>

            <div className="buyer-row email-row">
              <span className="buyer-label email-label">
                Email:
              </span>

              <span className="buyer-email">
                {quotation.buyer
                  ?.email || ""}
              </span>
            </div>
          </div>
        </section>

        <section className="intro-text">
          <p>
            Công ty TNHH Công nghệ
            Nhipro xin gửi tới Quý Công
            ty lời chào trân trọng nhất,
            cảm ơn quý khách hàng đã
            quan tâm đến sản phẩm của
            công ty chúng tôi.
          </p>

          <p>
            Chúng tôi xin gửi đến Quý
            khách hàng bảng báo giá như
            sau:
          </p>
        </section>

        <table className="product-table">
          <thead>
            <tr>
              <th className="col-index">
                STT
              </th>

              <th className="col-product">
                Tên Sản Phẩm
              </th>

              <th className="col-unit">
                ĐVT
              </th>

              <th className="col-quantity">
                SL
              </th>

              <th className="col-price">
                Đơn Giá
              </th>

              <th className="col-total">
                Thành Tiền
              </th>

              <th className="col-note">
                Ghi Chú
              </th>
            </tr>
          </thead>

          <tbody>
            {displayedItems.map(
              (item, index) => {
                const lineSubtotal =
                  toNumber(
                    item.quantity
                  ) *
                  toNumber(
                    item.price
                  );

                return (
                  <tr
                    key={
                      item.id ||
                      `${index}-${getItemName(
                        item
                      )}`
                    }
                  >
                    <td className="center">
                      {index + 1}
                    </td>

                    <td>
                      <div className="product-name">
                        {getItemName(
                          item
                        )}
                      </div>

                    </td>

                    <td className="center">
                      {item.unit ||
                        "cái"}
                    </td>

                    <td className="center">
                      {formatMoney(
                        item.quantity
                      )}
                    </td>

                    <td className="money">
                      {formatMoney(
                        item.price
                      )}
                    </td>

                    <td className="money">
                      {formatMoney(
                        lineSubtotal
                      )}
                    </td>

                    <td>
                      {item.note || ""}
                    </td>
                  </tr>
                );
              }
            )}

            <tr className="summary-row">
              <td
                colSpan={5}
                className="summary-label"
              >
                Tiền hàng trước thuế:
              </td>

              <td className="money summary-value">
                {formatMoney(
                  subtotal
                )}
              </td>

              <td />
            </tr>

            <tr className="summary-row">
              <td
  colSpan={5}
  className="summary-label"
>
  Thuế VAT
  {vatRates.length > 0
    ? ` (${vatRates.join("%, ")}%)`
    : " (0%)"}
  :
</td>

              <td className="money summary-value">
                {formatMoney(
                  vatAmount
                )}
              </td>

              <td />
            </tr>

            <tr className="summary-row total-row">
              <td
                colSpan={5}
                className="summary-label"
              >
                Tổng cộng sau thuế:
              </td>

              <td className="money summary-value">
                {formatMoney(
                  total
                )}
              </td>

              <td />
            </tr>
          </tbody>
        </table>

        <section className="terms">
          <h3>Ghi Chú:</h3>

          <p>
            * Báo giá trên có giá trị
            trong vòng {validDays} ngày
            kể từ ngày báo.
          </p>

          <h3>
            Thời gian giao hàng và bảo
            hành sản phẩm:
          </h3>

          <p>
            * Giá trên chưa bao gồm chi
            phí vận chuyển.
          </p>

          <p>
            * Hàng được thực hiện trong
            vòng 25 đến 30 ngày kể từ
            ngày thực hiện hợp đồng.
          </p>

          <p>
            * Thiết bị được bảo hành 12
            tháng đối với lỗi kỹ thuật
            do nhà sản xuất.
          </p>

          <h3>Thanh toán:</h3>

          <p>
            * Thanh toán 100% trước khi
            giao hàng.
          </p>

          <p>
            * Thanh toán bằng chuyển
            khoản:
          </p>

          <div className="bank-info">
            <p>
              Đơn vị thụ hưởng:{" "}
              <strong>
                {seller.bankOwner}
              </strong>
            </p>

            <p>
              Tài khoản số:{" "}
              <strong>
                {seller.bankAccount}
              </strong>{" "}
              – tại{" "}
              <strong>
                {seller.bankName}
              </strong>{" "}
              -{" "}
              <strong>
                {seller.bankBranch}
              </strong>
            </p>
          </div>
        </section>

        <section className="signatures">
          <div>
            <h3>
              XÁC NHẬN BÊN MUA
            </h3>

            <p>
              (Ký, ghi rõ họ tên)
            </p>
          </div>

          <div>
            <h3>
              {seller.companyName}
            </h3>

            <p>
              (Ký, đóng dấu và ghi rõ
              họ tên)
            </p>
          </div>
        </section>
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #e5e7eb;
          color: #111;
          font-family:
            "Times New Roman",
            Times,
            serif;
        }

        .screen-toolbar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 12px 20px;
          background: #111827;
          box-shadow:
            0 2px 8px
            rgba(0, 0, 0, 0.2);
        }

        .screen-toolbar button {
          cursor: pointer;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          padding: 9px 16px;
          color: #111827;
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
        }

        .screen-toolbar button.primary {
          border-color: #047857;
          background: #059669;
          color: #fff;
        }

        .screen-message {
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          padding: 30px;
          font-family: Arial, sans-serif;
          font-size: 18px;
        }

        .screen-message.error {
          color: #b91c1c;
        }

        .quotation-page {
          width: 210mm;
          min-height: 297mm;
          margin: 18px auto;
          background: #fff;
          padding: 10mm 10mm 12mm;
          box-shadow:
            0 4px 20px
            rgba(0, 0, 0, 0.18);
          font-size: 13.5px;
          line-height: 1.25;
        }

        .seller-header {
  display: grid;
  grid-template-columns: 50mm 1fr;
  column-gap: 4mm;
  align-items: center;
}

.logo-box {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
}

.company-logo {
  display: block;
  width: 48mm;
  height: auto;
  object-fit: contain;
}

        .seller-information {
  display:flex;
  flex-direction:column;
  justify-content:center;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

        .seller-information h1 {
  margin: 0 0 3px;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 800;
}

        .seller-contact-row {
          display: flex;
          gap: 32px;
        }

        .double-rule {
          height: 5px;
          margin-top: 0mm;
          border-top: 3px double #111;
        }

        .document-date {
          margin-top: 5mm;
          padding-right: 13mm;
          text-align: right;
          font-size: 15px;
          font-style: italic;
        }

        .document-title {
          margin-top: 2mm;
          background: #fffec5;
          padding: 3mm 2mm;
          color: #ed1717;
          text-align: center;
          font-size: 21px;
          font-weight: 800;
        }

        .buyer-section {
          margin-top: 4mm;
        }

        .buyer-row {
          display: flex;
          min-height: 6mm;
          align-items: flex-start;
        }

        .buyer-label {
          width: 26mm;
          flex: 0 0 26mm;
          color: #0877be;
          font-size: 15px;
          font-weight: 700;
        }

        .buyer-contact-grid {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          column-gap: 10mm;
        }

        .email-row {
          justify-content: flex-start;
        }

        .email-label {
          width: auto;
          flex: 0 0 auto;
          margin-right: 8mm;
          color: #111;
          font-weight: 400;
        }

        .buyer-email {
          color: #f00;
        }

        .intro-text {
          margin: 5mm 0 3mm;
          font-size: 14px;
          font-style: italic;
        }

        .intro-text p {
          margin: 0;
        }

        .product-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .product-table th,
        .product-table td {
          border: 1px solid #111;
        }

        .product-table th {
          background: #0877be;
          padding: 3.2mm 1.5mm;
          color: #fff;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
        }

        .product-table td {
          min-height: 10mm;
          padding: 2.3mm 1.5mm;
          vertical-align: middle;
        }

        .product-table tbody tr:not(.summary-row) td {
          height: 15mm;
        }

        .col-index {
          width: 9mm;
        }

        .col-product {
          width: 83mm;
        }

        .col-unit {
          width: 14mm;
        }

        .col-quantity {
          width: 14mm;
        }

        .col-price {
          width: 23mm;
        }

        .col-total {
          width: 27mm;
        }

        .col-note {
          width: 25mm;
        }

        .center {
          text-align: center;
        }

        .money {
          text-align: right;
          white-space: nowrap;
        }

        .product-name {
          font-weight: 600;
        }

        .product-code {
          margin-top: 1mm;
          color: #555;
          font-size: 10px;
        }

        .summary-row td {
          height: 7mm;
          padding-top: 1.5mm;
          padding-bottom: 1.5mm;
        }

        .summary-label {
          color: #f00;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
        }

        .summary-value {
          color: #f00;
          font-weight: 800;
        }

        .total-row td {
          font-size: 14px;
        }

        .terms {
          margin-top: 4mm;
          font-size: 13.5px;
        }

        .terms h3 {
          margin: 3mm 0 1mm;
          font-size: 14px;
        }

        .terms p {
          margin: 1.8mm 0;
          padding-left: 10mm;
        }

        .bank-info p {
          padding-left: 10mm;
        }

        .signatures {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 15mm;
          min-height: 35mm;
          margin-top: 7mm;
          text-align: center;
          page-break-inside: avoid;
        }

        .signatures h3 {
          margin: 0;
          font-size: 14px;
        }

        .signatures p {
          margin-top: 2mm;
          color: #555;
          font-size: 11px;
          font-style: italic;
        }

        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        @media print {
          html,
          body {
            background: #fff;
          }

          .screen-toolbar {
            display: none !important;
          }

          .quotation-page {
            width: auto;
            min-height: auto;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }

          .product-table thead {
            display: table-header-group;
          }

          .product-table tr,
          .terms h3,
          .terms p {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }

        @media screen and (max-width: 900px) {
          .quotation-page {
            transform-origin:
              top left;
          }
        }
      `}</style>
    </>
  );
}

export default function QuotationPrintPage() {
  return (
    <Suspense
      fallback={
        <main className="screen-message">
          Đang tải báo giá...
        </main>
      }
    >
      <QuotationPrintContent />
    </Suspense>
  );
}