import { GetServerSideProps } from "next";
import type { Prisma } from "@prisma/client";
import useTranslation from "next-translate/useTranslation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Cookies from "js-cookie";
import Layout from "@/components/Layout";
import MobileHeader from "@/components/MobileHeader";
import Banner, { BannerSlide } from "@/components/Banner";
import CouponBanner from "@/components/CouponBanner";
import CategoryCarousel from "@/components/CategoryCarousel";
import SubBannerCarousel from "@/components/SubBannerCarousel";
import PopularProducts from "@/components/PopularProducts";
import ProductCard from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { mapToProduct } from "@/lib/productMapping";
import { Category, Product } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  PackageCheck,
  PhoneCall,
  UserRound,
} from "lucide-react";

interface HomeProps {
  banners: BannerSlide[];
  subBanners: BannerSlide[];
  featured: Product[];
  onSale: Product[];
  bestSellers: Product[];
  categories: Category[];
  flashEndAt: string;
  serverNowTs: number;
}

type PaymentMethodId = "credit_card" | "bank_transfer" | "cod";

type ShortcutStats = {
  addressCount: number | null;
  profileName: string | null;
  toReceiveCount: number | null;
  preferredPaymentMethod: PaymentMethodId | null;
  faqCount: number | null;
};

type OrdersApiItem = {
  status?: string;
};

function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return value === "credit_card" || value === "bank_transfer" || value === "cod";
}

type ShelfProps = {
  title: string;
  href: string;
  products: Product[];
  viewAllLabel: string;
  showBadge?: "sale" | "new";
  palette: string[];
  icon?: React.ReactNode;
};

function ProductShelf({
  title,
  href,
  products,
  viewAllLabel,
  showBadge,
  palette,
  icon,
}: ShelfProps) {
  return (
    <section className="mb-8 md:mb-10 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-100 p-4 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {title}
          </h2>
          {icon}
        </div>
        <Link
          href={href}
          className="text-sm text-teal-700 hover:underline font-medium"
        >
          {viewAllLabel}
        </Link>
      </div>

      <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-2">
        {products.slice(0, 10).map((product, idx) => (
          <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
            <ProductCard
              product={product}
              backgroundColor={palette[idx % palette.length]}
              showBadge={showBadge ?? null}
              salePercent={25 + idx * 5}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function getReadableBannerText(value?: string | null) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (/^\d+$/.test(text)) return "";
  if (text.length <= 1) return "";
  return text;
}

export default function HomePage({
  banners,
  subBanners,
  featured,
  onSale,
  bestSellers,
  categories,
  flashEndAt,
  serverNowTs,
}: HomeProps) {
  const { t, lang } = useTranslation("common");
  const { token, user } = useAuth();
  const locale: "th" | "en" = lang === "en" ? "en" : "th";
  const [nowTs, setNowTs] = useState<number>(serverNowTs);
  const [desktopHeroIndex, setDesktopHeroIndex] = useState(0);
  const [shortcutStats, setShortcutStats] = useState<ShortcutStats>({
    addressCount: null,
    profileName: null,
    toReceiveCount: null,
    preferredPaymentMethod: null,
    faqCount: null,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const endAtMs = useMemo(() => {
    const parsed = new Date(flashEndAt).getTime();
    return Number.isFinite(parsed) ? parsed : Date.now();
  }, [flashEndAt]);

  const remainingMs = Math.max(endAtMs - nowTs, 0);
  const hours = Math.min(Math.floor(remainingMs / 3_600_000), 99);
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
  const seconds = Math.floor((remainingMs % 60_000) / 1_000);
  const commonSectionClass = "px-4 md:px-6 lg:px-8 mb-6 md:mb-8";
  const actionLinkClass =
    "px-4 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-md";
  const productGridClass =
    "flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-2";
  const heroSlides = useMemo(() => {
    if (banners.length > 0) return banners;
    return [{ title: t("home.defaultBanner"), sub: "", img: "/images/placeholder.png" }];
  }, [banners]);
  const promoSlides = useMemo(() => {
    if (subBanners.length > 0) return subBanners;
    return heroSlides;
  }, [subBanners, heroSlides]);
  const desktopHero = heroSlides[desktopHeroIndex] ?? heroSlides[0];
  const desktopPromoTop =
    promoSlides[desktopHeroIndex % promoSlides.length] ?? promoSlides[0];
  const desktopPromoBottom =
    promoSlides[(desktopHeroIndex + 1) % promoSlides.length] ?? promoSlides[0];
  const desktopHeroTitle = getReadableBannerText(desktopHero.title);
  const desktopHeroSub = getReadableBannerText(desktopHero.sub);
  const desktopHighlightItems = [
    {
      label: t("settings.shippingAddress"),
      icon: MapPin,
      href: "/account/addresses/select",
      subtitle:
        shortcutStats.addressCount === null
          ? t("account.shippingAddressDesc")
          : `${shortcutStats.addressCount} ${t("common.items")}`,
    },
    {
      label: t("settings.profile"),
      icon: UserRound,
      href: "/account/settings/profile",
      subtitle: shortcutStats.profileName ?? t("account.editProfileDesc"),
    },
    {
      label: t("ordersPage.tabReceive"),
      icon: PackageCheck,
      href: "/orders?tab=TO_RECEIVE",
      subtitle:
        shortcutStats.toReceiveCount === null
          ? t("ordersPage.trackPackage")
          : `${shortcutStats.toReceiveCount} ${t("common.items")}`,
    },
    {
      label: t("settings.paymentMethods"),
      icon: CreditCard,
      href: "/account/settings/payment",
      subtitle: shortcutStats.preferredPaymentMethod
        ? shortcutStats.preferredPaymentMethod === "bank_transfer"
          ? t("checkout.payBank")
          : shortcutStats.preferredPaymentMethod === "cod"
            ? t("checkout.payCod")
            : t("checkout.payCard")
        : t("account.paymentMethodsDesc"),
    },
    {
      label: t("account.contactUs"),
      icon: PhoneCall,
      href: "/contact",
      subtitle:
        shortcutStats.faqCount === null
          ? t("account.contactUsDesc")
          : `FAQ ${shortcutStats.faqCount} ${t("common.items")}`,
    },
  ];
  const desktopQuickLinks = [
    { label: t("home.flashSaleChip"), href: "/sale" },
    { label: t("home.freeShipCode"), href: "/coupons" },
    { label: t("home.todayDeal"), href: "/all-products?discount=1" },
    { label: t("home.newItems"), href: "/new" },
  ];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setDesktopHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4600);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    setDesktopHeroIndex((prev) => (prev >= heroSlides.length ? 0 : prev));
  }, [heroSlides.length]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadShortcutStats = async () => {
      const authToken = token ?? Cookies.get("token") ?? "";
      const authHeaders = authToken
        ? { Authorization: `Bearer ${authToken}` }
        : undefined;

      const safeJson = async <T,>(req: Promise<Response>) => {
        try {
          const res = await req;
          if (!res.ok) return null;
          return (await res.json()) as T;
        } catch {
          return null;
        }
      };

      const [faqData, profileData, addressData, orderData, paymentData] =
        await Promise.all([
          safeJson<{ faqs?: Array<unknown> }>(
            fetch(`/api/faqs?locale=${locale}`, { signal: controller.signal }),
          ),
          authHeaders
            ? safeJson<{ user?: { name?: string | null } }>(
                fetch("/api/auth/profile", {
                  headers: authHeaders,
                  signal: controller.signal,
                }),
              )
            : Promise.resolve(null),
          authHeaders
            ? safeJson<{ addresses?: Array<unknown> }>(
                fetch("/api/addresses", {
                  headers: authHeaders,
                  signal: controller.signal,
                }),
              )
            : Promise.resolve(null),
          authHeaders
            ? safeJson<{ orders?: OrdersApiItem[] }>(
                fetch(`/api/orders?locale=${locale}`, {
                  headers: authHeaders,
                  signal: controller.signal,
                }),
              )
            : Promise.resolve(null),
          authHeaders
            ? safeJson<{ preferredMethod?: PaymentMethodId }>(
                fetch("/api/payments/methods", {
                  headers: authHeaders,
                  signal: controller.signal,
                }),
              )
            : Promise.resolve(null),
        ]);

      if (cancelled) return;

      const ordersPayload = orderData?.orders;
      const orders = Array.isArray(ordersPayload) ? ordersPayload : [];
      const addressItems = addressData?.addresses;
      const preferredPaymentMethod = paymentData?.preferredMethod;
      const faqItems = faqData?.faqs;
      const toReceiveCount = authHeaders
        ? orders.filter((item) => String(item.status).toUpperCase() === "SHIPPED")
            .length
        : null;

      setShortcutStats({
        addressCount: authHeaders
          ? Array.isArray(addressItems)
            ? addressItems.length
            : 0
          : null,
        profileName:
          profileData?.user?.name?.trim() || user?.name?.trim() || null,
        toReceiveCount,
        preferredPaymentMethod: isPaymentMethodId(preferredPaymentMethod)
          ? preferredPaymentMethod
          : null,
        faqCount: Array.isArray(faqItems) ? faqItems.length : null,
      });
    };

    loadShortcutStats();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locale, token, user?.name]);

  const flashColors = [
    "bg-gradient-to-br from-orange-400 to-orange-500",
    "bg-gradient-to-br from-yellow-400 to-yellow-500",
    "bg-gradient-to-br from-pink-400 to-pink-500",
    "bg-gradient-to-br from-blue-400 to-blue-500",
    "bg-gradient-to-br from-purple-400 to-purple-500",
  ];
  const homeSections = [
    {
      title: t("newArrivals"),
      href: "/new",
      products: featured,
      colors: [
        "bg-gradient-to-br from-cyan-400 to-cyan-500",
        "bg-gradient-to-br from-red-400 to-red-500",
        "bg-gradient-to-br from-blue-400 to-blue-500",
        "bg-gradient-to-br from-green-400 to-green-500",
        "bg-gradient-to-br from-indigo-400 to-indigo-500",
      ],
      badge: "new" as const,
      wrapperClass: commonSectionClass,
    },
    {
      title: t("recommended"),
      href: "/recommended",
      products: featured,
      colors: [
        "bg-gradient-to-br from-teal-400 to-teal-500",
        "bg-gradient-to-br from-amber-400 to-amber-500",
        "bg-gradient-to-br from-rose-400 to-rose-500",
        "bg-gradient-to-br from-violet-400 to-violet-500",
        "bg-gradient-to-br from-lime-400 to-lime-500",
      ],
      badge: null,
      wrapperClass: commonSectionClass,
    },
    {
      title: t("home.highPopularity"),
      href: "/popular",
      products: bestSellers,
      colors: [
        "bg-gradient-to-br from-fuchsia-400 to-fuchsia-500",
        "bg-gradient-to-br from-sky-400 to-sky-500",
        "bg-gradient-to-br from-emerald-400 to-emerald-500",
        "bg-gradient-to-br from-orange-400 to-orange-500",
        "bg-gradient-to-br from-pink-400 to-pink-500",
      ],
      badge: null,
      wrapperClass: "px-4 md:px-6 lg:px-8 mb-20 md:mb-8",
    },
  ];

  const format2 = (value: number) =>
    String(Math.max(0, value)).padStart(2, "0");

  return (
    <Layout title={t("siteTitle")}>
      {/* Mobile Header - Only on Mobile */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      <div className="app-page-container pt-4 md:pb-8 md:pt-10">
        {/* Desktop Hero */}
        <section className="hidden md:block px-4 md:px-6 lg:px-8 mb-8">
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-[30px] font-extrabold leading-tight text-[#0f172a]">
                  {t("home.recommendedForYou")}
                </h2>
                <p className="text-[16px] text-[#64748b]">
                  {t("home.dailyDeals")}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-[14px]">
                {desktopQuickLinks.map((chip) => (
                    <Link
                      key={`${chip.label}-${chip.href}`}
                      href={chip.href}
                      className="rounded-lg bg-[#eef4ff] px-3 py-1 font-semibold text-[#2563eb] transition-all duration-300 hover:bg-[#dce9ff] hover:scale-105 hover:shadow-md"
                    >
                      {chip.label}
                    </Link>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <article className="relative col-span-8 h-[332px] overflow-hidden rounded-2xl bg-[#f1f5f9]">
                <Image
                  src={desktopHero.img}
                  alt={desktopHeroTitle || "banner"}
                  fill
                  sizes="(min-width: 1024px) 62vw, 100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/15 to-transparent" />
                {desktopHeroTitle || desktopHeroSub ? (
                  <div className="absolute left-5 top-5 max-w-[72%] text-white">
                    {desktopHeroTitle ? (
                      <h3 className="text-[30px] font-extrabold leading-tight drop-shadow-sm">
                        {desktopHeroTitle}
                      </h3>
                    ) : null}
                    {desktopHeroSub ? (
                      <p className="mt-1 text-[17px] text-white/95">
                        {desktopHeroSub}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() =>
                    setDesktopHeroIndex(
                      (prev) =>
                        (prev - 1 + heroSlides.length) % heroSlides.length,
                    )
                  }
                  aria-label={t("common.prev")}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-white/88 text-[#1f2937] transition-all duration-300 hover:bg-white hover:scale-110 hover:shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDesktopHeroIndex(
                      (prev) => (prev + 1) % heroSlides.length,
                    )
                  }
                  aria-label={t("common.next")}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-white/88 text-[#1f2937] transition-all duration-300 hover:bg-white hover:scale-110 hover:shadow-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
                  {heroSlides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDesktopHeroIndex(i)}
                      aria-label={t("common.goToSlide", { n: i + 1 })}
                      className={`min-h-0 h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                        i === desktopHeroIndex
                          ? "bg-white ring-2 ring-white/55"
                          : "bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </article>

              <aside className="col-span-4 grid grid-rows-2 gap-3">
                {[desktopPromoTop, desktopPromoBottom].map((promo, idx) => {
                  const promoTitle = getReadableBannerText(promo.title);
                  return (
                    <article
                      key={`${promo.img}-${idx}`}
                      className="relative overflow-hidden rounded-2xl bg-[#f1f5f9]"
                    >
                      <Image
                        src={promo.img}
                        alt={promoTitle || `promo-${idx + 1}`}
                        fill
                        sizes="(min-width: 1024px) 30vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
                      {promoTitle ? (
                        <div className="absolute left-4 top-4 max-w-[80%] text-white">
                          <h4 className="text-[20px] font-bold leading-tight drop-shadow-sm">
                            {promoTitle}
                          </h4>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </aside>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
              {desktopHighlightItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex flex-col items-center rounded-xl px-2 py-2 transition-all duration-300 hover:bg-[#f8fafc] hover:-translate-y-0.5"
                  >
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg border border-[#d5dde9] bg-[#f8fbff] text-[#2563eb] transition-all duration-300 group-hover:scale-105 group-hover:border-[#2563eb]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-center text-[16px] font-semibold text-[#1f2937] transition-colors duration-300 group-hover:text-[#2563eb]">
                      {item.label}
                    </span>
                    <span className="mt-1 line-clamp-2 text-center text-[13px] text-[#64748b]">
                      {item.subtitle}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Banner - Mobile */}
        <div className="md:hidden">
          {banners && banners.length > 0 ? <Banner slides={banners} /> : null}
        </div>

        {/* Coupon Banner - Mobile */}
        <div className="md:hidden">
          <CouponBanner />
        </div>

        {/* Category Grid */}
        <section className={commonSectionClass}>
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              {t("home.categoryProducts")}
            </h2>
            <Link href="/categories" className={actionLinkClass}>
              {t("viewAllArrow")}
            </Link>
          </div>
          <CategoryCarousel categories={categories} />
        </section>

        {/* Sub Banner - แบนเนอร์โปรโมชั่น */}
        {subBanners && subBanners.length > 0 ? (
          <section className="px-4 md:px-6 lg:px-8 mb-6 md:mb-8 md:hidden">
            <SubBannerCarousel slides={subBanners} />
          </section>
        ) : null}

        {/* สินค้ายอดนิยม - Popular Products */}
        <section className={commonSectionClass}>
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              {t("home.popularProducts")}
            </h2>
          </div>
          <PopularProducts products={bestSellers} />
        </section>

        {/* Flash Sale */}
        <section className={commonSectionClass}>
          {/* Desktop Flash Sale Banner */}
          <div className="hidden md:block mb-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-red-600 p-6 shadow-2xl">
              {/* Animated Background Decorations */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

              <div className="relative z-10 flex items-center justify-between">
                {/* Left Side - Title & Timer */}
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg">
                      ⚡ Flash Sale
                    </h2>
                    <p className="text-white/90 text-base font-semibold mb-3">
                      {t("flash.discountUpTo")}
                    </p>

                    {/* Countdown Timer */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-white animate-pulse" />
                      <div className="flex items-center gap-2">
                        <div className="bg-white rounded-xl px-3 py-2 shadow-lg min-w-[60px] text-center">
                          <div className="text-2xl font-black text-red-600">{format2(hours)}</div>
                          <div className="text-xs font-bold text-gray-600 mt-1">{t("flash.hours")}</div>
                        </div>
                        <span className="text-xl font-bold text-white">:</span>
                        <div className="bg-white rounded-xl px-3 py-2 shadow-lg min-w-[60px] text-center">
                          <div className="text-2xl font-black text-red-600">{format2(minutes)}</div>
                          <div className="text-xs font-bold text-gray-600 mt-1">{t("flash.minutes")}</div>
                        </div>
                        <span className="text-xl font-bold text-white">:</span>
                        <div className="bg-white rounded-xl px-3 py-2 shadow-lg min-w-[60px] text-center">
                          <div className="text-2xl font-black text-red-600">{format2(seconds)}</div>
                          <div className="text-xs font-bold text-gray-600 mt-1">{t("flash.seconds")}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - View All Button */}
                <Link
                  href="/sale"
                  className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-bold text-base rounded-lg hover:bg-red-50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  {t("viewAll")}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Flash Sale Header */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                Flash Sale
              </h2>
              <Clock className="w-4 h-4 text-red-500" />
              <div className="flex items-center gap-1 text-white text-xs font-bold">
                <span className="bg-black px-1.5 py-0.5 rounded">
                  {format2(hours)}
                </span>
                <span className="bg-black px-1.5 py-0.5 rounded">
                  {format2(minutes)}
                </span>
                <span className="bg-black px-1.5 py-0.5 rounded">
                  {format2(seconds)}
                </span>
              </div>
            </div>
            <Link href="/sale" className={actionLinkClass}>
              {t("viewAllArrow")}
            </Link>
          </div>

          {/* Flash Sale Products - Responsive Grid */}
          <div className={productGridClass}>
            {onSale.slice(0, 10).map((product, idx) => (
              <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
                <ProductCard
                  product={product}
                  backgroundColor={flashColors[idx % flashColors.length]}
                  showBadge="sale"
                  salePercent={25 + idx * 5}
                />
              </div>
            ))}
          </div>
        </section>

        {homeSections.map((section) => (
          <section key={section.title} className={section.wrapperClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
                {section.title}
              </h2>
              <Link href={section.href} className={actionLinkClass}>
                {t("viewAllArrow")}
              </Link>
            </div>

            <div className={productGridClass}>
              {section.products.slice(0, 10).map((product, idx) => (
                <div key={product.id} className="flex-shrink-0 w-40 md:w-auto">
                  <ProductCard
                    product={product}
                    backgroundColor={
                      section.colors[idx % section.colors.length]
                    }
                    showBadge={section.badge}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async ({
  locale,
}) => {
  const lang = locale ?? "th";

  const rawHero = await prisma.bannerLocale.findMany({
    where: {
      locale: lang,
      banner: {
        isNot: {
          position: "sub",
        },
      },
    },
    include: { banner: true },
    orderBy: { banner: { order: "asc" } },
  });

  const banners: BannerSlide[] = rawHero.map(({ title, sub, banner }) => ({
    title: title ?? "",
    sub: sub ?? "",
    img: banner.imageUrl,
  }));

  const rawPromo = await prisma.bannerLocale.findMany({
    where: { locale: lang, banner: { position: "sub" } },
    include: { banner: true },
    orderBy: { banner: { order: "asc" } },
  });

  const subBanners: BannerSlide[] = rawPromo.map(({ title, sub, banner }) => ({
    title: title ?? "",
    sub: sub ?? "",
    img: banner.imageUrl,
  }));

  // helper: fetch localized products
  async function getProducts(where: Prisma.ProductWhereInput, take?: number) {
    const raw = await prisma.product.findMany({
      where,
      take,
      orderBy: { updatedAt: "desc" },
      include: { translations: { where: { locale: lang }, take: 1 } },
    });
    return raw.map((item) => mapToProduct(item, lang));
  }

  const featured = await getProducts({ isFeatured: true }, 10);
  const onSale = await getProducts({ salePrice: { not: null } }, 10);

  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 8,
  });
  const bestSellerIds = top.map((item) => item.productId);
  const bestSellersRaw = await prisma.product.findMany({
    where: { id: { in: bestSellerIds } },
    include: { translations: { where: { locale: lang }, take: 1 } },
  });
  const bestById = new Map(bestSellersRaw.map((item) => [item.id, item]));
  const bestSellers: Product[] = bestSellerIds
    .map((id) => bestById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => mapToProduct(item, lang));

  const rawCats = await prisma.categoryLocale.findMany({
    where: { locale: lang },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const categories: Category[] = await Promise.all(
    rawCats.map(async ({ category, name }) => {
      // นับจำนวนสินค้าในแต่ละหมวดหมู่
      const [productCount, coverProduct] = await Promise.all([
        prisma.product.count({
          where: { categoryId: category.id },
        }),
        prisma.product.findFirst({
          where: { categoryId: category.id, imageUrl: { not: null } },
          orderBy: { updatedAt: "desc" },
          select: { imageUrl: true },
        }),
      ]);

      return {
        id: category.id,
        name,
        productCount,
        imageUrl: coverProduct?.imageUrl ?? null,
      };
    }),
  );

  const now = new Date();
  const configuredEnd = process.env.FLASH_SALE_END_AT;
  let flashEndDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  if (configuredEnd) {
    const parsed = new Date(configuredEnd);
    if (!Number.isNaN(parsed.getTime())) {
      flashEndDate = parsed;
    }
  }

  return {
    props: {
      banners,
      subBanners,
      featured,
      onSale,
      bestSellers,
      categories,
      flashEndAt: flashEndDate.toISOString(),
      serverNowTs: now.getTime(),
    },
  };
};
