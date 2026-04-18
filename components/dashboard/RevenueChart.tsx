"use client";
import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";
import type { RevenueDataPoint } from "@/types";

interface Props {
  data: RevenueDataPoint[];
}

const fmt = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 text-sm space-y-1">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name === "revenue" ? "Ciro" : "Net Kâr"}:</span>
          <span className="font-bold" style={{ color: p.color }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-4 sm:p-6"
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Ciro & Net Kâr</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Son 30 gün</p>
      </div>

      <div className="-mx-2 sm:mx-0">
        <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(v) => (
              <span className="text-xs text-slate-500">{v === "revenue" ? "Ciro" : "Net Kâr"}</span>
            )}
          />
          <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5}
            fill="url(#gradRevenue)" dot={false} activeDot={{ r: 5, fill: "#3B82F6" }} />
          <Area type="monotone" dataKey="profit" stroke="#34D399" strokeWidth={2.5}
            fill="url(#gradProfit)" dot={false} activeDot={{ r: 5, fill: "#34D399" }} />
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
