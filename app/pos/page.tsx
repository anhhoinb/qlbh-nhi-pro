"use client";

import { useEffect, useState } from "react";

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
  useProductVat: boolean;
  paymentMethod: string;
  customerPay: string;
  search: string;
  barcode: string;
  showProductDropdown: boolean;
};

export default function POSPage() {
  const router = useRouter();

  const formatMoney = (value: any) => {
    return new Intl.NumberFormat("vi-VN").format(
      Number(value || 0)
    );
  };

  const createEmptyOrder = (id: number): OrderTab => ({
    id,
    cart: [],
    useProductVat: true,
    paymentMethod: "cash",
    customerPay: "",
    search: "",
    barcode: "",
    showProductDropdown: false,
  });

  const handleLogout =
    async () => {
      await signOut(auth);

      router.push("/login");
    };

  const [accountName, setAccountName] =
    useState("Tài khoản");

  const [products, setProducts] =
    useState<any[]>([]);

  const [orders, setOrders] =
    useState<OrderTab[]>([
      createEmptyOrder(1),
    ]);

  const [activeOrder, setActiveOrder] =
    useState(1);

  const [showBarcodeInput, setShowBarcodeInput] =
    useState(true);

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
  };

  const resetOrRemoveCurrentOrder = () => {
    setOrders((prev) => {
      if (prev.length <= 1) {
        setActiveOrder(1);

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

      return newOrders;
    });
  };

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            setAccountName(
              user.displayName ||
              user.email ||
              "Tài khoản"
            );
          } else {
            setAccountName("Tài khoản");
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
          "Sản phẩm đã hết hàng"
        );

        return;
      }

      if (currentQty >= currentStock) {
        alert(
          "Không đủ tồn kho, không thể bán thêm"
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
          ...cart,
          {
            ...product,
            quantity: 1,
            price: Number(product.price || 0),
            tax: Number(product.tax || 0),
            unit: getUnitText(product.unit),
            product_code: getProductCode(product),
            product_location: getProductLocation(product),
          },
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
          "Không đủ tồn kho, không thể tăng số lượng"
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
              "Không đủ tồn kho"
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

  const total =
    subtotal + vatAmount;

  const printBill =
    (
      billType: "temporary" | "invoice" = "temporary",
      orderCodeParam?: string
    ) => {
      const billWindow =
        window.open("", "_blank");

      if (!billWindow) return;

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
                  ${item.name}
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

      billWindow.document.write(`
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
      `);

      billWindow.document.close();

      billWindow.focus();

      billWindow.print();
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
            `Sản phẩm "${item.name}" không đủ tồn kho`
          );

          return;
        }
      }

      const orderCode =
        await getNextOrderCode();

      const paymentMethodText =
        paymentMethod === "bank"
          ? "Chuyển khoản"
          : "Tiền mặt";

      await addDoc(
        collection(db, "orders"),
        {
          orderCode: orderCode,
          order_code: orderCode,

          items: cart,
          subtotal: subtotal,
          vatAmount: vatAmount,
          total: total,

          paymentMethod: paymentMethod,
          paymentMethodText: paymentMethodText,

          createdAt: new Date(),
        }
      );

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

      printBill(
        "invoice",
        orderCode
      );

      alert(
        "Thanh toán thành công"
      );

      resetOrRemoveCurrentOrder();
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

          <div className="relative w-[320px]">

            <input
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
              <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow-lg z-50 max-h-96 overflow-auto mt-1">

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
                      className="w-full text-left p-3 hover:bg-blue-50 border-b"
                    >
                      <div className="font-semibold text-black">
                        {product.name}
                      </div>

                      <div className="text-xs text-gray-500 mt-1 flex gap-3 flex-wrap">
                        <span>
                          Mã: {getProductCode(product) || "-"}
                        </span>

                        <span>
                          VAT: {Number(product.tax || 0)}%
                        </span>

                        <span>
                          Vị trí: {getProductLocation(product) || "-"}
                        </span>

                        <span>
                          Giá: {formatMoney(product.price)}đ
                        </span>

                        <span>
                          Tồn: {Number(product.stock || 0)}
                        </span>
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

          <div className="flex items-center gap-1 ml-2">

            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() =>
                  setActiveOrder(order.id)
                }
                className={
                  activeOrder === order.id
                    ? "bg-blue-900 px-4 py-2 rounded-lg font-semibold text-sm"
                    : "bg-blue-600 hover:bg-blue-800 px-4 py-2 rounded-lg font-semibold text-sm"
                }
              >
                Đơn {order.id}
              </button>
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

          {/* NÚT HOME */}
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

          {/* NÚT ĐĂNG XUẤT */}
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
        <section className="flex-1 bg-white overflow-auto">

          <table className="w-full border-collapse text-sm">

            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr className="border-b">
                <th className="p-3 text-left w-12">
                  STT
                </th>

                <th className="p-3 text-left w-16">
                  Ảnh
                </th>

                <th className="p-3 text-left w-32">
                  Mã SKU
                </th>

                <th className="p-3 text-left">
                  Tên sản phẩm
                </th>

                <th className="p-3 text-left w-24">
                  Đơn vị
                </th>

                <th className="p-3 text-center w-32">
                  Số lượng
                </th>

                <th className="p-3 text-right w-32">
                  Đơn giá
                </th>

                <th className="p-3 text-right w-36">
                  Thành tiền
                </th>

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
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          Ảnh
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {item.product_code || ""}
                    </td>

                    <td className="p-3">
                      <div className="font-medium">
                        {item.name}
                      </div>

                      <div className="text-xs text-gray-500">
                        {item.product_location
                          ? `Vị trí: ${item.product_location}`
                          : "Mặc định"}
                      </div>

                      <div className="text-xs text-orange-600">
                        VAT: {useProductVat ? Number(item.tax || 0) : 0}%
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
                        type="number"
                        min="0"
                        value={item.price || 0}
                        onChange={(e) =>
                          changePrice(
                            item.id,
                            Number(e.target.value)
                          )
                        }
                        className="w-28 border rounded-lg p-2 text-right text-black"
                      />
                    </td>

                    <td className="p-3 text-right font-semibold">
                      {formatMoney(itemFinalTotal)}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}

              {cart.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="p-16 text-center text-gray-400"
                  >
                    Chưa có sản phẩm trong đơn. Hãy tìm sản phẩm ở ô phía trên.
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </section>

        {/* BÊN PHẢI */}
        <aside className="w-[360px] bg-white border-l flex flex-col">

          <div className="p-3 border-b">
            <input
              type="text"
              placeholder="Tìm khách hàng vào đơn (F4)"
              className="w-full border rounded-lg p-2 text-sm"
            />

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

            <div className="flex justify-between text-sm">
              <span>
                Chiết khấu (F6)
              </span>

              <span>
                0
              </span>
            </div>

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
                className="w-full border p-3 rounded-xl"
                value={paymentMethod}
                onChange={(e) =>
                  updateCurrentOrder({
                    paymentMethod: e.target.value,
                  })
                }
              >
                <option value="cash">
                  Tiền mặt
                </option>

                <option value="bank">
                  Chuyển khoản
                </option>
              </select>
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
                type="number"
                className="w-full border p-3 rounded-xl text-right text-xl font-bold"
                value={customerPay}
                onChange={(e) =>
                  updateCurrentOrder({
                    customerPay: e.target.value,
                  })
                }
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
                    onClick={() =>
                      updateCurrentOrder({
                        customerPay: String(money),
                      })
                    }
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
                  Math.max(
                    Number(customerPay || 0) - total,
                    0
                  )
                )}
              </span>
            </div>

          </div>

          <div className="p-4 border-t space-y-3">
            <button
              type="button"
              onClick={() => checkout()}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl text-lg font-bold"
            >
              Thanh toán
            </button>

            <button
              type="button"
              onClick={() =>
                printBill("temporary")
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
            >
              In tạm tính
            </button>
          </div>

        </aside>

      </div>

    </main>
  );
}