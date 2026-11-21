// ============================================================
// BottomNavigation.tsx — Compact Elevated Floating Navigation Dock
// ============================================================

import {
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: "الإيرادات", url: "/revenues", icon: TrendingUp },
  { title: "المصروفات", url: "/expenses", icon: TrendingDown },
  { title: "الرئيسية", url: "/", icon: LayoutGrid },
  { title: "العملاء", url: "/clients", icon: Users },
  { title: "الإعدادات", url: "/settings", icon: SettingsIcon },
];

export function BottomNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <nav
      className="fixed bottom-2.5 left-3 right-3 max-w-lg md:max-w-2xl mx-auto z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-2xl sm:rounded-3xl select-none transition-all duration-300"
      dir="rtl"
      aria-label="القائمة السفلية"
    >
      <div className="flex items-center justify-around h-[54px] px-1 relative">
        {navItems.map((item) => {
          const active = isActive(item.url);
          const Icon = item.icon;

          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "group flex flex-col items-center justify-center flex-1 h-full relative",
                "transition-transform duration-150 active:scale-95 focus-visible:outline-none"
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Elevated circular/rounded icon for active item, flush icon for inactive */}
              {active ? (
                <div className="relative -mt-4 sm:-mt-5 flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full sm:rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/40 border-[2.5px] border-white dark:border-slate-900 transition-all duration-300 ease-out z-10 animate-in zoom-in-95 duration-200">
                  <Icon className="h-5 w-5 stroke-[2.2] text-white" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-6 text-slate-400 dark:text-slate-500 group-hover:text-foreground transition-colors">
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>
              )}

              {/* Label: Blue when active, gray when inactive */}
              <span
                className={cn(
                  "mt-0.5 tracking-tight text-center leading-none transition-all duration-200",
                  active
                    ? "text-[10.5px] sm:text-[11px] font-extrabold text-blue-600 dark:text-blue-400"
                    : "text-[10px] sm:text-[10.5px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-foreground"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}