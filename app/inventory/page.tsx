"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, AlertTriangle, Download, Package } from "lucide-react";
import { db, generateId, now } from "@/lib/db";
import { useLicenseStore } from "@/lib/store";
import { exportProductsToExcel } from "@/lib/export";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

const emptyProduct = (): Partial<Product> => ({
  name: "", barcode: "", category: "", unit: "adet",
  costPrice: 0, masterPrice: 0, retailPrice: 0,
  stock: 0, minStock: 5, vatRate: 20,
});

export default function InventoryPage() {
  const { shopName } = useLicenseStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(emptyProduct());
  const [editId, setEditId] = useState<string | null>(null);

  const load = async () => setProducts(await db.products.orderBy("name").toArray());
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode?.includes(query)
  );

  async function saveProduct() {
    if (!editing.name?.trim()) return;
    if (editId) {
      await db.products.update(editId, { ...editing, updatedAt: now(), synced: false });
    } else {
      await db.products.add({ ...emptyProduct(), ...editing, id: generateId(), createdAt: now(), updatedAt: now(), synced: false } as Product);
    }
    setShowForm(false);
    setEditing(emptyProduct());
    setEditId(null);
    load();
  }

  async function deleteProduct(id: string) {
    if (!confirm("Bu ürünü silmek istiyor musunuz?")) return;
    await db.products.delete(id);
    load();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stok Yönetimi</h1>
            <p className="text-sm text-slate-400 mt-0.5">{products.length} ürün</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportProductsToExcel(products, shopName)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-white transition-all"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => { setEditing(emptyProduct()); setEditId(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:bg-blue-600 transition-all"
            >
              <Plus className="w-4 h-4" /> Ürün Ekle
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün veya barkod ara..."
            className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/60 dark:border-slate-700/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* Table */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {["Ürün", "Kategori", "Stok", "Maliyet", "Usta", "Perakende", "KDV", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {p.stock <= p.minStock && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{p.name}</p>
                          {p.barcode && <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{p.category ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "font-bold",
                        p.stock <= p.minStock ? "text-red-500" : p.stock <= p.minStock * 2 ? "text-amber-500" : "text-slate-700 dark:text-slate-200"
                      )}>
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{fmt(p.costPrice)}</td>
                    <td className="px-5 py-3.5 text-emerald-600 dark:text-emerald-400 font-medium">{fmt(p.masterPrice)}</td>
                    <td className="px-5 py-3.5 text-blue-600 dark:text-blue-400 font-bold">{fmt(p.retailPrice)}</td>
                    <td className="px-5 py-3.5 text-slate-400">%{p.vatRate}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditing(p); setEditId(p.id); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Ürün bulunamadı</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-7 space-y-5"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editId ? "Ürün Düzenle" : "Yeni Ürün"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Ürün Adı *", key: "name", span: true },
                { label: "Barkod", key: "barcode" },
                { label: "Kategori", key: "category" },
                { label: "Birim", key: "unit" },
                { label: "Maliyet (₺)", key: "costPrice", type: "number" },
                { label: "Usta Fiyat (₺)", key: "masterPrice", type: "number" },
                { label: "Perakende (₺)", key: "retailPrice", type: "number" },
                { label: "Stok", key: "stock", type: "number" },
                { label: "Min Stok", key: "minStock", type: "number" },
              ].map(({ label, key, type = "text", span }) => (
                <div key={key} className={span ? "col-span-2" : ""}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={type === "number"
                      ? ((editing as any)[key] ?? 0) === 0 ? "" : (editing as any)[key]
                      : (editing as any)[key] ?? ""}
                    onChange={(e) => setEditing({
                      ...editing,
                      [key]: type === "number"
                        ? e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                        : e.target.value,
                    })}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">KDV Oranı</label>
                <select
                  value={editing.vatRate ?? 20}
                  onChange={(e) => setEditing({ ...editing, vatRate: parseInt(e.target.value) as 0 | 10 | 20 })}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value={0}>%0</option>
                  <option value={10}>%10</option>
                  <option value={20}>%20</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-2xl text-sm hover:bg-slate-200 transition-colors">
                İptal
              </button>
              <button onClick={saveProduct}
                className="flex-[2] py-3 bg-blue-500 text-white font-bold rounded-2xl text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
                {editId ? "Güncelle" : "Kaydet"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
