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
  useState<any[]>([
    {
      name: "",
      main_name: "",
      short_name: "",
      qty: 1,
      price: 0,
    },
  ]);

  const [
  inventoryProducts,
  setInventoryProducts,
] = useState<any[]>([]);

  const [productSearch, setProductSearch] =
    useState<Record<number, string>>({});

  const [openProductDropdown, setOpenProductDropdown] =
    useState<number | null>(null);

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
      phone: "",
      address: "",
      type: "customer",
      total: "",
      paid: "",
      createdDate: new Date()
        .toISOString()
        .slice(0, 10),
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

      phone:
        newDebt.phone,

      address:
        newDebt.address,

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
      phone: "",
      address: "",
      type: "customer",
      total: "",
      paid: "",
      createdDate: new Date()
        .toISOString()
        .slice(0, 10),
      dueDate: "",
      note: "",
    });
setProducts([
  {
    name: "",
    main_name: "",
    short_name: "",
    qty: 1,
    price: 0,
  },
]);

    setShowAddDebt(false);
  };

  const getInventoryProductName = (product: any) => {
    return (
      product.short_name ||
      product.shortName ||
      product.sell_name ||
      product.sellName ||
      product.main_name ||
      product.mainName ||
      product.name ||
      product.productName ||
      ""
    );
  };

  const getInventoryProductFullName = (product: any) => {
    return (
      product.main_name ||
      product.mainName ||
      product.full_name ||
      product.fullName ||
      product.name ||
      ""
    );
  };

  const getInventoryProductSellName = (product: any) => {
    return (
      product.short_name ||
      product.shortName ||
      product.sell_name ||
      product.sellName ||
      product.name ||
      ""
    );
  };

  const getInventoryProductCode = (product: any) => {
    return (
      product.product_code ||
      product.productCode ||
      product.sku ||
      product.code ||
      ""
    );
  };

  const getInventoryDisplayPrimary = (product: any) => {
    return (
      product.short_name ||
      product.shortName ||
      product.sell_name ||
      product.sellName ||
      product.name ||
      product.productName ||
      product.product_name ||
      product.main_name ||
      product.mainName ||
      product.full_name ||
      product.fullName ||
      "Sản phẩm"
    );
  };

  const getInventoryDisplaySecondary = (product: any) => {
    const primary = String(
      getInventoryDisplayPrimary(product)
    )
      .trim()
      .toLocaleLowerCase("vi-VN");

    const candidates = [
      product.main_name,
      product.mainName,
      product.full_name,
      product.fullName,
      product.short_name,
      product.shortName,
      product.sell_name,
      product.sellName,
      product.name,
      product.productName,
      product.product_name,
    ];

    return (
      candidates.find((value) => {
        const name = String(value || "").trim();

        return (
          name &&
          name.toLocaleLowerCase("vi-VN") !== primary
        );
      }) || ""
    );
  };

  const getFilteredInventoryProducts = (index: number) => {
    const keyword = String(
      productSearch[index] ?? products[index]?.name ?? ""
    )
      .trim()
      .toLocaleLowerCase("vi-VN");

    const filtered = inventoryProducts.filter((product: any) => {
      if (!keyword) return true;

      const searchable = [
        product.name,
        product.productName,
        product.product_name,
        product.main_name,
        product.mainName,
        product.full_name,
        product.fullName,
        product.short_name,
        product.shortName,
        product.sell_name,
        product.sellName,
        product.product_code,
        product.productCode,
        product.sku,
        product.code,
      ]
        .map((value) =>
          String(value || "")
            .toLocaleLowerCase("vi-VN")
        )
        .join(" ");

      return searchable.includes(keyword);
    });

    return filtered.slice(0, 15);
  };

  const selectDebtProduct = (
    index: number,
    selected: any
  ) => {
    const selectedCode =
      getInventoryProductCode(selected);

    const selectedName =
      getInventoryProductName(selected);

    const existingIndex =
      products.findIndex((item: any, itemIndex: number) => {
        if (itemIndex === index) {
          return false;
        }

        const itemCode = String(
          item.product_code ||
          item.productCode ||
          item.sku ||
          item.code ||
          ""
        ).trim();

        const itemName = String(
          item.name || ""
        )
          .trim()
          .toLocaleLowerCase("vi-VN");

        const targetName = String(selectedName)
          .trim()
          .toLocaleLowerCase("vi-VN");

        if (selectedCode && itemCode) {
          return itemCode === selectedCode;
        }

        return Boolean(
          targetName &&
          itemName === targetName
        );
      });

    if (existingIndex >= 0) {
      const clone = [...products];

      clone[existingIndex] = {
        ...clone[existingIndex],
        qty:
          Number(clone[existingIndex].qty || 0) + 1,
      };

      clone.splice(index, 1);

      setProducts(
        clone.length
          ? clone
          : [
              {
                name: "",
                main_name: "",
                short_name: "",
                qty: 1,
                price: 0,
              },
            ]
      );

      setProductSearch((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });

      setOpenProductDropdown(null);
      return;
    }

    const clone = [...products];

    clone[index] = {
      ...clone[index],
      name: selectedName,
      main_name: getInventoryProductFullName(selected),
      short_name: getInventoryProductSellName(selected),
      product_code: selectedCode,
      price: Number(
        selected.price ||
        selected.sellPrice ||
        selected.salePrice ||
        0
      ),
    };

    setProducts(clone);

    setProductSearch((prev) => ({
      ...prev,
      [index]: selectedName,
    }));

    setOpenProductDropdown(null);
  };

  const getDebtProductDisplayPrimary = (item: any) => {
    return (
      item.printName ||
      item.name ||
      item.short_name ||
      item.shortName ||
      item.main_name ||
      item.mainName ||
      "Sản phẩm"
    );
  };

  const getDebtProductDisplaySecondary = (item: any) => {
    const primary = String(
      getDebtProductDisplayPrimary(item)
    )
      .trim()
      .toLocaleLowerCase("vi-VN");

    const candidates = [
      item.main_name,
      item.mainName,
      item.full_name,
      item.fullName,
      item.short_name,
      item.shortName,
      item.sell_name,
      item.sellName,
    ];

    return (
      candidates.find((value) => {
        const name = String(value || "").trim();

        return (
          name &&
          name.toLocaleLowerCase("vi-VN") !== primary
        );
      }) || ""
    );
  };

  const getDebtProductPrimaryName = (item: any) => {
    return (
      item.printName ||
      item.name ||
      item.productName ||
      item.product_name ||
      item.short_name ||
      item.shortName ||
      item.sell_name ||
      item.sellName ||
      item.main_name ||
      item.mainName ||
      item.full_name ||
      item.fullName ||
      "Sản phẩm"
    );
  };

  const getDebtProductSecondaryName = (item: any) => {
    const primary =
      getDebtProductPrimaryName(item)
        .trim()
        .toLocaleLowerCase("vi-VN");

    const candidates = [
      item.short_name,
      item.shortName,
      item.sell_name,
      item.sellName,
      item.main_name,
      item.mainName,
      item.full_name,
      item.fullName,
    ];

    return (
      candidates.find((value) => {
        const name = String(value || "").trim();

        return (
          name &&
          name.toLocaleLowerCase("vi-VN") !== primary
        );
      }) || ""
    );
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showAddDebt) {
        setShowAddDebt(false);
        setOpenProductDropdown(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showAddDebt]);

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
            className="bg-white p-5 rounded-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h2 className="text-3xl font-bold mb-6">
              Thêm công nợ
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-2">

              <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Thông tin khách hàng công nợ
                </h3>

                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Tên khách hàng / NCC *
                    </label>

                    <input
                      placeholder="Nhập tên khách hàng / NCC"
                      value={newDebt.customer}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          customer: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Số điện thoại
                      </label>

                      <input
                        placeholder="Số điện thoại"
                        value={newDebt.phone}
                        onChange={(e) =>
                          setNewDebt({
                            ...newDebt,
                            phone: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Loại công nợ
                      </label>

                      <select
                        value={newDebt.type}
                        onChange={(e) =>
                          setNewDebt({
                            ...newDebt,
                            type: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      >
                        <option value="customer">
                          Công nợ khách hàng
                        </option>

                        <option value="supplier">
                          Công nợ NCC
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Địa chỉ
                    </label>

                    <textarea
                      rows={2}
                      placeholder="Địa chỉ khách hàng / NCC"
                      value={newDebt.address}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          address: e.target.value,
                        })
                      }
                      className="w-full resize-y rounded-xl border border-slate-300 p-3"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-3">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">
                  Thông tin công nợ
                </h3>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Tổng tiền
                      </label>

                      <input
                        placeholder="Tổng tiền tự tính"
                        value={formatMoney(productsTotal)}
                        readOnly
                        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Đã thanh toán
                      </label>

                      <input
                        placeholder="Đã thanh toán"
                        value={newDebt.paid}
                        onChange={(e) =>
                          setNewDebt({
                            ...newDebt,
                            paid: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Còn nợ
                      </label>

                      <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-rose-600">
                        {formatMoney(autoRemaining)}đ
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Ngày tạo
                      </label>

                      <input
                        type="date"
                        value={newDebt.createdDate}
                        onChange={(e) =>
                          setNewDebt({
                            ...newDebt,
                            createdDate: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-600">
                        Hạn thanh toán
                      </label>

                      <input
                        type="date"
                        value={newDebt.dueDate}
                        onChange={(e) =>
                          setNewDebt({
                            ...newDebt,
                            dueDate: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Ghi chú
                    </label>

                    <textarea
                      rows={2}
                      placeholder="Ghi chú"
                      value={newDebt.note}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          note: e.target.value,
                        })
                      }
                      className="w-full resize-y rounded-xl border border-slate-300 p-3"
                    />
                  </div>
                </div>
              </section>

<div className="col-span-2">

  <div className="mb-2">
    <label className="font-medium">
      Danh sách sản phẩm
    </label>
  </div>

  <div className="relative mb-3">
    <input
      id="debt-product-search"
      placeholder="Tìm theo tên bán, tên đầy đủ hoặc mã SP..."
      value={productSearch[-1] || ""}
      onFocus={() => setOpenProductDropdown(-1)}
      onChange={(e) => {
        setProductSearch((prev) => ({
          ...prev,
          [-1]: e.target.value,
        }));
        setOpenProductDropdown(-1);
      }}
      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 outline-none focus:border-sky-500"
    />

    <button
      type="button"
      onClick={() =>
        setOpenProductDropdown(
          openProductDropdown === -1 ? null : -1
        )
      }
      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100"
    >
      ▾
    </button>

    {openProductDropdown === -1 && (
      <div className="absolute left-0 right-0 top-full z-[90] mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        {(() => {
          const keyword = String(productSearch[-1] || "")
            .trim()
            .toLocaleLowerCase("vi-VN");

          const list = inventoryProducts
            .filter((product: any) => {
              if (!keyword) return true;

              const searchable = [
                product.name,
                product.productName,
                product.product_name,
                product.main_name,
                product.mainName,
                product.full_name,
                product.fullName,
                product.short_name,
                product.shortName,
                product.sell_name,
                product.sellName,
                product.product_code,
                product.productCode,
                product.sku,
                product.code,
              ]
                .map((value) =>
                  String(value || "")
                    .toLocaleLowerCase("vi-VN")
                )
                .join(" ");

              return searchable.includes(keyword);
            })
            .slice(0, 15);

          if (list.length === 0) {
            return (
              <div className="p-3 text-sm text-slate-500">
                Không tìm thấy sản phẩm
              </div>
            );
          }

          return list.map((product: any) => {
            const primary = getInventoryDisplayPrimary(product);
            const secondary = getInventoryDisplaySecondary(product);
            const code = getInventoryProductCode(product);

            return (
              <button
                key={product.id || code || primary}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();

                  const selectedCode = code;
                  const selectedName = primary;
                  const selectedSellName =
                    getInventoryProductSellName(product);
                  const selectedFullName =
                    getInventoryProductFullName(product);

                  const existingIndex =
                    products.findIndex((item: any) => {
                      const itemCode = String(
                        item.product_code ||
                        item.productCode ||
                        item.sku ||
                        item.code ||
                        ""
                      ).trim();

                      const itemName = String(item.name || "")
                        .trim()
                        .toLocaleLowerCase("vi-VN");

                      const targetName = String(selectedName)
                        .trim()
                        .toLocaleLowerCase("vi-VN");

                      if (selectedCode && itemCode) {
                        return itemCode === selectedCode;
                      }

                      return Boolean(
                        targetName &&
                        itemName === targetName
                      );
                    });

                  if (existingIndex >= 0) {
                    const clone = [...products];
                    clone[existingIndex] = {
                      ...clone[existingIndex],
                      qty:
                        Number(clone[existingIndex].qty || 0) + 1,
                    };
                    setProducts(clone);
                  } else {
                    const cleaned = products.filter(
                      (item: any) =>
                        String(item.name || "").trim() ||
                        Number(item.price || 0) > 0
                    );

                    setProducts([
                      ...cleaned,
                      {
                        name: selectedName,
                        main_name: selectedFullName,
                        short_name: selectedSellName,
                        printName: selectedName,
                        product_code: selectedCode,
                        qty: 1,
                        price: Number(
                          product.price ||
                          product.sellPrice ||
                          product.salePrice ||
                          0
                        ),
                      },
                    ]);
                  }

                  setProductSearch((prev) => ({
                    ...prev,
                    [-1]: "",
                  }));
                  setOpenProductDropdown(null);

                  setTimeout(() => {
                    const input =
                      document.getElementById(
                        "debt-product-search"
                      ) as HTMLInputElement | null;

                    input?.focus();
                  }, 0);
                }}
                className="w-full border-b border-slate-100 px-3 py-2.5 text-left hover:bg-sky-50"
              >
                <div className="font-semibold text-slate-800">
                  {primary || "Sản phẩm"}
                </div>

                {secondary && (
                  <div className="mt-0.5 text-xs text-slate-500">
                    {secondary}
                  </div>
                )}

                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {code && <span>Mã: {code}</span>}
                  <span>
                    Giá: {formatMoney(
                      Number(
                        product.price ||
                        product.sellPrice ||
                        product.salePrice ||
                        0
                      )
                    )}đ
                  </span>
                </div>
              </button>
            );
          });
        })()}
      </div>
    )}
  </div>

  <div className="overflow-hidden rounded-xl border border-slate-200">
    <table className="w-full text-sm">
      <thead className="bg-slate-100 text-slate-700">
        <tr>
          <th className="px-3 py-2 text-left">Sản phẩm</th>
          <th className="px-3 py-2 text-center w-24">SL</th>
          <th className="px-3 py-2 text-right w-36">Đơn giá</th>
          <th className="px-3 py-2 text-right w-36">Thành tiền</th>
          <th className="px-3 py-2 text-center w-16"></th>
        </tr>
      </thead>

      <tbody>
        {products
          .filter((item: any) =>
            String(item.name || "").trim()
          )
          .map((item, index) => (
            <tr
              key={`${item.product_code || item.name}-${index}`}
              className="border-t border-slate-200"
            >
              <td className="px-3 py-1.5">
                <div className="font-semibold leading-5">
                  {getDebtProductDisplayPrimary(item)}
                </div>

                {getDebtProductDisplaySecondary(item) && (
                  <div className="mt-0.5 text-xs leading-4 text-slate-500">
                    {getDebtProductDisplaySecondary(item)}
                  </div>
                )}

                {item.product_code && (
                  <div className="text-xs text-slate-400">
                    Mã: {item.product_code}
                  </div>
                )}
              </td>

              <td className="px-3 py-1.5">
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => {
                    const clone = [...products];
                    clone[index] = {
                      ...clone[index],
                      qty: Math.max(
                        1,
                        Number(e.target.value || 1)
                      ),
                    };
                    setProducts(clone);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-center"
                />
              </td>

              <td className="px-3 py-1.5">
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => {
                    const clone = [...products];
                    clone[index] = {
                      ...clone[index],
                      price: Number(e.target.value || 0),
                    };
                    setProducts(clone);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-2 py-2 text-right"
                />
              </td>

              <td className="px-3 py-2 text-right font-semibold">
                {formatMoney(
                  Number(item.qty || 0) *
                  Number(item.price || 0)
                )}đ
              </td>

              <td className="px-3 py-1.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const clone = products.filter(
                      (_item, i) => i !== index
                    );

                    setProducts(
                      clone.length
                        ? clone
                        : [
                            {
                              name: "",
                              main_name: "",
                              short_name: "",
                              qty: 1,
                              price: 0,
                            },
                          ]
                    );
                  }}
                  className="h-9 w-9 rounded-lg bg-rose-500 text-white"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}

        {products.filter((item: any) =>
          String(item.name || "").trim()
        ).length === 0 && (
          <tr>
            <td
              colSpan={5}
              className="px-3 py-5 text-center text-slate-500"
            >
              Chưa chọn sản phẩm
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

</div>

            </div>

            <div className="sticky bottom-0 -mx-7 -mb-7 mt-6 flex justify-end gap-3 border-t border-slate-200 bg-white px-7 py-4">

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
        SĐT:
        <b>
          {" "}
          {selectedDebt.phone || "---"}
        </b>
      </div>

      <div className="col-span-2">
        Địa chỉ:
        <b>
          {" "}
          {selectedDebt.address || "---"}
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

  <div className="font-semibold leading-5">
    {getDebtProductPrimaryName(item)}
  </div>

  {getDebtProductSecondaryName(item) && (
    <div
      className="mt-0.5 text-xs leading-4 text-slate-500"
      title={getDebtProductSecondaryName(item)}
    >
      {getDebtProductSecondaryName(item)}
    </div>
  )}

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