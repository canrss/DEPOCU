"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  sub?: string;
  trend?: number; // percentage
  icon?: React.ReactNode;
  accent?: "blue" | "green" | "amber" | "red";
  delay?: number;
}

const accentMap = {
  blue:  { bg: "from-blue-500/10 to-blue-600/5",  icon: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
  green: { bg: "from-emerald-500/10 to-emerald-600/5", icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
  amber: { bg: "from-amber-500/10 to-amber-600/5", icon: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" },
  red:   { bg: "from-red-500/10 to-red-600/5",    icon: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" },
};

export function StatCard({ title, value, sub, trend, icon, accent = "blue", delay = 0 }: StatCardProps) {
  const colors = accentMap[accent];
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === undefined ? "" : trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-400" : "text-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative overflow-hidden bg-white/70 dark:bg-slate-900/70",
        "backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40",
        "shadow-xl p-6 flex flex-col gap-3 bg-gradient-to-br",
        colors.bg
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {icon && (
          <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center text-sm", colors.icon)}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>

      {TrendIcon && trend !== undefined && (
        <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span>{Math.abs(trend).toFixed(1)}% geçen aya göre</span>
        </div>
      )}
    </motion.div>
  );
}
