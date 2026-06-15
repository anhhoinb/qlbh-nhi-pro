import { NextResponse } from "next/server";

import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";

import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu email",
        },
        { status: 400 }
      );
    }

    if (!body.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mật khẩu",
        },
        { status: 400 }
      );
    }

    const authUser =
      await adminAuth.createUser({
        email: body.email,
        password: body.password,
        displayName: body.name,
      });

    await adminDb
      .collection("users")
      .doc(authUser.uid)
      .set({
        name: body.name,
        email: body.email,

        role:
          body.role || "staff",

        active: true,

        permissions:
          body.permissions || {},

        createdAt:
          FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      uid: authUser.uid,
    });
  } catch (error: any) {
    console.error(
      "CREATE USER ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}