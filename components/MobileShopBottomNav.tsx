import Link from "next/link";
import { Heart, House, Package, ShoppingCart, UserRound } from "lucide-react";

type MobileShopBottomNavProps = {
  activePath: string;
};

function resolveActivePath(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0];

  if (cleanPath.startsWith("/wishlist")) return "/wishlist";
  if (
    cleanPath.startsWith("/cart") ||
    cleanPath.startsWith("/checkout") ||
    cleanPath.startsWith("/coupons")
  ) {
    return "/cart";
  }
  if (
    cleanPath.startsWith("/account") ||
    cleanPath.startsWith("/orders") ||
    cleanPath.startsWith("/contact") ||
    cleanPath.startsWith("/qa")
  ) {
    return "/account";
  }
  if (
    cleanPath.startsWith("/all-products") ||
    cleanPath.startsWith("/categories") ||
    cleanPath.startsWith("/products") ||
    cleanPath.startsWith("/sale") ||
    cleanPath.startsWith("/recommended") ||
    cleanPath.startsWith("/popular") ||
    cleanPath.startsWith("/new")
  ) {
    return "/all-products";
  }

  return "/";
}

export default function MobileShopBottomNav({
  activePath,
}: MobileShopBottomNavProps) {
  const resolvedActivePath = resolveActivePath(activePath);
  const tabs = [
    { href: "/", label: "หน้าหลัก", icon: House },
    { href: "/wishlist", label: "ถูกใจ", icon: Heart },
    { href: "/all-products", label: "สินค้า", icon: Package },
    { href: "/cart", label: "ตะกร้า", icon: ShoppingCart },
    { href: "/account", label: "บัญชี", icon: UserRound },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#cfcfd2] bg-[#f8f8f8] md:hidden">
      <div className="mx-auto w-full max-w-[440px]">
        <div
          className="grid h-[84px] grid-cols-5 px-2"
          style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = resolvedActivePath === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 ${
                isActive ? "text-[#2f6ef4]" : "text-[#6b7280]"
              }`}
            >
              <Icon
                  className={`h-8 w-8 ${isActive ? "" : "stroke-[1.9]"}`}
                  strokeWidth={isActive ? 2.3 : 2}
              />
                <span className="text-[14px] leading-none">{tab.label}</span>
            </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
