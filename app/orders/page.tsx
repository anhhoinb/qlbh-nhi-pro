"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  runTransaction,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function OrdersPage() {
  const [orders, setOrders] =
    useState<any[]>([]);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [selectedOrder, setSelectedOrder] =
    useState<any>(null);

  const [selectedOrderIds, setSelectedOrderIds] =
    useState<string[]>([]);

  const [importing, setImporting] =
    useState(false);

  const [returnOpen, setReturnOpen] =
    useState(false);

  const [returnOrder, setReturnOrder] =
    useState<any>(null);

  const [returnItems, setReturnItems] =
    useState<any[]>([]);

  const [returnReason, setReturnReason] =
    useState("");

  const [restockReturnedItems, setRestockReturnedItems] =
    useState(true);

  const [savingReturn, setSavingReturn] =
    useState(false);

  const ordersPerPage = 20;

  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString();
  };

  const parseNumber = (value: any) => {
    if (value === null || value === undefined) {
      return 0;
    }

    const cleaned = String(value)
      .replace(/\./g, "")
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "");

    return Number(cleaned || 0);
  };

  const formatDate = (value: any) => {
    if (!value) return "---";

    try {
      const date = value.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

      return date.toLocaleString("vi-VN");
    } catch {
      return "---";
    }
  };

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

  const getOrderCode = (item: any) => {
    return (
      item.orderCode ||
      item.order_code ||
      item.id
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

  const getProductName = (product: any) => {
    return (
      product.name ||
      product.productName ||
      product.product_name ||
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

  const getProductUnit = (product: any) => {
    return (
      product.unit ||
      product.unitName ||
      product.donVi ||
      ""
    );
  };

  const getProductQuantity = (product: any) => {
    return Number(
      product.quantity ||
      product.qty ||
      0
    );
  };

  const getProductPrice = (product: any) => {
    return Number(
      product.price ||
      product.sellPrice ||
      product.salePrice ||
      product.unitPrice ||
      0
    );
  };

  const getProductVat = (product: any) => {
    return Number(
      product.vat ||
      product.tax ||
      0
    );
  };

  const getProductTotal = (product: any) => {
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

  const getPaymentMethodText = (item: any) => {
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

    if (method === "cash") return "Tiền mặt";
    if (method === "bank") return "Chuyển khoản";
    if (method === "card") return "Quẹt thẻ";
    if (method === "mixed") return "CK + TM";

    return method || "---";
  };

  const getPaymentMethodValue = (item: any) => {
    const method =
      item.paymentMethod ||
      item.payment_method ||
      item.paymentType ||
      "";

    if (method) return method;

    const text = getPaymentMethodText(item);

    if (text === "Tiền mặt") return "cash";
    if (text === "Chuyển khoản") return "bank";
    if (text === "Quẹt thẻ") return "card";
    if (text === "CK + TM") return "mixed";

    return "";
  };

  const getDiscountText = (item: any) => {
    const discountAmount = Number(
      item.discountAmount ||
      item.discount ||
      0
    );

    const discountType =
      item.discountType ||
      item.discount_type ||
      "";

    const discountValue =
      item.discountValue ||
      item.discount_value ||
      0;

    if (discountAmount <= 0) {
      return "0đ";
    }

    if (discountType === "percent") {
      return `${discountValue}% : ${formatMoney(discountAmount)}đ`;
    }

    return `${formatMoney(discountAmount)}đ`;
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

  const getDiscountAmount = (item: any) => {
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

  const getChangeAmount = (item: any) => {
    return Number(
      item.changeAmount ||
      item.change_amount ||
      0
    );
  };

  const csvEscape = (value: any) => {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  };

  const parseCSVLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);

    return result;
  };

  const exportOrdersDetailToCSV = () => {
    if (orders.length === 0) {
      alert("Chưa có đơn hàng để xuất file");
      return;
    }

    const headers = [
      "ma_don",
      "khach_hang",
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
      const items = getItems(order);

      const baseRow = [
        getOrderCode(order),
        getCustomerName(order),
        getCustomerPhone(order),
        getCustomerAddress(order),
        formatDate(order.createdAt),
        getCreatedBy(order),
        getPaymentMethodText(order),
        getPaymentMethodValue(order),
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
      } else {
        items.forEach((product: any) => {
          rows.push([
            ...baseRow,
            getProductName(product),
            getProductSku(product),
            getProductQuantity(product),
            getProductUnit(product),
            getProductPrice(product),
            getProductVat(product),
            getProductTotal(product),
          ]);
        });
      }
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map(csvEscape).join(",")
      ),
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `don-hang-chi-tiet-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const importOrdersDetailFromCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const confirmImport = confirm(
      "Bạn có chắc muốn nhập file chi tiết đơn hàng này không?"
    );

    if (!confirmImport) {
      event.target.value = "";
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();

      const cleanText = text.replace(/^\uFEFF/, "");

      const lines = cleanText
        .split(/\r?\n/)
        .filter((line) => line.trim() !== "");

      if (lines.length <= 1) {
        alert("File không có dữ liệu đơn hàng");
        event.target.value = "";
        setImporting(false);
        return;
      }

      const headers = parseCSVLine(lines[0]).map((h) =>
        h.trim()
      );

      const requiredHeaders = [
        "ma_don",
        "khach_hang",
        "tong_tien_hang",
        "khach_phai_tra",
        "ten_san_pham",
        "ma_sku",
        "so_luong",
        "don_vi",
        "don_gia",
        "vat_san_pham",
        "thanh_tien_san_pham",
      ];

      const isValidFile = requiredHeaders.every(
        (header) => headers.includes(header)
      );

      if (!isValidFile) {
        alert(
          "File không đúng định dạng. Vui lòng dùng file CSV chi tiết được xuất từ hệ thống."
        );
        event.target.value = "";
        setImporting(false);
        return;
      }

      const groupedOrders: Record<string, any> = {};

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        const orderCode =
          row.ma_don ||
          `IMPORT-${Date.now()}-${i}`;

        if (!groupedOrders[orderCode]) {
          const paymentMethod =
            row.payment_method ||
            "";

          const paymentMethodText =
            row.phuong_thuc_thanh_toan ||
            "";

          const cashAmount =
            parseNumber(row.tien_mat);

          const bankAmount =
            parseNumber(row.chuyen_khoan);

          groupedOrders[orderCode] = {
            orderCode: orderCode,
            order_code: orderCode,

            customer_name:
              row.khach_hang || "Khách lẻ",

            customer_phone:
              row.sdt || "",

            customer_address:
              row.dia_chi || "",

            customer: {
              name: row.khach_hang || "Khách lẻ",
              phone: row.sdt || "",
              address: row.dia_chi || "",
            },

            createdBy:
              row.nguoi_tao || "---",

            paymentMethod:
              paymentMethod,
            payment_method:
              paymentMethod,
            paymentMethodText:
              paymentMethodText,
            payment_method_text:
              paymentMethodText,

            splitPayment: {
              cash: cashAmount,
              bank: bankAmount,
            },

            cashAmount: cashAmount,
            bankAmount: bankAmount,

            subtotal:
              parseNumber(row.tong_tien_hang),

            vatAmount:
              parseNumber(row.vat_don),

            discountType:
              row.loai_chiet_khau || "",

            discountValue:
              parseNumber(row.gia_tri_chiet_khau),

            discountAmount:
              parseNumber(row.tien_chiet_khau),

            discount:
              parseNumber(row.tien_chiet_khau),

            total:
              parseNumber(row.khach_phai_tra),

            grand_total:
              parseNumber(row.khach_phai_tra),

            totalAmount:
              parseNumber(row.khach_phai_tra),

            customerPay:
              parseNumber(row.khach_dua),

            changeAmount:
              parseNumber(row.tien_thua),

            items: [],

            imported: true,
            importedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          };
        }

        const productName =
          row.ten_san_pham || "";

        const sku =
          row.ma_sku || "";

        const quantity =
          parseNumber(row.so_luong);

        const price =
          parseNumber(row.don_gia);

        const productTotal =
          parseNumber(row.thanh_tien_san_pham);

        if (
          productName ||
          sku ||
          quantity > 0 ||
          price > 0 ||
          productTotal > 0
        ) {
          groupedOrders[orderCode].items.push({
            name: productName || "---",
            productName: productName || "---",
            product_name: productName || "---",

            sku: sku,
            code: sku,
            productCode: sku,
            product_code: sku,

            quantity: quantity,
            qty: quantity,

            unit: row.don_vi || "",
            unitName: row.don_vi || "",

            price: price,
            unitPrice: price,
            sellPrice: price,

            vat: parseNumber(row.vat_san_pham),
            tax: parseNumber(row.vat_san_pham),

            total: productTotal,
            totalPrice: productTotal,
            amount: productTotal,
          });
        }
      }

      const ordersToImport =
        Object.values(groupedOrders);

      if (ordersToImport.length === 0) {
        alert("Không tìm thấy đơn hàng hợp lệ trong file");
        event.target.value = "";
        setImporting(false);
        return;
      }

      for (const order of ordersToImport) {
        await addDoc(
          collection(db, "orders"),
          order
        );
      }

      alert(
        `Đã nhập ${ordersToImport.length} đơn hàng từ file chi tiết`
      );

      event.target.value = "";

      await loadOrders();
    } catch (error) {
      console.error(error);
      alert("Có lỗi khi nhập file. Vui lòng kiểm tra lại file CSV.");
    }

    setImporting(false);
  };

  const loadOrders = async () => {
    const querySnapshot =
      await getDocs(
        collection(db, "orders")
      );

    const data: any[] = [];

    querySnapshot.forEach((docItem) => {
      data.push({
        id: docItem.id,
        ...docItem.data(),
      });
    });

    data.sort((a, b) => {
      const timeA = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const timeB = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return timeB - timeA;
    });

    setOrders(data);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const totalPages =
    Math.ceil(orders.length / ordersPerPage);

  const startIndex =
    (currentPage - 1) * ordersPerPage;

  const currentOrders =
    orders.slice(
      startIndex,
      startIndex + ordersPerPage
    );

  const selectedOrders = orders.filter((order) =>
    selectedOrderIds.includes(order.id)
  );

  const isAllCurrentPageSelected =
    currentOrders.length > 0 &&
    currentOrders.every((order) =>
      selectedOrderIds.includes(order.id)
    );

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedOrderIds((prev) =>
        prev.filter(
          (id) =>
            !currentOrders.some((order) => order.id === id)
        )
      );
      return;
    }

    setSelectedOrderIds((prev) => {
      const next = [...prev];

      currentOrders.forEach((order) => {
        if (!next.includes(order.id)) {
          next.push(order.id);
        }
      });

      return next;
    });
  };

  const printSelectedOrders = () => {
  if (selectedOrders.length === 0) {
    alert("Vui lòng tích chọn đơn hàng cần in");
    return;
  }

  selectedOrders.forEach((order) => {
    const orderId =
      order.id ||
      order.orderCode ||
      order.order_code;

    if (!orderId) {
      return;
    }

    const printWindow = window.open(
      `/print-order/invoice?id=${encodeURIComponent(
        orderId
      )}`,
      "_blank"
    );

    if (!printWindow) {
      alert(
        "Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup."
      );
    }
  });
};

  const cancelSelectedOrders = async () => {
  if (selectedOrders.length === 0) {
    alert("Vui lòng tích chọn đơn hàng cần hủy");
    return;
  }

  const ok = confirm(
    `Bạn có chắc muốn hủy ${selectedOrders.length} đơn hàng đã chọn không?`
  );

  if (!ok) return;

  for (const order of selectedOrders) {

    // Đã hủy thì bỏ qua
    if (order.status === "cancelled") continue;

    const items = getItems(order);

    // Trả hàng về kho
    for (const item of items) {

      if (!item.id) continue;

      const productRef = doc(db, "products", item.id);

      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) continue;

      const currentStock = Number(
        productSnap.data().stock || 0
      );

      await updateDoc(productRef, {
        stock:
          currentStock +
          Number(getProductQuantity(item)),
      });
    }

    // Đổi trạng thái đơn
    await updateDoc(doc(db, "orders", order.id), {
      status: "cancelled",
      statusText: "Đã hủy",
      cancelledAt: serverTimestamp(),
    });
  }

  alert("Đã hủy đơn hàng");

  setSelectedOrderIds([]);

  await loadOrders();
};

  const createShippingForSelectedOrders = () => {

  if (selectedOrders.length !== 1) {

    alert(
      "Vui lòng chọn đúng 1 đơn hàng"
    );

    return;
  }

  const order =
    selectedOrders[0];

  const orderId =
    order.id;

  if (!orderId) {

    alert(
      "Không tìm thấy đơn hàng"
    );

    return;
  }

  window.open(
    `/print-order/delivery?id=${encodeURIComponent(orderId)}`,
    "_blank"
  );
};

  const getAlreadyReturnedQuantity = (
    order: any,
    product: any,
    index: number
  ) => {
    const returnedItems =
      order.returnedItems || [];

    return returnedItems.reduce(
      (sum: number, returnedItem: any) => {
        const sameProduct =
          String(
            returnedItem.productId ||
              returnedItem.id ||
              ""
          ) ===
            String(
              product.id ||
                product.productId ||
                ""
            ) ||
          (
            !product.id &&
            !product.productId &&
            returnedItem.itemIndex === index
          );

        return sameProduct
          ? sum +
              Number(
                returnedItem.quantity || 0
              )
          : sum;
      },
      0
    );
  };

  const openReturnModal = () => {
    if (selectedOrders.length !== 1) {
      alert("Vui lòng chọn đúng 1 đơn hàng để trả hàng");
      return;
    }

    const order = selectedOrders[0];

    if (order.status === "cancelled") {
      alert("Đơn hàng đã hủy, không thể trả hàng");
      return;
    }

    const items = getItems(order);

    if (items.length === 0) {
      alert("Đơn hàng không có sản phẩm để trả");
      return;
    }

    const preparedItems = items.map(
      (item: any, index: number) => {
        const soldQuantity =
          getProductQuantity(item);

        const alreadyReturned =
          getAlreadyReturnedQuantity(
            order,
            item,
            index
          );

        const remainingQuantity =
          Math.max(
            soldQuantity -
              alreadyReturned,
            0
          );

        return {
          ...item,
          itemIndex: index,
          productId:
            item.id ||
            item.productId ||
            "",
          selected:
            remainingQuantity > 0,
          returnQuantity:
            remainingQuantity > 0
              ? 1
              : 0,
          soldQuantity,
          alreadyReturned,
          remainingQuantity,
        };
      }
    );

    const hasReturnableItem =
      preparedItems.some(
        (item: any) =>
          item.remainingQuantity > 0
      );

    if (!hasReturnableItem) {
      alert("Đơn hàng này đã được trả hết");
      return;
    }

    setReturnOrder(order);
    setReturnItems(preparedItems);
    setReturnReason("");
    setRestockReturnedItems(true);
    setReturnOpen(true);
  };

  const closeReturnModal = () => {
    if (savingReturn) return;

    setReturnOpen(false);
    setReturnOrder(null);
    setReturnItems([]);
    setReturnReason("");
    setRestockReturnedItems(true);
  };

  const updateReturnItem = (
    index: number,
    changes: any
  ) => {
    setReturnItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...changes,
            }
          : item
      )
    );
  };

  const confirmReturn = async () => {
    if (!returnOrder) return;

    const selectedReturnItems =
      returnItems.filter(
        (item) =>
          item.selected &&
          Number(
            item.returnQuantity || 0
          ) > 0
      );

    if (
      selectedReturnItems.length === 0
    ) {
      alert(
        "Vui lòng chọn ít nhất một sản phẩm cần trả"
      );
      return;
    }

    for (
      const item of selectedReturnItems
    ) {
      const returnQuantity =
        Number(
          item.returnQuantity || 0
        );

      if (
        returnQuantity >
        Number(
          item.remainingQuantity || 0
        )
      ) {
        alert(
          `Số lượng trả của "${getProductName(
            item
          )}" vượt quá số lượng còn có thể trả`
        );
        return;
      }
    }

    const confirmed =
      window.confirm(
        `Xác nhận trả ${selectedReturnItems.length} sản phẩm của đơn ${getOrderCode(
          returnOrder
        )}?`
      );

    if (!confirmed) return;

    try {
      setSavingReturn(true);

      const returnRef = doc(
        collection(db, "returns")
      );

      await runTransaction(
        db,
        async (transaction) => {
          const orderRef = doc(
            db,
            "orders",
            returnOrder.id
          );

          const orderSnap =
            await transaction.get(
              orderRef
            );

          if (!orderSnap.exists()) {
            throw new Error(
              "Không tìm thấy đơn hàng"
            );
          }

          const latestOrder =
            orderSnap.data();

          const oldReturnedItems =
            Array.isArray(
              latestOrder.returnedItems
            )
              ? latestOrder.returnedItems
              : [];

          const returnRecords: any[] = [];
          let totalRefund = 0;

          for (
            const item of selectedReturnItems
          ) {
            const quantity =
              Number(
                item.returnQuantity || 0
              );

            const unitPrice =
              getProductPrice(item);

            const vatRate =
              getProductVat(item);

            const lineSubtotal =
              unitPrice * quantity;

            const lineVat =
              lineSubtotal *
              (vatRate / 100);

            const lineRefund =
              lineSubtotal + lineVat;

            totalRefund += lineRefund;

            let stockBefore: number | null =
              null;
            let stockAfter: number | null =
              null;

            if (
              restockReturnedItems &&
              item.productId
            ) {
              const productRef = doc(
                db,
                "products",
                item.productId
              );

              const productSnap =
                await transaction.get(
                  productRef
                );

              if (
                productSnap.exists()
              ) {
                stockBefore = Number(
                  productSnap.data()
                    ?.stock || 0
                );

                stockAfter =
                  stockBefore +
                  quantity;

                transaction.update(
                  productRef,
                  {
                    stock:
                      stockAfter,
                    updatedAt:
                      serverTimestamp(),
                  }
                );

                const movementRef =
                  doc(
                    collection(
                      db,
                      "inventory_movements"
                    )
                  );

                transaction.set(
                  movementRef,
                  {
                    productId:
                      item.productId,
                    productCode:
                      getProductSku(
                        item
                      ),
                    productName:
                      getProductName(
                        item
                      ),
                    type: "return",
                    direction: "in",
                    quantity,
                    stockBefore,
                    stockAfter,
                    orderId:
                      returnOrder.id,
                    orderCode:
                      getOrderCode(
                        returnOrder
                      ),
                    returnId:
                      returnRef.id,
                    customerName:
                      getCustomerName(
                        returnOrder
                      ),
                    reason:
                      returnReason.trim() ||
                      "Khách trả hàng",
                    note:
                      "Nhập lại kho từ phiếu trả hàng",
                    createdAt:
                      serverTimestamp(),
                  }
                );
              }
            }

            returnRecords.push({
              itemIndex:
                item.itemIndex,
              productId:
                item.productId || "",
              productName:
                getProductName(
                  item
                ),
              productCode:
                getProductSku(
                  item
                ),
              unit:
                getProductUnit(
                  item
                ),
              quantity,
              soldQuantity:
                Number(
                  item.soldQuantity ||
                    0
                ),
              unitPrice,
              vatRate,
              lineSubtotal,
              lineVat,
              lineRefund,
              restocked:
                restockReturnedItems,
              stockBefore,
              stockAfter,
            });
          }

          const mergedReturnedItems =
            [
              ...oldReturnedItems,
              ...returnRecords,
            ];

          const orderItems =
            getItems({
              ...returnOrder,
              ...latestOrder,
            });

          const totalSoldQuantity =
            orderItems.reduce(
              (
                sum: number,
                item: any
              ) =>
                sum +
                getProductQuantity(
                  item
                ),
              0
            );

          const totalReturnedQuantity =
            mergedReturnedItems.reduce(
              (
                sum: number,
                item: any
              ) =>
                sum +
                Number(
                  item.quantity || 0
                ),
              0
            );

          const newStatus =
            totalReturnedQuantity >=
            totalSoldQuantity
              ? "returned"
              : "partially_returned";

          transaction.set(
            returnRef,
            {
              orderId:
                returnOrder.id,
              orderCode:
                getOrderCode(
                  returnOrder
                ),
              customerId:
                returnOrder.customerId ||
                returnOrder.customer?.id ||
                "",
              customerName:
                getCustomerName(
                  returnOrder
                ),
              customerPhone:
                getCustomerPhone(
                  returnOrder
                ),
              items:
                returnRecords,
              totalQuantity:
                returnRecords.reduce(
                  (
                    sum: number,
                    item: any
                  ) =>
                    sum +
                    Number(
                      item.quantity ||
                        0
                    ),
                  0
                ),
              totalRefund,
              reason:
                returnReason.trim() ||
                "Khách trả hàng",
              restocked:
                restockReturnedItems,
              status:
                "completed",
              createdAt:
                serverTimestamp(),
            }
          );

          transaction.update(
            orderRef,
            {
              status:
                newStatus,
              statusText:
                newStatus ===
                "returned"
                  ? "Đã trả hàng"
                  : "Trả một phần",
              returnedItems:
                mergedReturnedItems,
              returnedAmount:
                Number(
                  latestOrder
                    .returnedAmount ||
                    0
                ) +
                totalRefund,
              lastReturnId:
                returnRef.id,
              lastReturnedAt:
                serverTimestamp(),
              updatedAt:
                serverTimestamp(),
            }
          );
        }
      );

      alert("Đã tạo phiếu trả hàng");

      closeReturnModal();
      setSelectedOrderIds([]);
      await loadOrders();
    } catch (error: any) {
      console.error(
        "RETURN ORDER ERROR:",
        error
      );

      alert(
        error?.message ||
          "Không xử lý được trả hàng"
      );
    } finally {
      setSavingReturn(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-blue-700">
          Lịch sử bán hàng
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportOrdersDetailToCSV}
            className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            Xuất file chi tiết
          </button>

          <label className="px-5 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold cursor-pointer">
            {importing
              ? "Đang nhập..."
              : "Nhập file chi tiết"}

            <input
              type="file"
              accept=".csv"
              onChange={importOrdersDetailFromCSV}
              disabled={importing}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {selectedOrderIds.length > 0 && (
        <div className="mb-4 bg-white rounded-2xl shadow px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">
            Đã chọn{" "}
            <span className="text-blue-700">
              {selectedOrderIds.length}
            </span>{" "}
            đơn hàng
          </div>

          <div className="flex items-center gap-2">
            <button
  type="button"
  onClick={printSelectedOrders}
  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold"
>
  In đơn hàng
</button>
<button
  type="button"
  onClick={() => {

    if (selectedOrders.length !== 1) {

      alert(
        "Chỉ chọn 1 đơn hàng"
      );

      return;
    }

    const order =
      selectedOrders[0];

    if (!order?.id) {

      alert(
        "Không tìm thấy đơn hàng"
      );

      return;
    }

    window.open(
      `/print-order/export?id=${encodeURIComponent(order.id)}&autoPrint=1`,
      "_blank"
    );
  }}
  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold"
>
  In phiếu xuất kho
</button>

            <button
  type="button"
  onClick={createShippingForSelectedOrders}
  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold"
>
  Tạo phiếu vận chuyển
</button>

            <button
              type="button"
              onClick={openReturnModal}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold"
            >
              Trả hàng
            </button>

            <button
              type="button"
              onClick={cancelSelectedOrders}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
            >
              Hủy đơn hàng
            </button>

            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-sm font-semibold"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-700 text-white">
            <tr>
              <th className="p-4 text-center w-14">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  onChange={toggleSelectAllCurrentPage}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>

              <th className="p-4 pl-6 text-left">
                Mã đơn
              </th>

              <th className="p-4 text-left">
                Khách hàng
              </th>

              <th className="p-4 text-left">
                Tổng tiền
              </th>

              <th className="p-4 text-left">
                Ngày tạo
              </th>

              <th className="p-4 text-left">
                Người tạo
              </th>
              <th className="p-4 text-left">
                Trạng thái
              </th>
            </tr>
          </thead>

          <tbody>
            {currentOrders.map((item) => (
              <tr
                key={item.id}
                className="border-b hover:bg-gray-50"
              >
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(item.id)}
                    onChange={() => toggleSelectOrder(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>

                <td className="p-4 pl-6 text-black font-semibold">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedOrder(item)
                    }
                    className="text-blue-700 hover:underline font-bold"
                  >
                    {getOrderCode(item)}
                  </button>
                </td>

                <td className="p-4 text-black">
                  {getCustomerName(item)}
                </td>

                <td className="p-4 text-black">
                  {formatMoney(
                    item.total ||
                      item.grand_total ||
                      item.totalAmount ||
                      0
                  )}
                  đ
                </td>

                <td className="p-4 text-black">
                  {formatDate(item.createdAt)}
                </td>

                <td className="p-4 text-black">
                  {getCreatedBy(item)}
                </td>

                <td className="p-4">
                  {item.status === "cancelled" ? (
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      Đã hủy
                    </span>
                  ) : item.status === "returned" ? (
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                      Đã trả hàng
                    </span>
                  ) : item.status === "partially_returned" ? (
                    <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                      Trả một phần
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                      Hoàn thành
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {currentOrders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-gray-500"
                >
                  Chưa có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-white">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              {orders.length === 0
                ? 0
                : startIndex + 1}
              {" "}
              -{" "}
              {Math.min(
                startIndex + ordersPerPage,
                orders.length
              )}
              {" "}
              / {orders.length} đơn hàng
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Trước
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() =>
                    setCurrentPage(page)
                  }
                  className={
                    currentPage === page
                      ? "px-4 py-2 rounded-lg bg-blue-700 text-white text-sm"
                      : "px-4 py-2 rounded-lg border text-sm hover:bg-gray-100"
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      totalPages
                    )
                  )
                }
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {returnOpen && returnOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-orange-500 px-6 py-5 text-white">
              <div>
                <h2 className="text-2xl font-bold">
                  Trả hàng
                </h2>

                <p className="mt-1 text-sm text-orange-100">
                  Đơn: {getOrderCode(returnOrder)} · {getCustomerName(returnOrder)}
                </p>
              </div>

              <button
                type="button"
                disabled={savingReturn}
                onClick={closeReturnModal}
                className="h-10 w-10 rounded-full bg-white/20 text-xl hover:bg-white/30 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(92vh-90px)] overflow-auto p-6">
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full min-w-[950px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-center">Chọn</th>
                      <th className="p-3 text-left">Sản phẩm</th>
                      <th className="p-3 text-left">Mã SP</th>
                      <th className="p-3 text-right">Đã bán</th>
                      <th className="p-3 text-right">Đã trả</th>
                      <th className="p-3 text-right">Còn được trả</th>
                      <th className="p-3 text-center">SL trả lần này</th>
                      <th className="p-3 text-right">Tiền hoàn dự kiến</th>
                    </tr>
                  </thead>

                  <tbody>
                    {returnItems.map((item, index) => {
                      const quantity = Number(item.returnQuantity || 0);
                      const lineSubtotal = getProductPrice(item) * quantity;
                      const lineRefund =
                        lineSubtotal +
                        lineSubtotal *
                          (getProductVat(item) / 100);

                      return (
                        <tr key={`${item.productId || "item"}-${index}`} className="border-t">
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={Boolean(item.selected)}
                              disabled={item.remainingQuantity <= 0}
                              onChange={(event) =>
                                updateReturnItem(index, {
                                  selected: event.target.checked,
                                  returnQuantity:
                                    event.target.checked &&
                                    Number(item.returnQuantity || 0) <= 0
                                      ? 1
                                      : item.returnQuantity,
                                })
                              }
                            />
                          </td>

                          <td className="p-3 font-semibold">
                            {getProductName(item)}
                          </td>

                          <td className="p-3">
                            {getProductSku(item) || "---"}
                          </td>

                          <td className="p-3 text-right">
                            {item.soldQuantity}
                          </td>

                          <td className="p-3 text-right">
                            {item.alreadyReturned}
                          </td>

                          <td className="p-3 text-right font-semibold text-blue-700">
                            {item.remainingQuantity}
                          </td>

                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={item.remainingQuantity}
                              disabled={!item.selected || item.remainingQuantity <= 0}
                              value={item.returnQuantity}
                              onChange={(event) => {
                                const value = Math.max(
                                  0,
                                  Math.min(
                                    Number(event.target.value || 0),
                                    Number(item.remainingQuantity || 0)
                                  )
                                );

                                updateReturnItem(index, {
                                  returnQuantity: value,
                                });
                              }}
                              className="w-24 rounded-lg border p-2 text-center disabled:bg-gray-100"
                            />
                          </td>

                          <td className="p-3 text-right font-semibold">
                            {formatMoney(lineRefund)}đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Lý do trả hàng
                  </label>

                  <textarea
                    rows={4}
                    value={returnReason}
                    onChange={(event) =>
                      setReturnReason(event.target.value)
                    }
                    placeholder="Ví dụ: Khách đổi sản phẩm, sản phẩm lỗi..."
                    className="w-full resize-y rounded-2xl border p-4 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="rounded-2xl border bg-gray-50 p-5">
                  <label className="flex cursor-pointer items-center gap-3 font-semibold">
                    <input
                      type="checkbox"
                      checked={restockReturnedItems}
                      onChange={(event) =>
                        setRestockReturnedItems(event.target.checked)
                      }
                    />

                    Nhập lại số lượng trả vào kho
                  </label>

                  <p className="mt-2 text-sm text-gray-500">
                    Nếu bỏ chọn, hệ thống vẫn lưu phiếu trả hàng nhưng không cộng lại tồn kho.
                  </p>

                  <div className="mt-5 border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng tiền hoàn dự kiến</span>

                      <span className="text-orange-600">
                        {formatMoney(
                          returnItems.reduce((sum, item) => {
                            if (!item.selected) return sum;

                            const quantity = Number(item.returnQuantity || 0);
                            const subtotal = getProductPrice(item) * quantity;

                            return (
                              sum +
                              subtotal +
                              subtotal * (getProductVat(item) / 100)
                            );
                          }, 0)
                        )}
                        đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={savingReturn}
                  onClick={closeReturnModal}
                  className="rounded-xl bg-gray-200 px-6 py-3 font-semibold hover:bg-gray-300 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={savingReturn}
                  onClick={confirmReturn}
                  className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {savingReturn
                    ? "Đang xử lý..."
                    : "Xác nhận trả hàng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Chi tiết đơn hàng
                </h2>

                <div className="text-sm opacity-90 mt-1">
                  Mã đơn:{" "}
                  <span className="font-semibold">
                    {getOrderCode(selectedOrder)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-[78vh] overflow-auto bg-gray-50">
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">
                    Thông tin khách hàng
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Khách hàng
                      </span>
                      <span className="font-semibold text-right">
                        {getCustomerName(selectedOrder)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Số điện thoại
                      </span>
                      <span className="font-semibold text-right">
                        {getCustomerPhone(selectedOrder) || "---"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Địa chỉ
                      </span>
                      <span className="font-semibold text-right">
                        {getCustomerAddress(selectedOrder) || "---"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border p-5">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">
                    Thông tin đơn hàng
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Ngày tạo
                      </span>
                      <span className="font-semibold text-right">
                        {formatDate(selectedOrder.createdAt)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Người tạo
                      </span>
                      <span className="font-semibold text-right">
                        {getCreatedBy(selectedOrder)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Thanh toán
                      </span>
                      <span className="font-bold text-blue-700 text-right">
                        {getPaymentMethodText(selectedOrder)}
                      </span>
                    </div>

                    {(
                      selectedOrder.paymentMethod === "mixed" ||
                      selectedOrder.payment_method === "mixed"
                    ) && (
                      <>
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">
                            Tiền mặt
                          </span>
                          <span className="font-semibold text-right">
                            {formatMoney(
                              selectedOrder.splitPayment?.cash ||
                                selectedOrder.cashAmount ||
                                0
                            )}
                            đ
                          </span>
                        </div>

                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">
                            Chuyển khoản
                          </span>
                          <span className="font-semibold text-right">
                            {formatMoney(
                              selectedOrder.splitPayment?.bank ||
                                selectedOrder.bankAmount ||
                                0
                            )}
                            đ
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border overflow-hidden mb-5">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h3 className="font-bold text-lg text-gray-800">
                    Sản phẩm trong đơn
                  </h3>

                  <span className="text-sm text-gray-500">
                    {getItems(selectedOrder).length} sản phẩm
                  </span>
                </div>

                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left w-16">
                        STT
                      </th>
                      <th className="p-3 text-left">
                        Sản phẩm
                      </th>
                      <th className="p-3 text-left">
                        Mã SKU
                      </th>
                      <th className="p-3 text-right">
                        SL
                      </th>
                      <th className="p-3 text-left">
                        Đơn vị
                      </th>
                      <th className="p-3 text-right">
                        Đơn giá
                      </th>
                      <th className="p-3 text-right">
                        VAT
                      </th>
                      <th className="p-3 text-right">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {getItems(selectedOrder).map(
                      (product: any, index: number) => (
                        <tr
                          key={index}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="p-3">
                            {index + 1}
                          </td>

                          <td className="p-3">
                            <div className="font-semibold">
                              {getProductName(product)}
                            </div>
                          </td>

                          <td className="p-3 text-gray-700">
                            {getProductSku(product) || "---"}
                          </td>

                          <td className="p-3 text-right font-semibold">
                            {getProductQuantity(product)}
                          </td>

                          <td className="p-3">
                            {getProductUnit(product) || "---"}
                          </td>

                          <td className="p-3 text-right">
                            {formatMoney(
                              getProductPrice(product)
                            )}
                            đ
                          </td>

                          <td className="p-3 text-right">
                            {getProductVat(product)}%
                          </td>

                          <td className="p-3 text-right font-bold">
                            {formatMoney(
                              getProductTotal(product)
                            )}
                            đ
                          </td>
                        </tr>
                      )
                    )}

                    {getItems(selectedOrder).length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-gray-500"
                        >
                          Đơn hàng này chưa có dữ liệu sản phẩm
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="bg-white rounded-2xl border w-full max-w-lg p-5">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">
                    Tổng thanh toán
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Tổng tiền
                      </span>
                      <strong>
                        {formatMoney(
                          selectedOrder.subtotal ||
                            selectedOrder.totalBeforeDiscount ||
                            selectedOrder.total ||
                            0
                        )}
                        đ
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        VAT
                      </span>
                      <strong>
                        {formatMoney(
                          selectedOrder.vatAmount ||
                            selectedOrder.vat ||
                            0
                        )}
                        đ
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Chiết khấu
                      </span>
                      <strong>
                        {getDiscountText(selectedOrder)}
                      </strong>
                    </div>

                    <div className="border-t pt-4 flex justify-between text-xl">
                      <span className="font-bold text-gray-900">
                        Khách phải trả
                      </span>
                      <strong className="text-blue-700">
                        {formatMoney(
                          selectedOrder.total ||
                            selectedOrder.grand_total ||
                            selectedOrder.totalAmount ||
                            0
                        )}
                        đ
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Khách đưa
                      </span>
                      <strong>
                        {formatMoney(
                          selectedOrder.customerPay ||
                            selectedOrder.customer_pay ||
                            0
                        )}
                        đ
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Tiền thừa
                      </span>
                      <strong>
                        {formatMoney(
                          selectedOrder.changeAmount ||
                            selectedOrder.change_amount ||
                            0
                        )}
                        đ
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="px-8 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}