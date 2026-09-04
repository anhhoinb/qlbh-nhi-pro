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
  )
    .filter((rate) => rate > 0)
    .sort((a, b) => a - b);

  const vatBreakdown = useMemo(() => {
    const grouped = new Map<number, number>();

    items.forEach((item) => {
      const rate = toNumber(item.tax);

      if (rate <= 0) {
        return;
      }

      const lineSubtotal =
        toNumber(item.quantity) *
        toNumber(item.price);

      const lineVat =
        lineSubtotal * (rate / 100);

      grouped.set(
        rate,
        (grouped.get(rate) || 0) + lineVat
      );
    });

    return Array.from(grouped.entries())
      .map(([rate, amount]) => ({
        rate,
        amount,
      }))
      .sort((a, b) => a.rate - b.rate);
  }, [items]);

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

      const vatEntries =
        vatBreakdown.length > 0
          ? vatBreakdown
          : [{ rate: 0, amount: 0 }];

      const border = {
        top: { style: "thin", color: { argb: "FF111111" } },
        left: { style: "thin", color: { argb: "FF111111" } },
        bottom: { style: "thin", color: { argb: "FF111111" } },
        right: { style: "thin", color: { argb: "FF111111" } },
      } as const;

      const baseFont = {
        name: "Times New Roman",
        size: 10,
        color: { argb: "FF111111" },
      } as const;

      const getWrappedRowHeight = (
        value: string,
        charsPerLine: number,
        minHeight = 22
      ) => {
        const lines = String(value || "")
          .split(/\r?\n/)
          .reduce(
            (sum, line) =>
              sum +
              Math.max(
                1,
                Math.ceil(line.length / charsPerLine)
              ),
            0
          );

        return Math.max(minHeight, lines * 17);
      };

      /*
       * PBG: dùng trực tiếp file mẫu BG.xlsx (BG(8) chuẩn).
       * Không dựng lại sheet, không đổi độ rộng cột, không sửa bố cục mẫu.
       * Chỉ chèn dòng khi cần và đổ dữ liệu báo giá.
       */

      /* Thông tin đầu báo giá */
      worksheet.getCell("D1").value = [
        seller.companyName || "",
        `MST: ${seller.taxCode || ""}`,
        `SĐT: ${seller.phone || ""}             Email: ${
          seller.email || ""
        }`,
        `Địa Chỉ: ${seller.address || ""}`,
      ].join("\n");

      worksheet.getCell("E6").value =
        `TP. HCM, ngày ${String(
          quotationDate.getDate()
        ).padStart(2, "0")} tháng ${String(
          quotationDate.getMonth() + 1
        ).padStart(2, "0")} năm ${quotationDate.getFullYear()}`;

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

      const firstProductRow = 15;
      const extraProductRows = Math.max(exportItems.length - 1, 0);

      /*
       * Các merge động được gỡ trước khi chèn dòng.
       * Header B14:D14 giữ nguyên đúng file mẫu.
       */
      ["B15:D15", "A16:H16", "A17:H17", "A18:H18", "A32:D32", "E32:J32"]
        .forEach((range) => {
          try {
            worksheet.unMergeCells(range);
          } catch {}
        });

      const copyTemplateRow = (
        sourceRowNumber: number,
        targetRowNumber: number
      ) => {
        const sourceRow = worksheet.getRow(sourceRowNumber);
        const targetRow = worksheet.getRow(targetRowNumber);

        targetRow.height = sourceRow.height;

        for (let column = 1; column <= 10; column += 1) {
          const sourceCell = sourceRow.getCell(column);
          const targetCell = targetRow.getCell(column);

          targetCell.style = {
            ...sourceCell.style,
            font: sourceCell.font ? { ...sourceCell.font } : undefined,
            fill: sourceCell.fill ? { ...sourceCell.fill } : undefined,
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
                }
              : undefined,
            alignment: sourceCell.alignment
              ? { ...sourceCell.alignment }
              : undefined,
          };

          targetCell.numFmt = sourceCell.numFmt;
        }
      };

      /*
       * File mẫu có sẵn 1 dòng sản phẩm (15).
       * Chỉ chèn thêm khi báo giá có từ 2 sản phẩm trở lên.
       */
      if (extraProductRows > 0) {
        worksheet.insertRows(
          firstProductRow + 1,
          Array.from({ length: extraProductRows }, () => []),
          "i"
        );
      }

      exportItems.forEach((item, index) => {
        const rowNumber = firstProductRow + index;

        if (index > 0) {
          copyTemplateRow(firstProductRow, rowNumber);
        }

        try {
          worksheet.unMergeCells(`B${rowNumber}:D${rowNumber}`);
        } catch {}
        worksheet.mergeCells(`B${rowNumber}:D${rowNumber}`);

        const productName = getItemName(item);
        const quantity = toNumber(item.quantity);
        const price = toNumber(item.price);
        const tax = toNumber(item.tax);
        const note = String(item.note || "");

        worksheet.getCell(`A${rowNumber}`).value = index + 1;
        worksheet.getCell(`B${rowNumber}`).value = productName;
        worksheet.getCell(`E${rowNumber}`).value = item.unit || "cái";
        worksheet.getCell(`F${rowNumber}`).value = quantity;
        worksheet.getCell(`G${rowNumber}`).value = price;
        worksheet.getCell(`H${rowNumber}`).value =
          tax > 0 ? `${tax}%` : "";
        worksheet.getCell(`I${rowNumber}`).value = quantity * price;
        worksheet.getCell(`J${rowNumber}`).value = note;

        worksheet.getCell(`F${rowNumber}`).numFmt = "#,##0";
        worksheet.getCell(`G${rowNumber}`).numFmt = "#,##0";
        worksheet.getCell(`I${rowNumber}`).numFmt = "#,##0";

        worksheet.getCell(`B${rowNumber}`).alignment = {
          ...(worksheet.getCell(`B${rowNumber}`).alignment || {}),
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
        worksheet.getCell(`J${rowNumber}`).alignment = {
          ...(worksheet.getCell(`J${rowNumber}`).alignment || {}),
          horizontal: "left",
          vertical: "top",
          wrapText: true,
        };

        worksheet.getRow(rowNumber).height = Math.max(
          getWrappedRowHeight(productName, 48, 21),
          getWrappedRowHeight(note, 18, 21)
        );
      });

      /*
       * Tổng tiền nằm ngay sau danh sách sản phẩm.
       * VAT hiển thị đúng như bản xem trước:
       * 8% và 10% có dòng riêng; không có VAT thì không hiện dòng VAT.
       */
      const subtotalRow = firstProductRow + exportItems.length;
      const templateVatRow = subtotalRow + 1;

      const pbgVatEntries = vatBreakdown;

      if (pbgVatEntries.length === 0) {
        worksheet.spliceRows(templateVatRow, 1);
      } else if (pbgVatEntries.length > 1) {
        worksheet.insertRows(
          templateVatRow + 1,
          Array.from({ length: pbgVatEntries.length - 1 }, () => []),
          "i"
        );

        for (let index = 1; index < pbgVatEntries.length; index += 1) {
          copyTemplateRow(templateVatRow, templateVatRow + index);
        }
      }

      const totalRow = subtotalRow + 1 + pbgVatEntries.length;

      const writeSummaryRow = (
        rowNumber: number,
        label: string,
        amount: number
      ) => {
        try {
          worksheet.unMergeCells(`A${rowNumber}:H${rowNumber}`);
        } catch {}
        worksheet.mergeCells(`A${rowNumber}:H${rowNumber}`);

        worksheet.getCell(`A${rowNumber}`).value = label;
        worksheet.getCell(`I${rowNumber}`).value = Math.round(amount);
        worksheet.getCell(`J${rowNumber}`).value = null;
        worksheet.getCell(`I${rowNumber}`).numFmt = "#,##0";
      };

      writeSummaryRow(
        subtotalRow,
        "Tiền hàng trước thuế:",
        subtotal
      );

      pbgVatEntries.forEach((entry, index) => {
        writeSummaryRow(
          subtotalRow + 1 + index,
          `Thuế VAT (${entry.rate}%):`,
          entry.amount
        );
      });

      writeSummaryRow(
        totalRow,
        "Tổng cộng sau thuế:",
        total
      );

      /*
       * Các dòng dưới bảng giữ nguyên style/khoảng cách của file mẫu.
       * Chỉ cập nhật nội dung theo dữ liệu báo giá.
       */
      const noteTitleRow = totalRow + 2;
      const validityRow = totalRow + 3;
      const deliveryTitleRow = totalRow + 4;
      const shippingRow = totalRow + 5;
      const deliveryRow = totalRow + 6;
      const warrantyRow = totalRow + 7;
      const paymentTitleRow = totalRow + 8;
      const payment100Row = totalRow + 9;
      const transferRow = totalRow + 10;
      const bankOwnerRow = totalRow + 11;
      const bankAccountRow = totalRow + 12;
      const signatureRow = totalRow + 14;

      worksheet.getCell(`A${noteTitleRow}`).value = "Ghi Chú:";
      worksheet.getCell(`B${validityRow}`).value =
        `* Báo giá trên có giá trị trong vòng ${validDays} ngày kể từ ngày báo.`;

      worksheet.getCell(`A${deliveryTitleRow}`).value =
        "Thời gian giao hàng và bảo hành sản phẩm:";

      worksheet.getCell(`B${shippingRow}`).value =
        quotation.terms?.shippingIncluded
          ? "* Giá trên đã bao gồm chi phí vận chuyển."
          : "* Giá trên chưa bao gồm chi phí vận chuyển.";

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

      worksheet.getCell(`A${paymentTitleRow}`).value = "Thanh toán:";
      worksheet.getCell(`B${payment100Row}`).value =
        "* Thanh toán 100% trước khi giao hàng.";
      worksheet.getCell(`B${transferRow}`).value =
        "* Thanh toán bằng chuyển khoản:";
      worksheet.getCell(`B${bankOwnerRow}`).value =
        `* Đơn vị thụ hưởng: ${seller.bankOwner || ""}`;
      worksheet.getCell(`B${bankAccountRow}`).value =
        `* Tài khoản số: ${seller.bankAccount || ""} – tại ${
          seller.bankName || ""
        } - ${seller.bankBranch || ""}`;

      /*
       * Các dòng nội dung dưới bảng dùng chữ đen.
       */
      [
        `B${validityRow}`,
        `B${deliveryRow}`,
        `B${warrantyRow}`,
        `B${bankOwnerRow}`,
        `B${bankAccountRow}`,
      ].forEach((cellAddress) => {
        const cell = worksheet.getCell(cellAddress);
        cell.font = {
          ...(cell.font || {}),
          color: { argb: "FF000000" },
        };
      });

      /*
       * Chỉ dòng phí vận chuyển màu đỏ.
       * Không tạo thêm border cho phần ghi chú/điều khoản/thanh toán.
       */
      worksheet.getCell(`B${shippingRow}`).font = {
        ...(worksheet.getCell(`B${shippingRow}`).font || {}),
        color: {
          argb: quotation.terms?.shippingIncluded
            ? "FF111111"
            : "FFFF0000",
        },
      };

      try {
        worksheet.unMergeCells(`A${signatureRow}:D${signatureRow}`);
      } catch {}
      try {
        worksheet.unMergeCells(`E${signatureRow}:J${signatureRow}`);
      } catch {}

      worksheet.mergeCells(`A${signatureRow}:D${signatureRow}`);
      worksheet.mergeCells(`E${signatureRow}:J${signatureRow}`);

      worksheet.getCell(`A${signatureRow}`).value =
        "XÁC NHẬN BÊN MUA";
      worksheet.getCell(`E${signatureRow}`).value =
        seller.companyName || "";

      worksheet.views = [
        {
          state: "normal",
          showGridLines: false,
        },
      ];

      worksheet.pageSetup = {
        ...worksheet.pageSetup,
        paperSize: 9,
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        printArea: `A1:J${signatureRow + 3}`,
      };

      // Ép màu chữ đen sau cùng để style từ file mẫu không ghi đè.
      [
        validityRow,
        deliveryRow,
        warrantyRow,
        bankOwnerRow,
        bankAccountRow,
      ].forEach((rowNumber) => {
        for (let column = 1; column <= 10; column += 1) {
          const cell = worksheet.getRow(rowNumber).getCell(column);
          cell.font = {
            ...(cell.font || {}),
            color: { argb: "FF000000" },
          };
        }
      });

      /*
       * BIÊN BẢN GIAO NHẬN - sheet PGH
       * Danh sách sản phẩm luôn lấy đúng theo danh sách của báo giá.
       * Chỉ hiển thị: STT, Tên sản phẩm, ĐVT, SL.
       */
      const deliveryWorksheet = workbook.getWorksheet("PGH");

      if (deliveryWorksheet) {
        const firstDeliveryProductRow = 21;
        const extraDeliveryItemCount = Math.max(exportItems.length - 1, 0);

        /*
         * Gỡ merge của dòng sản phẩm mẫu và khu vực chữ ký trước khi chèn dòng.
         * Làm như vậy để ExcelJS không tạo merge chồng lấn khi insertRows().
         */
        [
          `B${firstDeliveryProductRow}:G${firstDeliveryProductRow}`,
          "A23:J23",
          "A25:D25",
          "E25:I25",
          "A26:D26",
          "E26:I26",
        ].forEach((range) => {
          try {
            deliveryWorksheet.unMergeCells(range);
          } catch {
            // Bỏ qua nếu vùng chưa merge.
          }
        });

        if (extraDeliveryItemCount > 0) {
          deliveryWorksheet.insertRows(
            firstDeliveryProductRow + 1,
            Array.from({ length: extraDeliveryItemCount }, () => []),
            "i"
          );
        }

        const deliveryTemplateRow =
          deliveryWorksheet.getRow(firstDeliveryProductRow);

        for (
          let itemIndex = 0;
          itemIndex < exportItems.length;
          itemIndex += 1
        ) {
          const rowNumber = firstDeliveryProductRow + itemIndex;
          const targetRow = deliveryWorksheet.getRow(rowNumber);

          if (itemIndex > 0) {
            targetRow.height = deliveryTemplateRow.height;

            for (let column = 1; column <= 9; column += 1) {
              const sourceCell = deliveryTemplateRow.getCell(column);
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

          try {
            deliveryWorksheet.unMergeCells(
              `B${rowNumber}:G${rowNumber}`
            );
          } catch {
            // Bỏ qua nếu dòng chưa merge.
          }

          deliveryWorksheet.mergeCells(`B${rowNumber}:G${rowNumber}`);

          const item = exportItems[itemIndex];

          const deliveryProductName = getItemName(item);

          deliveryWorksheet.getCell(`A${rowNumber}`).value = itemIndex + 1;
          deliveryWorksheet.getCell(`B${rowNumber}`).value =
            deliveryProductName;
          deliveryWorksheet.getCell(`B${rowNumber}`).alignment = {
            ...(deliveryWorksheet.getCell(`B${rowNumber}`).alignment || {}),
            wrapText: true,
            vertical: "middle",
          };
          targetRow.height = getWrappedRowHeight(
            deliveryProductName,
            58,
            Number(deliveryTemplateRow.height || 22)
          );

          deliveryWorksheet.getCell(`H${rowNumber}`).value =
            item.unit || "cái";
          deliveryWorksheet.getCell(`I${rowNumber}`).value =
            toNumber(item.quantity);

          deliveryWorksheet.getCell(`I${rowNumber}`).numFmt = "#,##0";
        }

        /*
         * Khôi phục merge khu vực chữ ký sau khi số dòng sản phẩm thay đổi.
         */
        const deliveryLegalTextRow =
          23 + extraDeliveryItemCount;
        const deliverySignatureRow =
          25 + extraDeliveryItemCount;
        const deliverySignatureSubRow =
          26 + extraDeliveryItemCount;

        [
          `A${deliveryLegalTextRow}:J${deliveryLegalTextRow}`,
          `A${deliverySignatureRow}:D${deliverySignatureRow}`,
          `E${deliverySignatureRow}:I${deliverySignatureRow}`,
          `A${deliverySignatureSubRow}:D${deliverySignatureSubRow}`,
          `E${deliverySignatureSubRow}:I${deliverySignatureSubRow}`,
        ].forEach((range) => {
          try {
            deliveryWorksheet.unMergeCells(range);
          } catch {
            // Bỏ qua nếu vùng chưa merge.
          }

          deliveryWorksheet.mergeCells(range);
        });

        /*
         * Giữ toàn bộ biên bản giao nhận nằm trong khổ giấy A4 khi in.
         */
        deliveryWorksheet.pageSetup = {
          ...deliveryWorksheet.pageSetup,
          paperSize: 9,
          orientation: "portrait",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 1,
          margins: {
            left: 0.45,
            right: 0.45,
            top: 0.4,
            bottom: 0.5,
            header: 0.2,
            footer: 0.2,
          },
          printArea: `A1:I${deliverySignatureSubRow + 2}`,
        };

        deliveryWorksheet.views = [
          {
            state: "normal",
            showGridLines: false,
          },
        ];
      }

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

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 1500);
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

              <th className="col-vat">
                VAT
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

                    <td className="center">
                      {toNumber(item.tax)}%
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
                colSpan={6}
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

            {vatBreakdown.length > 0 ? (
              vatBreakdown.map((entry) => (
                <tr
                  className="summary-row"
                  key={`vat-${entry.rate}`}
                >
                  <td
                    colSpan={6}
                    className="summary-label"
                  >
                    Thuế VAT ({entry.rate}%):
                  </td>

                  <td className="money summary-value">
                    {formatMoney(entry.amount)}
                  </td>

                  <td />
                </tr>
              ))
            ) : (
              <tr className="summary-row">
                <td
                  colSpan={6}
                  className="summary-label"
                >
                  Thuế VAT (0%):
                </td>

                <td className="money summary-value">
                  0
                </td>

                <td />
              </tr>
            )}

            <tr className="summary-row total-row">
              <td
                colSpan={6}
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

          <p
            className={
              quotation.terms?.shippingIncluded
                ? undefined
                : "shipping-not-included"
            }
          >
            * {quotation.terms?.shippingIncluded
              ? "Giá trên đã bao gồm chi phí vận chuyển."
              : "Giá trên chưa bao gồm chi phí vận chuyển."}
          </p>

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
          padding: 1mm 0.8mm;
          color: #000;
          text-align: center;
          font-size: 12.5px;
          font-weight: 700;
          line-height: 1.1;
          vertical-align: middle;
          white-space: nowrap;
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
          width: 72mm;
        }

        .col-unit {
          width: 12mm;
        }

        .col-quantity {
          width: 12mm;
        }

        .col-price {
          width: 17mm;
        }

        .col-vat {
          width: 10mm;
        }

        .col-total {
          width: 21mm;
        }

        .col-note {
          width: 14mm;
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
          border-top: 1px solid #111;
          border-bottom: 1px solid #111;
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

        .shipping-not-included {
          color: #f00;
        }

        .terms h3 {
          margin: 3mm 0 1mm;
          font-size: 14px;
        }

        .terms h3:last-of-type {
          break-after: avoid;
          page-break-after: avoid;
        }

        .terms p {
          margin: 1.2mm 0;
          line-height: 1.25;
          white-space: normal;
          overflow: visible;
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