import { NextResponse } from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const uid = String(body?.uid || "").trim();

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

    const userDoc = await adminDb
      .collection("users")
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy nhân viên",
        },
        {
          status: 404,
        }
      );
    }

    const userData = userDoc.data();

    if (userData?.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Không được xóa tài khoản Admin",
        },
        {
          status: 403,
        }
      );
    }

    await adminAuth.deleteUser(uid);

    await adminDb
      .collection("users")
      .doc(uid)
      .delete();

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("DELETE USER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Không xóa được nhân viên",
        code: error?.code || "",
      },
      {
        status: 500,
      }
    );
  }
}