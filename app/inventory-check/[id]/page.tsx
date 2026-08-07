"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type CheckItem = {
  productId?: string;
  productName?: string;
  productCode?: string;
  unit?: string;
  systemStock?: number;
  actualStock?: number;
  difference?: number;
  note?: string;
};

type InventoryCheck = {
  id?: string;
  code?: string;
  status?: string;
  warehouseName?: string;
  checkedBy?: string;
  generalNote?: string;
  createdAt?: any;
  checkedAt?: any;
  completedAt?: any;
  items?: CheckItem[];
};

function formatDate(value: any) {
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
}

export default function InventoryCheckDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [check, setCheck] =
    useState<InventoryCheck | null>(null);

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const loadCheck = async () => {
      try {
        setLoading(true);

        const snapshot = await getDoc(
          doc(db, "inventory_checks", id)
        );

        if (!snapshot.exists()) {
          alert("Không tìm thấy phiếu kiểm");
          return;
        }

        setCheck({
          id: snapshot.id,
          ...snapshot.data(),
        } as InventoryCheck);
      } catch (error) {
        console.error(error);
        alert("Không tải được phiếu kiểm");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCheck();
    }
  }, [id]);

  const items = check?.items || [];

  const differenceCount = useMemo(() => {
    return items.filter(
      (item) => Number(item.difference || 0) !== 0
    ).length;
  }, [items]);

  const completeInventoryCheck = async () => {
    if (!check?.id) return;

    if (check.status !== "draft") {
      alert("Phiếu kiểm này đã được hoàn thành trước đó.");
      return;
    }

    if (items.length === 0) {
      alert("Phiếu kiểm không có sản phẩm.");
      return;
    }

    if (items.length > 499) {
      alert(
        "Phiếu kiểm có quá nhiều sản phẩm để hoàn thành một lần. Vui lòng chia thành nhiều phiếu nhỏ hơn."
      );
      return;
    }

    const confirmed = window.confirm(
      `Hoàn thành phiếu ${check.code || ""}?\n\n` +
        "Tồn kho của từng sản phẩm sẽ được cập nhật theo số lượng thực tế. " +
        "Thao tác này không nên thực hiện hai lần."
    );

    if (!confirmed) return;

    try {
      setCompleting(true);

      await runTransaction(db, async (transaction) => {
        const checkRef = doc(
          db,
          "inventory_checks",
          check.id as string
        );

        const latestCheckSnap = await transaction.get(checkRef);

        if (!latestCheckSnap.exists()) {
          throw new Error("Không tìm thấy phiếu kiểm.");
        }

        const latestCheck = latestCheckSnap.data();

        if (latestCheck.status !== "draft") {
          throw new Error(
            "Phiếu kiểm đã được hoàn thành bởi một phiên làm việc khác."
          );
        }

        const validItems = items.filter(
          (item) => item.productId
        );

        const productRefs = validItems.map((item) =>
          doc(db, "products", item.productId as string)
        );

        const productSnapshots = [];

        for (const productRef of productRefs) {
          productSnapshots.push(
            await transaction.get(productRef)
          );
        }

        productSnapshots.forEach((snapshot, index) => {
          if (!snapshot.exists()) {
            throw new Error(
              `Không tìm thấy sản phẩm: ${
                validItems[index]?.productName || "Không xác định"
              }`
            );
          }
        });

        validItems.forEach((item, index) => {
          const actualStock = Math.max(
            0,
            Number(item.actualStock || 0)
          );

          transaction.update(productRefs[index], {
            stock: actualStock,
            updatedAt: serverTimestamp(),
          });
        });

        transaction.update(checkRef, {
          status: "balanced",
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      setCheck((prev) =>
        prev
          ? {
              ...prev,
              status: "balanced",
              completedAt: new Date(),
            }
          : prev
      );

      alert(
        "Đã hoàn thành phiếu kiểm và cập nhật tồn kho thành công."
      );
    } catch (error: any) {
      console.error(error);

      alert(
        `Không hoàn thành được phiếu kiểm.\n\n${
          error?.message || "Lỗi không xác định"
        }`
      );
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-5">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-center border border-slate-200 shadow-sm">
          Đang tải phiếu kiểm...
        </div>
      </main>
    );
  }

  if (!check) {
    return (
      <main className="min-h-screen bg-slate-100 p-5">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 text-center border border-slate-200 shadow-sm">
          Không có dữ liệu phiếu kiểm.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-black">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sky-700">
              Phiếu kiểm {check.code || ""}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {check.status === "balanced"
                ? "Phiếu đã hoàn thành và tồn kho đã được cập nhật."
                : "Phiếu đang ở trạng thái nháp, chưa cập nhật tồn kho."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/inventory-check"
              className="rounded-xl border border-slate-300 px-4 py-2 text-center font-semibold text-slate-700 hover:bg-slate-50"
            >
              Quay lại danh sách
            </Link>

            {check.status === "draft" && (
              <button
                type="button"
                disabled={completing}
                onClick={completeInventoryCheck}
                className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {completing
                  ? "Đang cập nhật kho..."
                  : "Hoàn thành phiếu kiểm"}
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500">Mã phiếu</div>
            <div className="mt-1 font-bold text-sky-700">
              {check.code || check.id}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500">Ngày tạo</div>
            <div className="mt-1 font-semibold">
              {formatDate(check.createdAt || check.checkedAt)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500">Kho kiểm</div>
            <div className="mt-1 font-semibold">
              {check.warehouseName || "Kho mặc định"}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="text-sm text-slate-500">Người kiểm</div>
            <div className="mt-1 font-semibold">
              {check.checkedBy || "---"}
            </div>
          </div>
        </div>

        {check.generalNote && (
          <div className="mb-5 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">
              Ghi chú chung
            </div>

            <div className="mt-2 whitespace-pre-wrap">
              {check.generalNote}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
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
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={`${item.productId}-${index}`}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="p-3 text-center">
                      {index + 1}
                    </td>

                    <td className="p-3">
                      {item.productCode || "---"}
                    </td>

                    <td className="p-3 font-semibold">
                      {item.productName || "---"}
                    </td>

                    <td className="p-3 text-center">
                      {item.unit || "cái"}
                    </td>

                    <td className="p-3 text-center text-sky-700">
                      {Number(item.systemStock || 0)}
                    </td>

                    <td className="p-3 text-center">
                      {Number(item.actualStock || 0)}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`font-bold ${
                          Number(item.difference || 0) > 0
                            ? "text-emerald-600"
                            : Number(item.difference || 0) < 0
                            ? "text-rose-600"
                            : "text-gray-600"
                        }`}
                      >
                        {Number(item.difference || 0) > 0 ? "+" : ""}
                        {Number(item.difference || 0)}
                      </span>
                    </td>

                    <td className="p-3 whitespace-pre-wrap">
                      {item.note || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5">
            <span className="font-semibold">
              Có {differenceCount} sản phẩm chênh lệch.
            </span>
          </div>
        </div>

        {check.status === "balanced" ? (
          <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-800">
            Phiếu đã hoàn thành. Tồn kho đã được cập nhật theo số lượng thực tế
            vào lúc {formatDate(check.completedAt)}.
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-800">
            Phiếu đang ở trạng thái nháp. Chỉ khi bấm
            <strong> Hoàn thành phiếu kiểm </strong>
            thì tồn kho mới được cập nhật.
          </div>
        )}
      </div>
    </main>
  );
}