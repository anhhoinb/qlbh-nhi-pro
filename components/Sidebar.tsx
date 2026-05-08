"use client";

import Link from "next/link";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
} from "@/lib/firebase";

import {
  useRouter,
} from "next/navigation";

export default function Sidebar() {

  const router = useRouter();

  const handleLogout =
    async () => {

      await signOut(auth);

      router.push("/login");
    };

  const menus = [

    {
      name: "Dashboard",
      href: "/dashboard",
    },

    {
      name: "POS Bán hàng",
      href: "/pos",
    },

    {
      name: "Sản phẩm",
      href: "/products",
    },

    {
      name: "Khách hàng",
      href: "/customers",
    },

    {
      name: "Đơn hàng",
      href: "/orders",
    },

    {
      name: "Tồn kho",
      href: "/inventory",
    },

    {
      name: "Nhập hàng",
      href: "/restock",
    },

    {
      name: "Lịch sử nhập",
      href: "/restock-history",
    },

    {
      name: "Báo cáo",
      href: "/reports",
    },

    {
      name: "Admin",
      href: "/admin",
    },

  ];

  return (
    <aside className="w-64 min-h-screen bg-blue-700 text-white p-5 flex flex-col justify-between">

      <div>

        <h1 className="text-3xl font-bold mb-10">
          QLBH Nhi Pro
        </h1>

        <div className="space-y-3">

          {menus.map((item) => (

            <Link
              key={item.href}
              href={item.href}
              className="block bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl transition"
            >
              {item.name}
            </Link>

          ))}

        </div>

      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 p-4 rounded-2xl mt-10"
      >
        Đăng xuất
      </button>

    </aside>
  );
}