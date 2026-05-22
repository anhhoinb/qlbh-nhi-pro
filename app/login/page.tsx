"use client";

import { useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

import {
  auth,
  db,
} from "@/lib/firebase";

type CurrentUserInfo = {
  uid: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const getRedirectPath = (
    userInfo: CurrentUserInfo
  ) => {
    const role =
      String(userInfo.role || "")
        .trim()
        .toLowerCase();

    const permissions =
      userInfo.permissions || {};

    const isAdmin =
      role === "admin" ||
      permissions.admin === true;

    if (isAdmin) {
      return "/dashboard";
    }

    return "/pos";
  };

  const saveUserPermission = async (
    uid: string,
    authEmail?: string | null
  ) => {
    const userRef =
      doc(db, "users", uid);

    const userSnap =
      await getDoc(userRef);

    if (!userSnap.exists()) {
      localStorage.removeItem(
        "currentUserInfo"
      );

      await signOut(auth);

      alert(
        "Tài khoản này chưa được cấp quyền trong hệ thống"
      );

      return null;
    }

    const userData: any =
      userSnap.data();

    if (userData.active !== true) {
      localStorage.removeItem(
        "currentUserInfo"
      );

      await signOut(auth);

      alert(
        "Tài khoản này đang bị khóa"
      );

      return null;
    }

    const role =
      String(userData.role || "staff")
        .trim()
        .toLowerCase();

    const permissions =
      userData.permissions &&
      typeof userData.permissions === "object"
        ? userData.permissions
        : {};

    const currentUserInfo: CurrentUserInfo = {
      uid: uid,

      email:
        userData.email ||
        authEmail ||
        "",

      name:
        userData.name ||
        "",

      role: role,

      permissions: permissions,
    };

    localStorage.removeItem(
      "currentUserInfo"
    );

    localStorage.setItem(
      "currentUserInfo",
      JSON.stringify(currentUserInfo)
    );

    return currentUserInfo;
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!isMounted) {
            return;
          }

          if (!currentUser) {
            localStorage.removeItem(
              "currentUserInfo"
            );

            setChecking(false);
            return;
          }

          try {
            const userInfo =
              await saveUserPermission(
                currentUser.uid,
                currentUser.email
              );

            if (!isMounted) {
              return;
            }

            if (!userInfo) {
              setChecking(false);
              return;
            }

            const redirectPath =
              getRedirectPath(userInfo);

            router.replace(redirectPath);
          } catch (error) {
            console.error(error);

            localStorage.removeItem(
              "currentUserInfo"
            );

            await signOut(auth);

            if (isMounted) {
              setChecking(false);
            }
          }
        }
      );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  const handleLogin = async () => {
    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      alert("Vui lòng nhập email");
      return;
    }

    if (!password) {
      alert("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      setLoading(true);

      localStorage.removeItem(
        "currentUserInfo"
      );

      const result =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const userInfo =
        await saveUserPermission(
          result.user.uid,
          result.user.email
        );

      if (!userInfo) {
        return;
      }

      const redirectPath =
        getRedirectPath(userInfo);

      router.replace(redirectPath);
    } catch (error: any) {
      console.error(error);

      if (
        error?.code === "auth/user-not-found" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/invalid-credential"
      ) {
        alert(
          "Email hoặc mật khẩu không đúng"
        );
        return;
      }

      if (
        error?.code === "auth/too-many-requests"
      ) {
        alert(
          "Bạn nhập sai quá nhiều lần, vui lòng thử lại sau"
        );
        return;
      }

      alert(
        "Không đăng nhập được, vui lòng kiểm tra lại"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">
          Đang kiểm tra đăng nhập...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-blue-700 text-white p-7">
          <h1 className="text-3xl font-bold">
            Đăng nhập quản trị
          </h1>

          <p className="text-blue-100 mt-2">
            Vui lòng đăng nhập để vào hệ thống quản lý bán hàng
          </p>
        </div>

        <div className="p-7 space-y-5 text-black">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              placeholder="Nhập email đăng nhập"
              className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Mật khẩu
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              placeholder="Nhập mật khẩu"
              className="w-full border p-4 rounded-2xl outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleLogin}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-60"
          >
            {loading
              ? "Đang đăng nhập..."
              : "Đăng nhập"}
          </button>

          <p className="text-sm text-gray-500 text-center">
            Admin sẽ vào trang Dashboard, nhân viên sẽ vào màn hình POS.
          </p>
        </div>
      </div>
    </main>
  );
}