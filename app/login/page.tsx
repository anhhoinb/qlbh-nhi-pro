"use client";

import { useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

type CurrentUserInfo = {
  uid: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, boolean>;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const goToPage = (path: string) => {
    window.location.href = path;
  };

  const getRedirectPath = (userInfo: CurrentUserInfo) => {
    const role = String(userInfo.role || "")
      .trim()
      .toLowerCase();

    const permissions = userInfo.permissions || {};

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
    authEmail?: string | null,
    showAlert: boolean = true
  ) => {
    console.log("UID LOGIN:", uid);

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    console.log("DOC EXISTS:", userSnap.exists());
    console.log("DATA:", userSnap.data());

    if (!userSnap.exists()) {
      localStorage.removeItem("currentUserInfo");
      await signOut(auth);

      if (showAlert) {
        alert(
          "Tài khoản này chưa được cấp quyền trong hệ thống"
        );
      }

      return null;
    }

    const userData: any = userSnap.data();

    if (userData.active !== true) {
      localStorage.removeItem("currentUserInfo");
      await signOut(auth);

      if (showAlert) {
        alert("Tài khoản này đang bị khóa");
      }

      return null;
    }

    const role = String(userData.role || "staff")
      .trim()
      .toLowerCase();

    const permissions =
      userData.permissions &&
      typeof userData.permissions === "object"
        ? userData.permissions
        : {};

    const currentUserInfo: CurrentUserInfo = {
      uid,
      email: userData.email || authEmail || "",
      name: userData.name || "",
      role,
      permissions,
    };

    localStorage.removeItem("currentUserInfo");
    localStorage.setItem(
      "currentUserInfo",
      JSON.stringify(currentUserInfo)
    );

    return currentUserInfo;
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!isMounted) {
          return;
        }

        if (!currentUser) {
          localStorage.removeItem("currentUserInfo");
          setChecking(false);
          return;
        }

        try {
          const userInfo = await saveUserPermission(
            currentUser.uid,
            currentUser.email,
            false
          );

          if (!isMounted) {
            return;
          }

          if (!userInfo) {
            setChecking(false);
            return;
          }

          const redirectPath = getRedirectPath(userInfo);
          goToPage(redirectPath);
        } catch (error) {
          console.error(error);

          localStorage.removeItem("currentUserInfo");
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
  }, []);

  const handleLogin = async () => {
    const cleanEmail = email.trim();

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

      localStorage.removeItem("currentUserInfo");

      const result = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const userInfo = await saveUserPermission(
        result.user.uid,
        result.user.email,
        true
      );

      if (!userInfo) {
        setLoading(false);
        return;
      }

      const redirectPath = getRedirectPath(userInfo);
      goToPage(redirectPath);
    } catch (error: any) {
      console.error(error);

      if (
        error?.code === "auth/user-not-found" ||
        error?.code === "auth/wrong-password" ||
        error?.code === "auth/invalid-credential"
      ) {
        alert("Email hoặc mật khẩu không đúng");
        return;
      }

      if (error?.code === "auth/too-many-requests") {
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
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-700">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm border border-slate-200">
          Đang kiểm tra đăng nhập...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 border border-slate-200">
        <div className="bg-slate-800 px-7 py-8 text-white">
          <div className="text-sm font-semibold tracking-[0.18em] text-sky-300 uppercase">
            Quản lý bán hàng
          </div>

          <h1 className="mt-2 text-3xl font-bold">
            Đăng nhập
          </h1>

          <p className="mt-2 text-slate-300">
            Vui lòng đăng nhập để vào hệ thống quản lý bán hàng
          </p>
        </div>

        <div className="p-7 space-y-5 text-black">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
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
              className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
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
              className="w-full border border-slate-300 bg-white p-4 rounded-2xl outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleLogin}
            className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white py-4 rounded-2xl font-bold text-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading
              ? "Đang đăng nhập..."
              : "Đăng nhập"}
          </button>

          <p className="text-sm text-slate-500 text-center">
            Admin sẽ vào trang Dashboard, nhân viên sẽ vào màn hình POS.
          </p>
        </div>
      </div>
    </main>
  );
}