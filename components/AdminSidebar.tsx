// components/AdminSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  X,
  BarChart2,
  Settings,
  ClipboardList,
  Truck,
  Tag,
  MessageSquare,
  LogOut,
} from "lucide-react";

export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { adminLogout } = useAuth();
  const router = useRouter();
  const pathname = router.asPath.split("?")[0].split("#")[0] || "/";

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <BarChart2 size={20} />,
    },
    {
      label: "Edited Pages",
      href: "/admin/home-manage",
      icon: <Settings size={20} />,
    },
    {
      label: "Order Management",
      href: "/admin/orders",
      icon: <ClipboardList size={20} />,
    },
    { label: "Suppliers", href: "/admin/suppliers", icon: <Truck size={20} /> },
    { label: "Coupon", href: "/admin/coupons", icon: <Tag size={20} /> },
    { label: "Contact", href: "/admin/qa", icon: <MessageSquare size={20} /> },
  ];

  const handleLogout = () => {
    adminLogout();
    router.push("/admin/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile header + dropdown */}
      <div className="md:hidden bg-green-800 text-white">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="p-2 rounded-md hover:bg-green-700 transition"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="bg-green-700 px-4 pb-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map(({ label, href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    isActive(href)
                      ? "bg-white text-green-800"
                      : "text-white hover:bg-green-600"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {icon}
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <button
              onClick={() => {
                handleLogout();
                setMobileOpen(false);
              }}
              className="mt-4 w-full flex items-center justify-center space-x-2 bg-red-600 px-3 py-2 rounded-md hover:bg-red-700 transition"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col justify-between bg-green-800 text-white p-6 w-64 h-screen">
        <div>
          <div className="mb-8 flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-green-800 font-bold text-xl">C</span>
            </div>
            <span className="text-xl font-semibold">ICONNEX THAILAND</span>
          </div>
          <nav className="space-y-4">
            {navItems.map(({ label, href, icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive(href)
                    ? "bg-white text-green-800"
                    : "text-white hover:bg-green-600"
                }`}
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center space-x-2 bg-red-600 px-3 py-2 rounded-md hover:bg-red-700 transition"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </aside>
    </>
  );
}
