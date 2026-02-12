import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import {
  Box,
  ChevronRight,
  CreditCard,
  Heart,
  LogOut,
  MapPin,
  Phone,
  Settings,
  UserRound,
  CircleHelp,
} from "lucide-react";
import MobileShopBottomNav from "@/components/MobileShopBottomNav";
import { useAuth } from "@/context/AuthContext";

type OrderSummary = {
  id: string;
  status: string;
};

type ProfileResponse = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type AccountMenuItem = {
  href: string;
  icon: typeof Box;
  title: string;
  subtitle: string;
  badge?: number;
};

function getAuthToken(token: string | null) {
  return token ?? Cookies.get("token") ?? "";
}

export default function AccountPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("ผู้ใช้งาน");
  const [email, setEmail] = useState("-");
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);

  useEffect(() => {
    const authToken = getAuthToken(token);
    if (!authToken) {
      router.push("/login");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, ordersRes, wishlistRes] = await Promise.all([
          fetch("/api/auth/profile", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/orders", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/wishlist", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        if (cancelled) return;

        const profileJson = profileRes.ok
          ? ((await profileRes.json()) as ProfileResponse)
          : {};
        const ordersJson = ordersRes.ok
          ? ((await ordersRes.json()) as { orders?: OrderSummary[] })
          : { orders: [] };
        const wishlistJson = wishlistRes.ok
          ? ((await wishlistRes.json()) as unknown[])
          : [];

        const orders = Array.isArray(ordersJson.orders) ? ordersJson.orders : [];
        const activeOrders = orders.filter((item) => {
          const key = item.status?.toUpperCase();
          return key !== "COMPLETED" && key !== "CANCELLED";
        });

        setName(profileJson.user?.name ?? "ผู้ใช้งาน");
        setEmail(profileJson.user?.email ?? "-");
        setOrderCount(orders.length);
        setActiveOrderCount(activeOrders.length);
        setWishlistCount(Array.isArray(wishlistJson) ? wishlistJson.length : 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  const orderMenu = useMemo<AccountMenuItem[]>(
    () => [
      {
        href: "/orders",
        icon: Box,
        title: "คำสั่งซื้อของฉัน",
        subtitle: "ดูสถานะและประวัติการสั่งซื้อ",
        badge: activeOrderCount > 0 ? activeOrderCount : undefined,
      },
      {
        href: "/wishlist",
        icon: Heart,
        title: "รายการโปรด",
        subtitle: "สินค้าที่ถูกใจ",
      },
    ],
    [activeOrderCount]
  );

  const accountMenu = useMemo<AccountMenuItem[]>(
    () => [
      {
        href: "/account/addresses",
        icon: MapPin,
        title: "ที่อยู่จัดส่ง",
        subtitle: "จัดการที่อยู่สำหรับจัดส่งสินค้า",
      },
      {
        href: "/account/settings/payment",
        icon: CreditCard,
        title: "วิธีชำระเงิน",
        subtitle: "จัดการบัตรและวิธีชำระเงิน",
      },
      {
        href: "/account/profile",
        icon: Settings,
        title: "แก้ไขโปรไฟล์",
        subtitle: "แก้ไขข้อมูลบัญชีของคุณ",
      },
    ],
    []
  );

  const supportMenu = useMemo<AccountMenuItem[]>(
    () => [
      {
        href: "/contact",
        icon: Phone,
        title: "ติดต่อเรา",
        subtitle: "สอบถามข้อมูล แจ้งปัญหา",
      },
      {
        href: "/qa",
        icon: CircleHelp,
        title: "ช่วยเหลือ",
        subtitle: "คำถามที่พบบ่อย วิธีใช้งาน",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      <div className="mx-auto w-full max-w-[440px] pb-[110px]">
        <section className="relative bg-gradient-to-br from-[#2f6ef4] to-[#4e8cff] px-4 pb-8 pt-6 text-white">
          <h1 className="text-[34px] font-extrabold leading-none tracking-tight">บัญชีของฉัน</h1>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-white/16">
              <UserRound className="h-14 w-14 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[27px] font-bold leading-tight">{name}</p>
              <p className="truncate text-[17px] text-white/90">{email}</p>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-2 px-4">
          <div className="rounded-[24px] border border-[#d8d8d8] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[30px] font-extrabold leading-tight text-[#2f6ef4]">{orderCount}</p>
                <p className="mt-1 text-[16px] leading-tight text-[#4b5563]">คำสั่งซื้อ</p>
              </div>
              <div>
                <p className="text-[30px] font-extrabold leading-tight text-[#2f6ef4]">{wishlistCount}</p>
                <p className="mt-1 text-[16px] leading-tight text-[#4b5563]">รายการโปรด</p>
              </div>
              <div>
                <p className="text-[30px] font-extrabold leading-tight text-[#f59e0b]">{activeOrderCount}</p>
                <p className="mt-1 text-[16px] leading-tight text-[#4b5563]">กำลังดำเนินการ</p>
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-4 px-4 pt-5">
          <MenuSection title="คำสั่งซื้อ" items={orderMenu} />
          <MenuSection title="บัญชีของฉัน" items={accountMenu} />
          <MenuSection title="อื่นๆ" items={supportMenu} />

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-[20px] border border-[#f7d2d4] bg-white px-4 py-4"
          >
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[#fff1f1] text-[#ef4444]">
              <LogOut className="h-8 w-8" />
            </div>
            <span className="text-[24px] font-bold leading-tight text-[#ef4444]">ออกจากระบบ</span>
          </button>

          {loading ? (
            <p className="text-center text-[16px] text-[#6b7280]">กำลังโหลดข้อมูลบัญชี...</p>
          ) : null}
        </main>
      </div>

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}

function MenuSection({ title, items }: { title: string; items: AccountMenuItem[] }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[24px] font-extrabold leading-none text-[#374151]">{title}</h2>
      <div className="overflow-hidden rounded-[20px] border border-[#e3e4e7] bg-white">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 ${
                index !== items.length - 1 ? "border-b border-[#eceef2]" : ""
              }`}
            >
              <div className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[#eef3ff] text-[#2f6ef4]">
                <Icon className="h-7 w-7" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[22px] font-bold leading-tight text-[#111827]">
                  {item.title}
                </p>
                <p className="mt-0.5 truncate text-[15px] leading-snug text-[#6b7280]">
                  {item.subtitle}
                </p>
              </div>

              {item.badge ? (
                <span className="rounded-full bg-[#ff3b30] px-3 py-1 text-[16px] font-semibold leading-none text-white">
                  {item.badge}
                </span>
              ) : null}
              <ChevronRight className="h-6 w-6 text-[#9ca3af]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
