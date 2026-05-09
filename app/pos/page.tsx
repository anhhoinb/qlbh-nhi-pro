"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function POSPage() {

  const [products, setProducts] = useState<any[]>([]);

  const [cart, setCart] = useState<any[]>([]);
  const [vat, setVat] =
  useState("0");

  const [search, setSearch] =
    useState("");

  const [barcode, setBarcode] =
    useState("");

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {

        const data: any[] = [];

        snapshot.forEach((doc) => {

          data.push({
            id: doc.id,
            ...doc.data(),
          });

        });

        setProducts(data);
      }
    );

    return () => unsubscribe();

  }, []);

const addToCart = (product: any) => {

  const currentStock =
    Number(product.stock || 0);

  const existing = cart.find(
    (item) => item.id === product.id
  );

  const currentQty =
    existing?.quantity || 0;

  // KHÔNG CHO BÁN ÂM

  if (currentQty >= currentStock) {

    alert("Sản phẩm đã hết hàng");

    return;
  }

  if (existing) {

    const updatedCart = cart.map((item) => {

      if (item.id === product.id) {

        return {
          ...item,
          quantity: item.quantity + 1,
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
      },
    ]);

  }

};
  const handleBarcode = (
    value: string
  ) => {

    setBarcode(value);

    const found =
      products.find(
        (item: any) =>
          item.barcode === value
      );

    if (found) {

      addToCart(found);

      setBarcode("");
    }

  };

  const increaseQty = (id: string) => {

    setCart(
      cart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );

  };

  const decreaseQty = (id: string) => {

    const updated = cart
      .map((item) => {

        if (item.id === id) {

          return {
            ...item,
            quantity: item.quantity - 1,
          };

        }

        return item;

      })
      .filter((item) => item.quantity > 0);

    setCart(updated);

  };

  const removeItem = (id: string) => {

    setCart(
      cart.filter((item) => item.id !== id)
    );

  };

 const printBill = () => {

  const billWindow =
    window.open("", "_blank");

  if (!billWindow) return;

  const subtotal =
  cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        item.quantity,
    0
  );

const vatAmount =
  subtotal *
  (Number(vat) / 100);

const total =
  subtotal + vatAmount;

  const itemsHtml = cart.map(
    (item, index) => `

      <tr>

        <td>
          ${index + 1}
        </td>

        <td>
          ${item.name}
        </td>

        <td>
          ${item.quantity}
        </td>

        <td>
          ${Number(item.price)
            .toLocaleString()}đ
        </td>

        <td>
          ${(
            Number(item.price) *
            item.quantity
          ).toLocaleString()}đ
        </td>

      </tr>

    `
  ).join("");

  billWindow.document.write(`

    <html>

      <head>

        <title>
          Hóa đơn bán hàng
        </title>

        <style>

  @page {

    size: A5;
    margin: 10mm;

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
    max-width: 500px;
    margin: 0 auto;

  }

  .center {

    text-align: center;

  }

  h1 {

    margin: 0;
    font-size: 26px;

  }

  .title {

    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;

  }

  .shop-info {

    margin-top: 2px;
    margin-bottom: 10px;
    font-size: 12px;
    line-height: 1.3;

  }

  hr {

    margin: 20px 0;

  }

  .info {

    font-size: 12px;
    line-height: 1.3;
    margin-bottom: 10px;

  }

  table {

    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;

  }

  th {

    background: #eee;
    font-size: 13px;
    padding: 5px;
    text-align: left;

  }

  td {

    border-bottom:
      1px dashed #999;

    padding: 5px;
    font-size: 13px;
    text-align: left;

  }

  .total {

    margin-top: 5px;
    font-size: 12px;
    font-weight: bold;
    text-align: right;

  }

  .thanks {

    text-align: center;
    margin-top: 15px;
    font-size: 15px;
    line-height: 1.5;

  }

</style>

      </head>

      <body>

  <div class="bill-container">

        <div class="center">

          <h1>
            NhiPro23
          </h1>

          <div class="shop-info">

            Địa chỉ:
            TP.HCM
            <br>

            Hotline:
            0900 000 000

          </div>

        </div>

        <hr>

        <p style="font-size: 13px; margin: 5px 0;">
          <strong>
            Mã đơn:
          </strong>

          DH${Date.now()}
        </p>

        <p style="font-size: 13px; margin: 5px 0;">
          <strong>
            Ngày:
          </strong>

          ${new Date()
            .toLocaleString()}
        </p>

        <table>

          <thead>

            <tr>

              <th>STT</th>
              <th>SP</th>
              <th>SL</th>
              <th>Giá</th>
              <th>TT</th>

            </tr>

          </thead>

          <tbody>

            ${itemsHtml}

          </tbody>

        </table>

       <div class="total">

  <div>
    Tạm tính:
    ${subtotal.toLocaleString()}đ
  </div>

  <div>
    VAT:
    ${vatAmount.toLocaleString()}đ
  </div>

  <div style="
    font-size: 12px;
    margin-top: 5px;
    font-weight: bold;
  ">
    Tổng cộng:
    ${total.toLocaleString()}đ
  </div>

</div>

        <div class="thanks">

          Cảm ơn quý khách!
          <br>

          Hẹn gặp lại ❤️

        </div>

        </div>

</body>

    </html>

  `);

  billWindow.document.close();

  billWindow.focus();

  billWindow.print();

};

  cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        item.quantity,
    0
  );

const subtotal =
  cart.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        item.quantity,
    0
  );

const vatAmount =
  subtotal *
  (Number(vat) / 100);

const total =
  subtotal + vatAmount;

  const checkout = async () => {

    if (cart.length === 0) {

      alert("Chưa có sản phẩm");

      return;
    }

const orderCode =
  "DH" +
  Date.now();

await addDoc(
  collection(db, "orders"),
  {

    order_code:
      orderCode,

    items: cart,

    total,

    createdAt:
      new Date(),

  }
);

    for (const item of cart) {

      const currentStock =
        Number(item.stock || 0);

      const newStock =
        currentStock - item.quantity;

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

    alert("Thanh toán thành công");

    setCart([]);
  };

  const filteredProducts =
    products.filter((item: any) => {

      const keyword =
        search.toLowerCase();

      return (
        item.name
          ?.toLowerCase()
          .includes(keyword)
      );

    });

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">

          <div className="bg-white rounded-3xl shadow p-6">

            <h1 className="text-3xl font-bold text-blue-700 mb-6">
              Bán hàng POS
            </h1>

            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              className="w-full border p-4 rounded-2xl mb-5 text-black"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="Quét barcode..."
              className="w-full border p-4 rounded-2xl mb-5 text-black"
              value={barcode}
              onChange={(e) =>
                handleBarcode(e.target.value)
              }
            />

            {products.length === 0 && (
              <div className="text-red-500 text-lg">
                Chưa có sản phẩm nào
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {filteredProducts.map((product) => (

                <div
                  key={product.id}
                  className="border rounded-2xl p-4 hover:shadow-lg cursor-pointer bg-white transition"
                  onClick={() =>
                    addToCart(product)
                  }
                >

                  <h2 className="font-bold text-lg text-black">
                    {product.image && (

  <img
    src={product.image}
    alt={product.name}
    className="w-full h-40 object-cover rounded-2xl mb-3"
    loading="lazy"
  />

)}
                    {product.name}
                  </h2>

                  <p className="text-blue-700 mt-2 text-xl font-semibold">
                    {Number(product.price)
                      .toLocaleString()}đ
                  </p>

                  <p
  className={`mt-1 font-semibold ${
    Number(product.stock || 0) <= 5
      ? "text-red-500"
      : "text-gray-500"
  }`}
>

  Tồn kho:
  {" "}
  {product.stock || 0}

  {Number(product.stock || 0) <= 5 &&
    " ⚠️ Sắp hết"}

</p>

                </div>

              ))}

            </div>

          </div>

        </div>

        <div>

          <div className="bg-white rounded-3xl shadow p-6 sticky top-5">

            <h2 className="text-2xl font-bold mb-6 text-black">
              Giỏ hàng
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-auto">

              {cart.map((item) => (

                <div
                  key={item.id}
                  className="border rounded-2xl p-4"
                >

                  <div className="flex justify-between items-center">

                    <h3 className="font-semibold text-black">
                      {item.name}
                    </h3>

                    <button
                      onClick={() =>
                        removeItem(item.id)
                      }
                      className="text-red-500 font-bold"
                    >
                      X
                    </button>

                  </div>

                  <p className="text-blue-700 mt-2 font-semibold">
                    {Number(item.price)
                      .toLocaleString()}đ
                  </p>

                  <div className="flex items-center gap-3 mt-3">

  <button
    onClick={() =>
      decreaseQty(item.id)
    }
    className="bg-gray-200 px-3 py-1 rounded-lg"
  >
    -
  </button>

  <input
    type="number"
    min="1"
    value={item.quantity}
    onChange={(e) => {

      const value =
        Number(e.target.value);

      setCart((prev: any[]) =>

        prev.map((cartItem) =>

          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity:
                  value > 0
                    ? value
                    : 1,
              }
            : cartItem

        )

      );
    }}
    className="w-20 border rounded-lg p-2 text-center text-black"
  />

  <button
    onClick={() =>
      increaseQty(item.id)
    }
    className="bg-gray-200 px-3 py-1 rounded-lg"
  >
    +
  </button>

</div>
                </div>

              ))}

            </div>

            <div className="border-t mt-6 pt-6">
              <div className="mb-4">

  <label className="block mb-2 font-semibold text-black">

    VAT đơn hàng

  </label>

  <select
    className="w-full border p-3 rounded-xl text-black"
    value={vat}
    onChange={(e) =>
      setVat(
        e.target.value
      )
    }
  >

    <option value="0">
      Không VAT
    </option>

    <option value="8">
      VAT 8%
    </option>

    <option value="10">
      VAT 10%
    </option>

  </select>

</div>

              <div className="space-y-2">

  <div className="text-lg text-black">

    Tạm tính:

    <span className="ml-2 font-semibold">

      {subtotal.toLocaleString()}đ

    </span>

  </div>

  <div className="text-lg text-black">

    VAT:

    <span className="ml-2 font-semibold text-orange-600">

      {vatAmount.toLocaleString()}đ

    </span>

  </div>

  <div className="text-3xl font-bold text-red-600">

    Tổng cộng:

    <span className="ml-2">

      {total.toLocaleString()}đ

    </span>

  </div>

</div>

              <div className="space-y-3">

                <button
                  onClick={checkout}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-2xl text-lg font-semibold"
                >
                  Thanh toán
                </button>

                <button
                  onClick={printBill}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-lg font-semibold"
                >
                  In hóa đơn
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}