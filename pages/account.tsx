import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import useTranslation from "next-translate/useTranslation";
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
  const { t, lang } = useTranslation("common");
  const locale = lang === "en" ? "en" : "th";
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string>(t("account.defaultUser"));
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
          fetch(`/api/orders?locale=${locale}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/auth/favorites", {
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
          ? ((await wishlistRes.json()) as { favorites?: unknown[] })
          : { favorites: [] };

        const orders = Array.isArray(ordersJson.orders)
          ? ordersJson.orders
          : [];
        const activeOrders = orders.filter((item) => {
          const key = item.status?.toUpperCase();
          return key !== "COMPLETED" && key !== "CANCELLED";
        });

        setName(profileJson.user?.name ?? t("account.defaultUser"));
        setEmail(profileJson.user?.email ?? "-");
        setOrderCount(orders.length);
        setActiveOrderCount(activeOrders.length);
        setWishlistCount(
          Array.isArray(wishlistJson.favorites)
            ? wishlistJson.favorites.length
            : 0,
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [locale, router, token, t]);

  const orderMenu = useMemo<AccountMenuItem[]>(
    () => [
      {
        href: "/orders",
        icon: Box,
        title: t("account.myOrders"),
        subtitle: t("account.myOrdersDesc"),
        badge: activeOrderCount > 0 ? activeOrderCount : undefined,
      },
      {
        href: "/wishlist",
        icon: Heart,
        title: t("account.wishlist"),
        subtitle: t("account.wishlistDesc"),
      },
    ],
    [activeOrderCount, t],
  );

  const accountMenu = useMemo<AccountMenuItem[]>(
    () => [
      {
        href: "/account/addresses/select",
        icon: MapPin,
        title: t("account.shippingAddress"),
        subtitle: t("account.shippingAddressDesc"),
      },
      {
        href: "/account/settings/payment",
        icon: CreditCard,
        title: t("account.paymentMethods"),
        subtitle: t("account.paymentMethodsDesc"),
      },
      {
        href: "/account/profile",
        icon: Settings,
        title: t("account.editProfile"),
        subtitle: t("account.editProfileDesc"),
      },
    ],
    [t],
  );

  const supportMenu = useMemo<AccountMenuItem[]>(
    () => [
      {
        href: "/contact",
        icon: Phone,
        title: t("account.contactUs"),
        subtitle: t("account.contactUsDesc"),
      },
      {
        href: "/qa",
        icon: CircleHelp,
        title: t("account.help"),
        subtitle: t("account.helpDesc"),
      },
    ],
    [t],
  );

  return (
    <div className="min-h-screen desktop-page overflow-x-hidden bg-[#f3f3f4] text-[#111827]">
      <div className="app-page-container-narrow pb-[110px] md:pb-12 desktop-shell">
        <section className="relative bg-gradient-to-br from-[#2f6ef4] to-[#4e8cff] px-4 md:px-6 pb-8 md:pb-10 pt-6 md:pt-8 text-white">
          <h1 className="text-[34px] md:text-[38px] font-extrabold leading-none tracking-tight">
            {t("account.title")}
          </h1>

          <div className="mt-6 flex items-center gap-4 md:gap-5">
            <div className="flex h-[110px] w-[110px] md:h-[120px] md:w-[120px] items-center justify-center rounded-full bg-white/16">
              <UserRound
                className="h-14 w-14 md:h-16 md:w-16 text-white"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[27px] md:text-[30px] font-bold leading-tight">
                {name}
              </p>
              <p className="truncate text-[17px] md:text-[18px] text-white/90">
                {email}
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-2 px-4 md:px-6">
          <div className="rounded-[24px] border border-[#d8d8d8] bg-white p-4 md:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
              <div>
                <p className="text-[30px] md:text-[34px] font-extrabold leading-tight text-[#2f6ef4]">
                  {orderCount}
                </p>
                <p className="mt-1 text-[16px] md:text-[17px] leading-tight text-[#4b5563]">
                  {t("account.ordersCount")}
                </p>
              </div>
              <div>
                <p className="text-[30px] font-extrabold leading-tight text-[#2f6ef4]">
                  {wishlistCount}
                </p>
                <p className="mt-1 text-[16px] leading-tight text-[#4b5563]">
                  {t("account.wishlistCount")}
                </p>
              </div>
              <div>
                <p className="text-[30px] font-extrabold leading-tight text-[#f59e0b]">
                  {activeOrderCount}
                </p>
                <p className="mt-1 text-[16px] leading-tight text-[#4b5563]">
                  {t("account.processingCount")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <main className="space-y-4 px-4 pt-5">
          <MenuSection title={t("account.orderSection")} items={orderMenu} />
          <MenuSection
            title={t("account.accountSection")}
            items={accountMenu}
          />
          <MenuSection title={t("account.otherSection")} items={supportMenu} />

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-[20px] border border-[#f7d2d4] bg-white px-4 py-4"
          >
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-[#fff1f1] text-[#ef4444]">
              <LogOut className="h-8 w-8" />
            </div>
            <span className="text-[24px] font-bold leading-tight text-[#ef4444]">
              {t("logout")}
            </span>
          </button>

          {loading ? (
            <p className="text-center text-[16px] text-[#6b7280]">
              {t("account.loading")}
            </p>
          ) : null}
        </main>
      </div>

      <MobileShopBottomNav activePath="/account" />
    </div>
  );
}

function MenuSection({
  title,
  items,
}: {
  title: string;
  items: AccountMenuItem[];
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[24px] font-extrabold leading-none text-[#374151]">
        {title}
      </h2>
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
