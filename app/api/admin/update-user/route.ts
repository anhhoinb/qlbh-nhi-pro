import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const uid = String(body?.uid || "").trim();
    const name = String(body?.name || "").trim();
    const role = String(
      body?.role || "Nhân viên"
    ).trim();
    const active = body?.active !== false;
    const password = String(
      body?.password || ""
    ).trim();

    if (!uid) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu UID nhân viên",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu tên nhân viên",
        },
        {
          status: 400,
        }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Mật khẩu mới phải có ít nhất 6 ký tự",
        },
        {
          status: 400,
        }
      );
    }

    await adminAuth.updateUser(uid, {
      displayName: name,
      disabled: !active,
      ...(password ? { password } : {}),
    });

    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          name,
          role,
          active,
          updatedAt:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        }
      );

    return NextResponse.json({
      success: true,
      uid,
      passwordChanged: Boolean(password),
    });
  } catch (error: any) {
    console.error(
      "UPDATE USER ERROR:",
      error
    );

    let message =
      error?.message ||
      "Không cập nhật được nhân viên";

    if (
      error?.code === "auth/user-not-found"
    ) {
      message =
        "Không tìm thấy tài khoản trong Firebase Authentication";
    }

    if (
      error?.code === "auth/invalid-password"
    ) {
      message =
        "Mật khẩu không hợp lệ. Mật khẩu phải có ít nhất 6 ký tự";
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
        code: error?.code || "",
      },
      {
        status: 500,
      }
    );
  }
}