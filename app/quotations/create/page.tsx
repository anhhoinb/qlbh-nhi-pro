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

import { db } from "@/lib/firebase";

type Product = {
  id: string;
  name?: string;
  main_name?: string;
  short_name?: string;
  product_code?: string;
  price?: number;
  tax?: number;
  stock?: number;
  unit?: string | { name?: string };
};

type QuotationItem = {
  id: string;
  name: string;
  main_name: string;
  short_name: string;
  printName: string;
  product_code: string;
  unit: string;
  quantity: number;
  price: number;
  tax: number;
  note: string;
};

type BuyerInfo = {
  companyName: string;
  address: string;
  taxCode: string;
  phone: string;
  email: string;
};

const DEFAULT_SELLER = {
  companyName: "CÔNG TY TNHH CÔNG NGHỆ NHIPRO",
  taxCode: "0317504408",
  phone: "0911201091",
  email: "hhcompany.info@gmail.com",
  address:
    "40/12 Lữ Gia, Phường Phú Thọ, Thành phố Hồ Chí Minh, Việt Nam",
  bankName: "Ngân hàng TMCP Á Châu (ACB)",
  bankBranch: "Chi nhánh Lê Đại Hành",
  bankAccount: "12345078",
  bankOwner: "CÔNG TY TNHH CÔNG NGHỆ NHIPRO",
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function parseMoney(value: string) {
  return Number(value.replace(/\D/g, "") || 0);
}

function getUnitText(unit: Product["unit"]) {
  if (typeof unit === "string") {
    return unit || "cái";
  }

  return unit?.name || "cái";
}

export default function CreateQuotationPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMainName, setShowMainName] = useState(false);

  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [validDays, setValidDays] = useState("3");

  const [deliveryTime, setDeliveryTime] = useState(
    "Hàng được giao trong vòng 25 đến 30 ngày kể từ ngày thực hiện hợp đồng."
  );

  const [warrantyTime, setWarrantyTime] = useState(
    "Bảo hành 12 tháng đối với lỗi kỹ thuật do nhà sản xuất."
  );

  const [shippingIncluded, setShippingIncluded] = useState(false);
  const [shippingNote, setShippingNote] = useState("");

  const [buyer, setBuyer] = useState<BuyerInfo>({
    companyName: "",
    address: "",
    taxCode: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("pos_show_main_name");

    if (saved !== null) {
      setShowMainName(saved === "true");
    }
  }, []);

  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        printName: showMainName
          ? item.main_name || item.name || ""
          : item.short_name || item.main_name || item.name || "",
      }))
    );

    localStorage.setItem("pos_show_main_name", String(showMainName));
  }, [showMainName]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));

        const data = snapshot.docs.map((item) => {
          const productData = item.data();

          return {
            id: item.id,
            ...productData,
            price: Number(productData.price || 0),
            tax: Number(productData.tax || 0),
            stock: Number(productData.stock || 0),
          };
        }) as Product[];

        data.sort((a, b) =>
          getProductDisplayName(a).localeCompare(
            getProductDisplayName(b),
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

    loadProducts();
  }, [showMainName]);

  function getProductDisplayName(product: Product) {
    return showMainName
      ? product.main_name || product.name || ""
      : product.short_name || product.main_name || product.name || "";
  }

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
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name || "",
          main_name: product.main_name || product.name || "",
          short_name:
            product.short_name || product.main_name || product.name || "",
          printName: getProductDisplayName(product),
          product_code: product.product_code || "",
          unit: getUnitText(product.unit),
          quantity: 1,
          price: Number(product.price || 0),
          tax: Number(product.tax || 0),
          note: "",
        },
      ];
    });

    setSearch("");
    setShowDropdown(false);
  };

  const updateItem = (id: string, changes: Partial<QuotationItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
            }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0) * Number(item.price || 0),
      0
    );
  }, [items]);

  const vatAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const lineSubtotal =
        Number(item.quantity || 0) * Number(item.price || 0);

      return sum + lineSubtotal * (Number(item.tax || 0) / 100);
    }, 0);
  }, [items]);

  const total = subtotal + vatAmount;

  const getNextQuotationCode = async () => {
    const counterRef = doc(db, "settings", "quotation_counter");
    const counterSnap = await getDoc(counterRef);

    let nextNumber = 1;

    if (counterSnap.exists()) {
      nextNumber = Number(counterSnap.data()?.current || 0) + 1;
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

    return `BG${String(nextNumber).padStart(6, "0")}`;
  };

  const validate = () => {
    if (!buyer.companyName.trim()) {
      alert("Vui lòng nhập tên công ty mua hàng");
      return false;
    }

    if (items.length === 0) {
      alert("Vui lòng thêm ít nhất một sản phẩm");
      return false;
    }

    return true;
  };

  const previewQuotation = () => {
    if (!validate()) return;

    try {
      const previewItems = items.map((item) => {
        const lineSubtotal =
          Number(item.quantity || 0) * Number(item.price || 0);
        const lineVat =
          lineSubtotal * (Number(item.tax || 0) / 100);

        return {
          ...item,
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
          tax: Number(item.tax || 0),
          lineSubtotal,
          lineVat,
          lineTotal: lineSubtotal + lineVat,
        };
      });

      const previewData = {
        id: "preview",
        quotationCode: "BẢN XEM TRƯỚC",
        quotation_code: "BẢN XEM TRƯỚC",
        quotationDate,
        validDays: Number(validDays || 0),
        seller: DEFAULT_SELLER,
        buyer: {
          companyName: buyer.companyName.trim(),
          address: buyer.address.trim(),
          taxCode: buyer.taxCode.trim(),
          phone: buyer.phone.trim(),
          email: buyer.email.trim(),
        },
        terms: {
          deliveryTime: deliveryTime.trim(),
          warrantyTime: warrantyTime.trim(),
          shippingIncluded,
          shippingNote: shippingNote.trim(),
        },
        items: previewItems,
        subtotal,
        vatAmount,
        total,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        "temporary_quotation",
        JSON.stringify(previewData)
      );

      const previewWindow = window.open(
        "/quotations/print?preview=1",
        "_blank"
      );

      if (!previewWindow) {
        alert(
          "Trình duyệt đang chặn cửa sổ xem trước. Vui lòng cho phép mở cửa sổ bật lên."
        );
      }
    } catch (error) {
      console.error("PREVIEW QUOTATION ERROR:", error);
      alert("Không thể xem trước báo giá");
    }
  };

  const saveQuotation = async (openPrint: boolean) => {
    if (!validate()) return;

    const printWindow = openPrint ? window.open("", "_blank") : null;

    try {
      setSaving(true);

      const quotationCode = await getNextQuotationCode();

      const quotationData = {
        quotationCode,
        quotation_code: quotationCode,
        quotationDate,
        validDays: Number(validDays || 0),
        seller: DEFAULT_SELLER,
        buyer: {
          companyName: buyer.companyName.trim(),
          address: buyer.address.trim(),
          taxCode: buyer.taxCode.trim(),
          phone: buyer.phone.trim(),
          email: buyer.email.trim(),
        },
        terms: {
          deliveryTime: deliveryTime.trim(),
          warrantyTime: warrantyTime.trim(),
          shippingIncluded,
          shippingNote: shippingNote.trim(),
        },
        items: items.map((item) => {
          const lineSubtotal =
            Number(item.quantity || 0) * Number(item.price || 0);
          const lineVat =
            lineSubtotal * (Number(item.tax || 0) / 100);

          return {
            ...item,
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            tax: Number(item.tax || 0),
            lineSubtotal,
            lineVat,
            lineTotal: lineSubtotal + lineVat,
          };
        }),
        subtotal,
        vatAmount,
        total,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "quotations"),
        quotationData
      );

      if (openPrint) {
        const printUrl = `/quotations/print?id=${encodeURIComponent(
          docRef.id
        )}&print=1`;

        if (printWindow) {
          printWindow.location.href = printUrl;
        } else {
          window.location.href = printUrl;
        }
      } else {
        alert(`Đã lưu báo giá ${quotationCode}`);
        router.push("/quotations");
      }
    } catch (error: any) {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }

      console.error("SAVE QUOTATION ERROR:", error);

      alert(
        `Không lưu được báo giá.\n\n${error?.code || ""}\n${
          error?.message || "Lỗi không xác định"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-5 text-black">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">
              Tạo báo giá
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Nhập khách hàng thủ công và chọn sản phẩm cần báo giá
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/pos")}
              className="rounded-xl border px-4 py-2 font-semibold hover:bg-gray-50"
            >
              Quay lại POS
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={previewQuotation}
              className="rounded-xl border border-orange-500 bg-white px-5 py-2 font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-50"
            >
              Xem trước
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveQuotation(false)}
              className="rounded-xl bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu báo giá"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveQuotation(true)}
              className="rounded-xl bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              Lưu và in
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
          <section className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Thông tin báo giá</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Ngày báo giá
                  </label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(event) => setQuotationDate(event.target.value)}
                    className="w-full rounded-xl border p-3"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Hiệu lực
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={validDays}
                      onChange={(event) => setValidDays(event.target.value)}
                      className="w-full rounded-xl border p-3"
                    />
                    <span className="text-sm text-gray-500">ngày</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Công ty mua hàng</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Tên công ty *
                  </label>
                  <input
                    value={buyer.companyName}
                    onChange={(event) =>
                      setBuyer((prev) => ({
                        ...prev,
                        companyName: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border p-3"
                    placeholder="Nhập tên công ty mua hàng"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Địa chỉ
                  </label>
                  <textarea
                    rows={3}
                    value={buyer.address}
                    onChange={(event) =>
                      setBuyer((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border p-3"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Mã số thuế
                  </label>
                  <input
                    value={buyer.taxCode}
                    onChange={(event) =>
                      setBuyer((prev) => ({
                        ...prev,
                        taxCode: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border p-3"
                    placeholder="Nhập mã số thuế"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Số điện thoại
                    </label>
                    <input
                      value={buyer.phone}
                      onChange={(event) =>
                        setBuyer((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border p-3"
                      placeholder="Số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      value={buyer.email}
                      onChange={(event) =>
                        setBuyer((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border p-3"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Điều kiện báo giá</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Thời gian giao hàng
                  </label>
                  <textarea
                    rows={3}
                    value={deliveryTime}
                    onChange={(event) => setDeliveryTime(event.target.value)}
                    className="w-full resize-y rounded-xl border p-3 outline-none focus:border-blue-500"
                    placeholder="Nhập thời gian giao hàng"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Thời gian bảo hành
                  </label>
                  <textarea
                    rows={3}
                    value={warrantyTime}
                    onChange={(event) => setWarrantyTime(event.target.value)}
                    className="w-full resize-y rounded-xl border p-3 outline-none focus:border-blue-500"
                    placeholder="Nhập thời gian bảo hành"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Chi phí vận chuyển
                  </label>
                  <div className="flex flex-wrap gap-5">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="shippingIncluded"
                        checked={!shippingIncluded}
                        onChange={() => setShippingIncluded(false)}
                      />
                      <span>Chưa bao gồm</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="shippingIncluded"
                        checked={shippingIncluded}
                        onChange={() => setShippingIncluded(true)}
                      />
                      <span>Đã bao gồm</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold">
                    Ghi chú vận chuyển
                  </label>
                  <textarea
                    rows={3}
                    value={shippingNote}
                    onChange={(event) => setShippingNote(event.target.value)}
                    className="w-full resize-y rounded-xl border p-3 outline-none focus:border-blue-500"
                    placeholder="Ví dụ: Miễn phí giao hàng nội thành..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Sản phẩm báo giá</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Tìm theo tên hoặc mã sản phẩm
                  </p>
                </div>

                <div className="flex overflow-hidden rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setShowMainName(false)}
                    className={`px-4 py-2 text-sm font-semibold ${
                      !showMainName
                        ? "bg-blue-700 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Tên bán
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMainName(true)}
                    className={`px-4 py-2 text-sm font-semibold ${
                      showMainName
                        ? "bg-blue-700 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    Tên đầy đủ
                  </button>
                </div>
              </div>

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
                  className="w-full rounded-xl border p-3 outline-none focus:border-blue-500"
                />

                {showDropdown && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-xl border bg-white shadow-xl">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">
                        Không tìm thấy sản phẩm
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const stock = Number(product.stock || 0);

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onMouseDown={() => addProduct(product)}
                            className="flex w-full items-center justify-between gap-4 border-b p-3 text-left hover:bg-blue-50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold">
                                {getProductDisplayName(product)}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                <span className="text-gray-500">
                                  Mã: {product.product_code || "---"}
                                </span>

                                <span
                                  className={
                                    stock > 0
                                      ? "font-semibold text-green-600"
                                      : "font-semibold text-red-600"
                                  }
                                >
                                  Tồn kho: {formatMoney(stock)}
                                </span>

                                <span className="text-gray-500">
                                  ĐVT: {getUnitText(product.unit)}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 font-semibold text-blue-700">
                              {formatMoney(Number(product.price || 0))}đ
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead className="bg-blue-700 text-white">
                    <tr>
                      <th className="p-3 text-center">STT</th>
                      <th className="p-3 text-left">Mã SP</th>
                      <th className="p-3 text-left">Tên sản phẩm</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3 text-center">SL</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-center">VAT</th>
                      <th className="p-3 text-right">Thành tiền</th>
                      <th className="p-3 text-left">Ghi chú</th>
                      <th className="p-3" />
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => {
                      const lineSubtotal =
                        Number(item.quantity || 0) * Number(item.price || 0);
                      const lineTotal =
                        lineSubtotal +
                        lineSubtotal * (Number(item.tax || 0) / 100);

                      return (
                        <tr key={item.id} className="border-b">
                          <td className="p-3 text-center">{index + 1}</td>
                          <td className="p-3">{item.product_code || "---"}</td>
                          <td className="p-3 align-top font-normal whitespace-normal break-words">
                            {item.printName}
                          </td>
                          <td className="p-3 text-center">{item.unit}</td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  quantity: Math.max(
                                    1,
                                    Number(event.target.value || 1)
                                  ),
                                })
                              }
                              className="w-20 rounded-lg border p-2 text-center"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              inputMode="numeric"
                              value={formatMoney(item.price)}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  price: parseMoney(event.target.value),
                                })
                              }
                              className="w-32 rounded-lg border p-2 text-right"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={item.tax}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  tax: Number(event.target.value),
                                })
                              }
                              className="rounded-lg border p-2"
                            >
                              <option value="0">0%</option>
                              <option value="8">8%</option>
                              <option value="10">10%</option>
                            </select>
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatMoney(lineTotal)}đ
                          </td>
                          <td className="p-3 align-top">
                            <textarea
                              rows={3}
                              value={item.note}
                              onChange={(event) =>
                                updateItem(item.id, {
                                  note: event.target.value,
                                })
                              }
                              className="min-h-[76px] w-full resize-y rounded-lg border p-2 leading-5 outline-none focus:border-blue-500"
                              placeholder="Nhập ghi chú, có thể Enter xuống dòng"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-lg bg-red-500 px-3 py-2 font-semibold text-white hover:bg-red-600"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {items.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="p-10 text-center text-gray-500"
                        >
                          Chưa có sản phẩm trong báo giá
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t bg-gray-50 p-5">
                <div className="w-full max-w-md space-y-3">
                  <div className="flex justify-between">
                    <span>Tiền hàng:</span>
                    <strong>{formatMoney(subtotal)}đ</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế VAT:</span>
                    <strong>{formatMoney(vatAmount)}đ</strong>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-xl font-bold text-red-600">
                    <span>Tổng cộng:</span>
                    <span>{formatMoney(total)}đ</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}