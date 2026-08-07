"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

type Product = {
  id: string;
  name?: string;
  main_name?: string;
  short_name?: string;
  product_code?: string;
  sku?: string;
  code?: string;
  stock?: number;
  quantity?: number;
  inventory?: number;
  unit?: string | { name?: string };
};

type CheckItem = {
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  systemStock: number;
  actualStock: number;
  difference: number;
  note: string;
};

function getProductName(product: Product) {
  return (
    product.short_name ||
    product.main_name ||
    product.name ||
    "Sản phẩm"
  );
}

function getProductCode(product: Product) {
  return (
    product.product_code ||
    product.sku ||
    product.code ||
    ""
  );
}

function getProductStock(product: Product) {
  return Number(
    product.stock ??
      product.quantity ??
      product.inventory ??
      0
  );
}

function getUnitText(unit: Product["unit"]) {
  if (typeof unit === "string") {
    return unit || "cái";
  }

  return unit?.name || "cái";
}

export default function CreateInventoryCheckPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [warehouseName, setWarehouseName] =
    useState("Kho mặc định");

  const [checkedBy, setCheckedBy] = useState("");
  const [generalNote, setGeneralNote] = useState("");

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const saved = localStorage.getItem("currentUserInfo");

        if (saved) {
          const parsed = JSON.parse(saved);
          setCheckedBy(
            parsed?.name ||
              parsed?.email ||
              auth.currentUser?.email ||
              ""
          );
          return;
        }

        setCheckedBy(auth.currentUser?.email || "");
      } catch {
        setCheckedBy(auth.currentUser?.email || "");
      }
    };

    const loadProducts = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "products")
        );

        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Product[];

        data.sort((a, b) =>
          getProductName(a).localeCompare(
            getProductName(b),
            "vi"
          )
        );

        setProducts(data);
      } catch (error) {
        console.error(error);
        alert("Không tải được danh sách sản phẩm");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadCurrentUser();
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return products.slice(0, 30);
    }

    return products
      .filter((product) => {
        const values = [
          product.name,
          product.main_name,
          product.short_name,
          product.product_code,
          product.sku,
          product.code,
        ];

        return values.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(keyword)
        );
      })
      .slice(0, 50);
  }, [products, search]);

  const addProduct = (product: Product) => {
    setItems((prev) => {
      if (
        prev.some(
          (item) => item.productId === product.id
        )
      ) {
        return prev;
      }

      const systemStock = getProductStock(product);

      return [
        ...prev,
        {
          productId: product.id,
          productName: getProductName(product),
          productCode: getProductCode(product),
          unit: getUnitText(product.unit),
          systemStock,
          actualStock: systemStock,
          difference: 0,
          note: "",
        },
      ];
    });

    setSearch("");
    setShowDropdown(false);
  };

  const updateActualStock = (
    productId: string,
    actualStock: number
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              actualStock,
              difference:
                actualStock -
                Number(item.systemStock || 0),
            }
          : item
      )
    );
  };

  const updateNote = (
    productId: string,
    note: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              note,
            }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => item.productId !== productId
      )
    );
  };

  const differenceCount = useMemo(() => {
    return items.filter(
      (item) => Number(item.difference || 0) !== 0
    ).length;
  }, [items]);

  const totalDifference = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + Number(item.difference || 0),
      0
    );
  }, [items]);

  const getNextCode = async () => {
    const counterRef = doc(
      db,
      "settings",
      "inventory_check_counter"
    );

    const counterSnap = await getDoc(counterRef);

    let nextNumber = 1;

    if (counterSnap.exists()) {
      nextNumber =
        Number(counterSnap.data()?.current || 0) + 1;
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

    return `KK${String(nextNumber).padStart(6, "0")}`;
  };

  const saveDraft = async () => {
    if (items.length === 0) {
      alert("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    try {
      setSaving(true);

      const code = await getNextCode();

      const docRef = await addDoc(
        collection(db, "inventory_checks"),
        {
          code,
          warehouseId: "default",
          warehouseName:
            warehouseName.trim() || "Kho mặc định",
          checkedBy: checkedBy.trim(),
          generalNote: generalNote.trim(),
          status: "draft",
          itemCount: items.length,
          differenceCount,
          totalDifference,
          items: items.map((item) => ({
            ...item,
            systemStock: Number(
              item.systemStock || 0
            ),
            actualStock: Number(
              item.actualStock || 0
            ),
            difference: Number(
              item.difference || 0
            ),
          })),
          checkedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      alert(`Đã lưu phiếu kiểm ${code}`);
      router.push(`/inventory-check/${docRef.id}`);
    } catch (error: any) {
      console.error(error);

      alert(
        `Không lưu được phiếu kiểm.\n\n${
          error?.message || "Lỗi không xác định"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-black">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sky-700">
              Tạo phiếu kiểm hàng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Nhập số lượng thực tế để so sánh với tồn kho hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/inventory-check")}
              className="rounded-xl border px-4 py-2 font-semibold hover:bg-slate-50"
            >
              Quay lại
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={saveDraft}
              className="rounded-xl bg-slate-800 px-5 py-2 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu phiếu nháp"}
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <label className="mb-1 block text-sm font-semibold">
              Kho kiểm
            </label>

            <input
              value={warehouseName}
              onChange={(event) =>
                setWarehouseName(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 p-3"
            />
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <label className="mb-1 block text-sm font-semibold">
              Người kiểm
            </label>

            <input
              value={checkedBy}
              onChange={(event) =>
                setCheckedBy(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 p-3"
            />
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <label className="mb-1 block text-sm font-semibold">
              Ghi chú chung
            </label>

            <input
              value={generalNote}
              onChange={(event) =>
                setGeneralNote(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 p-3"
              placeholder="Nhập ghi chú nếu có"
            />
          </div>
        </div>

        <div className="mb-5 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <h2 className="mb-3 text-lg font-bold">
            Thêm sản phẩm kiểm
          </h2>

          <div className="relative">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              disabled={loadingProducts}
              placeholder={
                loadingProducts
                  ? "Đang tải sản phẩm..."
                  : "Nhập tên hoặc mã sản phẩm..."
              }
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-xl border bg-white shadow-xl">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">
                    Không tìm thấy sản phẩm
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onMouseDown={() => addProduct(product)}
                      className="flex w-full items-center justify-between gap-4 border-b border-slate-200 p-3 text-left hover:bg-blue-50"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {getProductName(product)}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Mã: {getProductCode(product) || "---"}
                        </div>
                      </div>

                      <div className="shrink-0 font-semibold text-sky-700">
                        Tồn: {getProductStock(product)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 text-center">STT</th>
                  <th className="p-3 text-left">Mã SP</th>
                  <th className="p-3 text-left">Tên sản phẩm</th>
                  <th className="p-3 text-center">ĐVT</th>
                  <th className="p-3 text-center">Tồn hệ thống</th>
                  <th className="p-3 text-center">Tồn thực tế</th>
                  <th className="p-3 text-center">Chênh lệch</th>
                  <th className="p-3 text-left">Ghi chú</th>
                  <th className="p-3" />
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.productId}
                    className="border-b border-slate-200"
                  >
                    <td className="p-3 text-center">
                      {index + 1}
                    </td>

                    <td className="p-3">
                      {item.productCode || "---"}
                    </td>

                    <td className="p-3 font-semibold">
                      {item.productName}
                    </td>

                    <td className="p-3 text-center">
                      {item.unit}
                    </td>

                    <td className="p-3 text-center font-semibold text-sky-700">
                      {item.systemStock}
                    </td>

                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.actualStock}
                        onChange={(event) =>
                          updateActualStock(
                            item.productId,
                            Math.max(
                              0,
                              Number(event.target.value || 0)
                            )
                          )
                        }
                        className="w-28 rounded-lg border p-2 text-center"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`font-bold ${
                          item.difference > 0
                            ? "text-emerald-600"
                            : item.difference < 0
                            ? "text-rose-600"
                            : "text-gray-600"
                        }`}
                      >
                        {item.difference > 0 ? "+" : ""}
                        {item.difference}
                      </span>
                    </td>

                    <td className="p-3">
                      <input
                        value={item.note}
                        onChange={(event) =>
                          updateNote(
                            item.productId,
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border p-2"
                        placeholder="Ghi chú"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.productId)
                        }
                        className="rounded-lg bg-rose-500 px-3 py-2 font-semibold text-white hover:bg-rose-600"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-10 text-center text-slate-500"
                    >
                      Chưa có sản phẩm trong phiếu kiểm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 border-t bg-slate-50 p-5 md:grid-cols-3">
            <div>
              <div className="text-sm text-slate-500">
                Tổng sản phẩm
              </div>
              <div className="mt-1 text-xl font-bold text-sky-700">
                {items.length}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">
                Sản phẩm có chênh lệch
              </div>
              <div className="mt-1 text-xl font-bold text-rose-600">
                {differenceCount}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">
                Tổng chênh lệch
              </div>
              <div
                className={`mt-1 text-xl font-bold ${
                  totalDifference > 0
                    ? "text-emerald-600"
                    : totalDifference < 0
                    ? "text-rose-600"
                    : "text-slate-700"
                }`}
              >
                {totalDifference > 0 ? "+" : ""}
                {totalDifference}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}