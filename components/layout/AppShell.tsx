"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useLicenseStore, useAppStore } from "@/lib/store";
import { mountSyncListener, syncAll } from "@/lib/sync";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",           label: "Dashboard",  icon: LayoutDashboard },
  { href: "/pos",        label: "Satış",      icon: ShoppingCart },
  { href: "/inventory",  label: "Stok",       icon: Package },
  { href: "/customers",  label: "Cariler",    icon: Users },
  { href: "/settings",   label: "Ayarlar",    icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isActivated, shopName } = useLicenseStore();
  const { isOnline, syncStatus } = useAppStore();

  useEffect(() => {
    mountSyncListener();
  }, []);

  useEffect(() => {
    if (!isActivated && !pathname.startsWith("/welcome") && !pathname.startsWith("/admin")) {
      router.replace("/welcome");
    }
  }, [isActivated, pathname, router]);

  const isPublicRoute = pathname.startsWith("/welcome") || pathname.startsWith("/admin");
  if (isPublicRoute) return <>{children}</>;

  return (
    <div className="flex min-h-screen md:h-screen flex-col md:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-[220px] md:flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800/60 flex flex-col">
        {/* Logo */}
        <div className="px-4 pt-4 pb-3 md:px-5 md:pt-6 md:pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              📦
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">Depocu</p>
              <p className="text-xs text-slate-400 truncate max-w-[130px]">{shopName}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 md:pb-0 flex gap-2 overflow-x-auto md:block md:space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  active
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Status Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => syncAll()}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
              isOnline
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
            )}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? "Çevrimiçi" : "Çevrimdışı"}</span>
            {syncStatus === "syncing" && <RefreshCw className="w-3 h-3 ml-auto animate-spin" />}
            {syncStatus === "success" && <span className="ml-auto">✓</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-0 md:min-w-0 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
