"use client";

import { useState } from "react";
import { updateProductNames } from "../scripts/updateProductNames";
export default function Page() {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateProductNames();
      alert("Đã cập nhật thành công!");
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <button
        onClick={handleUpdate}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-50"
      >
        {loading ? "Đang cập nhật..." : "Cập nhật main_name và short_name"}
      </button>
    </div>
  );
}