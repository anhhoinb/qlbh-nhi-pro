"use client";

import { useEffect, useMemo, useState } from "react";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function DebtReportPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [showAddDebt, setShowAddDebt] =
    useState(false);
    const [selectedDebt, setSelectedDebt] =
  useState<any>(null);
    const [products, setProducts] =
  useState([
    {
      name: "",
      qty: 1,
      price: 0,
    },
  ]);

  const [
  inventoryProducts,
  setInventoryProducts,
] = useState<any[]>([]);

useEffect(() => {

  const savedProducts =
    localStorage.getItem(
      "products"
    );

  if (savedProducts) {

    setInventoryProducts(
      JSON.parse(
        savedProducts
      )
    );

  }

}, []);
console.log(
  "inventoryProducts:",
  inventoryProducts
);
  const [newDebt, setNewDebt] =
    useState({
      customer: "",
      type: "customer",
      total: "",
      paid: "",
      createdDate: "",
      dueDate: "",
      note: "",
    });

  useEffect(() => {

const loadDebts = async () => {

  const snapshot =
    await getDocs(
      collection(db, "debts")
    );

  const debtList =
snapshot.docs
  .map(
    (doc) => ({
      firestoreId: doc.id,
      ...doc.data(),
    })
  )
    .sort(
      (a:any,b:any)=>
        b.date?.localeCompare(
          a.date
        )
    );

  setDebts(
    debtList
  );
};

loadDebts();

}, []);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(
      "vi-VN"
    ).format(value || 0);
  };
  
  const productsTotal =
  useMemo(() => {

    return products.reduce(
      (
        sum,
        item
      ) =>

        sum +
        (
          item.qty *
          item.price
        ),

      0
    );

  }, [products]);
  const autoRemaining =
  useMemo(() => {

    const paid =
      Number(
        newDebt.paid || 0
      );

    return Math.max(
      productsTotal - paid,
      0
    );

  }, [
    productsTotal,
    newDebt.paid,
  ]);

  const totalReceivable =
  debts.reduce(
    (sum, item) =>
      sum +
      Number(
        item.total || 0
      ),
    0
  );

  const totalPaid =
    debts.reduce(
      (sum, item) =>
        sum +
        Number(item.paid || 0),
      0
    );

  const totalDebt =
  debts.reduce(
    (sum, item) =>
      sum +
      Number(item.remaining || 0),
    0
  );

  const saveDebt = async () => {
    if (
      !newDebt.customer ||
      !newDebt.total
    ) {
      alert(
        "Nhập khách hàng và tổng tiền"
      );
      return;
    }

    const debtItem = {
      date:
        newDebt.createdDate ||
        new Date().toLocaleDateString(
          "vi-VN"
        ),

      orderCode:
        "DEBT" +
        Date.now()
          .toString()
          .slice(-5),

      customer:
        newDebt.customer,

      total: Number(
        newDebt.total
      ),

      paid: Number(
        newDebt.paid || 0
      ),

      remaining:
        autoRemaining,

      status:
        autoRemaining <= 0
          ? "paid"
          : "unpaid",

      dueDate:
        newDebt.dueDate,

      note: newDebt.note,

      type: newDebt.type,
      products,
    };
await addDoc(
  collection(db, "debts"),
  debtItem
);
    setDebts([
  debtItem,
  ...debts,
]);

    setNewDebt({
      customer: "",
      type: "customer",
      total: "",
      paid: "",
      createdDate: "",
      dueDate: "",
      note: "",
    });
setProducts([
  {
    name: "",
    qty: 1,
    price: 0,
  },
]);

    setShowAddDebt(false);
  };

  const collectDebt = async (
  debt:any
) => {

  const money = prompt(
    `Khách còn nợ ${formatMoney(
      debt.remaining
    )}đ\nNhập số tiền thu:`
  );

  if (!money) return;

  const collectAmount =
    Number(money);

  if (
    collectAmount <= 0 ||
    isNaN(collectAmount)
  ) {
    alert("Số tiền không hợp lệ");
    return;
  }

  const newPaid =
    Number(debt.paid || 0) +
    collectAmount;

  const newRemain =
    Math.max(
      Number(debt.remaining || 0)
      - collectAmount,
      0
    );

  await updateDoc(
  doc(
    db,
    "debts",
    debt.firestoreId
  ),
    {
      paid: newPaid,
      remaining: newRemain,
      status:
        newRemain <= 0
          ? "paid"
          : "unpaid",
    }
  );

  setDebts((prev)=>
    prev.map((item)=>

      item.firestoreId ===
debt.firestoreId
        ? {
            ...item,
            paid: newPaid,
            remaining:
              newRemain,
            status:
              newRemain <= 0
                ? "paid"
                : "unpaid",
          }
        : item
    )
  );

  alert("Đã thu nợ");
};

  return (
    <main className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-[1800px] mx-auto">

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-sky-700">
            Báo cáo công nợ
          </h1>

          <p className="text-slate-500 mt-2">
            Theo dõi công nợ khách hàng và nhà cung cấp
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-500">
              Tổng phải thu
            </p>

            <h2 className="text-3xl font-bold text-rose-600 mt-2">
              {formatMoney(
                totalReceivable
              )}đ
            </h2>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border border-slate-200">

            <p className="text-slate-500">
              Tổng phải trả
            </p>

            <h2 className="text-3xl font-bold text-amber-600 mt-2">
              0đ
            </h2>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border border-slate-200">

            <p className="text-slate-500">
              Đã thu
            </p>

            <h2 className="text-3xl font-bold text-emerald-600 mt-2">
              {formatMoney(
                totalPaid
              )}đ
            </h2>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm border border-slate-200">

            <p className="text-slate-500">
              Còn nợ
            </p>

            <h2 className="text-3xl font-bold text-sky-700 mt-2">
              {formatMoney(
                totalDebt
              )}đ
            </h2>

          </div>

        </div>

        <div className="bg-white border border-slate-200 rounded-2xl border shadow-sm p-6">

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-xl font-bold">
              Danh sách công nợ
            </h2>

            <button
              onClick={() =>
                setShowAddDebt(true)
              }
              className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              + Thêm công nợ
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="bg-slate-800 text-white">

                  <th className="px-4 py-3 text-left">
                    Ngày
                  </th>

                  <th className="px-4 py-3 text-left">
                    Mã đơn
                  </th>

                  <th className="px-4 py-3 text-left">
                    Đối tượng
                  </th>

                  <th className="px-4 py-3 text-right">
                    Tổng tiền
                  </th>

                  <th className="px-4 py-3 text-right">
                    Đã thanh toán
                  </th>

                  <th className="px-4 py-3 text-right">
                    Còn nợ
                  </th>

                  <th className="px-4 py-3 text-center">
                    Trạng thái
                  </th>

                  <th className="px-4 py-3 text-left">
                    Ghi chú
                </th>

                <th className="px-4 py-3 text-left">
                    Hành động
                </th>

                </tr>

              </thead>

              <tbody>

                {debts.map(
                  (
                    item,
                    index
                  ) => (

                    <tr
                      key={index}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >

                      <td className="p-4">

{(() => {

  if (!item.date)
    return "-";

  const parts =
    item.date.split(" ");

  if (
    parts.length >= 2
  ) {

    const time =
      parts[0];

    const date =
      parts.slice(1)
      .join(" ");

    return `${date} - ${time}`;
  }

  return item.date;

})()}

</td>

                      <td className="p-4">

  <button
    type="button"
    onClick={() =>
      setSelectedDebt(
        item
      )
    }
    className="
      text-sky-700
      font-semibold
      hover:underline
    "
  >

    {item.orderCode}

  </button>

</td>

                      <td className="p-4">
                        {item.customer}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatMoney(
                          item.total
                        )}đ
                      </td>

                      <td className="p-4 text-right text-emerald-600">
                        {formatMoney(
                          item.paid
                        )}đ
                      </td>

                      <td className="p-4 text-right text-rose-600 font-bold">
                        {formatMoney(
                          item.remaining
                        )}đ
                      </td>

                      <td className="px-4 py-3 text-center">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.status ===
                            "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {item.status ===
                          "paid"
                            ? "Đã thanh toán"
                            : "Còn nợ"}
                        </span>

                      </td>

                      <td className="p-4 text-gray-600 max-w-[250px] truncate">
                        {item.note || "-"}
                    </td>

<td>
  {Number(item.remaining || 0) > 0 && (
    <button
      onClick={() =>
        collectDebt(item)
      }
      className="
      px-3 py-1
      rounded-lg
      bg-emerald-600
      text-white
      text-sm
      "
    >
      Thu nợ
    </button>
  )}
</td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {showAddDebt && (

        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center pt-20 z-50"
          onClick={() =>
            setShowAddDebt(false)
          }
        >

          <div
            className="bg-white p-7 rounded-2xl w-full max-w-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2 className="text-3xl font-bold mb-6">
              Thêm công nợ
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <input
                placeholder="Tên khách hàng / NCC *"
                value={
                  newDebt.customer
                }
                onChange={(e) =>
                  setNewDebt({
                    ...newDebt,
                    customer:
                      e.target.value,
                  })
                }
                className="border border-slate-300 p-4 rounded-xl"
              />

              <select
                value={
                  newDebt.type
                }
                onChange={(e) =>
                  setNewDebt({
                    ...newDebt,
                    type:
                      e.target.value,
                  })
                }
                className="border border-slate-300 p-4 rounded-xl"
              >

                <option value="customer">
                  Công nợ khách hàng
                </option>

                <option value="supplier">
                  Công nợ NCC
                </option>

              </select>

              <input
  placeholder="Tổng tiền tự tính"
  value={
    formatMoney(
      productsTotal
    )
  }
  readOnly
  className="border border-slate-300 p-4 rounded-xl bg-slate-100"
/>

              <input
                placeholder="Đã thanh toán"
                value={
                  newDebt.paid
                }
                onChange={(e) =>
                  setNewDebt({
                    ...newDebt,
                    paid:
                      e.target.value,
                  })
                }
                className="border border-slate-300 p-4 rounded-xl"
              />

              <div className="col-span-2">

                <label className="text-sm text-slate-500 block mb-2">
                  Còn nợ
                </label>

                <div className="border rounded-2xl p-4 bg-slate-100 font-semibold text-rose-600">

                  {formatMoney(
                    autoRemaining
                  )}đ

                </div>

              </div>

              <div>

                <label className="text-sm text-slate-500 mb-2 block">
                  Ngày tạo
                </label>

                <input
                  type="date"
                  value={
                    newDebt.createdDate
                  }
                  onChange={(e) =>
                    setNewDebt({
                      ...newDebt,
                      createdDate:
                        e.target.value,
                    })
                  }
                  className="border border-slate-300 p-4 rounded-xl w-full"
                />

              </div>

              <div>

                <label className="text-sm text-slate-500 mb-2 block">
                  Hạn thanh toán
                </label>

                <input
                  type="date"
                  value={
                    newDebt.dueDate
                  }
                  onChange={(e) =>
                    setNewDebt({
                      ...newDebt,
                      dueDate:
                        e.target.value,
                    })
                  }
                  className="border border-slate-300 p-4 rounded-xl w-full"
                />

              </div>
<div className="col-span-2">

  <label className="font-medium mb-3 block">
    Danh sách sản phẩm
  </label>

  {products.map((item, index) => (

    <div
      key={index}
      className="grid grid-cols-[3fr_1fr_1fr_1fr_60px] gap-3 mb-4 items-end"
    >

      <div>

        <label className="text-xs text-slate-500 mb-1 block">
          Sản phẩm
        </label>

        <input
  list={`product-list-${index}`}
  placeholder="Tên SP"
  value={item.name}
  onChange={(e) => {

  const clone =
    [...products];

  const selected =
    inventoryProducts.find(
      (p:any) =>

        p.name ===
        e.target.value
    );

  clone[index].name =
    e.target.value;

  if (selected) {

    clone[index].price =
      Number(
        selected.price || 0
      );

  }

  setProducts(
    clone
  );

}}
  className="border border-slate-300 p-3 rounded-xl w-full"
/>

        <datalist
  id={`product-list-${index}`}
>

  {inventoryProducts.map(
    (product:any)=>(

      <option
        key={
          product.id ||
          product.product_code
        }

        value={
          product.name ||
          ""
        }

      />

    )
  )}

</datalist>

      </div>

      <div>

        <label className="text-xs text-slate-500 mb-1 block">
          SL
        </label>

        <input
          type="number"
          value={item.qty}
          onChange={(e) => {

            const clone =
              [...products];

            clone[index].qty =
              Number(
                e.target.value
              );

            setProducts(clone);

          }}
          className="border border-slate-300 p-3 rounded-xl w-full"
        />

      </div>

      <div>

        <label className="text-xs text-slate-500 mb-1 block">
          Đơn giá
        </label>

        <input
          type="number"
          value={item.price}
          onChange={(e) => {

            const clone =
              [...products];

            clone[index].price =
              Number(
                e.target.value
              );

            setProducts(clone);

          }}
          className="border border-slate-300 p-3 rounded-xl w-full"
        />

      </div>

      <div>

        <label className="text-xs text-slate-500 mb-1 block">
          Thành tiền
        </label>

        <div className="border rounded-xl p-3 bg-slate-100">

          {formatMoney(
            item.qty *
            item.price
          )}đ

        </div>

      </div>

      <button
        type="button"
        onClick={() => {

          const clone =
            products.filter(
              (_, i) =>
                i !== index
            );

          setProducts(
            clone.length
              ? clone
              : [
                  {
                    name: "",
                    qty: 1,
                    price: 0,
                  },
                ]
          );

        }}
        className="h-11 w-11 rounded-xl bg-rose-500 text-white text-lg"
      >

        ✕

      </button>

    </div>

  ))}

  <button
    type="button"
    onClick={() =>
      setProducts([
        ...products,
        {
          name: "",
          qty: 1,
          price: 0,
        },
      ])
    }
    className="bg-slate-200 px-4 py-2 rounded-xl"
  >
    + Thêm sản phẩm
  </button>

</div>
              <textarea
                placeholder="Ghi chú"
                value={
                  newDebt.note
                }
                onChange={(e) =>
                  setNewDebt({
                    ...newDebt,
                    note:
                      e.target.value,
                  })
                }
                className="border border-slate-300 p-4 rounded-xl col-span-2 h-24"
              />

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setShowAddDebt(false)
                }
                className="bg-slate-200 px-6 py-3 rounded-2xl"
              >
                Hủy
              </button>

              <button
                onClick={saveDebt}
                className="bg-sky-600 text-white px-6 py-3 rounded-2xl"
              >
                Lưu công nợ
              </button>

            </div>

          </div>

        </div>

      )}

{selectedDebt && (

<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

  <div className="bg-white border border-slate-200 rounded-2xl w-[900px] max-h-[85vh] overflow-auto p-6">

    <div className="flex justify-between mb-6">

      <h2 className="text-2xl font-bold">

        {selectedDebt.orderCode}

      </h2>

      <button
        onClick={() =>
          setSelectedDebt(null)
        }
        className="text-3xl"
      >
        ×
      </button>

    </div>

    <div className="grid grid-cols-2 gap-4 mb-6">

      <div>
        Khách:
        <b>
          {" "}
          {selectedDebt.customer}
        </b>
      </div>

      <div>
        Còn nợ:
        <b>
          {" "}
          {formatMoney(
            selectedDebt.remaining
          )}đ
        </b>
      </div>

      <div>
        Tổng:
        {formatMoney(
          selectedDebt.total
        )}đ
      </div>

      <div>
        Đã trả:
        {formatMoney(
          selectedDebt.paid
        )}đ
      </div>

    </div>

    <table className="w-full border">

      <thead>

        <tr className="bg-slate-100">

          <th className="p-3">
            SP
          </th>

          <th>
            SL
          </th>

          <th>
            Giá
          </th>

        </tr>

      </thead>

      <tbody>

        {(selectedDebt.products || [])
          .map(
            (
              item:any,
              index:number
            ) => (

<tr key={index}>

<td className="p-3">

{item.name}

</td>

<td>

{item.qty}

</td>

<td>

{formatMoney(
 item.price
)}đ

</td>

</tr>

          ))}

      </tbody>

    </table>

  </div>

</div>

)}
    </main>
  );
}