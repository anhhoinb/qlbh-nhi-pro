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
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="bg-white rounded-3xl shadow p-10">
          <h1 className="text-5xl font-bold text-blue-700 mb-5">
            Quản trị hệ thống
          </h1>

          <p className="text-gray-600 text-lg">
            Quản lý tài khoản nhân viên,
            phân quyền và cấu hình hệ thống.
          </p>
        </div>

        {/* MONTHLY REPORT */}

        <div className="bg-white rounded-3xl shadow p-8">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-gray-800">
              Báo cáo đơn hàng tự động
            </h2>

            <p className="text-gray-500 mt-2">
              Tự động gửi danh sách đơn hàng
              của tháng liền trước qua email.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-gray-500">
              Đang tải cài đặt...
            </div>
          ) : (
            <div className="space-y-6">

              {/* ENABLE */}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) =>
                    setEnabled(
                      e.target.checked
                    )
                  }
                  className="w-5 h-5"
                />

                <span className="font-semibold text-gray-700">
                  Tự động gửi báo cáo
                  hàng tháng
                </span>
              </label>

              {/* EMAIL */}

              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Email nhận báo cáo
                </label>

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
                  className="w-full max-w-xl border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-sm text-gray-500 mt-2">
                  Có thể thay đổi email này
                  bất cứ lúc nào.
                </p>
              </div>

              {/* SCHEDULE */}

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">

                <div className="font-bold text-blue-800 mb-2">
                  Lịch gửi hiện tại
                </div>

                <div className="text-gray-700">
                  01:00 sáng ngày 1 hàng tháng
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  Múi giờ Việt Nam
                  (Asia/Ho_Chi_Minh)
                </div>

                <div className="text-sm text-gray-500 mt-1">
                  File gửi là báo cáo của
                  tháng vừa kết thúc.
                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving ||
                    sending
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-xl transition"
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
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-xl transition"
                >
                  {sending
                    ? "Đang gửi..."
                    : "Gửi thử ngay"}
                </button>

              </div>

              <p className="text-sm text-gray-500">
                Gửi thử sẽ gửi báo cáo
                của tháng liền trước đến
                email đang nhập ở trên.
              </p>

            </div>
          )}

        </div>

      </div>
    </main>
  );
}