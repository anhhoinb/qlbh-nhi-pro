"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type MenuItem = {
  label: string;
  href: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export default function Sidebar() {
  const pathname = usePathname();

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        title: "Tổng quan",
        items: [
          {
            label: "Dashboard",
            href: "/dashboard",
          },
        ],
      },
      {
        title: "Bán hàng",
        items: [
          {
            label: "POS bán hàng",
            href: "/pos",
          },
          {
            label: "Đơn hàng",
            href: "/orders",
          },
          {
            label: "Mẫu in",
            href: "/print-template",
          },
        ],
      },
      {
        title: "Sản phẩm",
        items: [
          {
            label: "Tất cả sản phẩm",
            href: "/products",
          },
          {
            label: "Tồn kho",
            href: "/inventory",
          },
          {
            label: "Nhập hàng",
            href: "/restock",
          },
          {
            label: "Lịch sử nhập",
            href: "/restock-history",
          },
        ],
      },
      {
        title: "Khách hàng",
        items: [
          {
            label: "Danh sách khách hàng",
            href: "/customers",
          },
        ],
      },
      {
        title: "Báo cáo",
        items: [
          {
            label: "Báo cáo bán hàng",
            href: "/reports",
          },
          {
            label: "Báo cáo tài chính",
            href: "/reports/finance",
          },
          {
            label: "Báo cáo tồn kho",
            href: "/reports/inventory",
          },
          {
            label: "Thống kê đơn hàng",
            href: "/reports/orders",
          },
          {
            label: "Thống kê sản phẩm",
            href: "/reports/products",
          },
        ],
      },
      {
        title: "Quản trị",
        items: [
          {
            label: "Quản trị hệ thống",
            href: "/admin",
          },
        ],
      },
    ],
    []
  );

  const isExactActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }

    if (href === "/reports") {
      return pathname === "/reports";
    }

    return pathname === href;
  };

  const isGroupActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }

    if (href === "/reports") {
      return pathname === "/reports";
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  const getOpenGroupsByPath = () => {
    const result: Record<string, boolean> = {};

    menuGroups.forEach((group) => {
      result[group.title] = group.items.some((item) =>
        isGroupActive(item.href)
      );
    });

    return result;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const autoOpen = getOpenGroupsByPath();

      return {
        ...prev,
        ...autoOpen,
      };
    });
  }, [pathname, menuGroups]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside className="w-64 min-h-screen bg-blue-700 text-white flex flex-col">
      <div className="px-6 py-6 border-b border-blue-500">
        <Link
          href="/dashboard"
          className="block text-2xl font-bold tracking-wide"
        >
          QLBH Nhi Pro
        </Link>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-3 overflow-y-auto">
        {menuGroups.map((group) => {
          const isOpen = openGroups[group.title] || false;

          const hasActiveChild = group.items.some((item) =>
            isGroupActive(item.href)
          );

          return (
            <div key={group.title} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 font-semibold transition ${
                  hasActiveChild
                    ? "bg-blue-500 text-white"
                    : "bg-blue-600/60 hover:bg-blue-600"
                }`}
              >
                <span>{group.title}</span>

                <span
                  className={`transition-transform ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
              </button>

              {isOpen && (
                <div className="ml-3 pl-3 border-l border-blue-400 space-y-2">
                  {group.items.map((item) =>
                    item.href === "/pos" ? (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-xl px-4 py-2 text-sm transition ${
                          isExactActive(item.href)
                            ? "bg-white text-blue-700 font-bold shadow"
                            : "text-blue-50 hover:bg-blue-600"
                        }`}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-xl px-4 py-2 text-sm transition ${
                          isExactActive(item.href)
                            ? "bg-white text-blue-700 font-bold shadow"
                            : "text-blue-50 hover:bg-blue-600"
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}