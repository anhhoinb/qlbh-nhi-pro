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
  terms?: {
    deliveryTime?: string;
    warrantyTime?: string;
    shippingIncluded?: boolean;
    shippingNote?: string;
  };
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

  const exportExcel = async () => {
    try {
      if (!quotation) {
        alert("Không có dữ liệu báo giá để xuất Excel");
        return;
      }

      /*
       * Chỉ tải thư viện khi bấm Xuất Excel.
       * File mẫu phải nằm tại: public/templates/BG.xlsx
       */
      const ExcelJSModule = await import("exceljs");
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;

      const templateResponse = await fetch("/templates/BG.xlsx", {
        cache: "no-store",
      });

      if (!templateResponse.ok) {
        throw new Error(
          "Không tìm thấy file mẫu public/templates/BG.xlsx"
        );
      }

      const templateBuffer = await templateResponse.arrayBuffer();
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(templateBuffer);

      const worksheet =
        workbook.getWorksheet("PBG") || workbook.worksheets[0];

      if (!worksheet) {
        throw new Error("Không tìm thấy sheet PBG trong file mẫu BG.xlsx");
      }

      const exportItems =
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

      /*
       * File mẫu có dòng sản phẩm đầu tiên tại dòng 15.
       * Nếu có nhiều sản phẩm, chèn thêm dòng trước phần tổng tiền.
       */
      const firstProductRow = 15;
      const extraItemCount = Math.max(exportItems.length - 1, 0);

      /*
       * Gỡ toàn bộ merge liên quan đến dòng sản phẩm mẫu và 3 dòng tổng tiền
       * TRƯỚC KHI chèn dòng. Nếu không, ExcelJS có thể tạo các vùng merge
       * chồng lấn khi insertRows(), dẫn đến lỗi "Cannot merge already merged cells".
       */
      [
        `B${firstProductRow}:D${firstProductRow}`,
        `A${firstProductRow + 1}:G${firstProductRow + 1}`,
        `A${firstProductRow + 2}:G${firstProductRow + 2}`,
        `A${firstProductRow + 3}:G${firstProductRow + 3}`,

        /*
         * Các vùng merge nằm phía dưới bảng sản phẩm cũng phải được gỡ
         * trước khi insertRows(). Nếu giữ nguyên, ExcelJS dịch dữ liệu
         * nhưng không dịch vùng merge ổn định, làm chữ ký bị lặp/chồng.
         */
        "A34:D34",
        "E34:I34",
        "A35:D35",
        "E36:H36",
      ].forEach((range) => {
        try {
          worksheet.unMergeCells(range);
        } catch {
          // Bỏ qua nếu vùng chưa merge.
        }
      });

      if (extraItemCount > 0) {
        worksheet.insertRows(
          firstProductRow + 1,
          Array.from({ length: extraItemCount }, () => []),
          "i"
        );
      }

      /*
       * Sao chép định dạng dòng sản phẩm mẫu cho toàn bộ sản phẩm.
       */
      const templateRow = worksheet.getRow(firstProductRow);

      for (
        let itemIndex = 0;
        itemIndex < exportItems.length;
        itemIndex += 1
      ) {
        const rowNumber = firstProductRow + itemIndex;
        const targetRow = worksheet.getRow(rowNumber);

        if (itemIndex > 0) {
          targetRow.height = templateRow.height;

          for (let column = 1; column <= 9; column += 1) {
            const sourceCell = templateRow.getCell(column);
            const targetCell = targetRow.getCell(column);

            targetCell.style = {
              ...sourceCell.style,
              font: sourceCell.font
                ? { ...sourceCell.font }
                : undefined,
              fill: sourceCell.fill
                ? { ...sourceCell.fill }
                : undefined,
              border: sourceCell.border
                ? {
                    top: sourceCell.border.top
                      ? { ...sourceCell.border.top }
                      : undefined,
                    left: sourceCell.border.left
                      ? { ...sourceCell.border.left }
                      : undefined,
                    bottom: sourceCell.border.bottom
                      ? { ...sourceCell.border.bottom }
                      : undefined,
                    right: sourceCell.border.right
                      ? { ...sourceCell.border.right }
                      : undefined,
                    diagonal: sourceCell.border.diagonal
                      ? { ...sourceCell.border.diagonal }
                      : undefined,
                  }
                : undefined,
              alignment: sourceCell.alignment
                ? { ...sourceCell.alignment }
                : undefined,
              protection: sourceCell.protection
                ? { ...sourceCell.protection }
                : undefined,
            };

            targetCell.numFmt = sourceCell.numFmt;
          }
        }

        /*
         * Sau khi đã gỡ merge trước khi chèn dòng, có thể merge lại an toàn.
         */
        worksheet.mergeCells(`B${rowNumber}:D${rowNumber}`);

        const item = exportItems[itemIndex];
        const quantity = toNumber(item.quantity);
        const price = toNumber(item.price);

        worksheet.getCell(`A${rowNumber}`).value = itemIndex + 1;
        worksheet.getCell(`B${rowNumber}`).value = getItemName(item);
        worksheet.getCell(`E${rowNumber}`).value = item.unit || "cái";
        worksheet.getCell(`F${rowNumber}`).value = quantity;
        worksheet.getCell(`G${rowNumber}`).value = price;
        worksheet.getCell(`H${rowNumber}`).value = {
          formula: `IFERROR(F${rowNumber}*G${rowNumber},"")`,
          result: quantity * price,
        };
        worksheet.getCell(`I${rowNumber}`).value = item.note || "";

        worksheet.getCell(`F${rowNumber}`).numFmt = "#,##0";
        worksheet.getCell(`G${rowNumber}`).numFmt = "#,##0";
        worksheet.getCell(`H${rowNumber}`).numFmt = "#,##0";
      }

      /*
       * Sau khi chèn dòng, các phần phía dưới được dời xuống tương ứng.
       */
      const subtotalRow = firstProductRow + exportItems.length;
      const vatRow = subtotalRow + 1;
      const totalRow = subtotalRow + 2;
      const spacerRow = subtotalRow + 3;
      const noteTitleRow = subtotalRow + 4;
      const validityRow = subtotalRow + 5;
      const deliveryTitleRow = subtotalRow + 6;
      const shippingRow = subtotalRow + 7;
      const shippingNoteRow = subtotalRow + 8;
      const deliveryRow = subtotalRow + 9;
      const warrantyRow = subtotalRow + 10;

      /*
       * Đảm bảo vùng tổng tiền vẫn được merge đúng sau khi chèn dòng.
       */
      [subtotalRow, vatRow, totalRow].forEach((rowNumber) => {
        try {
          worksheet.unMergeCells(`A${rowNumber}:G${rowNumber}`);
        } catch {
          // Không cần xử lý nếu vùng chưa merge.
        }

        worksheet.mergeCells(`A${rowNumber}:G${rowNumber}`);
      });

      const itemLastRow = firstProductRow + exportItems.length - 1;

      worksheet.getCell(`A${subtotalRow}`).value =
        "Tiền hàng trước thuế:";
      worksheet.getCell(`H${subtotalRow}`).value = {
        formula: `SUM(H${firstProductRow}:H${itemLastRow})`,
        result: subtotal,
      };

      const vatText =
        vatRates.length > 0
          ? `Thuế VAT (${vatRates.join("%, ")}%):`
          : "Thuế VAT (0%):";

      worksheet.getCell(`A${vatRow}`).value = vatText;
      worksheet.getCell(`H${vatRow}`).value = {
        formula:
          vatRates.length === 1
            ? `H${subtotalRow}*${vatRates[0]}%`
            : `${vatAmount}`,
        result: vatAmount,
      };

      worksheet.getCell(`A${totalRow}`).value =
        "Tổng cộng sau thuế:";
      worksheet.getCell(`H${totalRow}`).value = {
        formula: `H${subtotalRow}+H${vatRow}`,
        result: total,
      };

      worksheet.getCell(`H${subtotalRow}`).numFmt = "#,##0";
      worksheet.getCell(`H${vatRow}`).numFmt = "#,##0";
      worksheet.getCell(`H${totalRow}`).numFmt = "#,##0";

      /*
       * Thông tin đầu báo giá.
       */
      worksheet.getCell("D1").value = [
        seller.companyName || "",
        `MST: ${seller.taxCode || ""}`,
        `SĐT: ${seller.phone || ""}             Email: ${
          seller.email || ""
        }`,
        `Địa Chỉ: ${seller.address || ""}`,
      ].join("\n");

      worksheet.getCell("E6").value =
        `TP. HCM, ngày ${String(quotationDate.getDate()).padStart(
          2,
          "0"
        )} tháng ${String(quotationDate.getMonth() + 1).padStart(
          2,
          "0"
        )} năm ${quotationDate.getFullYear()}`;

      worksheet.getCell("C9").value =
        quotation.buyer?.companyName || "";
      worksheet.getCell("C10").value =
        quotation.buyer?.address || "";
      worksheet.getCell("C11").value =
        quotation.buyer?.taxCode || "";
      worksheet.getCell("C12").value =
        quotation.buyer?.phone || "";
      worksheet.getCell("F12").value =
        quotation.buyer?.email || "";

      /*
       * Điều kiện báo giá.
       */
      worksheet.getCell(`B${validityRow}`).value =
        `* Báo giá trên có giá trị trong vòng ${validDays} ngày kể từ ngày báo.`;

      worksheet.getCell(`B${shippingRow}`).value =
        quotation.terms?.shippingIncluded
          ? "* Giá trên đã bao gồm chi phí vận chuyển."
          : "* Giá trên chưa bao gồm chi phí vận chuyển.";

      if (quotation.terms?.shippingNote) {
        worksheet.getCell(`B${shippingNoteRow}`).value =
          `* ${quotation.terms.shippingNote}`;
      } else {
        worksheet.getCell(`B${shippingNoteRow}`).value =
          `* ${
            quotation.terms?.deliveryTime ||
            "Hàng được thực hiện trong vòng 25 đến 30 ngày kể từ ngày thực hiện hợp đồng."
          }`;
      }

      if (quotation.terms?.shippingNote) {
        worksheet.getCell(`B${deliveryRow}`).value =
          `* ${
            quotation.terms?.deliveryTime ||
            "Hàng được thực hiện trong vòng 25 đến 30 ngày kể từ ngày thực hiện hợp đồng."
          }`;
        worksheet.getCell(`B${warrantyRow}`).value =
          `* ${
            quotation.terms?.warrantyTime ||
            "Thiết bị được bảo hành 12 tháng đối với lỗi kỹ thuật do nhà sản xuất."
          }`;
      } else {
        worksheet.getCell(`B${deliveryRow}`).value =
          `* ${
            quotation.terms?.warrantyTime ||
            "Thiết bị được bảo hành 12 tháng đối với lỗi kỹ thuật do nhà sản xuất."
          }`;
        worksheet.getCell(`B${warrantyRow}`).value = "";
      }

      /*
       * Ngân hàng và chữ ký.
       * Các dòng này cũng tự dịch xuống khi thêm sản phẩm.
       */
      const bankOwnerRow = subtotalRow + 15;
      const bankAccountRow = subtotalRow + 16;
      const signatureRow = subtotalRow + 18;
      const buyerSignatureBlankRow = signatureRow + 1;
      const sellerSignatureBlankRow = signatureRow + 2;

      /*
       * Khôi phục đúng các vùng merge chữ ký đã có trong file mẫu.
       * Không ghi thêm nội dung mới vào nhiều ô, tránh bị lặp chữ.
       */
      [
        `A${signatureRow}:D${signatureRow}`,
        `E${signatureRow}:I${signatureRow}`,
        `A${buyerSignatureBlankRow}:D${buyerSignatureBlankRow}`,
        `E${sellerSignatureBlankRow}:H${sellerSignatureBlankRow}`,
      ].forEach((range) => {
        try {
          worksheet.unMergeCells(range);
        } catch {
          // Bỏ qua nếu chưa merge.
        }

        worksheet.mergeCells(range);
      });

      /*
       * Dòng tiêu đề Thanh toán cần merge để không bị cắt còn chữ "Thanh".
       */
      const paymentTitleRow = subtotalRow + 10;

      try {
        worksheet.unMergeCells(`A${paymentTitleRow}:I${paymentTitleRow}`);
      } catch {
        // Bỏ qua nếu chưa merge.
      }

      worksheet.mergeCells(`A${paymentTitleRow}:I${paymentTitleRow}`);
      worksheet.getCell(`A${paymentTitleRow}`).value = "Thanh toán:";

      worksheet.getCell(`B${bankOwnerRow}`).value =
        `Đơn vị thụ hưởng: ${seller.bankOwner || ""}`;

      worksheet.getCell(`B${bankAccountRow}`).value =
        `Tài khoản số: ${seller.bankAccount || ""} – tại ${
          seller.bankName || ""
        } - ${seller.bankBranch || ""}`;

      worksheet.getCell(`A${signatureRow}`).value =
        "XÁC NHẬN BÊN MUA";

      worksheet.getCell(`E${signatureRow}`).value =
        seller.companyName || "";

      /*
       * Thiết lập in A4 và chỉ in vùng báo giá.
       */
      worksheet.pageSetup = {
        ...worksheet.pageSetup,
        paperSize: 9,
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.75,
          right: 0.75,
          top: 0.4,
          bottom: 0.75,
          header: 0.2,
          footer: 0.2,
        },
        printArea: `A1:I${signatureRow + 2}`,
      };

      worksheet.views = [
        {
          state: "normal",
          showGridLines: false,
        },
      ];

      workbook.calcProperties.fullCalcOnLoad = true;

      const safeCode = String(
        quotation.quotationCode || "Bao-gia-xem-truoc"
      ).replace(/[\/:*?"<>|]/g, "-");

      const outputBuffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([outputBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `${safeCode}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (exportError) {
      console.error("EXPORT EXCEL ERROR:", exportError);

      alert(
        exportError instanceof Error
          ? `Không thể xuất Excel.

${exportError.message}`
          : "Không thể xuất Excel"
      );
    }
  };

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
          className="excel"
          onClick={exportExcel}
        >
          Xuất Excel
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
        <table className="print-layout">
          <thead>
            <tr>
              <td>
                <div className="print-header">
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
                </div>
              </td>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <div className="print-content">
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

                    <td className="note-cell">
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

          <p>* Báo giá trên có giá trị trong vòng {validDays} ngày kể từ ngày báo.</p>

          <h3>Thời gian giao hàng và bảo hành sản phẩm:</h3>

          <p>* {quotation.terms?.shippingIncluded ? "Giá trên đã bao gồm chi phí vận chuyển." : "Giá trên chưa bao gồm chi phí vận chuyển."}</p>

          {quotation.terms?.shippingNote && (
            <p>* {quotation.terms.shippingNote}</p>
          )}

          <p>* {quotation.terms?.deliveryTime || "Hàng được thực hiện trong vòng 25 đến 30 ngày kể từ ngày thực hiện hợp đồng."}</p>

          <p>* {quotation.terms?.warrantyTime || "Thiết bị được bảo hành 12 tháng đối với lỗi kỹ thuật do nhà sản xuất."}</p>

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
                </div>
              </td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td>
                <div className="print-footer">
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
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
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

        .screen-toolbar button.excel {
          border-color: #166534;
          background: #16a34a;
          color: #fff;
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
  margin: 8px auto;
  background: #fff;
  padding: 10mm 20mm 20mm;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.18);
  font-size: 13.5px;
  line-height: 1.25;
}

        .print-layout {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .print-layout > thead > tr > td,
        .print-layout > tbody > tr > td,
        .print-layout > tfoot > tr > td {
          border: 0;
          padding: 0;
          vertical-align: top;
        }

        .print-header {
          padding-bottom: 1mm;
        }

        .print-content {
          width: 100%;
        }

        .print-footer {
          padding-top: 0;
        }

        .seller-header {
          display: grid;
          grid-template-columns: 44mm 1fr;
          column-gap: 3mm;
          align-items: center;
        }

.logo-box {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

.company-logo {
          display: block;
          width: 42mm;
          height: auto;
          object-fit: contain;
        }

        .seller-information {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.3;
        }

        .seller-information h1 {
          margin: 0 0 2px;
          font-size: 20px;
          line-height: 1.1;
          font-weight: 800;
          white-space: nowrap;
        }

        .seller-contact-row {
          display: flex;
          gap: 20px;
          white-space: nowrap;
        }

        .double-rule {
          height: 3px;
          margin-top: 0;
          border-top: 3px double #111;
        }

        .document-date {
          margin-top: 2mm;
          padding-right: 8mm;
          text-align: right;
          font-size: 15px;
          font-style: italic;
        }

        .document-title {
  margin-top: 2mm;
  background: transparent;
  padding: 3mm 2mm;
  color: #000;
  text-align: center;
  font-size: 21px;
  font-weight: 800;
  border: none;
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
          max-width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .product-table th,
        .product-table td {
          border: 1px solid #111;
        }

        .product-table th {
          background: #fff;
          padding: 1mm 1.5mm;
          color: #000;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.1;
          vertical-align: middle;
        }

        .product-table td {
          padding: 1.4mm 1.5mm;
          line-height: 1.2;
          vertical-align: middle;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .product-table tbody tr {
          height: auto;
        }

        .product-table tbody tr td {
          min-height: 0;
        }

        .col-index {
          width: 9mm;
          text-align: center;
        }

        .col-product {
          width: 77mm;
        }

        .col-unit {
          width: 12mm;
        }

        .col-quantity {
          width: 12mm;
        }

        .col-price {
          width: 19mm;
        }

        .col-total {
          width: 21mm;
        }

        .col-note {
          width: 20mm;
        }

        .center {
          text-align: center;
          vertical-align: middle !important;
        }

        .product-table th.col-index {
          padding-left: 0;
          padding-right: 0;
          text-align: center;
          vertical-align: middle;
        }

        .money {
          text-align: right;
          white-space: nowrap;
        }

        .product-name {
          font-weight: 400;
          line-height: 1.4;
        }

        .note-cell {
          white-space: pre-wrap;
          line-height: 1.4;
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
          min-height: 0;
          margin-top: 2mm;
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
  margin: 10mm 20mm 20mm;
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

          .print-layout > thead {
            display: table-header-group;
          }

          .print-layout > tbody {
            display: table-row-group;
          }

          .print-layout > tfoot {
            display: table-footer-group;
          }

          .print-header,
          .print-footer {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .product-table {
            page-break-inside: auto;
          }

          .product-table thead {
            display: table-header-group;
          }

          .product-table tbody {
            display: table-row-group;
          }

          .product-table tr,
          .terms h3,
          .terms p {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .signatures {
            min-height: 0;
            margin-top: 2mm;
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