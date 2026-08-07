"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";

type MenuItem = {
  label: string;
  href: string;
  permissionKey?: string;
};

type MenuGroup = {
  title: string;
  permissionKey?: string;
  items: MenuItem[];
};

type CurrentUserInfo = {
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: Record<string, boolean>;
};

export default function Sidebar() {

  const pathname = usePathname();
  const router = useRouter();

  const [currentUserInfo, setCurrentUserInfo] =
    useState<CurrentUserInfo | null>(null);

  const [openPrintMenu, setOpenPrintMenu] =
    useState(false);

  useEffect(() => {

    const savedUser =
      localStorage.getItem("currentUserInfo");

    if (savedUser) {

      try {

        const parsedUser =
          JSON.parse(savedUser);

        setCurrentUserInfo(parsedUser);

      } catch (error) {

        console.error(
          "Không đọc được quyền người dùng:",
          error
        );

        setCurrentUserInfo(null);
      }
    }

  }, []);

  useEffect(() => {

    if (
      pathname.startsWith(
        "/dashboard/print-template"
      )
    ) {
      setOpenPrintMenu(true);
    }

  }, [pathname]);

  const handleLogout = async () => {

    const confirmLogout = confirm(
      "Bạn có chắc muốn đăng xuất không?"
    );

    if (!confirmLogout) {
      return;
    }

    try {

      localStorage.removeItem(
        "currentUserInfo"
      );

      await signOut(auth);

      router.replace("/login");

    } catch (error) {

      console.error(error);

      alert(
        "Không đăng xuất được, vui lòng thử lại"
      );
    }
  };

  const isAdmin =
    currentUserInfo?.role === "admin" ||
    currentUserInfo?.permissions?.admin ===
      true;

  const hasPermission = (
    permissionKey?: string
  ) => {

    if (!permissionKey) {
      return true;
    }

    if (isAdmin) {
      return true;
    }

    return (
      currentUserInfo?.permissions?.[
        permissionKey
      ] === true
    );
  };

  const menuGroups: MenuGroup[] =
    useMemo(
      () => [
        {
          title: "Tổng quan",
          permissionKey: "dashboard",
          items: [
            {
              label: "Dashboard",
              href: "/dashboard",
              permissionKey:
                "dashboard",
            },
          ],
        },

        {
          title: "Bán hàng",
          permissionKey: "pos",
          items: [
            {
              label: "POS bán hàng",
              href: "/pos",
              permissionKey: "pos",
            },

            {
              label: "Đơn hàng",
              href: "/orders",
              permissionKey:
                "orders",
            },

            {
              label: "Báo giá",
              href: "/quotations",
              permissionKey:
                "orders",
            },

            {
              label: "Mẫu in",
              href: "/print-template",
              permissionKey:
                "admin",
            },
          ],
        },

        {
          title: "Sản phẩm",
          permissionKey: "products",
          items: [
            {
              label:
                "Tất cả sản phẩm",
              href: "/products",
              permissionKey:
                "products",
            },

            {
              label: "Tồn kho",
              href: "/inventory",
              permissionKey:
                "products",
            },

            {
              label: "Nhập hàng",
              href: "/restock",
              permissionKey:
                "products",
            },

            {
              label: "Kiểm hàng",
              href: "/inventory-check",
              permissionKey:
                "products",
            },

            {
              label:
                "Lịch sử nhập",
              href: "/restock-history",
              permissionKey:
                "products",
            },
          ],
        },

        {
          title: "Khách hàng",
          permissionKey: "customers",
          items: [
            {
              label:
                "Danh sách khách hàng",
              href: "/customers",
              permissionKey:
                "customers",
            },
          ],
        },

        {
          title: "Báo cáo",
          permissionKey: "reports",
          items: [
            {
              label:
                "Báo cáo bán hàng",
              href: "/reports",
              permissionKey:
                "reports",
            },

            {
              label:
                "Báo cáo tài chính",
              href: "/reports/finance",
              permissionKey:
                "finance",
            },

            {
 label:
   "Công nợ",
 href: "/reports/debts",
 permissionKey:
   "reports",
},

            {
              label:
                "Báo cáo tồn kho",
              href: "/reports/inventory",
              permissionKey:
                "reports",
            },

            {
              label:
                "Thống kê đơn hàng",
              href: "/reports/orders",
              permissionKey:
                "reports",
            },

            {
              label:
                "Thống kê sản phẩm",
              href: "/reports/products",
              permissionKey:
                "reports",
            },
          ],
        },

        {
  title: "Quản trị",
  permissionKey: "admin",
  items: [
    {
      label: "Quản trị hệ thống",
      href: "/admin",
      permissionKey: "admin",
    },

    {
      label: "Tài khoản nhân viên",
      href: "/admin/users",
      permissionKey: "admin",
    },
  ],
},
      ],
      []
    );

  const visibleMenuGroups =
    menuGroups
      .map((group) => {

        const visibleItems =
          group.items.filter((item) =>
            hasPermission(
              item.permissionKey
            )
          );

        return {
          ...group,
          items: visibleItems,
        };

      })
      .filter((group) => {

        if (
          group.items.length <= 0
        ) {
          return false;
        }

        return hasPermission(
          group.permissionKey
        );
      });

  const isExactActive = (
    href: string
  ) => {

    if (href === "/dashboard") {

      return (
        pathname ===
          "/dashboard" ||
        pathname === "/"
      );
    }

    return pathname === href;
  };

  const isGroupActive = (
    href: string
  ) => {

    return (
      pathname === href ||
      pathname.startsWith(
        href + "/"
      )
    );
  };

  const getOpenGroupsByPath =
    () => {

      const result: Record<
        string,
        boolean
      > = {};

      visibleMenuGroups.forEach(
        (group) => {

          result[group.title] =
  group.title === "Bán hàng"
    ? (
        group.items.some(
          (item) =>
            isGroupActive(
              item.href
            )
        ) ||

        pathname.startsWith(
          "/dashboard/print-template"
        )
      )
    : group.items.some(
        (item) =>
          isGroupActive(
            item.href
          )
      );
        }
      );

      return result;
    };

  const [
    openGroups,
    setOpenGroups,
  ] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {

    setOpenGroups((prev) => {

      const autoOpen =
        getOpenGroupsByPath();

      return {
        ...prev,
        ...autoOpen,
      };
    });

  }, [pathname, currentUserInfo]);

  const toggleGroup = (
    title: string
  ) => {

    setOpenGroups((prev) => ({
      ...prev,
      [title]:
        !prev[title],
    }));
  };

  return (

    <aside className="w-64 min-h-screen bg-slate-800 text-white flex flex-col shadow-xl">

      <div className="px-6 py-6 border-b border-slate-700">

        <Link
          href="/dashboard"
          className="block text-2xl font-bold tracking-wide"
        >
          NhiPro
        </Link>

        {currentUserInfo?.name && (

          <div className="mt-3 text-sm text-slate-300">

            <div className="font-semibold">
              {
                currentUserInfo.name
              }
            </div>

            <div className="text-xs opacity-80">
              {currentUserInfo.role ===
              "admin"
                ? "Quản trị viên"
                : "Nhân viên"}
            </div>

          </div>
        )}

      </div>

      <nav className="flex-1 px-4 py-5 space-y-3 overflow-y-auto">

        {visibleMenuGroups.map(
          (group) => {

            const isOpen =
              openGroups[
                group.title
              ] || false;

            const hasActiveChild =
  group.title === "Bán hàng"
    ? (
        group.items.some(
          (item) =>
            isGroupActive(
              item.href
            )
        ) ||

        pathname.startsWith(
          "/dashboard/print-template"
        )
      )
    : group.items.some(
        (item) =>
          isGroupActive(
            item.href
          )
      );

            return (

              <div
                key={
                  group.title
                }
                className="space-y-2"
              >

                <button
                  type="button"
                  onClick={() =>
                    toggleGroup(
                      group.title
                    )
                  }
                  className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 font-semibold transition ${
                    hasActiveChild
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-700/40 hover:bg-slate-700"
                  }`}
                >

                  <span>
                    {
                      group.title
                    }
                  </span>

                  <span
                    className={`transition-transform ${
                      isOpen
                        ? "rotate-90"
                        : ""
                    }`}
                  >
                    ›
                  </span>

                </button>

                {isOpen && (

                  <div className="ml-3 pl-3 border-l border-slate-600 space-y-2">

                    {group.items.map(
                      (item) => {

                        if (
                          item.label ===
                          "Mẫu in"
                        ) {

                          return (

                            <div
                              key={
                                item.href
                              }
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenPrintMenu(
                                    !openPrintMenu
                                  )
                                }
                                className={`w-full flex items-center justify-between rounded-xl px-4 py-2 text-sm transition ${
                                  pathname.startsWith(
                                    "/dashboard/print-template"
                                  )
                                    ? "bg-sky-500 text-white font-bold shadow"
                                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                }`}
                              >

                                <span>
                                  Mẫu in
                                </span>

                                <span
                                  className={`transition-transform ${
                                    openPrintMenu
                                      ? "rotate-90"
                                      : ""
                                  }`}
                                >
                                  ›
                                </span>

                              </button>

                              {openPrintMenu && (

                                <div className="ml-4 mt-2 border-l border-slate-600 pl-3 space-y-1">

                                  <Link
                                    href="/dashboard/print-template/sales"
                                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                                      pathname ===
                                      "/dashboard/print-template/sales"
                                        ? "bg-sky-500 text-white font-bold"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                    }`}
                                  >
                                    Đơn bán hàng
                                  </Link>

                                  <Link
                                    href="/dashboard/print-template/export"
                                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                                      pathname ===
                                      "/dashboard/print-template/export"
                                        ? "bg-sky-500 text-white font-bold"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                    }`}
                                  >
                                    Phiếu xuất kho
                                  </Link>

                                  <Link
                                    href="/dashboard/print-template/delivery"
                                    className={`block rounded-lg px-3 py-2 text-sm transition ${
                                      pathname ===
                                      "/dashboard/print-template/delivery"
                                        ? "bg-sky-500 text-white font-bold"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                    }`}
                                  >
                                    Phiếu giao hàng
                                  </Link>

                                </div>
                              )}

                            </div>
                          );
                        }

                        return item.href ===
                          "/pos" ? (

                          <a
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block rounded-xl px-4 py-2 text-sm transition ${
                              isExactActive(
                                item.href
                              )
                                ? "bg-sky-500 text-white font-bold shadow"
                                : "text-slate-300 hover:bg-slate-700 hover:text-white"
                            }`}
                          >
                            {
                              item.label
                            }
                          </a>

                        ) : (

                          <Link
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
                            className={`block rounded-xl px-4 py-2 text-sm transition ${
                              isExactActive(
                                item.href
                              )
                                ? "bg-sky-500 text-white font-bold shadow"
                                : "text-slate-300 hover:bg-slate-700 hover:text-white"
                            }`}
                          >
                            {
                              item.label
                            }
                          </Link>
                        );
                      }
                    )}

                  </div>
                )}

              </div>
            );
          }
        )}

      </nav>

      <div className="p-4 border-t border-slate-700">

        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-2xl font-bold transition"
        >
          Đăng xuất
        </button>

      </div>

    </aside>
  );
}
