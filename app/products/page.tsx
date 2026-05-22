"use client";

import { useEffect, useRef, useState } from "react";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function ProductsPage() {
  // ADD PRODUCT
  const [name, setName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [productLocation, setProductLocation] = useState("");
  const [price, setPrice] = useState("");
  const [importPrice, setImportPrice] = useState("");
  const [capitalPrice, setCapitalPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("");
  const [tax, setTax] = useState("");

  // SHOW / HIDE ADD FORM
  const [showAddForm, setShowAddForm] = useState(false);

  // SEARCH + PAGINATION
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // DATA
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  // IMPORT FILE
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // EDIT MODAL
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editName, setEditName] = useState("");
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

      data.sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || ""),
          "vi"
        )
      );

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

  // ADD PRODUCT
  const addProduct = async () => {
    try {
      if (!name || !price) {
        alert("Nhập đầy đủ thông tin bắt buộc");
        return;
      }

      const normalizedName = name.trim().toLowerCase();

      const duplicate = products.find(
        (item: any) =>
          item.name?.trim()?.toLowerCase() === normalizedName
      );

      if (duplicate) {
        alert("Sản phẩm đã tồn tại");
        return;
      }

      await addDoc(collection(db, "products"), {
        name: name.trim(),
        product_code: productCode.trim(),
        product_location: productLocation.trim(),

        price: Number(price || 0),
        import_price: Number(importPrice || 0),
        capital_price: Number(
          costPrice || capitalPrice || 0
        ),

        stock: Number(stock || 0),
        unit: unit.trim() || "cái",
        tax: Number(tax || 0),

        createdAt: new Date(),
      });

      alert("Thêm sản phẩm thành công");

      setName("");
      setProductCode("");
      setProductLocation("");
      setPrice("");
      setImportPrice("");
      setCapitalPrice("");
      setCostPrice("");
      setStock("");
      setUnit("");
      setTax("");

      setShowAddForm(false);
      setCurrentPage(1);

      loadProducts();
    } catch (error) {
      console.log(error);

      alert("Không thể thêm sản phẩm");
    }
  };

  // OPEN EDIT MODAL
  const openEditModal = (item: any) => {
    setEditingProduct(item);

    setEditName(item.name || "");
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
      await updateDoc(
        doc(db, "products", editingProduct.id),
        {
          name: editName.trim(),
          product_code: editProductCode.trim(),
          product_location: editProductLocation.trim(),

          price: Number(editPrice || 0),
          import_price: Number(editImportPrice || 0),
          capital_price: Number(editCapitalPrice || 0),

          stock: Number(editStock || 0),
          unit: editUnit.trim() || "cái",
          tax: Number(editTax || 0),
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
      "name",
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
      item.name || "",
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

        if (existingNames.has(normalizedName)) {
          skipCount++;
          continue;
        }

        await addDoc(collection(db, "products"), {
          name: productName,
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

    const itemName = item.name?.toLowerCase() || "";
    const itemCode = item.product_code?.toLowerCase() || "";
    const itemLocation =
      item.product_location?.toLowerCase() || "";

    return (
      itemName.includes(keyword) ||
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
              onClick={() => setShowAddForm((prev) => !prev)}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-semibold"
            >
              {showAddForm ? "Ẩn form" : "+ Thêm sản phẩm"}
            </button>
          </div>
        </div>

        {/* ADD FORM */}
        {showAddForm && (
          <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <div className="xl:col-span-2">
                <label className="block mb-2 text-sm font-semibold text-black">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Nhập tên sản phẩm"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Mã sản phẩm
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

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Giá nhập
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
                  Giá vốn
                </label>

                <input
                  type="number"
                  placeholder="Nhập giá vốn"
                  className="w-full border p-4 rounded-2xl text-black"
                  value={costPrice || capitalPrice}
                  onChange={(e) => {
                    setCostPrice(e.target.value);
                    setCapitalPrice(e.target.value);
                  }}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Tồn kho
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
                  Đơn vị
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
                  VAT
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
                  Tên sản phẩm
                </th>

                <th className="p-4 text-left">
                  Mã SP
                </th>

                <th className="p-4 text-left">
                  Vị trí
                </th>

                <th className="p-4 text-right">
                  Giá nhập
                </th>

                <th className="p-4 text-right">
                  Giá bán
                </th>

                <th className="p-4 text-right">
                  Giá vốn
                </th>

                <th className="p-4 text-right">
                  Tồn kho
                </th>

                <th className="p-4 text-left">
                  Đơn vị
                </th>

                <th className="p-4 text-center">
                  VAT
                </th>

                <th className="p-4 text-center">
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4 text-black font-semibold">
                    {item.name}
                  </td>

                  <td className="p-4 text-black">
                    {item.product_code || "---"}
                  </td>

                  <td className="p-4 text-black">
                    {item.product_location || "---"}
                  </td>

                  <td className="p-4 text-right text-black">
                    {formatMoney(item.import_price)}
                  </td>

                  <td className="p-4 text-right text-blue-700 font-semibold">
                    {formatMoney(item.price)}
                  </td>

                  <td className="p-4 text-right text-black">
                    {formatMoney(item.capital_price)}
                  </td>

                  <td className="p-4 text-right text-black font-semibold">
                    {Number(item.stock || 0).toLocaleString("vi-VN")}
                  </td>

                  <td className="p-4 text-black">
                    {typeof item.unit === "string"
                      ? item.unit || "cái"
                      : item.unit?.name || "cái"}
                  </td>

                  <td className="p-4 text-center text-black">
                    {Number(item.tax || 0)}%
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        Sửa
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteProduct(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
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
                    Tên sản phẩm
                  </label>

                  <input
                    type="text"
                    className="w-full border p-4 rounded-2xl text-black"
                    value={editName}
                    onChange={(e) =>
                      setEditName(e.target.value)
                    }
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

              <div className="flex justify-end gap-3 mt-7">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-semibold"
                >
                  Hủy
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
      </div>
    </main>
  );
}