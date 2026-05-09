"use client";

import { useState } from "react";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  auth,
} from "@/lib/firebase";

export default function LoginPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {

    if (!email || !password) {

      alert("Nhập đầy đủ thông tin");

      return;
    }

    try {

      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("Đăng nhập thành công");

      // chuyển trang chắc chắn
      window.location.href =
        "/products";

    } catch (error) {

      console.log(error);

      alert("Sai tài khoản hoặc mật khẩu");

    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-10 rounded-3xl shadow w-full max-w-md">

        <h1 className="text-4xl font-bold text-blue-700 mb-8 text-center">
          Đăng nhập
        </h1>

        <div className="space-y-5">

          <input
            type="email"
            placeholder="Email"
            className="w-full border p-4 rounded-2xl text-black"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full border p-4 rounded-2xl text-black"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white p-4 rounded-2xl text-lg font-semibold"
          >

            {loading
              ? "Đang đăng nhập..."
              : "Đăng nhập"}

          </button>

        </div>

      </div>

    </main>
  );
}