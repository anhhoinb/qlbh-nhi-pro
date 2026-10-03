import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";

/* =========================================================
   HELPER
========================================================= */

const getCustomerName = (item: any) => {
  if (typeof item.customer_name === "object") {
    return item.customer_name?.name || "---";
  }

  if (typeof item.customer === "object") {
    return item.customer?.name || "---";
  }

  return (
    item.customer_name ||
    item.customer ||
    "Khách lẻ"
  );
};

const getCustomerPhone = (item: any) => {
  if (typeof item.customer === "object") {
    return (
      item.customer?.phone ||
      item.customer?.phoneNumber ||
      item.customer?.tel ||
      ""
    );
  }

  return (
    item.customer_phone ||
    item.phone ||
    ""
  );
};

const getCustomerAddress = (item: any) => {
  if (typeof item.customer === "object") {
    return item.customer?.address || "";
  }

  return item.customer_address || "";
};

const getCustomerTaxCode = (item: any) => {
  const customer =
    typeof item.customer === "object" &&
    item.customer
      ? item.customer
      : {};

  return (
    customer.taxCode ||
    customer.tax_code ||
    customer.taxId ||
    customer.mst ||
    item.taxCode ||
    item.tax_code ||
    item.taxId ||
    item.mst ||
    ""
  );
};

const getOrderCode = (item: any) => {
  return (
    item.orderCode ||
    item.order_code ||
    item.id ||
    ""
  );
};

const getCreatedBy = (item: any) => {
  return (
    item.createdBy ||
    item.createdByName ||
    item.createdByEmail ||
    item.userName ||
    item.userEmail ||
    "---"
  );
};

const getItems = (item: any) => {
  return (
    item.items ||
    item.products ||
    item.cart ||
    []
  );
};

const getProductMainName = (
  product: any
) => {
  return (
    product.main_name ||
    product.mainName ||
    product.name ||
    product.productName ||
    product.product_name ||
    "---"
  );
};

const getProductShortName = (
  product: any
) => {
  return (
    product.short_name ||
    product.shortName ||
    product.name ||
    product.productName ||
    product.product_name ||
    "---"
  );
};

const getProductName = (product: any) => {
  const mainName =
    getProductMainName(product);

  const shortName =
    getProductShortName(product);

  const savedPrintName = String(
    product.printName ||
      product.print_name ||
      ""
  ).trim();

  return (
    savedPrintName ||
    shortName ||
    mainName ||
    "---"
  );
};

const getProductSku = (product: any) => {
  return (
    product.sku ||
    product.code ||
    product.productCode ||
    product.product_code ||
    ""
  );
};

const getProductUnit = (
  product: any
) => {
  return (
    product.unit ||
    product.unitName ||
    product.donVi ||
    ""
  );
};

const getProductQuantity = (
  product: any
) => {
  return Number(
    product.quantity ||
      product.qty ||
      0
  );
};

const getProductPrice = (
  product: any
) => {
  return Number(
    product.price ||
      product.sellPrice ||
      product.salePrice ||
      product.unitPrice ||
      0
  );
};

const getProductVat = (
  product: any
) => {
  return Number(
    product.vat ||
      product.tax ||
      0
  );
};

const getProductTotal = (
  product: any
) => {
  const directTotal =
    product.total ||
    product.totalPrice ||
    product.amount;

  if (directTotal) {
    return Number(directTotal);
  }

  return (
    getProductQuantity(product) *
    getProductPrice(product)
  );
};

const getPaymentMethodText = (
  item: any
) => {
  const method =
    item.paymentMethod ||
    item.payment_method ||
    item.paymentType ||
    "";

  const text =
    item.paymentMethodText ||
    item.payment_method_text ||
    "";

  if (text) return text;

  if (method === "cash") {
    return "Tiền mặt";
  }

  if (method === "bank") {
    return "Chuyển khoản";
  }

  if (method === "card") {
    return "Quẹt thẻ";
  }

  if (method === "mixed") {
    return "CK + TM";
  }

  return method || "---";
};

const getPaymentMethodValue = (
  item: any
) => {
  const method =
    item.paymentMethod ||
    item.payment_method ||
    item.paymentType ||
    "";

  if (method) return method;

  const text =
    getPaymentMethodText(item);

  if (text === "Tiền mặt") {
    return "cash";
  }

  if (text === "Chuyển khoản") {
    return "bank";
  }

  if (text === "Quẹt thẻ") {
    return "card";
  }

  if (text === "CK + TM") {
    return "mixed";
  }

  return "";
};

const getSubtotal = (item: any) => {
  return Number(
    item.subtotal ||
      item.totalBeforeDiscount ||
      item.total ||
      item.grand_total ||
      item.totalAmount ||
      0
  );
};

const getVatAmount = (item: any) => {
  return Number(
    item.vatAmount ||
      item.vat ||
      0
  );
};

const getDiscountAmount = (
  item: any
) => {
  return Number(
    item.discountAmount ||
      item.discount ||
      0
  );
};

const getGrandTotal = (item: any) => {
  return Number(
    item.total ||
      item.grand_total ||
      item.totalAmount ||
      0
  );
};

const getCustomerPay = (item: any) => {
  return Number(
    item.customerPay ||
      item.customer_pay ||
      0
  );
};

const getChangeAmount = (
  item: any
) => {
  return Number(
    item.changeAmount ||
      item.change_amount ||
      0
  );
};

/* =========================================================
   DATE
========================================================= */

const getOrderDate = (item: any) => {
  const value = item.createdAt;

  if (!value) return null;

  try {
    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : value.seconds
          ? new Date(
              value.seconds * 1000
            )
          : new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
};

const getVietnamDateParts = (
  date: Date
) => {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }
    ).formatToParts(date);

  const getPart = (
    type: string
  ) =>
    Number(
      parts.find(
        (p) => p.type === type
      )?.value || 0
    );

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
  };
};

const formatDate = (value: any) => {
  if (!value) return "---";

  try {
    const date =
      typeof value.toDate === "function"
        ? value.toDate()
        : value.seconds
          ? new Date(
              value.seconds * 1000
            )
          : new Date(value);

    return new Intl.DateTimeFormat(
      "vi-VN",
      {
        timeZone:
          "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    ).format(date);
  } catch {
    return "---";
  }
};

/* =========================================================
   CSV
========================================================= */

const csvEscape = (value: any) => {
  return `"${String(
    value ?? ""
  ).replace(/"/g, '""')}"`;
};

const createCSV = (
  orders: any[]
) => {
  const headers = [
    "ma_don",
    "khach_hang",
    "mst",
    "sdt",
    "dia_chi",
    "ngay_tao",
    "nguoi_tao",
    "phuong_thuc_thanh_toan",
    "payment_method",
    "tien_mat",
    "chuyen_khoan",
    "tong_tien_hang",
    "vat_don",
    "loai_chiet_khau",
    "gia_tri_chiet_khau",
    "tien_chiet_khau",
    "khach_phai_tra",
    "khach_dua",
    "tien_thua",
    "ten_san_pham",
    "ma_sku",
    "so_luong",
    "don_vi",
    "don_gia",
    "vat_san_pham",
    "thanh_tien_san_pham",
  ];

  const rows: any[][] = [];

  orders.forEach((order) => {
    const items =
      getItems(order);

    const taxCode =
      getCustomerTaxCode(order);

    const phone =
      getCustomerPhone(order);

    const baseRow = [
      getOrderCode(order),

      getCustomerName(order),

      taxCode
        ? `\t${String(
            taxCode
          )}`
        : "",

      phone
        ? `\t${String(
            phone
          )}`
        : "",

      getCustomerAddress(order),

      formatDate(
        order.createdAt
      ),

      getCreatedBy(order),

      getPaymentMethodText(
        order
      ),

      getPaymentMethodValue(
        order
      ),

      order.splitPayment?.cash ||
        order.cashAmount ||
        0,

      order.splitPayment?.bank ||
        order.bankAmount ||
        0,

      getSubtotal(order),

      getVatAmount(order),

      order.discountType ||
        order.discount_type ||
        "",

      order.discountValue ||
        order.discount_value ||
        0,

      getDiscountAmount(order),

      getGrandTotal(order),

      getCustomerPay(order),

      getChangeAmount(order),
    ];

    if (items.length === 0) {
      rows.push([
        ...baseRow,
        "",
        "",
        0,
        "",
        0,
        0,
        0,
      ]);

      return;
    }

    items.forEach(
      (
        product: any,
        productIndex: number
      ) => {
        const orderColumns =
          productIndex === 0
            ? baseRow
            : new Array(
                baseRow.length
              ).fill("");

        rows.push([
          ...orderColumns,

          getProductName(
            product
          ),

          getProductSku(
            product
          ),

          getProductQuantity(
            product
          ),

          getProductUnit(
            product
          ),

          getProductPrice(
            product
          ),

          getProductVat(
            product
          ),

          getProductTotal(
            product
          ),
        ]);
      }
    );
  });

  return [
    headers.join(","),

    ...rows.map((row) =>
      row
        .map(csvEscape)
        .join(",")
    ),
  ].join("\n");
};

/* =========================================================
   KIỂM TRA ADMIN
========================================================= */

const verifyAdmin = async (
  request: NextRequest
) => {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    return false;
  }

  const token =
    authorization.slice(7);

  try {
    const decoded =
      await adminAuth.verifyIdToken(
        token
      );

    const userSnap =
      await adminDb
        .collection("users")
        .doc(decoded.uid)
        .get();

    if (!userSnap.exists) {
      return false;
    }

    const data =
      userSnap.data() || {};

    const role = String(
      data.role || ""
    )
      .trim()
      .toLowerCase();

    return (
      role === "admin" ||
      data.permissions?.admin ===
        true
    );
  } catch (error) {
    console.error(
      "VERIFY ADMIN ERROR:",
      error
    );

    return false;
  }
};

/* =========================================================
   POST = GỬI THỬ
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* -----------------------------------------
       1. Chỉ Admin được gửi thử
    ----------------------------------------- */

    const isAdmin =
      await verifyAdmin(request);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Bạn không có quyền thực hiện thao tác này.",
        },
        {
          status: 403,
        }
      );
    }

    /* -----------------------------------------
       2. Kiểm tra API KEY
    ----------------------------------------- */

    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Chưa cấu hình RESEND_API_KEY.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      QUAN TRỌNG:
      Chỉ khởi tạo Resend SAU KHI
      đã kiểm tra API key.

      Như vậy npm run build ở local
      sẽ không bị lỗi Missing API key.
    */
    const resend =
      new Resend(resendApiKey);

    /* -----------------------------------------
       3. Đọc cài đặt email
    ----------------------------------------- */

    const settingsSnap =
      await adminDb
        .collection("settings")
        .doc("monthlyReport")
        .get();

    if (!settingsSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Chưa có cài đặt báo cáo.",
        },
        {
          status: 400,
        }
      );
    }

    const settings =
      settingsSnap.data() || {};

    const recipientEmail =
      String(
        settings.recipientEmail ||
          ""
      ).trim();

    if (!recipientEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Chưa có email nhận báo cáo.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       4. Xác định tháng trước
       theo giờ Việt Nam
    ----------------------------------------- */

    const now = new Date();

    const vietnamNow =
      getVietnamDateParts(now);

    let reportMonth =
      vietnamNow.month - 1;

    let reportYear =
      vietnamNow.year;

    if (reportMonth === 0) {
      reportMonth = 12;
      reportYear -= 1;
    }

    /* -----------------------------------------
       5. Đọc đơn hàng
    ----------------------------------------- */

    const ordersSnap =
      await adminDb
        .collection("orders")
        .get();

    const orders: any[] = [];

    ordersSnap.forEach(
      (docItem) => {
        const order = {
          id: docItem.id,
          ...docItem.data(),
        };

        const date =
          getOrderDate(order);

        if (!date) {
          return;
        }

        const dateParts =
          getVietnamDateParts(
            date
          );

        if (
          dateParts.year ===
            reportYear &&
          dateParts.month ===
            reportMonth
        ) {
          orders.push(order);
        }
      }
    );

    /* -----------------------------------------
       6. Sắp xếp theo ngày
    ----------------------------------------- */

    orders.sort((a, b) => {
      const dateA =
        getOrderDate(a);

      const dateB =
        getOrderDate(b);

      return (
        (dateA?.getTime() || 0) -
        (dateB?.getTime() || 0)
      );
    });

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Không có đơn hàng trong tháng ${reportMonth}/${reportYear}.`,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       7. Tạo CSV
    ----------------------------------------- */

    const csv =
      createCSV(orders);

    /*
      BOM giúp Excel nhận tiếng Việt.
    */
    const csvWithBom =
      "\uFEFF" + csv;

    const monthText =
      String(
        reportMonth
      ).padStart(2, "0");

    const baseName =
      `danh_sach_don_hang_thang_${monthText}_nam_${reportYear}`;

    const fileName =
      `${baseName}.csv`;

    /* -----------------------------------------
       8. Gửi email
    ----------------------------------------- */

    const {
      data,
      error,
    } =
      await resend.emails.send({
        from:
          "Báo cáo QLBH <baocao@linhkiendientutphcm.com>",

        to: [
          recipientEmail,
        ],

        subject: baseName,

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #222;
            "
          >
            <h2>
              Báo cáo đơn hàng tháng ${monthText}/${reportYear}
            </h2>

            <p>
              File danh sách đơn hàng tháng
              <strong>${monthText}/${reportYear}</strong>
              được đính kèm trong email này.
            </p>

            <p>
              Tổng số đơn hàng:
              <strong>${orders.length}</strong>
            </p>

            <p
              style="
                color:#666;
                font-size:13px;
              "
            >
              Email được gửi tự động từ hệ thống QLBH.
            </p>
          </div>
        `,

        attachments: [
          {
            filename:
              fileName,

            content:
              Buffer.from(
                csvWithBom,
                "utf8"
              ),
          },
        ],
      });

    if (error) {
      console.error(
        "RESEND ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message ||
            "Không gửi được email.",
        },
        {
          status: 500,
        }
      );
    }

    /* -----------------------------------------
       9. Thành công
    ----------------------------------------- */

    return NextResponse.json({
      success: true,

      message:
        `Đã gửi báo cáo tháng ${monthText}/${reportYear} tới ${recipientEmail}.`,

      emailId:
        data?.id || "",

      fileName,

      orderCount:
        orders.length,
    });
  } catch (error: any) {
    console.error(
      "MONTHLY REPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Có lỗi khi tạo báo cáo.",
      },
      {
        status: 500,
      }
    );
  }
}