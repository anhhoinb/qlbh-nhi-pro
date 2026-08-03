"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import {
  db
} from "@/lib/firebase";

type InventoryMovement = {
  id: string;
  productId?: string;
  productName?: string;
  productCode?: string;
  type?: string;
  direction?: "in" | "out";
  quantity?: number;
  stockBefore?: number;
  stockAfter?: number;
  orderId?: string;
  orderCode?: string;
  reason?: string;
  note?: string;
  customerName?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: any;
};

export default function ProductsPage() {
  // ADD PRODUCT
  const [name, setName] = useState(""); // tương thích
  const [mainName, setMainName] = useState("");
  const [shortName, setShortName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productLocation, setProductLocation] = useState("");
  const [price, setPrice] = useState("");
  const [importPrice, setImportPrice] = useState("");
  const [capitalPrice, setCapitalPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("");
  const [tax, setTax] = useState("");

  // SHOW / HIDE ADD FORM
  const [showAddForm, setShowAddForm] = useState(false);

  // SEARCH + PAGINATION
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // DATA
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  const [imagePreview, setImagePreview] =
  useState("");

  const [imageFile, setImageFile] =
  useState<File | null>(null);

  // IMPORT FILE
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // EDIT MODAL
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [showStockHistory, setShowStockHistory] = useState(false);
  const [stockHistory, setStockHistory] = useState<InventoryMovement[]>([]);
  const [loadingStockHistory, setLoadingStockHistory] = useState(false);

  const [showColumnSettings, setShowColumnSettings] =
  useState(false);

  const columnPopupRef =
  useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const handleClickOutside = (
    event: MouseEvent
  ) => {
    if (
      columnPopupRef.current &&
      !columnPopupRef.current.contains(
        event.target as Node
      )
    ) {
      setShowColumnSettings(false);
    }
  };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

const [visibleColumns, setVisibleColumns] =
  useState({
    importPrice: true,
    capitalPrice: true,
    stock: true,
    vat: true,
    actions: true,
  });

const [canViewCostPrice, setCanViewCostPrice] =
  useState(false);

  const [canDeleteProduct, setCanDeleteProduct] =
  useState(false);

  const handleImageChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {

  const file =
  e.target.files?.[0];

if (!file) return;

setImageFile(file);

const reader =
  new FileReader();

reader.onloadend = () => {
  setImagePreview(
    reader.result as string
  );
};

reader.readAsDataURL(file);

};
  const [editName, setEditName] = useState(""); // tương thích
  const [editMainName, setEditMainName] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editProductCode, setEditProductCode] = useState("");
  const [editProductLocation, setEditProductLocation] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editImportPrice, setEditImportPrice] = useState("");
  const [editCapitalPrice, setEditCapitalPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editTax, setEditTax] = useState("");

  // FORMAT MONEY
  const formatMoney = (value: any) => {
    return Number(value || 0).toLocaleString("vi-VN") + "đ";
  };
  const generateProductCode = () => {
  let max = 0;

  products.forEach((item: any) => {
    const code = String(item.product_code || "");

    const match = code.match(/^A(\d+)$/i);

    if (match) {
      const number = Number(match[1]);

      if (number > max) {
        max = number;
      }
    }
  });

  return `A${max + 1}`;
};

  // LOAD PRODUCTS
  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "products")
      );

      const data: any[] = [];

      querySnapshot.forEach((docItem) => {
        data.push({
          id: docItem.id,
          ...docItem.data(),
        });
      });

      data.sort((a: any, b: any) => {
  const timeA = a.createdAt?.seconds || 0;
  const timeB = b.createdAt?.seconds || 0;

  return timeB - timeA;
});

      setProducts(data);
    } catch (error) {
      console.log(error);

      alert("Không tải được sản phẩm");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    try {
      const user = JSON.parse(
        localStorage.getItem("currentUserInfo") || "{}"
      );

      const normalizedRole = String(
        user.role || ""
      )
        .trim()
        .toLowerCase();

      const isAdmin =
        normalizedRole === "admin" ||
        user.permissions?.admin === true;

      const canView =
        isAdmin ||
        user.viewCostPrice === true ||
        user.permissions?.viewCostPrice === true;

      const canDelete =
        isAdmin ||
        user.deleteProduct === true ||
        user.permissions?.deleteProduct === true;

      setCanViewCostPrice(canView);
      setCanDeleteProduct(canDelete);
    } catch (error) {
      console.log(
        "Không đọc được quyền người dùng",
        error
      );

      setCanViewCostPrice(false);
      setCanDeleteProduct(false);
    }
  }, []);
  // ADD PRODUCT
  const addProduct = async () => {
    try {
      if (!mainName || !productCode || !price) {
  alert("Nhập đầy đủ thông tin bắt buộc");
  return;
}

const normalizedName = mainName.trim().toLowerCase();
const normalizedCode = productCode.trim().toLowerCase();

const duplicateName = products.find(
  (item: any) =>
    item.name?.trim()?.toLowerCase() === normalizedName
);

if (duplicateName) {
  alert("Tên sản phẩm đã tồn tại");
  return;
}

const duplicateCode = products.find(
  (item: any) =>
    item.product_code?.trim()?.toLowerCase() === normalizedCode
);

if (duplicateCode) {
  alert("Mã sản phẩm đã tồn tại");
  return;
}

      await addDoc(collection(db, "products"), {
        name: mainName.trim(),
        main_name: mainName.trim(),
        short_name:
  shortName.trim() ||
  mainName.trim(),
        imageUrl: imagePreview,
        product_code: productCode.trim(),
        product_location: productLocation.trim(),

        price: Number(price || 0),
        import_price: Number(importPrice || 0),
        capital_price: Number(
  capitalPrice || 0
),

        stock: Number(stock || 0),
        unit: unit.trim() || "cái",
        tax: Number(tax || 0),

        createdAt: new Date(),
      });

      alert("Thêm sản phẩm thành công");

      setName("");
      setMainName("");
      setShortName("");
      setProductCode("");
      setProductLocation("");
      setPrice("");
      setImportPrice("");
      setCapitalPrice("");
      setStock("");
      setUnit("");
      setTax("");
      setImagePreview("");
      setShowAddForm(false);
      setCurrentPage(1);

      loadProducts();
    } catch (error) {
      console.log(error);

      alert("Không thể thêm sản phẩm");
    }
  };

  const formatHistoryDate = (value: any) => {
    if (!value) return "---";

    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value?.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "---";
    }

    return date.toLocaleString("vi-VN");
  };

  const getMovementLabel = (movement: InventoryMovement) => {
    if (movement.type === "sale") return "Bán hàng";
    if (movement.type === "return") return "Hoàn kho";
    if (movement.type === "import") return "Nhập kho";
    if (movement.type === "adjustment") return "Điều chỉnh kho";
    if (movement.type === "inventory_check") return "Kiểm kho";

    return movement.reason || "Biến động kho";
  };

  const loadStockHistory = async (productId: string) => {
    try {
      setLoadingStockHistory(true);
      setStockHistory([]);

      let snapshot;

      try {
        snapshot = await getDocs(
          query(
            collection(db, "inventory_movements"),
            where("productId", "==", productId),
            orderBy("createdAt", "desc")
          )
        );
      } catch (error) {
        console.warn(
          "Không thể sắp xếp lịch sử theo createdAt, đang tải theo truy vấn cơ bản:",
          error
        );

        snapshot = await getDocs(
          query(
            collection(db, "inventory_movements"),
            where("productId", "==", productId)
          )
        );
      }

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })) as InventoryMovement[];

      data.sort((a, b) => {
        const getTime = (value: any) => {
          if (!value) return 0;

          if (typeof value?.toDate === "function") {
            return value.toDate().getTime();
          }

          if (value?.seconds) {
            return value.seconds * 1000;
          }

          const date = new Date(value);
          return Number.isNaN(date.getTime()) ? 0 : date.getTime();
        };

        return getTime(b.createdAt) - getTime(a.createdAt);
      });

      setStockHistory(data);
    } catch (error) {
      console.error(error);
      alert("Không tải được lịch sử kho của sản phẩm");
    } finally {
      setLoadingStockHistory(false);
    }
  };

  const openStockHistory = async () => {
    if (!editingProduct?.id) return;

    setShowStockHistory(true);
    await loadStockHistory(editingProduct.id);
  };

  // OPEN EDIT MODAL
  const openEditModal = (item: any) => {
    setEditingProduct(item);
    setShowStockHistory(false);
    setStockHistory([]);
    setImagePreview(item.imageUrl || "");

    setEditName(item.name || "");
    setEditMainName(item.main_name || item.name || "");
    setEditShortName(item.short_name || "");
    setEditProductCode(item.product_code || "");
    setEditProductLocation(item.product_location || "");
    setEditPrice(String(item.price || 0));
    setEditImportPrice(String(item.import_price || 0));
    setEditCapitalPrice(String(item.capital_price || 0));
    setEditStock(String(item.stock || 0));

    setEditUnit(
      typeof item.unit === "string"
        ? item.unit
        : item.unit?.name || "cái"
    );

    setEditTax(String(item.tax || 0));
  };

  // SAVE EDIT
  const saveEditProduct = async () => {
  if (!editingProduct) return;

  try {

    const normalizedCode = String(
      editProductCode || ""
    )
      .trim()
      .toUpperCase();

    const duplicateCode = products.find(
      (item: any) =>
        item.id !== editingProduct.id &&
        String(
          item.product_code || ""
        )
          .trim()
          .toUpperCase() ===
        normalizedCode
    );

    if (duplicateCode) {
      alert(
        `Mã sản phẩm "${editProductCode}" đã tồn tại`
      );
      return;
    }

    await updateDoc(
      doc(
        db,
        "products",
        editingProduct.id
      ),
      {
        name: editMainName.trim(),
        main_name: editMainName.trim(),
        short_name:
  editShortName.trim() ||
  editMainName.trim(),
        product_code:
          editProductCode.trim(),
        product_location:
          editProductLocation.trim(),

        price: Number(
          editPrice || 0
        ),
        import_price: Number(
          editImportPrice || 0
        ),
        capital_price: Number(
          editCapitalPrice || 0
        ),

        stock: Number(
          editStock || 0
        ),
        unit:
          editUnit.trim() || "cái",
        tax: Number(
          editTax || 0
        ),
      }
    );

    alert("Cập nhật thành công");

    setEditingProduct(null);

    loadProducts();

  } catch (error) {

    console.log(error);

    alert("Cập nhật thất bại");
  }
};

  // DELETE PRODUCT
  const deleteProduct = async (id: string) => {
    const confirmDelete = confirm(
      "Bạn có chắc muốn xóa sản phẩm này?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "products", id));

      loadProducts();
    } catch (error) {
      console.log(error);

      alert("Xóa sản phẩm thất bại");
    }
  };

  // EXPORT CSV
  const exportProductsToCSV = () => {
    if (products.length === 0) {
      alert("Chưa có sản phẩm để xuất file");
      return;
    }

    const headers = [
      "name","main_name","short_name",
      "product_code",
      "product_location",
      "price",
      "import_price",
      "capital_price",
      "stock",
      "unit",
      "tax",
    ];

    const rows = products.map((item: any) => [
      item.name || "", item.main_name || "", item.short_name || "",
      item.product_code || "",
      item.product_location || "",
      Number(item.price || 0),
      Number(item.import_price || 0),
      Number(item.capital_price || 0),
      Number(item.stock || 0),
      typeof item.unit === "string"
        ? item.unit || "cái"
        : item.unit?.name || "cái",
      Number(item.tax || 0),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const value = String(cell).replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `danh-sach-san-pham-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // PARSE CSV LINE
  const parseCSVLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);

    return result.map((item) => item.trim());
  };

  // IMPORT CSV
  const importProductsFromCSV = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const confirmImport = confirm(
      "Bạn có chắc muốn nhập file sản phẩm này không?"
    );

    if (!confirmImport) {
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();

      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        alert("File không có dữ liệu sản phẩm");
        event.target.value = "";
        return;
      }

      const headers = parseCSVLine(lines[0]).map((header) =>
        header.trim()
      );

      const requiredHeader = "name";

      if (!headers.includes(requiredHeader)) {
        alert(
          "File CSV cần có cột name. Ví dụ: name,product_code,product_location,price,import_price,capital_price,stock,unit,tax"
        );
        event.target.value = "";
        return;
      }

      let successCount = 0;
let skipCount = 0;

const existingNames = new Set(
  products.map((item: any) =>
    String(item.name || "").trim().toLowerCase()
  )
);

const existingCodes = new Set(
  products.map((item: any) =>
    String(item.product_code || "")
      .trim()
      .toLowerCase()
  )
);

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        const productName = String(row.name || "").trim();

        if (!productName) {
          skipCount++;
          continue;
        }

        const normalizedName =
  productName.toLowerCase();

const productCode = String(
  row.product_code || ""
).trim();

const normalizedCode =
  productCode.toLowerCase();

if (existingNames.has(normalizedName)) {
  skipCount++;
  continue;
}

if (existingCodes.has(normalizedCode)) {
  skipCount++;
  continue;
}

        await addDoc(collection(db, "products"), {
          name: productName,
          main_name: String(row.main_name||productName).trim(),
          short_name:
  String(
    row.short_name ||
    row.main_name ||
    row.name
  ).trim(),
          product_code: String(row.product_code || "").trim(),
          product_location: String(
            row.product_location || ""
          ).trim(),

          price: Number(row.price || 0),
          import_price: Number(row.import_price || 0),
          capital_price: Number(row.capital_price || 0),

          stock: Number(row.stock || 0),
          unit: String(row.unit || "cái").trim(),
          tax: Number(row.tax || 0),

          createdAt: new Date(),
        });

        existingNames.add(normalizedName);
existingCodes.add(normalizedCode);
successCount++;
      }

      alert(
        `Nhập file xong. Thành công: ${successCount}. Bỏ qua: ${skipCount}.`
      );

      event.target.value = "";
      setCurrentPage(1);

      loadProducts();
    } catch (error) {
      console.log(error);

      alert("Nhập file thất bại. Vui lòng kiểm tra lại file CSV.");

      event.target.value = "";
    }
  };

  // SEARCH
  const filteredProducts = products.filter((item: any) => {
    const keyword = search.toLowerCase();

    const itemName=(item.name||"").toLowerCase();
    const itemMain=(item.main_name||"").toLowerCase();
    const itemShort=(item.short_name||"").toLowerCase();
    const itemCode = item.product_code?.toLowerCase() || "";
    const itemLocation =
      item.product_location?.toLowerCase() || "";

    return (
      itemName.includes(keyword) ||
      itemMain.includes(keyword) ||
      itemShort.includes(keyword) ||
      itemCode.includes(keyword) ||
      itemLocation.includes(keyword)
    );
  });

  const totalPages = Math.ceil(
    filteredProducts.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedProducts =
    filteredProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  if (loading) {
    return (
      <div className="p-10 text-2xl">
        Đang tải sản phẩm.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-[1800px] mx-auto">
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-700">
              Quản lý sản phẩm
            </h1>

            <p className="text-gray-500 mt-2">
              Quản lý danh sách sản phẩm, tồn kho, giá bán và VAT
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={importProductsFromCSV}
            />
<a
  href="/templates/mau-nhap-san-pham.xlsx"
  download
  className="border border-blue-500 text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-2xl font-semibold transition"
>
  Tải file mẫu
</a>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-blue-600 text-blue-700 hover:bg-blue-50 px-5 py-3 rounded-2xl font-semibold"
            >
              Nhập file
            </button>

            <button
              type="button"
              onClick={exportProductsToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              Xuất file
            </button>

            <button
              type="button"
              onClick={() => {
  if (!showAddForm) {
    setProductCode(generateProductCode());
  }

  setShowAddForm((prev) => !prev);
}}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-semibold"
            >
              {showAddForm ? "Ẩn form" : "+ Thêm sản phẩm"}
            </button>
          </div>
        </div>
<div
  className={`fixed inset-0 bg-black/40 z-40 ${
    showAddForm
      ? "block"
      : "hidden"
  }`}
  onClick={() => setShowAddForm(false)}
/>
        {/* ADD FORM */}
        
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div
    className="bg-white w-full max-w-7xl max-h-[90vh] overflow-y-auto p-7 rounded-3xl shadow-2xl border border-gray-100"
    onClick={(e) =>
      e.stopPropagation()
    }
  >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <div className="xl:col-span-2">
                <label className="block mb-2 text-sm font-semibold text-black">
                  Tên chính <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Nhập tên chính"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={mainName}
                  onChange={(e) => {
                    setMainName(e.target.value);
                    setName(e.target.value);
                  }}
                />
              </div>

              <div className="xl:col-span-2">
                <label className="block mb-2 text-sm font-semibold text-black">
                  Tên phụ
                </label>

                <input
                  type="text"
                  placeholder="Ví dụ: NE555"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Mã sản phẩm <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Nhập mã sản phẩm"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={productCode}
                  onChange={(e) =>
                    setProductCode(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Vị trí sản phẩm
                </label>

                <input
                  type="text"
                  placeholder="VD: Kệ A1, Ngăn B2"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={productLocation}
                  onChange={(e) =>
                    setProductLocation(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Giá bán <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  placeholder="Nhập giá bán"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

{canViewCostPrice && (
<>
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Giá nhập <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  placeholder="Nhập giá nhập"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={importPrice}
                  onChange={(e) =>
                    setImportPrice(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Giá vốn <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  placeholder="Nhập giá vốn"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={capitalPrice}
                  onChange={(e)=>setCapitalPrice(e.target.value)}
                />
              </div>
</>
)}

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Tồn kho <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  placeholder="Nhập tồn kho"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Đơn vị <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="VD: cái, bộ, mét..."
                  className="w-full border p-4 rounded-2xl text-black"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  VAT <span className="text-red-500">*</span>
                </label>

                <select
                  className="w-full border p-4 rounded-2xl text-black bg-white"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                >
                  <option value="">
                    Chọn VAT
                  </option>

                  <option value="0">
                    VAT 0%
                  </option>

                  <option value="8">
                    VAT 8%
                  </option>

                  <option value="10">
                    VAT 10%
                  </option>
                </select>
              </div>
            </div>
<div className="xl:col-span-4">
  <label className="block mb-2 text-sm font-semibold text-black">
    Hình ảnh sản phẩm
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="w-full border p-3 rounded-2xl"
  />

  {imagePreview && (
    <img
      src={imagePreview}
      alt="Preview"
      className="w-32 h-32 object-cover rounded-xl mt-3 border"
    />
  )}
</div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-7 py-3 rounded-2xl font-semibold"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={addProduct}
                className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-2xl font-semibold"
              >
                Lưu sản phẩm
              </button>
            </div>
          </div>
          </div>
)}

        {/* SEARCH */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <input
            type="text"
            placeholder="Tìm theo tên, mã sản phẩm hoặc vị trí..."
            autoComplete="off"
            className="w-full border p-4 rounded-2xl text-black"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-blue-700 text-white">
              <tr>
                <th className="p-4 text-left">

  <div className="flex items-center gap-2">

    <button
      type="button"
      onClick={() =>
        setShowColumnSettings(
          !showColumnSettings
        )
      }
      className="hover:scale-110 transition text-lg"
    >
      ⚙️
    </button>

    <span>Tên sản phẩm</span>

  </div>

  {showColumnSettings && (
    <div
      ref={columnPopupRef}
      className="fixed bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 w-38 z-[9999]"
      style={{
        top: "300px",
        left: "560px",
      }}
    >

      <h3 className="font-bold mb-4 text-black text-base">
        Hiển thị cột
      </h3>

      <div className="space-y-3 text-sm text-black">

        {canViewCostPrice && (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={visibleColumns.importPrice}
      onChange={() =>
        setVisibleColumns((prev) => ({
          ...prev,
          importPrice: !prev.importPrice,
        }))
      }
    />
    <span>Giá nhập</span>
  </label>
)}

        {canViewCostPrice && (
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={visibleColumns.capitalPrice}
      onChange={() =>
        setVisibleColumns((prev) => ({
          ...prev,
          capitalPrice: !prev.capitalPrice,
        }))
      }
    />
    <span>Giá vốn</span>
  </label>
)}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={visibleColumns.stock}
            onChange={() =>
              setVisibleColumns((prev) => ({
                ...prev,
                stock:
                  !prev.stock,
              }))
            }
          />
          <span>Tồn kho</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={visibleColumns.vat}
            onChange={() =>
              setVisibleColumns((prev) => ({
                ...prev,
                vat:
                  !prev.vat,
              }))
            }
          />
          <span>VAT</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={visibleColumns.actions}
            onChange={() =>
              setVisibleColumns((prev) => ({
                ...prev,
                actions:
                  !prev.actions,
              }))
            }
          />
          <span>Hành động</span>
        </label>

      </div>

    </div>
  )}

</th>
                <th className="p-4 text-left">
                  Mã SP
                </th>

                <th className="p-4 text-left">
                  Vị trí
                </th>

                {canViewCostPrice &&
  visibleColumns.importPrice && (
    <th className="p-4 text-right">
      Giá nhập
    </th>
)}

                <th className="p-4 text-right">
                  Giá bán
                </th>

                {canViewCostPrice &&
  visibleColumns.capitalPrice && (
    <th className="p-4 text-right">
      Giá vốn
    </th>
)}

                {visibleColumns.stock && (
  <th className="p-4 text-right">
    Tồn kho
  </th>
)}

                <th className="p-4 text-left">
                  Đơn vị
                </th>

                {visibleColumns.vat && (
  <th className="p-4 text-center">
    VAT
  </th>
)}

                {visibleColumns.actions && (
<th className="p-4 text-center">
  Hành động
</th>
)}
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4">

  <div className="flex items-center gap-3">

    {item.imageUrl && (

      <img
        src={item.imageUrl}
        alt=""
        className="w-12 h-12 object-cover rounded-lg border"
      />

    )}

    <div className="flex flex-col">
      <span className="font-semibold text-black">
  {item.short_name ||
    item.main_name ||
    item.name}
</span>
      <span className="text-sm text-gray-500">{item.main_name || item.name}</span>
    </div>

  </div>

</td>

                  <td className="p-4 text-black">
                    {item.product_code || "---"}
                  </td>

                  <td className="p-4 text-black">
                    {item.product_location || "---"}
                  </td>

                  {canViewCostPrice &&
  visibleColumns.importPrice && (
    <td className="p-4 text-right text-black">
      {formatMoney(item.import_price)}
    </td>
)}

                  <td className="p-4 text-right text-blue-700 font-semibold">
                    {formatMoney(item.price)}
                  </td>

                  {canViewCostPrice &&
  visibleColumns.capitalPrice && (
    <td className="p-4 text-right text-black">
      {formatMoney(item.capital_price)}
    </td>
)}

                  {visibleColumns.stock && (
  <td className="p-4 text-right text-black font-semibold">
    {Number(item.stock || 0).toLocaleString("vi-VN")}
  </td>
)}

                  <td className="p-4 text-black">
                    {typeof item.unit === "string"
                      ? item.unit || "cái"
                      : item.unit?.name || "cái"}
                  </td>

                  {visibleColumns.vat && (
  <td className="p-4 text-center text-black">
    {Number(item.tax || 0)}%
  </td>
)}

                  {visibleColumns.actions && (
  <td className="p-4">
    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        Sửa
                      </button>

                      {canDeleteProduct && (
  <button
    type="button"
    onClick={() => deleteProduct(item.id)}
    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-sm"
  >
    Xóa
  </button>
)}
                    </div>
                  </td>
                  )}
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="p-10 text-center text-gray-500"
                  >
                    Không tìm thấy sản phẩm phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {filteredProducts.length > itemsPerPage && (
          <div className="bg-white mt-5 p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-black">
                {startIndex + 1}
              </span>
              {" "}đến{" "}
              <span className="font-semibold text-black">
                {Math.min(
                  startIndex + itemsPerPage,
                  filteredProducts.length
                )}
              </span>
              {" "}trong tổng{" "}
              <span className="font-semibold text-black">
                {filteredProducts.length}
              </span>
              {" "}sản phẩm
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                className={`px-4 py-2 rounded-xl font-semibold ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
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
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    currentPage === page
                      ? "bg-blue-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-black"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages)
                  )
                }
                className={`px-4 py-2 rounded-xl font-semibold ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl p-7">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-blue-700">
                    Sửa sản phẩm
                  </h2>

                  <p className="text-gray-500 mt-1">
                    Cập nhật thông tin sản phẩm
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full text-xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <div className="xl:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Tên chính
                  </label>
                  <input
                    type="text"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editMainName}
                    onChange={(e) => {
                      setEditMainName(e.target.value);
                      setEditName(e.target.value);
                    }}
                  />
                </div>

                <div className="xl:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Tên phụ
                  </label>
                  <input
                    type="text"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editShortName}
                    onChange={(e)=>setEditShortName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Mã sản phẩm
                  </label>

                  <input
                    type="text"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editProductCode}
                    onChange={(e) =>
                      setEditProductCode(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Vị trí sản phẩm
                  </label>

                  <input
                    type="text"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editProductLocation}
                    onChange={(e) =>
                      setEditProductLocation(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Giá bán
                  </label>

                  <input
                    type="number"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editPrice}
                    onChange={(e) =>
                      setEditPrice(e.target.value)
                    }
                  />
                </div>

                {canViewCostPrice && (
  <>
    <div>
      <label className="block mb-2 text-sm font-semibold text-black">
        Giá nhập
      </label>

      <input
        type="number"
        className="w-full border p-4 rounded-2xl text-black"
        value={editImportPrice}
        onChange={(e) =>
          setEditImportPrice(e.target.value)
        }
      />
    </div>

    <div>
      <label className="block mb-2 text-sm font-semibold text-black">
        Giá vốn
      </label>

      <input
        type="number"
        className="w-full border p-4 rounded-2xl text-black"
        value={editCapitalPrice}
        onChange={(e) =>
          setEditCapitalPrice(e.target.value)
        }
      />
    </div>
  </>
)}

                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Tồn kho
                  </label>

                  <input
                    type="number"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editStock}
                    onChange={(e) =>
                      setEditStock(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Đơn vị
                  </label>

                  <input
                    type="text"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editUnit}
                    onChange={(e) =>
                      setEditUnit(e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    VAT
                  </label>

                  <select
                    className="w-full border p-4 rounded-2xl text-black bg-white"
                    value={editTax}
                    onChange={(e) =>
                      setEditTax(e.target.value)
                    }
                  >
                    <option value="0">
                      VAT 0%
                    </option>

                    <option value="8">
                      VAT 8%
                    </option>

                    <option value="10">
                      VAT 10%
                    </option>
                  </select>
                </div>
              </div>
<div>
  <label className="block text-sm font-medium mb-2">
    Hình ảnh sản phẩm
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    className="w-full border p-3 rounded-2xl"
  />

  {imagePreview && (
    <img
      src={imagePreview}
      alt="Preview"
      className="w-32 h-32 object-cover rounded-xl mt-3 border"
    />
  )}
</div>
              <div className="flex flex-wrap justify-end gap-3 mt-7">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setShowStockHistory(false);
                    setStockHistory([]);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={openStockHistory}
                  className="border border-amber-500 bg-white px-6 py-3 rounded-2xl font-semibold text-amber-700 hover:bg-amber-50"
                >
                  Lịch sử kho
                </button>

                <button
                  type="button"
                  onClick={saveEditProduct}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-7 py-3 rounded-2xl font-semibold"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
        {showStockHistory && editingProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="text-2xl font-bold text-blue-700">
                    Lịch sử kho
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {editingProduct.short_name ||
                      editingProduct.main_name ||
                      editingProduct.name}
                    {editingProduct.product_code
                      ? ` • ${editingProduct.product_code}`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStockHistory(false)}
                  className="h-10 w-10 rounded-full bg-gray-100 text-xl hover:bg-gray-200"
                >
                  ×
                </button>
              </div>

              <div className="max-h-[calc(88vh-90px)] overflow-auto">
                {loadingStockHistory ? (
                  <div className="p-10 text-center text-gray-500">
                    Đang tải lịch sử kho...
                  </div>
                ) : stockHistory.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="text-lg font-semibold text-gray-700">
                      Chưa có lịch sử kho
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Lịch sử sẽ xuất hiện sau khi POS bắt đầu ghi dữ liệu vào
                      collection inventory_movements.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] border-collapse">
                      <thead className="sticky top-0 bg-blue-700 text-white">
                        <tr>
                          <th className="p-3 text-left">Thời gian</th>
                          <th className="p-3 text-left">Loại</th>
                          <th className="p-3 text-left">Chứng từ</th>
                          <th className="p-3 text-left">Khách hàng</th>
                          <th className="p-3 text-right">Tồn trước</th>
                          <th className="p-3 text-right">Thay đổi</th>
                          <th className="p-3 text-right">Tồn sau</th>
                          <th className="p-3 text-left">Người thao tác</th>
                        </tr>
                      </thead>

                      <tbody>
                        {stockHistory.map((movement) => {
                          const quantity = Number(movement.quantity || 0);
                          const isOut = movement.direction === "out";

                          return (
                            <tr
                              key={movement.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3 whitespace-nowrap">
                                {formatHistoryDate(movement.createdAt)}
                              </td>

                              <td className="p-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    isOut
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {getMovementLabel(movement)}
                                </span>
                              </td>

                              <td className="p-3 font-semibold text-blue-700">
                                {movement.orderCode || "---"}
                              </td>

                              <td className="p-3">
                                {movement.customerName || "---"}
                              </td>

                              <td className="p-3 text-right">
                                {Number(
                                  movement.stockBefore || 0
                                ).toLocaleString("vi-VN")}
                              </td>

                              <td
                                className={`p-3 text-right font-bold ${
                                  isOut
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {isOut ? "-" : "+"}
                                {quantity.toLocaleString("vi-VN")}
                              </td>

                              <td className="p-3 text-right font-semibold">
                                {Number(
                                  movement.stockAfter || 0
                                ).toLocaleString("vi-VN")}
                              </td>

                              <td className="p-3">
                                {movement.createdByName ||
                                  movement.createdBy ||
                                  "---"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}