"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Package, Users, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { db } from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StockTrendChart } from "@/components/dashboard/StockTrendChart";
import type { RevenueDataPoint, StockTrendPoint, TopProduct, Sale, Product } from "@/types";

const fmt = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);

function buildRevenueData(sales: Sale[]): RevenueDataPoint[] {
  const map = new Map<string, { revenue: number; cost: number }>();
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  last30.forEach((d) => map.set(d, { revenue: 0, cost: 0 }));

  sales.forEach((s) => {
    const d = s.createdAt.slice(0, 10);
    if (!map.has(d)) return;
    const entry = map.get(d)!;
    entry.revenue += s.total;
    s.items.forEach((item) => { entry.cost += (item.unitPrice * 0.6) * item.quantity; }); // est cost
  });

  return last30.map((date) => {
    const { revenue, cost } = map.get(date)!;
    return {
      date: date.slice(5),
      revenue: Math.round(revenue),
      profit: Math.round(revenue - cost),
      cost: Math.round(cost),
    };
  });
}

async function buildStockTrend(products: Product[]): Promise<{ data: StockTrendPoint[]; topProducts: TopProduct[] }> {
  const sales = await db.sales.orderBy("createdAt").reverse().limit(200).toArray();
  const productSales = new Map<string, { name: string; sold: number }>();

  sales.forEach((s) => {
    s.items.forEach((item) => {
      const e = productSales.get(item.productId) ?? { name: item.productName, sold: 0 };
      e.sold += item.quantity;
      productSales.set(item.productId, e);
    });
  });

  const topProducts: TopProduct[] = [...productSales.entries()]
    .sort((a, b) => b[1].sold - a[1].sold)
    .slice(0, 5)
    .map(([productId, { name, sold }]) => {
      const p = products.find((x) => x.id === productId);
      return { productId, productName: name, totalSold: sold, stockRemaining: p?.stock ?? 0 };
    });

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  // Simulate decreasing stock trend data
  const data: StockTrendPoint[] = last14.map((date, idx) => {
    const point: StockTrendPoint = { date: date.slice(5) };
    topProducts.forEach((tp) => {
      const decayFactor = (13 - idx) * (tp.totalSold / 200);
      point[tp.productName] = Math.max(0, Math.round(tp.stockRemaining + decayFactor));
    });
    return point;
  });

  return { data, topProducts };
}

export default function Dashboard() {
  const { isOnline, syncStatus } = useAppStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [stockData, setStockData] = useState<StockTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([
        db.sales.orderBy("createdAt").reverse().toArray(),
        db.products.toArray(),
      ]);
      setSales(s);
      setProducts(p);
      setRevenueData(buildRevenueData(s));
      const { data, topProducts } = await buildStockTrend(p);
      setStockData(data);
      setTopProducts(topProducts);
    })();
  }, []);

  const todaySales = sales.filter((s) => s.createdAt.startsWith(new Date().toISOString().slice(0, 10)));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const monthSales = sales.filter((s) => s.createdAt.startsWith(new Date().toISOString().slice(0, 7)));
  const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Depocu
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isOnline
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? "Çevrimiçi" : "Çevrimdışı"}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Bugünkü Ciro" value={fmt(todayRevenue)} sub={`${todaySales.length} satış`}
          icon={<ShoppingCart className="w-4 h-4" />} accent="blue" delay={0} />
        <StatCard title="Aylık Ciro" value={fmt(monthRevenue)} sub={`${monthSales.length} satış`}
          icon={<TrendingUp className="w-4 h-4" />} accent="green" delay={0.06} />
        <StatCard title="Toplam Ürün" value={String(products.length)} sub={`${lowStock} kritik stok`}
          icon={<Package className="w-4 h-4" />} accent={lowStock > 0 ? "red" : "amber"} delay={0.12} />
        <StatCard title="Toplam Müşteri" value="—" sub="Cari takip"
          icon={<Users className="w-4 h-4" />} accent="amber" delay={0.18} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />
        <StockTrendChart data={stockData} products={topProducts} />
      </div>

      {/* Critical Stock Alert */}
      {lowStock > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-xl rounded-3xl border border-red-200/50 dark:border-red-800/30 p-5"
        >
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">
            ⚠ Kritik Stok — {lowStock} ürün minimum seviyenin altında
          </p>
          <div className="flex flex-wrap gap-2">
            {products.filter((p) => p.stock <= p.minStock).map((p) => (
              <span key={p.id} className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs rounded-full font-medium">
                {p.name} — {p.stock} {p.unit}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
