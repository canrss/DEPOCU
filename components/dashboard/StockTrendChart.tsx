"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { motion } from "framer-motion";
import type { StockTrendPoint, TopProduct } from "@/types";

const COLORS = ["#3B82F6", "#34D399", "#F59E0B", "#F87171", "#A78BFA"];

interface Props {
  data: StockTrendPoint[];
  products: TopProduct[];
  criticalThreshold?: number;
}

function StockTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 text-sm space-y-1">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value} adet</span>
        </div>
      ))}
    </div>
  );
}

export function StockTrendChart({ data, products, criticalThreshold = 5 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-6"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Stok Azalım Trendi</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">En çok satan 5 ürün</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-500 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Kritik: ≤{criticalThreshold}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <Tooltip content={<StockTooltip />} />
          <Legend formatter={(v) => <span className="text-xs text-slate-500 truncate max-w-[80px]">{v}</span>} />
          <ReferenceLine
            y={criticalThreshold}
            stroke="#F87171"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{ value: "Kritik Eşik", position: "insideTopRight", fontSize: 10, fill: "#F87171" }}
          />
          {products.map((p, i) => (
            <Line
              key={p.productId}
              type="monotone"
              dataKey={p.productName}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
