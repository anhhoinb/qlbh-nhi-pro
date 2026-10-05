"use client";

import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

export default function AdminPage() {
  const [enabled, setEnabled] =
    useState(true);

  const [
    recipientEmail,
    setRecipientEmail,
  ] = useState(
    "hiephoa2008@gmail.com"
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  /* =====================================================
     LOAD SETTINGS
  ===================================================== */

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const ref = doc(
          db,
          "settings",
          "monthlyReport"
        );

        const snap =
          await getDoc(ref);

        if (snap.exists()) {
          const data =
            snap.data();

          setEnabled(
            data.enabled !== false
          );

          setRecipientEmail(
            String(
              data.recipientEmail ||
                ""
            )
          );
        }
      } catch (error) {
        console.error(
          "Không tải được cấu hình báo cáo:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  /* =====================================================
     KIỂM TRA EMAIL
  ===================================================== */

  const validateEmail = () => {
    const email =
      recipientEmail.trim();

    if (!email) {
      alert(
        "Vui lòng nhập email nhận báo cáo."
      );

      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      alert(
        "Địa chỉ email không hợp lệ."
      );

      return false;
    }

    return true;
  };

  /* =====================================================
     SAVE SETTINGS
  ===================================================== */

  const handleSave = async () => {
    if (!validateEmail()) {
      return;
    }

    const email =
      recipientEmail.trim();

    try {
      setSaving(true);

      await setDoc(
        doc(
          db,
          "settings",
          "monthlyReport"
        ),
        {
          enabled,

          recipientEmail:
            email,

          schedule: {
            day: 1,
            hour: 1,
            minute: 0,

            timezone:
              "Asia/Ho_Chi_Minh",
          },

          updatedAt:
            new Date().toISOString(),
        },
        {
          merge: true,
        }
      );

      alert(
        "Đã lưu cài đặt báo cáo."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Không lưu được cài đặt báo cáo."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     SEND TEST REPORT
  ===================================================== */

  const handleSendTest =
    async () => {
      if (!validateEmail()) {
        return;
      }

      try {
        setSending(true);

        /*
          Nếu bạn vừa thay đổi email
          nhưng chưa bấm Lưu cài đặt,
          ta lưu email trước khi gửi.
        */

        await setDoc(
          doc(
            db,
            "settings",
            "monthlyReport"
          ),
          {
            enabled,

            recipientEmail:
              recipientEmail.trim(),

            schedule: {
              day: 1,
              hour: 1,
              minute: 0,

              timezone:
                "Asia/Ho_Chi_Minh",
            },

            updatedAt:
              new Date().toISOString(),
          },
          {
            merge: true,
          }
        );

        /* -----------------------------------------
           Lấy tài khoản Firebase hiện tại
        ----------------------------------------- */

        const user =
          auth.currentUser;

        if (!user) {
          alert(
            "Không tìm thấy tài khoản đang đăng nhập."
          );

          return;
        }

        /* -----------------------------------------
           Lấy Firebase ID Token
        ----------------------------------------- */

        const token =
          await user.getIdToken();

        /* -----------------------------------------
           Gọi API gửi báo cáo
        ----------------------------------------- */

        const response =
          await fetch(
            "/api/monthly-order-report",
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Không gửi được báo cáo."
          );
        }

        alert(
          result.message ||
            "Đã gửi báo cáo thành công."
        );
      } catch (error: any) {
        console.error(
          "SEND TEST REPORT ERROR:",
          error
        );

        alert(
          error?.message ||
            "Không gửi được báo cáo."
        );
      } finally {
        setSending(false);
      }
    };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-100 px-5 py-5">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* HEADER */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
          <h1 className="text-2xl font-bold text-blue-700">
            Quản trị hệ thống
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Quản lý tài khoản nhân viên, phân quyền và cấu hình hệ thống.
          </p>
        </div>

        {/* MONTHLY REPORT */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

          {/* HEADER REPORT */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-gray-100">

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Báo cáo đơn hàng tự động
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Tự động gửi danh sách đơn hàng của tháng liền trước qua email.
              </p>
            </div>

            {!loading && (
              <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) =>
                    setEnabled(
                      e.target.checked
                    )
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm font-semibold text-gray-700">
                  Tự động gửi hàng tháng
                </span>
              </label>
            )}

          </div>

          {loading ? (
            <div className="py-8 text-sm text-gray-500">
              Đang tải cài đặt...
            </div>
          ) : (
            <div className="pt-5">

              {/* EMAIL + SCHEDULE */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* EMAIL */}

                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm font-bold text-gray-800 mb-3">
                    Email nhận báo cáo
                  </div>

                  <input
                    type="email"
                    value={
                      recipientEmail
                    }
                    onChange={(e) =>
                      setRecipientEmail(
                        e.target.value
                      )
                    }
                    placeholder="example@gmail.com"
                    className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Có thể thay đổi email nhận báo cáo bất cứ lúc nào.
                  </p>
                </div>

                {/* SCHEDULE */}

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">

                  <div className="text-sm font-bold text-blue-800 mb-2">
                    Lịch gửi hiện tại
                  </div>

                  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-blue-100">
                    <span className="text-sm text-gray-500">
                      Thời gian
                    </span>

                    <span className="text-sm font-semibold text-gray-800 text-right">
                      01:00 • Ngày 1 hàng tháng
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-blue-100">
                    <span className="text-sm text-gray-500">
                      Múi giờ
                    </span>

                    <span className="text-sm font-medium text-gray-700 text-right">
                      Việt Nam
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1.5">
                    <span className="text-sm text-gray-500">
                      Dữ liệu
                    </span>

                    <span className="text-sm font-medium text-gray-700 text-right">
                      Tháng vừa kết thúc
                    </span>
                  </div>

                </div>

              </div>

              {/* ACTION BAR */}

              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                <p className="text-xs text-gray-500">
                  Gửi thử sẽ gửi báo cáo của tháng liền trước đến email đang nhập ở trên.
                </p>

                <div className="flex items-center gap-2 shrink-0">

                  <button
                    type="button"
                    onClick={
                      handleSave
                    }
                    disabled={
                      saving ||
                      sending
                    }
                    className="h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-semibold px-4 rounded-lg transition"
                  >
                    {saving
                      ? "Đang lưu..."
                      : "Lưu cài đặt"}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSendTest
                    }
                    disabled={
                      sending ||
                      saving
                    }
                    className="h-9 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white text-sm font-semibold px-4 rounded-lg transition"
                  >
                    {sending
                      ? "Đang gửi..."
                      : "Gửi thử ngay"}
                  </button>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}