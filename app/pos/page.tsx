"use client";

import { useEffect, useRef, useState } from "react";

import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { db, auth } from "@/lib/firebase";

import {
  useRouter,
} from "next/navigation";

type OrderTab = {
  id: number;
  cart: any[];
  customer: any | null;
  useProductVat: boolean;
  paymentMethod: string;
  customerPay: string;
  search: string;
  barcode: string;
  showProductDropdown: boolean;
  discountType: "percent" | "value";
  discountValue: string;
  discountCode: string;
  splitPayment: {
    cash: string;
    bank: string;
  };
};

export default function POSPage() {
  const router = useRouter();

  const formatInputMoney = (value: any) => {
  const number = String(value || "").replace(/\D/g, "");

  if (!number) return "";

  return Number(number).toLocaleString("vi-VN");
};

const parseInputMoney = (value: string) => {
  return Number(value.replace(/\D/g, "") || 0);
};

  const productSearchRef =
    useRef<HTMLInputElement | null>(null);

  const customerSearchRef =
    useRef<HTMLInputElement | null>(null);

  const customerPayRef =
    useRef<HTMLInputElement | null>(null);

  const paymentMethodRef =
    useRef<HTMLSelectElement | null>(null);

  const formatMoney = (value: any) => {
    return new Intl.NumberFormat("vi-VN").format(
      Number(value || 0)
    );
  };

  const createEmptyOrder = (id: number): OrderTab => ({
    id,
    cart: [],
    customer: null,
    useProductVat: true,
    paymentMethod: "cash",
    customerPay: "0",
    search: "",
    barcode: "",
    showProductDropdown: false,
    discountType: "value",
    discountValue: "",
    discountCode: "",
    splitPayment: {
      cash: "",
      bank: "",
    },
  });

  const handleLogout =
    async () => {
      await signOut(auth);

      router.push("/login");
    };

  const [accountName, setAccountName] =
    useState("Tài khoản");

    const [currentUserInfo, setCurrentUserInfo] =
  useState<any>(null);

  const [showMainName, setShowMainName] = useState(false);
  useEffect(() => {
  const saved = localStorage.getItem("pos_show_main_name");

  if (saved !== null) {
    setShowMainName(saved === "true");
  }
}, []);

useEffect(() => {
  localStorage.setItem(
    "pos_show_main_name",
    String(showMainName)
  );
}, [showMainName]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [customers, setCustomers] =
    useState<any[]>([]);

  const [orders, setOrders] =
  useState<OrderTab[]>([
    createEmptyOrder(1),
  ]);

const [activeOrder, setActiveOrder] =
  useState(1);

useEffect(() => {
  try {
    const savedOrders =
      localStorage.getItem("pos_orders");

    const savedActive =
      localStorage.getItem("pos_active_order");

    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }

    if (savedActive) {
      setActiveOrder(Number(savedActive));
    }
  } catch (error) {
    console.log(error);
  }
}, []);

    useEffect(() => {

  try {

    localStorage.setItem(
      "pos_orders",
      JSON.stringify(orders)
    );

    localStorage.setItem(
      "pos_active_order",
      String(activeOrder)
    );

  } catch (error) {

    console.log(
      "Cannot save POS orders",
      error
    );

  }

}, [orders, activeOrder]);

  const [showBarcodeInput, setShowBarcodeInput] =
    useState(true);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [showCustomerDropdown, setShowCustomerDropdown] =
    useState(false);

  const [showCustomerForm, setShowCustomerForm] =
    useState(false);

  const [showShortcutModal, setShowShortcutModal] =
    useState(false);

  const [showDiscountModal, setShowDiscountModal] =
    useState(false);

  const [showSplitPaymentModal, setShowSplitPaymentModal] =
    useState(false);

  const [tempSplitPayment, setTempSplitPayment] =
    useState({
      cash: "",
      bank: "",
    });

  const [tempDiscountType, setTempDiscountType] =
    useState<"percent" | "value">("value");

  const [tempDiscountValue, setTempDiscountValue] =
    useState("");

  const [tempDiscountCode, setTempDiscountCode] =
    useState("");

  const [newCustomer, setNewCustomer] =
    useState({
      name: "",
      phone: "",
      code: "",
      address: "",
      email: "",
      taxCode: "",
    });

  const [printTemplate, setPrintTemplate] =
    useState<any>({
      shopName: "NhiPro23",
      address: "TP.HCM",
      phone: "0900 000 000",
      invoiceTitle: "HÓA ĐƠN BÁN HÀNG",
      temporaryTitle: "PHIẾU TẠM TÍNH",
      thankYouText: "Cảm ơn quý khách!",
      seeYouText: "Hẹn gặp lại ❤️",
      paperSize: "A5",
    });

  const currentOrder =
    orders.find(
      (order) =>
        order.id === activeOrder
    ) || orders[0];

  const cart =
    currentOrder?.cart || [];

  const selectedCustomer =
    currentOrder?.customer || null;

  const useProductVat =
    currentOrder?.useProductVat ?? true;

  const paymentMethod =
    currentOrder?.paymentMethod || "cash";

  const customerPay =
    currentOrder?.customerPay || "";

  const search =
    currentOrder?.search || "";

  const barcode =
    currentOrder?.barcode || "";

  const showProductDropdown =
    currentOrder?.showProductDropdown || false;

  const discountType =
    currentOrder?.discountType || "value";

  const discountValue =
    currentOrder?.discountValue || "";

  const discountCode =
    currentOrder?.discountCode || "";

  const splitPayment =
    currentOrder?.splitPayment || {
      cash: "",
      bank: "",
    };

  const updateCurrentOrder =
    (changes: Partial<OrderTab>) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === activeOrder
            ? {
                ...order,
                ...changes,
              }
            : order
        )
      );
    };

  const setCart =
    (newCart: any[] | ((prev: any[]) => any[])) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== activeOrder) {
            return order;
          }

          const nextCart =
            typeof newCart === "function"
              ? newCart(order.cart)
              : newCart;

          return {
            ...order,
            cart: nextCart,
          };
        })
      );
    };

  const addNewOrder = () => {
    const maxId =
      orders.length > 0
        ? Math.max(
            ...orders.map((order) => order.id)
          )
        : 0;

    const newId =
      maxId + 1;

    setOrders((prev) => [
      ...prev,
      createEmptyOrder(newId),
    ]);

    setActiveOrder(newId);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const removeOrder = (orderId: number) => {
    const orderNeedRemove =
      orders.find(
        (order) => order.id === orderId
      );

    if (!orderNeedRemove) return;

    if (
      orderNeedRemove.cart.length > 0
    ) {
      const confirmDelete =
        window.confirm(
          `Đơn ${orderId} đang có sản phẩm. Bạn có chắc muốn xóa đơn này không?`
        );

      if (!confirmDelete) return;
    }

    setOrders((prev) => {
      if (prev.length <= 1) {
        setActiveOrder(1);
        setCustomerSearch("");

        return [
          createEmptyOrder(1),
        ];
      }

      const currentIndex =
        prev.findIndex(
          (order) =>
            order.id === orderId
        );

      const newOrders =
        prev.filter(
          (order) =>
            order.id !== orderId
        );

      if (activeOrder === orderId) {
        const nextOrder =
          newOrders[
            currentIndex >= newOrders.length
              ? newOrders.length - 1
              : currentIndex
          ];

        setActiveOrder(nextOrder.id);

        setCustomerSearch(
          nextOrder.customer
            ? `${nextOrder.customer.name || ""}${
                nextOrder.customer.phone
                  ? " - " + nextOrder.customer.phone
                  : ""
              }`
            : ""
        );
      }

      return newOrders;
    });
  };

  const resetOrRemoveCurrentOrder = () => {
    setOrders((prev) => {
      if (prev.length <= 1) {
        setActiveOrder(1);
        setCustomerSearch("");

        return [
          createEmptyOrder(1),
        ];
      }

      const currentIndex =
        prev.findIndex(
          (order) =>
            order.id === activeOrder
        );

      const newOrders =
        prev.filter(
          (order) =>
            order.id !== activeOrder
        );

      const nextOrder =
        newOrders[
          currentIndex >= newOrders.length
            ? newOrders.length - 1
            : currentIndex
        ];

      setActiveOrder(nextOrder.id);

      setCustomerSearch(
        nextOrder.customer
          ? `${nextOrder.customer.name || ""}${
              nextOrder.customer.phone
                ? " - " + nextOrder.customer.phone
                : ""
            }`
          : ""
      );

      return newOrders;
    });
  };

  const goToNextOrder = () => {
    if (orders.length <= 1) return;

    const currentIndex =
      orders.findIndex(
        (order) =>
          order.id === activeOrder
      );

    const nextIndex =
      currentIndex >= orders.length - 1
        ? 0
        : currentIndex + 1;

    const nextOrder =
      orders[nextIndex];

    setActiveOrder(nextOrder.id);

    setCustomerSearch(
      nextOrder.customer
        ? `${nextOrder.customer.name || ""}${
            nextOrder.customer.phone
              ? " - " + nextOrder.customer.phone
              : ""
          }`
        : ""
    );
  };

  useEffect(() => {
    const order =
      orders.find(
        (item) =>
          item.id === activeOrder
      );

    if (order?.customer) {
      setCustomerSearch(
        `${order.customer.name || ""}${
          order.customer.phone
            ? " - " + order.customer.phone
            : ""
        }`
      );
    } else {
      setCustomerSearch("");
    }

    setShowCustomerDropdown(false);
  }, [activeOrder]);

 useEffect(() => {
  const unsubscribe =
    onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          const name =
            user.displayName ||
            user.email ||
            "Tài khoản";

          setAccountName(name);

          setCurrentUserInfo({
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "",
            name: name,
          });
        } else {
          setAccountName("Tài khoản");
          setCurrentUserInfo(null);
        }
      }
    );

  return () => unsubscribe();
}, []);

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(db, "products"),
        (snapshot) => {
          const productData =
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            }));

          setProducts(productData);
        },
        (error) => {
          console.log(error);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(db, "customers"),
        (snapshot) => {
          const customerData =
            snapshot.docs.map((docItem) => ({
              id: docItem.id,
              ...docItem.data(),
            }));

          setCustomers(customerData);
        },
        (error) => {
          console.log(error);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadPrintTemplate =
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
            setPrintTemplate((prev: any) => ({
              ...prev,
              ...snap.data(),
            }));
          }
        } catch (error) {
          console.log(error);
        }
      };

    loadPrintTemplate();
  }, []);

  const getUnitText =
    (unit: any) => {
      if (typeof unit === "string") {
        return unit || "cái";
      }

      return unit?.name || "cái";
    };

  const getProductCode =
    (product: any) => {
      return (
        product.product_code ||
        product.code ||
        product.sku ||
        ""
      );
    };

  const getProductLocation =
    (product: any) => {
      return (
        product.product_location ||
        product.location ||
        ""
      );
    };

    const getProductDisplayName = (product: any) => {
  return showMainName
    ? (
        product.main_name ||
        product.name ||
        ""
      )
    : (
        product.short_name ||
        product.main_name ||
        product.name ||
        ""
      );
};

const getProductMainName = (product: any) => {
  return (
    product.main_name ||
    product.name ||
    ""
  );
};

const getProductShortName = (product: any) => {
  return (
    product.short_name ||
    product.main_name ||
    product.name ||
    ""
  );
};

  const addToCart =
    (product: any) => {
      const currentStock =
        Number(product.stock || 0);

      const existing =
        cart.find(
          (item) =>
            item.id === product.id
        );

      const currentQty =
        existing?.quantity || 0;

      if (currentStock <= 0) {
        alert(
  `${
    getProductShortName(product)
  } đã hết hàng`
);

        return;
      }

      if (currentQty >= currentStock) {
        alert(
  `${
    getProductShortName(product)
  } không đủ tồn kho`
);

        return;
      }

      if (existing) {
        const updatedCart =
          cart.map((item) => {
            if (item.id === product.id) {
              return {
                ...item,
                quantity:
                  Number(item.quantity || 0) + 1,
              };
            }

            return item;
          });

        setCart(updatedCart);
      } else {
        setCart([
  {
    id: product.id,

    name:
  product.name || "",

main_name:
  product.main_name ||
  product.name ||
  "",

short_name:
  product.short_name ||
  product.main_name ||
  product.name ||
  "",

    imageUrl: product.imageUrl || "",

    quantity: 1,

    price: Number(product.price || 0),

    tax: Number(product.tax || 0),

    stock: Number(product.stock || 0),

    unit: getUnitText(product.unit),

    product_code: getProductCode(product),

    product_location: getProductLocation(product),

    barcode: product.barcode || "",
  },

  ...cart,
]);
      }
    };

  const handleBarcode =
    (value: string) => {
      updateCurrentOrder({
        barcode: value,
      });

      const keyword =
        value.trim().toLowerCase();

      if (!keyword) return;

      const found =
        products.find(
          (item: any) =>
            String(item.barcode || "")
              .toLowerCase() === keyword ||
            String(getProductCode(item) || "")
              .toLowerCase() === keyword
        );

      if (found) {
        addToCart(found);

        updateCurrentOrder({
          barcode: "",
        });
      }
    };

  const increaseQty =
    (id: string) => {
      const itemInCart =
        cart.find(
          (item) =>
            item.id === id
        );

      if (!itemInCart) return;

      const stock =
        Number(itemInCart.stock || 0);

      if (
        Number(itemInCart.quantity || 0) >=
        stock
      ) {
        alert(
  `${
    itemInCart.short_name ||
    itemInCart.main_name ||
    itemInCart.name
  } không đủ tồn kho`
);

        return;
      }

      setCart(
        cart.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + 1,
              }
            : item
        )
      );
    };

  const decreaseQty =
    (id: string) => {
      const updated =
        cart
          .map((item) => {
            if (item.id === id) {
              return {
                ...item,
                quantity:
                  Number(item.quantity || 0) - 1,
              };
            }

            return item;
          })
          .filter(
            (item) =>
              Number(item.quantity || 0) > 0
          );

      setCart(updated);
    };

  const changePrice =
    (
      id: string,
      value: number
    ) => {
      setCart((prev: any[]) =>
        prev.map((cartItem) => {
          if (cartItem.id !== id) {
            return cartItem;
          }

          return {
            ...cartItem,
            price:
              value >= 0
                ? value
                : 0,
          };
        })
      );
    };

  const changeQty =
    (
      id: string,
      value: number
    ) => {
      setCart((prev: any[]) =>
        prev.map((cartItem) => {
          if (cartItem.id !== id) {
            return cartItem;
          }

          const stock =
            Number(cartItem.stock || 0);

          let newQty =
            value > 0
              ? value
              : 1;

          if (newQty > stock) {
            alert(
  `${
    cartItem.short_name ||
    cartItem.main_name ||
    cartItem.name
  } không đủ tồn kho`
);

            newQty = stock;
          }

          return {
            ...cartItem,
            quantity: newQty,
          };
        })
      );
    };

  const removeItem =
    (id: string) => {
      setCart(
        cart.filter(
          (item) =>
            item.id !== id
        )
      );
    };

  const subtotal =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );

  const vatAmount =
    useProductVat
      ? cart.reduce(
          (sum, item) => {
            const itemTotal =
              Number(item.price || 0) *
              Number(item.quantity || 0);

            const itemVat =
              itemTotal *
              (
                Number(item.tax || 0) /
                100
              );

            return sum + itemVat;
          },
          0
        )
      : 0;

  const rawTotal =
    subtotal + vatAmount;

  const discountAmount =
    discountType === "percent"
      ? Math.min(
          rawTotal,
          rawTotal *
            (
              Number(discountValue || 0) /
              100
            )
        )
      : Math.min(
          rawTotal,
          Number(discountValue || 0)
        );

  const total =
    Math.max(
      rawTotal - discountAmount,
      0
    );

    useEffect(() => {
  if (paymentMethod !== "mixed") {
    updateCurrentOrder({
      customerPay: String(total),
    });
  }
}, [total, paymentMethod]);

  const splitPaymentTotal =
    Number(splitPayment.cash || 0) +
    Number(splitPayment.bank || 0);

  const customerPayAmount =
  paymentMethod === "mixed"
    ? splitPaymentTotal
    : Number(customerPay || total);

  const changeAmount =
    Math.max(
      customerPayAmount - total,
      0
    );

  const getPaymentMethodText =
    (method: string) => {
      if (method === "bank") return "Chuyển khoản";
      if (method === "mixed") return "CK + TM";
      return "Tiền mặt";
    };

  const openSplitPaymentModal = () => {
    const cashAmount =
      Number(splitPayment.cash || 0);

    const bankAmount =
      splitPayment.bank !== ""
        ? Number(splitPayment.bank || 0)
        : Math.max(total - cashAmount, 0);

    setTempSplitPayment({
      cash: String(cashAmount || ""),
      bank: String(bankAmount || ""),
    });

    setShowSplitPaymentModal(true);
  };

  const applySplitPayment = () => {
  const cash =
    Number(tempSplitPayment.cash || 0);

  const bank =
    Number(tempSplitPayment.bank || 0);

  if (cash < 0 || bank < 0) {
    alert(
      "Số tiền thanh toán không được nhỏ hơn 0"
    );

    return;
  }

  if (cash + bank <= 0) {
    alert(
      "Vui lòng nhập tiền mặt hoặc chuyển khoản"
    );

    return;
  }

  updateCurrentOrder({
    paymentMethod: "mixed",
    customerPay: String(cash + bank),
    splitPayment: {
      cash: String(cash),
      bank: String(bank),
    },
  });

  setShowSplitPaymentModal(false);
};

  const printBill =
    (
      billType: "temporary" | "invoice" = "temporary",
      orderCodeParam?: string
    ) => {

      const billTitle =
        billType === "invoice"
          ? printTemplate.invoiceTitle
          : printTemplate.temporaryTitle;

      const now =
        new Date();
      const billDate =
        `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;

      const displayOrderCode =
        orderCodeParam || "TẠM TÍNH";

      const shopNameHtml =
        printTemplate.shopName
          ? `<h1>${printTemplate.shopName}</h1>`
          : "";

      const billTitleHtml =
        billTitle
          ? `${billTitle}<br>`
          : "";

      const addressHtml =
        printTemplate.address
          ? `Địa chỉ: ${printTemplate.address}<br>`
          : "";

      const phoneHtml =
        printTemplate.phone
          ? `Hotline: ${printTemplate.phone}`
          : "";

      const customerHtml =
        selectedCustomer
          ? `
            <div class="customer-info">
              Khách hàng: ${selectedCustomer.name || ""}<br>
              SĐT: ${selectedCustomer.phone || ""}
            </div>
          `
          : "";

      const thankYouHtml =
        printTemplate.thankYouText
          ? `${printTemplate.thankYouText}<br>`
          : "";

      const seeYouHtml =
        printTemplate.seeYouText
          ? `${printTemplate.seeYouText}`
          : "";

      const pageSize =
        printTemplate.paperSize === "K80"
          ? "80mm auto"
          : "A5";

      const pageMargin =
        printTemplate.paperSize === "K80"
          ? "3mm"
          : "10mm";

      const billMaxWidth =
        printTemplate.paperSize === "K80"
          ? "280px"
          : "500px";

      const itemsHtml =
        cart.map(
          (item, index) => {
            const itemTotal =
              Number(item.price || 0) *
              Number(item.quantity || 0);

            const itemVat =
              useProductVat
                ? itemTotal *
                    (
                      Number(item.tax || 0) /
                      100
                    )
                : 0;

            const itemFinalTotal =
              itemTotal + itemVat;

            return `
              <tr>
                <td>
                  ${index + 1}
                </td>

                <td>
                  ${
  getProductDisplayName(item)
}
                  ${
                    item.product_code
                      ? `<br><small>Mã: ${item.product_code}</small>`
                      : ""
                  }
                </td>

                <td>
                  ${item.quantity} ${getUnitText(item.unit)}
                </td>

                <td>
                  ${formatMoney(Number(item.price || 0))}đ
                </td>

                <td>
                  ${useProductVat ? item.tax || 0 : 0}%
                </td>

                <td>
                  ${formatMoney(itemFinalTotal)}đ
                </td>
              </tr>
            `;
          }
        )
        .join("");

      const printArea =
  document.getElementById(
    "print-area"
  );

if (!printArea) return;

printArea.innerHTML = `
        <html>
          <head>
            <title></title>

            <style>
              @page {
                size: ${pageSize};
                margin: ${pageMargin};
              }

              body {
                font-family: Arial;
                color: #000;
                width: 100%;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
              }

              .bill-container {
                width: 100%;
                max-width: ${billMaxWidth};
                margin: 0 auto;
              }

              .center {
                text-align: center;
              }

              h1 {
                margin: 0;
                font-size: 26px;
              }

              .shop-info {
                margin-top: 2px;
                margin-bottom: 10px;
                font-size: 10px;
                line-height: 1.3;
              }

              .bill-meta {
                margin-top: 2px;
                font-size: 10px;
                font-weight: normal;
                text-align: center;
              }

              .customer-info {
                margin: 8px 0;
                font-size: 10px;
                line-height: 1.4;
              }

              .shop-info:empty {
                display: none;
              }

              hr {
                margin: 20px 0;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }

              th {
                background: #eee;
                font-size: 10px;
                padding: 5px;
                text-align: left;
              }

              td {
                border-bottom: 1px dashed #999;
                padding: 5px;
                font-size: 10px;
                text-align: left;
                vertical-align: top;
              }

              small {
                font-size: 10px;
              }

              .total {
                margin-top: 8px;
                font-size: 10px;
                font-weight: bold;
                text-align: right;
              }

              .thanks {
                text-align: center;
                margin-top: 12px;
                font-size: 12px;
                line-height: 1.3;
              }
            </style>
          </head>

          <body>
            <div class="bill-container">
              <div class="center">
                ${shopNameHtml}

                <div class="shop-info">
                  ${billTitleHtml}

                  <div class="bill-meta">
                    ${billDate} | ${displayOrderCode}
                  </div>

                  ${addressHtml}
                  ${phoneHtml}
                </div>
              </div>

              ${customerHtml}

              <hr>

              <table>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>SP</th>
                    <th>SL</th>
                    <th>Giá</th>
                    <th>VAT</th>
                    <th>TT</th>
                  </tr>
                </thead>

                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="total">
                <div>
                  Tổng:
                  ${formatMoney(subtotal)}đ
                </div>

                <div>
                  VAT:
                  ${formatMoney(vatAmount)}đ
                </div>

                <div>
  ${
    discountAmount > 0
      ? discountType === "percent"
        ? `Chiết khấu ${Number(discountValue || 0)}%: ${formatMoney(discountAmount)}đ`
        : `Chiết khấu: ${formatMoney(discountAmount)}đ`
      : `Chiết khấu: 0đ`
  }
</div>

                <div style="
                  font-size: 10px;
                  margin-top: 3px;
                  font-weight: bold;
                ">
                  Tổng cộng:
                  ${formatMoney(total)}đ
                </div>

              </div>

              <div class="thanks">
                ${thankYouHtml}
                ${seeYouHtml}
              </div>
            </div>
          </body>
        </html>
      `;

const printFrame =
  document.createElement("iframe");

printFrame.style.position = "fixed";
printFrame.style.right = "0";
printFrame.style.bottom = "0";
printFrame.style.width = "0";
printFrame.style.height = "0";
printFrame.style.border = "0";

document.body.appendChild(
  printFrame
);

const frameDoc =
  printFrame.contentWindow?.document;

if (!frameDoc) return;

frameDoc.open();
frameDoc.write(printArea.innerHTML);
frameDoc.close();

setTimeout(() => {
  printFrame.contentWindow?.focus();
  printFrame.contentWindow?.print();

  setTimeout(() => {
    document.body.removeChild(
      printFrame
    );
  }, 1000);
}, 300);
    };

  const getNextOrderCode =
    async () => {
      const counterRef =
        doc(
          db,
          "settings",
          "order_counter"
        );

      const counterSnap =
        await getDoc(counterRef);

      let nextNumber = 1;

      if (counterSnap.exists()) {
        const data: any =
          counterSnap.data();

        nextNumber =
          Number(data.current || 0) + 1;
      }

      await setDoc(
        counterRef,
        {
          current: nextNumber,
        },
        {
          merge: true,
        }
      );

      return `SON${String(nextNumber).padStart(5, "0")}`;
    };

    const printTemporaryInvoice = () => {
  if (cart.length === 0) {
    alert("Chưa có sản phẩm");
    return;
  }

  const temporaryOrder = {
    id: "TAM-TINH",

    orderCode: "TẠM TÍNH",
    order_code: "TẠM TÍNH",

    createdAt:
      new Date().toISOString(),

    customer:
      selectedCustomer,

    customerName:
      selectedCustomer?.name ||
      "Khách lẻ",

    customerPhone:
      selectedCustomer?.phone ||
      "",

    items: cart.map((item) => ({
  ...item,

  name: item.name || "",

  main_name:
    item.main_name ||
    item.name ||
    "",

  short_name:
    item.short_name ||
    item.main_name ||
    item.name ||
    "",

  printName: showMainName
    ? (
        item.main_name ||
        item.name ||
        ""
      )
    : (
        item.short_name ||
        item.main_name ||
        item.name ||
        ""
      ),

  productCode:
    item.product_code ||
    item.code ||
    item.sku ||
    "",
})),

    subtotal,
    vatAmount,

    discountType,
    discountValue,
    discountAmount,

    total,

    finalTotal:
      total,

    final_total:
      total,

    customerPaid:
      customerPayAmount,

    paidAmount:
      customerPayAmount,

    changeAmount,
  };

  sessionStorage.setItem(
    "temporary_invoice_order",
    JSON.stringify(
      temporaryOrder
    )
  );

  window.open(
    "/print-order/invoice?type=temporary&print=1",
    "_blank"
  );
};

  const checkout =
    async () => {
      if (cart.length === 0) {
        alert(
          "Chưa có sản phẩm"
        );

        return;
      }

      for (const item of cart) {
        const stock =
          Number(item.stock || 0);

        const quantity =
          Number(item.quantity || 0);

        if (quantity > stock) {
          alert(
            `Sản phẩm "${
  item.short_name ||
  item.main_name ||
  item.name
}" không đủ tồn kho`
          );

          return;
        }
      }

      const orderCode =
  await getNextOrderCode();

const paymentMethodText =
  getPaymentMethodText(paymentMethod);

let orderCashAmount = 0;
let orderTransferAmount = 0;
let orderCodAmount = 0;

const orderTotal =
  Number(total || 0);

const splitCashAmount =
  Number(splitPayment.cash || 0);

const splitBankAmount =
  Number(splitPayment.bank || 0);

if (paymentMethod === "cash") {
  orderCashAmount =
    Number(customerPay || 0);
}

if (
  paymentMethod === "bank" ||
  paymentMethod === "transfer"
) {
  orderTransferAmount =
    Number(customerPay || 0);
}

if (paymentMethod === "cod") {
  orderCodAmount =
    Number(customerPay || 0);
}

if (paymentMethod === "cod") {
  orderCodAmount = orderTotal;
}

if (paymentMethod === "mixed") {

  orderCashAmount =
    splitCashAmount;

  orderTransferAmount =
    splitBankAmount;

  const mixedTotal =
    orderCashAmount +
    orderTransferAmount;

  if (mixedTotal <= 0) {

    alert(
      "Vui lòng nhập số tiền mặt hoặc chuyển khoản"
    );

    return;

  }

}

const tempPaidAmount =

  orderCashAmount +

  orderTransferAmount +

  orderCodAmount;

if (
  tempPaidAmount <
  orderTotal
) {

  const confirmDebt =
    window.confirm(

`Khách thanh toán thiếu.

Tổng đơn: ${formatMoney(orderTotal)}đ
Đã trả: ${formatMoney(tempPaidAmount)}đ
Còn nợ: ${formatMoney(orderTotal - tempPaidAmount)}đ

OK = tạo công nợ`

);

  if (!confirmDebt) {

    return;

  }

}

const orderPaidAmount =
  Math.min(
    orderCashAmount +
      orderTransferAmount +
      orderCodAmount,
    orderTotal
  );

const orderRemainingAmount =
  Math.max(
    orderTotal - orderPaidAmount,
    0
  );

const orderChangeAmount =
  Math.max(
    orderPaidAmount - orderTotal,
    0
  );

const orderRef = await addDoc(
  collection(db, "orders"),
  {
    orderCode: orderCode,
    order_code: orderCode,

    createdBy:
      currentUserInfo?.name ||
      accountName ||
      "Không rõ",
    createdByEmail:
      currentUserInfo?.email || "",
    createdByUid:
      currentUserInfo?.uid || "",

    customer: selectedCustomer,
    customerId: selectedCustomer?.id || "",
    customerName:
      selectedCustomer?.name || "",
    customerPhone:
      selectedCustomer?.phone || "",
    customerCode:
      selectedCustomer?.code || "",
    customerAddress:
      selectedCustomer?.address || "",
    customerEmail:
      selectedCustomer?.email || "",
    customerTaxCode:
      selectedCustomer?.taxCode || "",

    items: cart.map(item => ({
  ...item,

  name:
    item.name,

  main_name:
    item.main_name ||
    item.name,

  short_name:
    item.short_name ||
    item.main_name ||
    item.name,

  printName: showMainName
    ? (
        item.main_name ||
        item.name
      )
    : (
        item.short_name ||
        item.main_name ||
        item.name
      ),
})),

list: cart.map(item => ({
  ...item,

  name:
    item.name,

  main_name:
    item.main_name ||
    item.name,

  short_name:
    item.short_name ||
    item.main_name ||
    item.name,

  printName: showMainName
    ? (
        item.main_name ||
        item.name
      )
    : (
        item.short_name ||
        item.main_name ||
        item.name
      ),
})),

    subtotal: subtotal,
    vatAmount: vatAmount,
    discountType: discountType,
    discountValue: discountValue,
    discountCode: discountCode,
    discountAmount: discountAmount,

    total: orderTotal,
    finalTotal: orderTotal,
    final_total: orderTotal,

    paymentMethod: paymentMethod,
    payment_method: paymentMethod,
    paymentMethodText: paymentMethodText,

    splitPayment: {
      cash: orderCashAmount,
      bank: orderTransferAmount,
    },

    cashAmount: orderCashAmount,
    cash_amount: orderCashAmount,
    moneyCash: orderCashAmount,

    transferAmount: orderTransferAmount,
    transfer_amount: orderTransferAmount,
    bankAmount: orderTransferAmount,
    bank_amount: orderTransferAmount,
    moneyBank: orderTransferAmount,

    codAmount: orderCodAmount,
    cod_amount: orderCodAmount,

    paidAmount: orderPaidAmount,
    paid_amount: orderPaidAmount,

    customerPay: orderPaidAmount,
    customer_pay: orderPaidAmount,

    changeAmount: orderChangeAmount,
    change_amount: orderChangeAmount,

    remainingAmount: orderRemainingAmount,
    remaining_amount: orderRemainingAmount,
    debtAmount: orderRemainingAmount,

    payments: [
      {
        method: "cash",
        methodText: "Tiền mặt",
        amount: orderCashAmount,
      },
      {
        method: "transfer",
        methodText: "Chuyển khoản",
        amount: orderTransferAmount,
      },
      {
        method: "cod",
        methodText: "COD",
        amount: orderCodAmount,
      },
    ].filter(
      (payment) =>
        Number(payment.amount || 0) > 0
    ),

    status:
      orderRemainingAmount > 0
        ? "debt"
        : "completed",
    createdAt: new Date(),
  }
);
window.open(
  `/print-order/invoice?id=${encodeURIComponent(orderRef.id)}&print=1`,
  "_blank"
);
console.log(
  "TOTAL:",
  orderTotal
);

console.log(
  "PAID:",
  orderPaidAmount
);

console.log(
  "REMAIN:",
  orderRemainingAmount
);
console.log(
  "orderRemainingAmount:",
  orderRemainingAmount
);

if (
  Number(orderRemainingAmount) > 0
) {

  let oldDebts = [];

try {
  oldDebts =
    JSON.parse(
      localStorage.getItem(
        "debts"
      ) || "[]"
    );
} catch {
  oldDebts = [];
}

  const debtData = {

    id:
      "DEBT" +
      Date.now(),

    date:
  new Date()
    .toLocaleString(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ),

    orderCode:
      orderCode,

    customer:
      selectedCustomer?.name ||
      "Khách lẻ",

    customerPhone:
      selectedCustomer?.phone || "",

    total:
      Number(orderTotal),

    paid:
      Number(
        orderPaidAmount
      ),

    remaining:
      Number(
        orderRemainingAmount
      ),

    status:
      "unpaid",

    type:
      "customer",

    note:
      "Tự tạo từ POS",

    products:
  cart.map(
    (item) => ({

      name:
        item.name,

      main_name:
        item.main_name ||
        item.name,

      short_name:
        item.short_name ||
        item.main_name ||
        item.name,

          qty:
            Number(
              item.quantity || 0
            ),

          price:
            Number(
              item.price || 0
            ),

        })
      ),

  };

  console.log(
    "SAVE DEBT:",
    debtData
  );

 await addDoc(
  collection(db, "debts"),
  debtData
);

console.log(
  "DEBTS SAVED:",
  debtData
);

}
      for (const item of cart) {
        const currentStock =
          Number(item.stock || 0);

        const newStock =
          currentStock -
          Number(item.quantity || 0);

        await updateDoc(
          doc(db, "products", item.id),
          {
            stock:
              newStock < 0
                ? 0
                : newStock,
          }
        );
      }

setTimeout(() => {
  resetOrRemoveCurrentOrder();
}, 800);
};
  const openDiscountModal = () => {
    setTempDiscountType(discountType);
    setTempDiscountValue(discountValue);
    setTempDiscountCode(discountCode);
    setShowDiscountModal(true);
  };

  const applyDiscount = () => {
    const value =
      Number(tempDiscountValue || 0);

    if (value < 0) {
      alert("Chiết khấu không được nhỏ hơn 0");
      return;
    }

    if (
      tempDiscountType === "percent" &&
      value > 100
    ) {
      alert("Chiết khấu phần trăm không được lớn hơn 100%");
      return;
    }

    updateCurrentOrder({
      discountType: tempDiscountType,
      discountValue: String(value),
      discountCode: tempDiscountCode,
    });

    setShowDiscountModal(false);
  };

  useEffect(() => {
    const handleShortcut =
      (e: KeyboardEvent) => {
        const target =
          e.target as HTMLElement;

        const tagName =
          target.tagName.toLowerCase();

        const isTyping =
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          target.isContentEditable;

        if (e.key === "Escape") {
          setShowShortcutModal(false);
          setShowCustomerForm(false);
          setShowCustomerDropdown(false);
          setShowDiscountModal(false);
          setShowSplitPaymentModal(false);

          updateCurrentOrder({
            showProductDropdown: false,
          });

          return;
        }

        if (
          e.key.startsWith("F") ||
          e.altKey
        ) {
          e.preventDefault();
        } else if (isTyping) {
          return;
        }

        if (e.key === "F1") {
          if (showSplitPaymentModal) {
            applySplitPayment();
          } else {
            checkout();
          }
          return;
        }

        if (e.key === "F2") {
          customerPayRef.current?.focus();
          customerPayRef.current?.select();
          return;
        }

        if (e.key === "F3") {
          productSearchRef.current?.focus();

          updateCurrentOrder({
            showProductDropdown: true,
          });

          return;
        }

        if (e.key === "F4") {
          customerSearchRef.current?.focus();
          setShowCustomerDropdown(true);
          return;
        }

        if (e.key === "F6") {
          openDiscountModal();
          return;
        }

        if (e.key === "F7") {
          paymentMethodRef.current?.focus();
          return;
        }

        if (e.key === "F10") {
          setShowBarcodeInput((prev) => !prev);
          return;
        }

        if (e.key === "F11") {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }

          return;
        }

        if (e.altKey && e.key === "1") {
  printTemporaryInvoice();
  return;
}

        if (e.altKey && e.key === "2") {
          goToNextOrder();
          return;
        }

        if (e.altKey && e.key === "3") {
          resetOrRemoveCurrentOrder();
          return;
        }

        if (e.altKey && e.key === "4") {
          const confirmClear =
            window.confirm(
              "Bạn có chắc muốn xóa toàn bộ sản phẩm trong đơn này không?"
            );

          if (confirmClear) {
            setCart([]);
          }

          return;
        }

        if (
          e.altKey &&
          e.key.toLowerCase() === "x"
        ) {
          updateCurrentOrder({
            paymentMethod:
              paymentMethod === "cash"
                ? "bank"
                : "cash",
          });

          return;
        }
      };

    window.addEventListener(
      "keydown",
      handleShortcut
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleShortcut
      );
    };
  }, [
    orders,
    activeOrder,
    paymentMethod,
    cart,
    total,
    customerPay,
    showProductDropdown,
    discountType,
    discountValue,
    discountCode,
    tempDiscountType,
    tempDiscountValue,
    tempDiscountCode,
    showSplitPaymentModal,
    tempSplitPayment,
  ]);

  const focusProductSearch = () => {
  productSearchRef.current?.focus();

  updateCurrentOrder({
    showProductDropdown: true,
  });
};
  const filteredCustomers =
    customerSearch.trim() === ""
      ? customers.slice(0, 20)
      : customers.filter((customer: any) => {
          const keyword =
            customerSearch.toLowerCase().trim();

          const name =
            String(customer.name || "")
              .toLowerCase();

          const phone =
            String(customer.phone || "")
              .toLowerCase();
              
          const code =
            String(customer.code || "")
              .toLowerCase();

          return (
            name.includes(keyword) ||
            phone.includes(keyword) ||
            code.includes(keyword)
          );
        });

  const selectCustomer =
    (customer: any) => {
      updateCurrentOrder({
        customer: customer,
      });

      setCustomerSearch(
        `${customer.name || ""}${
          customer.phone
            ? " - " + customer.phone
            : ""
        }`
      );

      setShowCustomerDropdown(false);
    };

  const addNewCustomer =
    async () => {
      if (!newCustomer.name.trim()) {
        alert("Vui lòng nhập tên khách hàng");
        return;
      }

      if (!newCustomer.phone.trim()) {
        alert("Vui lòng nhập số điện thoại");
        return;
      }

      const customerData = {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        code:
          newCustomer.code.trim() ||
          `KH${Date.now()}`,
        address: newCustomer.address.trim(),
        email: newCustomer.email.trim(),
        taxCode: newCustomer.taxCode.trim(),
        createdAt: new Date(),
      };

      const docRef =
        await addDoc(
          collection(db, "customers"),
          customerData
        );

      const savedCustomer = {
        id: docRef.id,
        ...customerData,
      };

      updateCurrentOrder({
        customer: savedCustomer,
      });

      setCustomerSearch(
        `${savedCustomer.name} - ${savedCustomer.phone}`
      );

      setNewCustomer({
        name: "",
        phone: "",
        code: "",
        address: "",
        email: "",
        taxCode: "",
      });

      setShowCustomerForm(false);
      setShowCustomerDropdown(false);
    };

  const filteredProducts =
    search.trim() === ""
      ? products.slice(0, 30)
      : products.filter((item: any) => {
          const keyword =
            search.toLowerCase().trim();

          const itemName =
  String(item.name || "")
    .toLowerCase();

const itemMainName =
  String(item.main_name || "")
    .toLowerCase();

const itemShortName =
  String(item.short_name || "")
    .toLowerCase();

          const itemCode =
            String(getProductCode(item) || "")
              .toLowerCase();

          const itemLocation =
            String(getProductLocation(item) || "")
              .toLowerCase();

          const itemBarcode =
            String(item.barcode || "")
              .toLowerCase();

          return (
  itemShortName.includes(keyword) ||
  itemMainName.includes(keyword) ||
  itemName.includes(keyword) ||
  itemCode.includes(keyword) ||
  itemLocation.includes(keyword) ||
  itemBarcode.includes(keyword)
);
        });

  return (
    <main className="min-h-screen bg-gray-100 text-black">

      {/* THANH TRÊN */}
      <div className="h-12 bg-blue-700 text-white flex items-center justify-between px-3">

        <div className="flex items-center gap-2 flex-1">

          <div
            className="relative w-[380px]"
            onMouseEnter={() =>
              updateCurrentOrder({
                showProductDropdown: true,
              })
            }

          >

            <input
              ref={productSearchRef}
              type="text"
              placeholder="Thêm sản phẩm vào đơn (F3)"
              className="w-full bg-white text-black px-3 py-2 rounded-lg outline-none text-sm"
              value={search}
              onChange={(e) => {
                updateCurrentOrder({
                  search: e.target.value,
                  showProductDropdown: true,
                });
              }}
              onFocus={() =>
                updateCurrentOrder({
                  showProductDropdown: true,
                })
              }
            />

            {showProductDropdown && (
  <div
    className="absolute top-full left-0 w-[620px] bg-white border rounded-xl shadow-lg z-50 max-h-96 overflow-auto mt-1"
    onMouseLeave={() => {
      updateCurrentOrder({
        showProductDropdown: false,
      });
    }}
  >

                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-gray-500">
                    Không tìm thấy sản phẩm
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onMouseDown={() => {
                        addToCart(product);

                        updateCurrentOrder({
                          search: "",
                          showProductDropdown: false,
                        });
                      }}
                      className="w-full p-3 hover:bg-blue-50 border-b"
                    >
                      <div className="flex items-center justify-between gap-4">

                        {/* BÊN TRÁI */}
                        {/* BÊN TRÁI */}

<div className="flex items-center gap-3 flex-1 min-w-0">

  {product.imageUrl && (

    <img
      src={product.imageUrl}
      alt={product.name}
      className="
        w-12
        h-12
        rounded-lg
        object-cover
        border
      "
    />

  )}

  <div className="text-left flex-1 min-w-0">

    <div className="font-semibold text-black truncate">
  {getProductShortName(product)}
</div>

<div className="text-xs text-gray-500 truncate">
  {getProductMainName(product)}
</div>

    <div className="text-xs text-gray-500 mt-1">
      Mã: {getProductCode(product) || "-"}
    </div>

    <div className="text-xs text-gray-500 mt-1">
      Vị trí: {getProductLocation(product) || "-"}
    </div>

  </div>

</div>

                        {/* BÊN PHẢI */}
                        <div className="text-right w-[130px] shrink-0">

                          <div className="font-semibold text-blue-700">
                            {formatMoney(product.price)}đ
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            VAT: {Number(product.tax || 0)}%
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            Có thể bán: {Number(product.stock || 0)}
                          </div>

                        </div>

                      </div>
                    </button>
                  ))
                )}

              </div>
            )}

          </div>

          <div className="flex items-center gap-2">

            {showBarcodeInput && (
              <input
                type="text"
                placeholder="Quét barcode hoặc mã sản phẩm..."
                className="w-[280px] bg-white text-black px-3 py-2 rounded-lg outline-none text-sm"
                value={barcode}
                onChange={(e) =>
                  handleBarcode(e.target.value)
                }
              />
            )}

            <button
              type="button"
              onClick={() =>
                setShowBarcodeInput(!showBarcodeInput)
              }
              title={
                showBarcodeInput
                  ? "Ẩn ô quét mã"
                  : "Hiện ô quét mã"
              }
              className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-800 flex items-center justify-center"
            >
              {showBarcodeInput ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-6 h-6"
                >
                  <path d="M2.71 3.16 1.39 4.48l3.05 3.05C2.98 8.67 1.82 10.19 1 12c1.73 4.39 6 7.5 11 7.5 1.84 0 3.57-.43 5.09-1.2l2.43 2.43 1.32-1.32L2.71 3.16zM12 17c-2.76 0-5-2.24-5-5 0-.89.23-1.72.64-2.45l1.52 1.52A3 3 0 0 0 12 15c.34 0 .67-.06.97-.16l1.52 1.52c-.73.41-1.6.64-2.49.64zm10.99-5c-.8-2.03-2.18-3.76-3.93-5.02C17.04 5.51 14.62 4.5 12 4.5c-1.4 0-2.74.24-3.98.69l1.68 1.68A4.93 4.93 0 0 1 12 7c2.76 0 5 2.24 5 5 0 .78-.18 1.52-.5 2.18l2.06 2.06c1.89-1.2 3.42-2.99 4.43-4.24z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="w-6 h-6"
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                </svg>
              )}
            </button>

          </div>

          <div className="flex rounded-lg overflow-hidden border border-white/40 ml-2">

  <button
    type="button"
    onClick={() => setShowMainName(false)}
    className={`px-3 py-2 text-sm ${
      !showMainName
        ? "bg-white text-blue-700 font-semibold"
        : "bg-blue-600 text-white"
    }`}
  >
    Tên bán
  </button>

  <button
    type="button"
    onClick={() => setShowMainName(true)}
    className={`px-3 py-2 text-sm ${
      showMainName
        ? "bg-white text-blue-700 font-semibold"
        : "bg-blue-600 text-white"
    }`}
  >
    Tên đầy đủ
  </button>

</div>

          <div className="flex items-center gap-1 ml-2">

            {orders.map((order) => (
              <div
                key={order.id}
                className={
                  activeOrder === order.id
                    ? "bg-blue-900 rounded-lg flex items-center overflow-hidden"
                    : "bg-blue-600 hover:bg-blue-800 rounded-lg flex items-center overflow-hidden"
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setActiveOrder(order.id)
                  }
                  className="px-4 py-2 font-semibold text-sm"
                >
                  Đơn {order.id}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();

                    removeOrder(order.id);
                  }}
                  title={`Xóa Đơn ${order.id}`}
                  className="px-2 py-2 text-white/80 hover:text-white hover:bg-red-600 font-bold"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addNewOrder}
              title="Tạo đơn hàng mới"
              className="text-3xl leading-none px-3 hover:bg-blue-800 rounded-lg"
            >
              +
            </button>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <div className="text-sm text-right leading-tight">
            <div>Chi nhánh mặc định</div>

            <div className="text-xs opacity-90 max-w-[160px] truncate">
              {accountName}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowShortcutModal(true)
            }
            title="Phím tắt"
            className="h-10 px-3 rounded-lg border border-white/80 hover:bg-blue-800 flex items-center gap-1 text-sm font-semibold"
          >
            <span className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-xs">
              ?
            </span>
            Phím tắt
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            title="Về trang quản trị"
            className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-800 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="w-7 h-7"
            >
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center border-2 border-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="w-6 h-6"
            >
              <path d="M17 8h-1V6c0-2.21-1.79-4-4-4S8 3.79 8 6v2H7c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-5 9.73V20h-1v-2.27c-.6-.35-1-1-1-1.73 0-1.1.9-2 2-2s2 .9 2 2c0 .73-.4 1.38-1 1.73zM14 8h-4V6c0-1.1.9-2 2-2s2 .9 2 2v2z" />
            </svg>
          </button>

        </div>

      </div>

      {/* BODY */}
      <div className="flex h-[calc(100vh-48px)]">

        {/* BÊN TRÁI */}
        <section className="flex-1 bg-white overflow-auto relative">

  {cart.length === 0 ? (
    <div className="h-full flex items-center justify-center">

      <div className="text-center">

        <div className="mx-auto mb-5 w-28 h-28 text-gray-200">

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 120 120"
            fill="currentColor"
            className="w-full h-full"
          >
            <path d="M60 8c-11.6 0-21 9.4-21 21 0 8.4 5 15.7 12.2 19L18 61.5v31.2L60 112l42-19.3V61.5L68.8 48C76 44.7 81 37.4 81 29 81 17.4 71.6 8 60 8zm0 12c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9zm-35 51.2 29 13.3v14.6L25 85.8V71.2zm70 0v14.6L66 99.1V84.5l29-13.3zM60 74.2 33.7 62.1 60 51.4l26.3 10.7L60 74.2z" />
          </svg>

        </div>

        <div className="text-xl text-gray-800 mb-5">
          Đơn hàng của bạn chưa có sản phẩm nào
        </div>

        <button
          type="button"
          onClick={focusProductSearch}
          className="px-12 py-3 border rounded-xl text-lg hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700"
        >
          Thêm sản phẩm ngay
        </button>

      </div>

    </div>
  ) : (
    <table className="w-full table-fixed border-collapse text-sm">

      <thead className="bg-gray-100 sticky top-0 z-10">
        <tr className="border-b">
          <th className="p-3 text-left w-[60px] whitespace-nowrap">
  STT
</th>

<th className="p-3 text-left w-[90px] whitespace-nowrap">
  Mã SKU
</th>

<th className="p-3 text-left">
  Tên sản phẩm
</th>

<th className="p-3 text-center w-[80px] whitespace-nowrap">
  Đơn vị
</th>

<th className="p-3 text-center w-[150px] whitespace-nowrap">
  Số lượng
</th>

<th className="p-3 text-right w-[140px] whitespace-nowrap">
  Đơn giá
</th>

<th className="p-3 text-right w-[140px] whitespace-nowrap">
  Thành tiền
</th>

<th className="p-3 w-[50px]"></th>

          <th className="p-3 text-center w-14"></th>
        </tr>
      </thead>

      <tbody>
        {cart.map((item: any, index: number) => {
          const itemTotal =
            Number(item.price || 0) *
            Number(item.quantity || 0);

          const itemVat =
            useProductVat
              ? itemTotal *
                  (
                    Number(item.tax || 0) /
                    100
                  )
              : 0;

          const itemFinalTotal =
            itemTotal + itemVat;

          return (
            <tr
              key={item.id || index}
              className="border-b hover:bg-blue-50"
            >

              <td className="p-3">
  {index + 1}
</td>
<td className="p-3">
  {item.product_code || ""}
</td>

              <td className="p-3">
  <div className="flex items-start gap-3">
    
    <button
  type="button"
  onClick={() => removeItem(item.id)}
  className="text-red-600 font-bold text-xl hover:text-red-700 hover:scale-110 transition"
  title="Xóa sản phẩm"
>
  ×
</button>

    <div className="leading-5">

  <div className="font-semibold text-[15px]">
    {getProductDisplayName(item)}
</div>

  {getProductMainName(item) !== getProductDisplayName(item) && (
    <div className="text-xs text-gray-500">
        {getProductMainName(item)}
    </div>
)}

  <div className="flex items-center gap-5 text-xs">

  <span className="text-gray-500">
    Vị trí: {item.product_location || "Mặc định"}
  </span>

  <span
    className={`font-medium ${
      Number(item.stock || 0) <= 0
        ? "text-red-600"
        : Number(item.stock || 0) <= 10
        ? "text-orange-500"
        : "text-green-600"
    }`}
  >
    Tồn: {item.stock || 0}
  </span>

  <span className="text-orange-500">
    VAT: {useProductVat ? Number(item.tax || 0) : 0}%
  </span>

</div>

</div>

  </div>
</td>

              <td className="p-3">
                {getUnitText(item.unit)}
              </td>

              <td className="p-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      decreaseQty(item.id)
                    }
                    className="bg-gray-200 px-2 py-1 rounded"
                  >
                    -
                  </button>

                  <input
                    type="number"
                    min="1"
                    className="w-16 border rounded-lg p-1 text-center"
                    value={item.quantity}
                    onChange={(e) =>
                      changeQty(
                        item.id,
                        Number(e.target.value)
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      increaseQty(item.id)
                    }
                    className="bg-gray-200 px-2 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              </td>

              <td className="p-3 text-right">
  <input
    type="text"
    inputMode="numeric"
    value={formatInputMoney(item.price)}
    onChange={(e) =>
      changePrice(
        item.id,
        parseInputMoney(e.target.value)
      )
    }
    className="w-28 rounded border border-gray-300 px-2 py-2 text-right font-semibold outline-none focus:border-blue-500"
  />
</td>

              <td className="p-3 text-right font-semibold">
                {formatMoney(itemFinalTotal)}
              </td>
            </tr>
          );
        })}
      </tbody>

    </table>
  )}

</section>

        {/* BÊN PHẢI */}
        <aside className="w-[360px] bg-white border-l flex flex-col">

          <div className="p-3 border-b">

            <div
              className="relative flex gap-2"
              onMouseLeave={() =>
                setShowCustomerDropdown(false)
              }
            >

              <div className="relative flex-1">

                <input
                  ref={customerSearchRef}
                  type="text"
                  placeholder="Tìm khách hàng vào đơn (F4)"
                  className="w-full border rounded-lg p-2 text-sm"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() =>
                    setShowCustomerDropdown(true)
                  }
                />

                {showCustomerDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-lg z-50 max-h-72 overflow-auto mt-1">

                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">
                        Không tìm thấy khách hàng
                      </div>
                    ) : (
                      filteredCustomers.map((customer: any) => (
                        <button
                          key={customer.id}
                          type="button"
                          onMouseDown={() =>
                            selectCustomer(customer)
                          }
                          className="w-full text-left p-3 hover:bg-blue-50 border-b"
                        >
                          <div className="font-semibold text-black">
                            {customer.name || "Chưa có tên"}
                          </div>

                          <div className="text-xs text-gray-500 mt-1">
                            SĐT: {customer.phone || "-"}
                          </div>

                          <div className="text-xs text-gray-500">
                            Mã KH: {customer.code || "-"}
                          </div>
                        </button>
                      ))
                    )}

                  </div>
                )}

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCustomerForm(true)
                }
                title="Thêm khách hàng mới"
                className="w-10 h-10 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-2xl leading-none flex items-center justify-center"
              >
                +
              </button>

            </div>

            {selectedCustomer && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs">
                <div className="font-semibold text-blue-700">
                  {selectedCustomer.name}
                </div>

                <div>
                  SĐT: {selectedCustomer.phone || "-"}
                </div>

                <div>
                  Mã KH: {selectedCustomer.code || "-"}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updateCurrentOrder({
                      customer: null,
                    });

                    setCustomerSearch("");
                  }}
                  className="text-red-600 mt-1 font-semibold"
                >
                  Bỏ chọn khách hàng
                </button>
              </div>
            )}

            <label className="flex items-center gap-2 mt-3 text-sm">
              <input type="checkbox" />
              Giao hàng
            </label>
          </div>

          <div className="p-4 flex-1 overflow-auto space-y-4">

            <div className="flex justify-between text-sm">
              <span>
                Tổng tiền ({cart.length} sản phẩm)
              </span>

              <span className="font-semibold">
                {formatMoney(subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span>
                VAT ({useProductVat ? "Có" : "Không"})
              </span>

              <span>
                {formatMoney(vatAmount)}
              </span>
            </div>

            <button
              type="button"
              onClick={openDiscountModal}
              className="w-full flex justify-between text-sm py-2 px-1 rounded hover:bg-blue-50"
            >
              <span>
                Chiết khấu (F6)
              </span>

              <span>
                {formatMoney(discountAmount)}
              </span>
            </button>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm">
                  KHÁCH PHẢI TRẢ
                </span>

                <span className="text-2xl font-bold text-blue-700">
                  {formatMoney(total)}
                </span>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-sm">
                Phương thức thanh toán
              </label>

              <select
                ref={paymentMethodRef}
                className="w-full border p-3 rounded-xl"
                value={paymentMethod}
                onChange={(e) => {
                  const value = e.target.value;

                  updateCurrentOrder({
                    paymentMethod: value,
                  });

                  if (value === "mixed") {
                    openSplitPaymentModal();
                  }
                }}
              >
                <option value="cash">
                  Tiền mặt
                </option>

                <option value="bank">
                  Chuyển khoản
                </option>

                <option value="mixed">
                  CK + TM
                </option>
              </select>

              {paymentMethod === "mixed" && (
                <button
                  type="button"
                  onClick={openSplitPaymentModal}
                  className="mt-2 w-full text-left text-sm text-blue-700 font-semibold hover:underline"
                >
                  Nhập chi tiết tiền mặt / chuyển khoản
                </button>
              )}
            </div>

            <div>
              <label className="block mb-2 font-semibold text-sm">
                Tính VAT
              </label>

              <select
                className="w-full border p-3 rounded-xl"
                value={useProductVat ? "yes" : "no"}
                onChange={(e) =>
                  updateCurrentOrder({
                    useProductVat:
                      e.target.value === "yes",
                  })
                }
              >
                <option value="yes">
                  Có VAT theo sản phẩm
                </option>

                <option value="no">
                  Không tính VAT
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-sm">
                Tiền khách đưa (F2)
              </label>

              <input
  ref={customerPayRef}
  type="text"
  inputMode="numeric"
  className="w-full border p-3 rounded-xl text-right text-xl font-bold"
 value={
  paymentMethod === "mixed"
    ? formatInputMoney(customerPayAmount)
    : formatInputMoney(customerPayAmount)
}
  onChange={(e) => {
  updateCurrentOrder({
    customerPay: String(
      parseInputMoney(e.target.value)
    ),
  });
}}
  onFocus={() => {
    if (paymentMethod === "mixed") {
      openSplitPaymentModal();
    }
  }}
  readOnly={paymentMethod === "mixed"}
  placeholder={formatMoney(total)}
/>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[10000, 20000, 50000, 100000, 200000, 500000].map(
                (money) => (
                  <button
                    key={money}
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 rounded-xl py-2 text-sm"
                    onClick={() => {
  if (paymentMethod === "mixed") {
    setTempSplitPayment({
      cash: String(money),
      bank: String(
        Math.max(total - money, 0)
      ),
    });

    setShowSplitPaymentModal(true);

    return;
  }

  updateCurrentOrder({
    customerPay: String(money),
  });
}}
                  >
                    {formatMoney(money)}
                  </button>
                )
              )}
            </div>

            <div className="flex justify-between border-t pt-4">
              <span className="font-semibold text-sm">
                Tiền thừa trả khách
              </span>

              <span className="font-bold text-xl">
                {formatMoney(
                  changeAmount
                )}
              </span>
            </div>

          </div>

          <div className="p-4 border-t space-y-3">
            <button
              type="button"
              onClick={() =>
                router.push("/quotations/create")
              }
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold"
            >
              Tạo báo giá
            </button>

            <button
              type="button"
              onClick={() => checkout()}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl text-lg font-bold"
            >
              Thanh toán
            </button>

            <button
              type="button"
              onClick={printTemporaryInvoice}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
            >
              In tạm tính
            </button>
          </div>

        </aside>

      </div>

      {showDiscountModal && (
  <div className="fixed inset-0 bg-black/40 z-[1000] flex items-start justify-center pt-10">

    <div className="bg-white w-[460px] rounded-xl shadow-xl text-black overflow-hidden">

      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="text-xl font-bold">
          Chiết khấu đơn hàng
        </h2>

        <button
          type="button"
          onClick={() =>
            setShowDiscountModal(false)
          }
          className="w-8 h-8 rounded-full flex items-center justify-center text-2xl text-gray-500 hover:bg-gray-100 hover:text-red-600"
        >
          ×
        </button>
      </div>

      <div className="px-5 py-5 space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chiết khấu thường
          </label>

          <div className="grid grid-cols-[130px_1fr] gap-3 items-center">

            <div className="flex rounded-lg border border-blue-600 overflow-hidden h-11">
              <button
                type="button"
                onClick={() =>
                  setTempDiscountType("percent")
                }
                className={
                  tempDiscountType === "percent"
                    ? "w-1/2 bg-blue-700 text-white font-semibold"
                    : "w-1/2 bg-white text-blue-700 font-semibold hover:bg-blue-50"
                }
              >
                %
              </button>

              <button
                type="button"
                onClick={() =>
                  setTempDiscountType("value")
                }
                className={
                  tempDiscountType === "value"
                    ? "w-1/2 bg-blue-700 text-white font-semibold"
                    : "w-1/2 bg-white text-blue-700 font-semibold hover:bg-blue-50"
                }
              >
                Giá trị
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                className="w-full h-11 border rounded-lg outline-none text-right px-3 pr-10 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                value={tempDiscountValue}
                onChange={(e) =>
                  setTempDiscountValue(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyDiscount();
                  }
                }}
                autoFocus
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {tempDiscountType === "percent" ? "%" : "đ"}
              </span>
            </div>

          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã giảm giá
          </label>

          <input
            type="text"
            className="w-full h-11 border rounded-lg outline-none px-3 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            value={tempDiscountCode}
            onChange={(e) =>
              setTempDiscountCode(e.target.value)
            }
            placeholder="Nhập mã giảm giá nếu có"
          />
        </div>

      </div>

      <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t">
        <button
          type="button"
          onClick={() =>
            setShowDiscountModal(false)
          }
          className="px-7 py-2.5 rounded-lg bg-white border font-semibold hover:bg-gray-100"
        >
          Thoát
        </button>

        <button
          type="button"
          onClick={applyDiscount}
          className="px-7 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold"
        >
          Áp dụng
        </button>
      </div>

    </div>

  </div>
)}

      {showSplitPaymentModal && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-center justify-center">
          <div className="bg-white w-[560px] rounded-xl shadow-xl text-black overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-xl font-bold">Thanh toán CK + TM</h2>

              <button
                type="button"
                onClick={() => setShowSplitPaymentModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-2xl text-gray-500 hover:bg-gray-100 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex justify-between items-center border-b pb-4">
                <span className="font-bold text-lg">Khách phải trả</span>
                <span className="text-2xl font-bold text-blue-700">{formatMoney(total)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] items-center gap-4">
                <label className="font-semibold">Tiền mặt</label>

                <input
                  type="number"
                  min="0"
                  className="w-full border-b border-gray-300 p-2 text-right text-xl font-bold outline-none focus:border-blue-700"
                  value={tempSplitPayment.cash}
                  onChange={(e) => {
                    const cashValue =
                      Number(e.target.value || 0);

                    const bankValue =
                      Math.max(total - cashValue, 0);

                    setTempSplitPayment({
                      cash: e.target.value,
                      bank: String(bankValue),
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySplitPayment();
                  }}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-[130px_1fr] items-center gap-4">
                <label className="font-semibold">Chuyển khoản</label>

                <input
                  type="number"
                  min="0"
                  className="w-full border-b border-gray-300 p-2 text-right text-xl font-bold outline-none focus:border-blue-700 bg-gray-50"
                  value={tempSplitPayment.bank}
                  onChange={(e) =>
                    setTempSplitPayment((prev) => ({
                      ...prev,
                      bank: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySplitPayment();
                  }}
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Tiền khách đưa</span>
                  <span className="font-bold">
                    {formatMoney(Number(tempSplitPayment.cash || 0) + Number(tempSplitPayment.bank || 0))}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-semibold">Tiền thừa trả khách</span>
                  <span className="font-bold text-xl">
                    {formatMoney(Math.max(Number(tempSplitPayment.cash || 0) + Number(tempSplitPayment.bank || 0) - total, 0))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 bg-gray-50 border-t">
              <button
                type="button"
                onClick={() => setShowSplitPaymentModal(false)}
                className="px-7 py-2.5 rounded-lg bg-white border font-semibold hover:bg-gray-100"
              >
                Thoát
              </button>

              <button
                type="button"
                onClick={applySplitPayment}
                className="px-7 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold"
              >
                Lưu (F1)
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerForm && (
        <div className="fixed inset-0 bg-black/40 z-[999] flex items-center justify-center">

          <div className="bg-white w-[520px] rounded-2xl shadow-xl p-6">

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-blue-700">
                Thêm khách hàng mới
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowCustomerForm(false)
                }
                className="text-2xl font-bold text-gray-500 hover:text-red-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block mb-1 text-sm font-semibold">
                  Tên khách hàng *
                </label>

                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-semibold">
                  Số điện thoại *
                </label>

                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-semibold">
                  Mã khách hàng
                </label>

                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  placeholder="VD: KH0001"
                  value={newCustomer.code}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      code: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-semibold">
                  Email
                </label>

                <input
                  type="email"
                  className="w-full border rounded-lg p-2"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="block mb-1 text-sm font-semibold">
                  Địa chỉ
                </label>

                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="block mb-1 text-sm font-semibold">
                  Mã số thuế
                </label>

                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={newCustomer.taxCode}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      taxCode: e.target.value,
                    })
                  }
                />
              </div>

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={() =>
                  setShowCustomerForm(false)
                }
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={addNewCustomer}
                className="px-5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold"
              >
                Lưu khách hàng
              </button>

            </div>

          </div>

        </div>
      )}

      {showShortcutModal && (
        <div className="fixed inset-0 bg-black/40 z-[1000] flex items-start justify-center pt-10">

          <div className="bg-white rounded-2xl shadow-2xl w-[760px] max-h-[90vh] overflow-hidden text-black">

            <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-700 text-white">
              <h2 className="text-xl font-bold">
                Phím tắt màn hình bán hàng
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowShortcutModal(false)
                }
                className="w-8 h-8 rounded-full hover:bg-blue-800 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-64px)]">

              <div className="grid grid-cols-2 gap-6">

                <div className="space-y-3">
                  <h3 className="font-bold text-blue-700 border-b pb-2">
                    Thao tác bán hàng
                  </h3>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F1
                    </kbd>
                    <span>Thanh toán đơn hàng</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F2
                    </kbd>
                    <span>Nhập tiền khách đưa</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F3
                    </kbd>
                    <span>Tìm / thêm sản phẩm vào đơn</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F4
                    </kbd>
                    <span>Tìm khách hàng vào đơn</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F6
                    </kbd>
                    <span>Chiết khấu đơn hàng</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F7
                    </kbd>
                    <span>Chọn phương thức thanh toán</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-blue-700 border-b pb-2">
                    Thao tác nhanh
                  </h3>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F10
                    </kbd>
                    <span>Ẩn / hiện ô quét barcode</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      F11
                    </kbd>
                    <span>Bật / tắt toàn màn hình</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Alt + 1
                    </kbd>
                    <span>In tạm tính</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Alt + 2
                    </kbd>
                    <span>Chuyển sang đơn kế tiếp</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Alt + 3
                    </kbd>
                    <span>Xóa / đóng đơn hiện tại</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Alt + 4
                    </kbd>
                    <span>Xóa toàn bộ sản phẩm trong đơn</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Alt + X
                    </kbd>
                    <span>Đổi nhanh Tiền mặt / Chuyển khoản</span>
                  </div>
                </div>

                <div className="space-y-3 col-span-2">
                  <h3 className="font-bold text-blue-700 border-b pb-2">
                    Phím điều hướng
                  </h3>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Esc
                    </kbd>
                    <span>Đóng popup / danh sách đang mở</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Enter
                    </kbd>
                    <span>Xác nhận trong popup đang nhập</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      ↑ / ↓
                    </kbd>
                    <span>Khi nhập số lượng, di chuyển lên sản phẩm bên trên</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <kbd className="px-4 py-1 border rounded bg-gray-100 font-bold">
                      Esc
                    </kbd>
                    <span>Ngắt thao tác thủ công trên ô số lượng sản phẩm</span>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      )}
<div
  id="print-area"
  style={{ display: "none" }}
></div>
    </main>
  );
}