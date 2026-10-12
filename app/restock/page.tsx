
"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Product = {
  id: string;
  name?: string;
  main_name?: string;
  short_name?: string;
  product_code?: string;
  product_location?: string;
  stock?: number;
  import_price?: number;
  [key: string]: any;
};

type RestockItem = {
  productId: string;
  productName: string;
  productCode: string;
  productLocation: string;
  beforeStock: number;
  quantity: string;
  unitPrice: string;
  afterStock: number;
};

type CurrentUser = {
  uid: string;
  username: string;
  name: string;
  role: string;
  canViewCostPrice: boolean;
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

const formatNumber = (value: number) =>
  Number(value || 0).toLocaleString("vi-VN");

const getProductName = (p: Product) =>
  String(p.main_name || p.name || "");

const getProductCode = (p: Product) =>
  String(
    p.product_code ||
      p.productCode ||
      p.sku ||
      p.code ||
      ""
  );

const getProductLocation = (p: Product) =>
  String(
    p.product_location ||
      p.location ||
      p.position ||
      p.place ||
      ""
  );

function readCurrentUser(): CurrentUser {
  const empty: CurrentUser = {
    uid: "",
    username: "",
    name: "",
    role: "",
    canViewCostPrice: false,
  };

  try {
    const raw = localStorage.getItem("currentUserInfo");
    if (!raw) return empty;

    const user = JSON.parse(raw);
    const role = String(user.role || "")
      .trim()
      .toLowerCase();

    const isAdmin =
      role === "admin" ||
      user.permissions?.admin === true;

    const username = String(
      user.username ||
        user.userName ||
        user.email ||
        ""
    );

    return {
      uid: String(user.uid || user.id || ""),
      username,
      name: String(
        user.displayName ||
          user.fullName ||
          user.name ||
          username ||
          ""
      ),
      role: isAdmin ? "admin" : role,
      canViewCostPrice:
        isAdmin ||
        user.viewCostPrice === true ||
        user.permissions?.viewCostPrice === true,
    };
  } catch (error) {
    console.error("Lỗi đọc tài khoản:", error);
    return empty;
  }
}

function generateRestockCode() {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  return `PNH-${date}-${time}`;
}

export default function RestockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<RestockItem[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [saving, setSaving] = useState(false);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canViewCostPrice =
    currentUser?.canViewCostPrice === true;

  useEffect(() => {
    setCurrentUser(readCurrentUser());
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);

      const snapshot = await getDocs(
        collection(db, "products")
      );

      const result = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as Product[];

      result.sort((a, b) =>
        getProductName(a).localeCompare(
          getProductName(b),
          "vi"
        )
      );

      setProducts(result);
    } catch (error) {
      console.error(error);
      alert("Không tải được danh sách sản phẩm");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
  }, []);

  const availableProducts = products.filter(
    (product) =>
      !items.some(
        (item) => item.productId === product.id
      )
  );

  const keyword = search.trim().toLowerCase();

  const filteredProducts = availableProducts
    .filter((product) => {
      if (!keyword) return true;

      return [
        product.name,
        product.main_name,
        product.short_name,
        getProductCode(product),
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(keyword));
    })
    .slice(0, 30);

  const totalQuantity = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const totalAmount = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.quantity) || 0) *
        (Number(item.unitPrice) || 0),
    0
  );

  const addProduct = (product: Product) => {
    if (
      items.some(
        (item) => item.productId === product.id
      )
    ) {
      alert("Sản phẩm đã có trong đơn nhập");
      return;
    }

    const beforeStock = Number(product.stock || 0);
    const importPrice = Number(product.import_price ?? 0);

    const newItem: RestockItem = {
      productId: product.id,
      productName: getProductName(product),
      productCode: getProductCode(product),
      productLocation: getProductLocation(product),
      beforeStock,
      quantity: "",
      unitPrice:
        canViewCostPrice &&
        Number.isFinite(importPrice) &&
        importPrice > 0
          ? String(importPrice)
          : "",
      afterStock: beforeStock,
    };

    setItems((prev) => [...prev, newItem]);
    setSearch("");
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const updateQuantity = (
    productId: string,
    quantity: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        return {
          ...item,
          quantity,
          afterStock:
            item.beforeStock + (Number(quantity) || 0),
        };
      })
    );
  };

  const updatePrice = (
    productId: string,
    unitPrice: string
  ) => {
    if (!canViewCostPrice) return;

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, unitPrice }
          : item
      )
    );
  };

  const removeProduct = (productId: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => item.productId !== productId
      )
    );
  };

  const handleRestock = async () => {
    if (saving) return;

    if (items.length === 0) {
      alert("Vui lòng chọn sản phẩm cần nhập");
      return;
    }

    const invalidQuantity = items.find((item) => {
      const quantity = Number(item.quantity);

      return (
        item.quantity.trim() === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      );
    });

    if (invalidQuantity) {
      alert(
        `Số lượng không hợp lệ: ${invalidQuantity.productName}`
      );
      return;
    }

    if (canViewCostPrice) {
      const invalidPrice = items.find((item) => {
        const price = Number(item.unitPrice);

        return (
          item.unitPrice.trim() === "" ||
          !Number.isFinite(price) ||
          price < 0
        );
      });

      if (invalidPrice) {
        alert(
          `Giá nhập không hợp lệ: ${invalidPrice.productName}`
        );
        return;
      }
    }

    const user = readCurrentUser();

    if (!user.uid && !user.username) {
      alert(
        "Không xác định được tài khoản đăng nhập. Vui lòng đăng nhập lại."
      );
      return;
    }

    try {
      setSaving(true);

      const restockCode = generateRestockCode();
      const restockRef = doc(collection(db, "restocks"));

      await runTransaction(db, async (transaction) => {
        const productSnapshots: {
          item: RestockItem;
          productRef: ReturnType<typeof doc>;
          stock: number;
        }[] = [];

        // Đọc toàn bộ tồn kho trước khi ghi.
        for (const item of items) {
          const productRef = doc(
            db,
            "products",
            item.productId
          );

          const snapshot = await transaction.get(
            productRef
          );

          if (!snapshot.exists()) {
            throw new Error(
              `Sản phẩm không còn tồn tại: ${item.productName}`
            );
          }

          productSnapshots.push({
            item,
            productRef,
            stock: Number(snapshot.data().stock || 0),
          });
        }

        const finalItems = productSnapshots.map(
          ({ item, stock }) => {
            const quantity = Number(item.quantity);
            const afterStock = stock + quantity;

            const base = {
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              productLocation: item.productLocation,
              beforeStock: stock,
              quantity,
              afterStock,
            };

            if (!user.canViewCostPrice) {
              return base;
            }

            const unitPrice = Number(item.unitPrice);

            return {
              ...base,
              unitPrice,
              lineTotal: quantity * unitPrice,
            };
          }
        );

        const orderQuantity = finalItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        const orderAmount = finalItems.reduce(
          (sum, item) =>
            sum +
            ("lineTotal" in item
              ? Number(item.lineTotal || 0)
              : 0),
          0
        );

        productSnapshots.forEach(
          ({ productRef }, index) => {
            transaction.update(productRef, {
              stock: finalItems[index].afterStock,
            });
          }
        );

        transaction.set(restockRef, {
          code: restockCode,
          type: "restock_order",
          itemCount: finalItems.length,
          totalQuantity: orderQuantity,
          items: finalItems,

          ...(user.canViewCostPrice
            ? { totalAmount: orderAmount }
            : {}),

          createdBy: user.uid || user.username,
          createdByUid: user.uid,
          createdByUsername: user.username,
          createdByName: user.name,
          createdByRole: user.role,

          createdAt: new Date(),
        });
      });

      alert(
        `Tạo đơn nhập hàng thành công: ${restockCode}`
      );

      setItems([]);
      setSearch("");
      setShowDropdown(false);

      await loadProducts();
    } catch (error: any) {
      console.error("Lỗi nhập hàng:", error);

      alert(
        error?.message ||
          "Nhập hàng thất bại. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-4 text-black">
      <div className="w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">
            Nhập hàng
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Chọn sản phẩm, nhập số lượng và tạo đơn
            nhập hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tìm kiếm / chọn sản phẩm cần nhập
              </label>

              <div ref={pickerRef} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  placeholder="Tìm theo tên hoặc mã sản phẩm..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />

                {showDropdown && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onMouseDown={(e) =>
                            e.preventDefault()
                          }
                          onClick={() =>
                            addProduct(product)
                          }
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-sky-50 last:border-0"
                        >
                          <div className="font-semibold text-slate-800">
                            {getProductName(product)}
                          </div>

                          {product.short_name && (
                            <div className="text-xs text-slate-500">
                              {product.short_name}
                            </div>
                          )}

                          <div className="mt-1 text-xs text-slate-500">
                            Mã:{" "}
                            {getProductCode(product) ||
                              "---"}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-sm text-slate-500">
                        Không tìm thấy sản phẩm
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Chọn sản phẩm để thêm vào danh sách
                nhập bên dưới.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between bg-slate-800 px-5 py-3.5 text-white">
                <h2 className="font-bold">
                  Danh sách sản phẩm nhập
                </h2>

                <span className="text-sm">
                  {items.length} sản phẩm
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead className="bg-slate-100 text-sm text-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        Sản phẩm
                      </th>

                      <th className="px-4 py-3 text-left">
                        Mã SP
                      </th>

                      <th className="px-4 py-3 text-left">
                        Vị trí
                      </th>

                      <th className="px-4 py-3 text-right">
                        Tồn hiện tại
                      </th>

                      <th className="px-4 py-3 text-center">
                        SL nhập
                      </th>

                      <th className="px-4 py-3 text-right">
                        Sau nhập
                      </th>

                      {canViewCostPrice && (
                        <>
                          <th className="px-4 py-3 text-right">
                            Giá nhập
                          </th>

                          <th className="px-4 py-3 text-right">
                            Thành tiền
                          </th>
                        </>
                      )}

                      <th className="px-4 py-3 text-center">
                        Xóa
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-b border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.productName}
                        </td>

                        <td className="px-4 py-3">
                          {item.productCode || "---"}
                        </td>

                        <td className="px-4 py-3">
                          {item.productLocation || "---"}
                        </td>

                        <td className="px-4 py-3 text-right font-semibold text-sky-700">
                          {formatNumber(item.beforeStock)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            placeholder="SL"
                            onChange={(e) =>
                              updateQuantity(
                                item.productId,
                                e.target.value
                              )
                            }
                            className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-right outline-none focus:border-sky-500"
                          />
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {formatNumber(item.afterStock)}
                        </td>

                        {canViewCostPrice && (
                          <>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitPrice}
                                placeholder="Giá mua"
                                onChange={(e) =>
                                  updatePrice(
                                    item.productId,
                                    e.target.value
                                  )
                                }
                                className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-right outline-none focus:border-sky-500"
                              />
                            </td>

                            <td className="px-4 py-3 text-right font-semibold">
                              {formatMoney(
                                (Number(item.quantity) ||
                                  0) *
                                  (Number(
                                    item.unitPrice
                                  ) || 0)
                              )}
                            </td>
                          </>
                        )}

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              removeProduct(
                                item.productId
                              )
                            }
                            className="rounded-xl bg-rose-600 px-3 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={
                            canViewCostPrice ? 9 : 7
                          }
                          className="p-8 text-center text-slate-500"
                        >
                          {loadingProducts
                            ? "Đang tải sản phẩm..."
                            : "Chưa có sản phẩm nào trong đơn nhập"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRestock}
              disabled={saving || loadingProducts}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving
                ? "Đang tạo đơn nhập..."
                : "Tạo đơn nhập hàng"}
            </button>
          </div>

          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              Tóm tắt đơn nhập
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-sm text-slate-500">
                  Số sản phẩm
                </p>

                <p className="mt-1 text-2xl font-bold text-sky-700">
                  {items.length}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm text-slate-500">
                  Tổng số lượng nhập
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {formatNumber(totalQuantity)}
                </p>
              </div>

              {canViewCostPrice && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm text-slate-500">
                    Tổng tiền đơn nhập
                  </p>

                  <p className="mt-1 text-2xl font-bold text-amber-700">
                    {formatMoney(totalAmount)}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Khi tạo đơn, hệ thống sẽ cộng tồn kho,
                lưu lịch sử nhập hàng và ghi nhận tài
                khoản thực hiện.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
