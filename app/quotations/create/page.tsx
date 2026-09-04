"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
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
  isManual?: boolean;
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
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") || "";
  const isEditMode = Boolean(editId);

  const [editingQuotationCode, setEditingQuotationCode] = useState("");
  const [loadingQuotation, setLoadingQuotation] = useState(false);
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
    if (!editId) return;

    const loadQuotationForEdit = async () => {
      try {
        setLoadingQuotation(true);

        const quotationRef = doc(db, "quotations", editId);
        const quotationSnap = await getDoc(quotationRef);

        if (!quotationSnap.exists()) {
          alert("Không tìm thấy báo giá cần sửa");
          router.push("/quotations");
          return;
        }

        const data: any = quotationSnap.data();

        setEditingQuotationCode(
          String(data.quotationCode || data.quotation_code || "")
        );

        if (data.quotationDate) {
          setQuotationDate(String(data.quotationDate));
        }

        setValidDays(String(data.validDays || 3));

        setBuyer({
          companyName: String(data.buyer?.companyName || ""),
          address: String(data.buyer?.address || ""),
          taxCode: String(data.buyer?.taxCode || ""),
          phone: String(data.buyer?.phone || ""),
          email: String(data.buyer?.email || ""),
        });

        setDeliveryTime(
          String(
            data.terms?.deliveryTime ||
              "Hàng được giao trong vòng 25 đến 30 ngày kể từ ngày thực hiện hợp đồng."
          )
        );

        setWarrantyTime(
          String(
            data.terms?.warrantyTime ||
              "Bảo hành 12 tháng đối với lỗi kỹ thuật do nhà sản xuất."
          )
        );

        setShippingIncluded(Boolean(data.terms?.shippingIncluded));
        setShippingNote(String(data.terms?.shippingNote || ""));

        const oldItems = Array.isArray(data.items) ? data.items : [];

        setItems(
          oldItems.map((item: any, index: number) => {
            const itemId = String(
              item.id ||
                item.productId ||
                item.product_id ||
                item.productCode ||
                item.product_code ||
                `quotation-item-${index}`
            );

            const name = String(item.name || item.productName || "");
            const mainName = String(
              item.main_name || item.mainName || name
            );
            const shortName = String(
              item.short_name || item.shortName || mainName || name
            );

            return {
              id: itemId,
              name,
              main_name: mainName,
              short_name: shortName,
              printName: String(
                item.printName || shortName || mainName || name
              ),
              product_code: String(
                item.product_code || item.productCode || ""
              ),
              unit: String(item.unit || "cái"),
              quantity: Number(item.quantity || 1),
              price: Number(item.price || 0),
              tax: Number(item.tax || 0),
              note: String(item.note || ""),
              isManual: Boolean(item.isManual),
            };
          })
        );
      } catch (error) {
        console.error("LOAD QUOTATION FOR EDIT ERROR:", error);
        alert("Không tải được báo giá cần sửa");
      } finally {
        setLoadingQuotation(false);
      }
    };

    loadQuotationForEdit();
  }, [editId, router]);

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
          isManual: false,
        },
      ];
    });

    setSearch("");
    setShowDropdown(false);
  };

  const addManualProduct = () => {
    const manualId = `manual-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    setItems((prev) => [
      ...prev,
      {
        id: manualId,
        name: "",
        main_name: "",
        short_name: "",
        printName: "",
        product_code: "",
        unit: "cái",
        quantity: 1,
        price: 0,
        tax: 0,
        note: "",
        isManual: true,
      },
    ]);
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

  const vatBreakdown = useMemo(() => {
    const breakdown = new Map<number, number>();

    items.forEach((item) => {
      const rate = Number(item.tax || 0);

      if (!Number.isFinite(rate) || rate <= 0) {
        return;
      }

      const lineSubtotal =
        Number(item.quantity || 0) * Number(item.price || 0);

      const lineVat = lineSubtotal * (rate / 100);

      breakdown.set(
        rate,
        (breakdown.get(rate) || 0) + lineVat
      );
    });

    return Array.from(breakdown.entries())
      .map(([rate, amount]) => ({
        rate,
        amount,
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => a.rate - b.rate);
  }, [items]);

  const vatAmount = useMemo(() => {
    return vatBreakdown.reduce(
      (sum, row) => sum + row.amount,
      0
    );
  }, [vatBreakdown]);

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

      const quotationCode = isEditMode
        ? editingQuotationCode
        : await getNextQuotationCode();

      if (isEditMode && !quotationCode) {
        throw new Error("Báo giá cũ không có mã báo giá");
      }

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
        updatedAt: serverTimestamp(),
      };

      let quotationId = editId;

      if (isEditMode) {
        await updateDoc(
          doc(db, "quotations", editId),
          quotationData
        );
      } else {
        const docRef = await addDoc(
          collection(db, "quotations"),
          {
            ...quotationData,
            createdAt: serverTimestamp(),
          }
        );

        quotationId = docRef.id;
      }

      if (openPrint) {
        const printUrl = `/quotations/print?id=${encodeURIComponent(
          quotationId
        )}&print=1`;

        if (printWindow) {
          printWindow.location.href = printUrl;
        } else {
          window.location.href = printUrl;
        }
      } else {
        alert(
          isEditMode
            ? `Đã cập nhật báo giá ${quotationCode}`
            : `Đã lưu báo giá ${quotationCode}`
        );
        router.push("/quotations");
      }
    } catch (error: any) {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }

      console.error("SAVE QUOTATION ERROR:", error);

      alert(
        `${
          isEditMode
            ? "Không cập nhật được báo giá."
            : "Không lưu được báo giá."
        }\n\n${error?.code || ""}\n${
          error?.message || "Lỗi không xác định"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingQuotation) {
    return (
      <main className="min-h-screen bg-slate-100 p-5 text-black">
        <div className="mx-auto max-w-[1500px] rounded-2xl bg-white p-10 text-center shadow-sm">
          Đang tải báo giá...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-black">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {isEditMode ? "Sửa báo giá" : "Tạo báo giá"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? `Đang chỉnh sửa ${editingQuotationCode || "báo giá"}`
                : "Nhập khách hàng thủ công và chọn sản phẩm cần báo giá"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/pos")}
              className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Quay lại POS
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={previewQuotation}
              className="rounded-xl border border-amber-500 bg-white px-5 py-2 font-semibold text-amber-600 hover:bg-amber-50 disabled:opacity-50"
            >
              Xem trước
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveQuotation(false)}
              className="rounded-xl bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {saving
                ? "Đang lưu..."
                : isEditMode
                ? "Lưu thay đổi"
                : "Lưu báo giá"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveQuotation(true)}
              className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isEditMode ? "Lưu thay đổi và in" : "Lưu và in"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                      className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />
                    <span className="text-sm text-slate-500">ngày</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                    className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                      className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                      className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                    className="w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                    className="w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                    className="w-full resize-y rounded-xl border border-slate-300 p-3 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    placeholder="Ví dụ: Miễn phí giao hàng nội thành..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Sản phẩm báo giá</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Tìm theo tên hoặc mã sản phẩm
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={addManualProduct}
                    className="rounded-xl border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    + Thêm sản phẩm ngoài kho
                  </button>

                  <div className="flex overflow-hidden rounded-xl border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setShowMainName(false)}
                      className={`px-4 py-2 text-sm font-semibold ${
                        !showMainName
                          ? "bg-sky-600 text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      Tên bán
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMainName(true)}
                      className={`px-4 py-2 text-sm font-semibold ${
                        showMainName
                          ? "bg-sky-600 text-white"
                          : "bg-white text-slate-700"
                      }`}
                    >
                      Tên đầy đủ
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="relative"
                onMouseLeave={() => setShowDropdown(false)}
              >
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
                  <div className="absolute left-0 right-0 top-full z-30 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-sm text-slate-500">
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
                            className="flex w-full items-center justify-between gap-4 border-b border-slate-100 p-3 text-left hover:bg-sky-50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-semibold">
                                {getProductDisplayName(product)}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                <span className="text-slate-500">
                                  Mã: {product.product_code || "---"}
                                </span>

                                <span
                                  className={
                                    stock > 0
                                      ? "font-semibold text-emerald-600"
                                      : "font-semibold text-rose-600"
                                  }
                                >
                                  Tồn kho: {formatMoney(stock)}
                                </span>

                                <span className="text-slate-500">
                                  ĐVT: {getUnitText(product.unit)}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 font-semibold text-sky-700">
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

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead className="bg-slate-800 text-white">
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
                        <tr key={item.id} className="border-b border-slate-200 align-middle hover:bg-slate-50">
                          <td className="p-3 text-center">{index + 1}</td>
                          <td className="p-3 align-middle">
                            {item.isManual ? (
                              <input
                                value={item.product_code}
                                onChange={(event) =>
                                  updateItem(item.id, {
                                    product_code: event.target.value,
                                  })
                                }
                                className="h-10 w-28 rounded-lg border border-slate-300 px-2 outline-none focus:border-sky-500"
                                placeholder="Mã SP"
                              />
                            ) : (
                              item.product_code || "---"
                            )}
                          </td>

                          <td className="p-3 align-middle font-normal whitespace-normal break-words">
                            {item.isManual ? (
                              <input
                                value={item.printName}
                                onChange={(event) => {
                                  const value = event.target.value;

                                  updateItem(item.id, {
                                    name: value,
                                    main_name: value,
                                    short_name: value,
                                    printName: value,
                                  });
                                }}
                                className="h-10 min-w-[260px] w-full rounded-lg border border-slate-300 px-2 outline-none focus:border-sky-500"
                                placeholder="Nhập tên sản phẩm"
                              />
                            ) : (
                              item.printName
                            )}
                          </td>

                          <td className="p-3 text-center align-middle">
                            {item.isManual ? (
                              <input
                                value={item.unit}
                                onChange={(event) =>
                                  updateItem(item.id, {
                                    unit: event.target.value,
                                  })
                                }
                                className="h-10 w-24 rounded-lg border border-slate-300 px-2 text-center outline-none focus:border-sky-500"
                                placeholder="ĐVT"
                              />
                            ) : (
                              item.unit
                            )}
                          </td>
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
                              className="h-10 w-20 rounded-lg border border-slate-300 px-2 text-center outline-none focus:border-sky-500"
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
                              className="h-10 w-32 rounded-lg border border-slate-300 px-2 text-right outline-none focus:border-sky-500"
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
                              className="h-10 rounded-lg border border-slate-300 px-2 outline-none focus:border-sky-500"
                            >
                              <option value="0">0%</option>
                              <option value="8">8%</option>
                              <option value="10">10%</option>
                            </select>
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {formatMoney(lineTotal)}đ
                          </td>
                          <td className="p-3 align-middle">
                            <textarea
                              rows={1}
                              ref={(element) => {
                                if (!element) return;

                                element.style.height = "40px";
                                element.style.height = `${Math.max(
                                  40,
                                  element.scrollHeight
                                )}px`;
                              }}
                              value={item.note}
                              onChange={(event) => {
                                const element = event.currentTarget;

                                element.style.height = "40px";
                                element.style.height = `${Math.max(
                                  40,
                                  element.scrollHeight
                                )}px`;

                                updateItem(item.id, {
                                  note: event.target.value,
                                });
                              }}
                              className="min-h-10 w-full resize-none overflow-hidden rounded-lg border border-slate-300 px-2 py-2 leading-5 outline-none focus:border-sky-500"
                              placeholder="Nhập ghi chú"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-lg bg-rose-500 px-3 py-2 font-semibold text-white hover:bg-rose-600"
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
                          className="p-10 text-center text-slate-500"
                        >
                          Chưa có sản phẩm trong báo giá
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-5">
                <div className="w-full max-w-md space-y-3">
                  <div className="flex justify-between">
                    <span>Tiền hàng:</span>
                    <strong>{formatMoney(subtotal)}đ</strong>
                  </div>
                  {vatBreakdown.map(({ rate, amount }) => (
                    <div
                      key={rate}
                      className="flex justify-between"
                    >
                      <span>VAT ({rate}%):</span>
                      <strong>{formatMoney(amount)}đ</strong>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold text-rose-600">
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