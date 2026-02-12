import Link from "next/link";
import { Heart, House, Search, ShoppingCart, UserRound } from "lucide-react";

type MobileShopBottomNavProps = {
  activePath: string;
};

export default function MobileShopBottomNav({
  activePath,
}: MobileShopBottomNavProps) {
  const tabs = [
    { href: "/", label: "หน้าหลัก", icon: House },
    { href: "/wishlist", label: "ถูกใจ", icon: Heart },
    { href: "/all-products", label: "ค้นหา", icon: Search },
    { href: "/cart", label: "ตะกร้า", icon: ShoppingCart },
    { href: "/account", label: "บัญชี", icon: UserRound },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#cfcfd2] bg-[#f8f8f8] md:hidden">
      <div
        className="mx-auto grid h-[84px] w-full max-w-[440px] grid-cols-5 px-2"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activePath === tab.href;

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
    </nav>
  );
}
