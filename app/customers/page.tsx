"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users, CreditCard, ChevronRight, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { db, generateId, now } from "@/lib/db";
import { useLicenseStore } from "@/lib/store";
import { exportCustomersToExcel } from "@/lib/export";
import type { Customer, Transaction } from "@/types";
import { cn } from "@/lib/utils";

const fmt = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

export default function CustomersPage() {
  const { shopName } = useLicenseStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payAmount, setPayAmount] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newType, setNewType] = useState<"customer" | "master">("customer");

  const load = async () => setCustomers(await db.customers.orderBy("name").toArray());
  useEffect(() => { load(); }, []);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const totalCredit = customers.reduce((sum, c) => c.balance < 0 ? sum + Math.abs(c.balance) : sum, 0);

  async function selectCustomer(c: Customer) {
    setSelected(c);
    const txs = await db.transactions.where("customerId").equals(c.id).reverse().sortBy("createdAt");
    setTransactions(txs);
  }

  async function addCustomer() {
    if (!newName.trim()) return;
    const customer: Customer = {
      id: generateId(), name: newName.trim(), phone: newPhone.trim() || undefined,
      balance: 0, type: newType, createdAt: now(), updatedAt: now(), synced: false,
    };
    await db.customers.add(customer);
    setShowNew(false); setNewName(""); setNewPhone("");
    load();
  }

  async function collectPayment() {
    const amount = parseFloat(payAmount);
    if (!selected || !amount || amount <= 0) return;
    await db.customers.update(selected.id, {
      balance: (selected.balance ?? 0) + amount, updatedAt: now(), synced: false,
    });
    await db.transactions.add({
      id: generateId(), customerId: selected.id, amount,
      type: "payment", description: `Tahsilat`, createdAt: now(), synced: false,
    });
    setPayAmount("");
    const updated = await db.customers.get(selected.id);
    if (updated) { setSelected(updated); load(); }
    const txs = await db.transactions.where("customerId").equals(selected.id).reverse().sortBy("createdAt");
    setTransactions(txs);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cari Hesaplar</h1>
            <p className="text-sm text-slate-400 mt-0.5">Toplam açık: {fmt(totalCredit)}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportCustomersToExcel(customers, shopName)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/25">
              <Plus className="w-4 h-4" /> Yeni Cari
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Customer List */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari ara..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/60 dark:border-slate-700/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            </div>

            <div className="space-y-2">
              {filtered.map((c, i) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => selectCustomer(c)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all",
                    selected?.id === c.id
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
                      : "bg-white/70 dark:bg-slate-900/70 backdrop-blur border-white/30 dark:border-slate-700/40 hover:bg-white dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold",
                      c.type === "master" ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" : "bg-blue-100 dark:bg-blue-900/40 text-blue-700"
                    )}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.type === "master" ? "Usta" : "Müşteri"}{c.phone ? ` · ${c.phone}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", c.balance < 0 ? "text-red-500" : c.balance > 0 ? "text-emerald-600" : "text-slate-400")}>
                        {fmt(Math.abs(c.balance))}
                      </p>
                      <p className="text-xs text-slate-400">{c.balance < 0 ? "Borçlu" : c.balance > 0 ? "Alacaklı" : "Denkleşmiş"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Customer Detail */}
          <div>
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Wallet Card */}
                <div className={cn(
                  "rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl",
                  selected.balance < 0
                    ? "bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/30"
                    : "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/30"
                )}>
                  <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-10 -translate-x-10" />
                  <div className="relative">
                    <p className="text-white/60 text-sm font-medium">{selected.type === "master" ? "Usta" : "Müşteri"}</p>
                    <p className="text-2xl font-bold mt-1">{selected.name}</p>
                    {selected.phone && <p className="text-white/60 text-sm mt-0.5">{selected.phone}</p>}
                    <div className="mt-6">
                      <p className="text-white/60 text-xs uppercase tracking-wider">Bakiye</p>
                      <p className="text-4xl font-bold mt-0.5">{fmt(Math.abs(selected.balance))}</p>
                      <p className="text-white/60 text-sm mt-1">
                        {selected.balance < 0 ? "Bize borçlu" : selected.balance > 0 ? "Bizde alacağı var" : "Hesap denkleşmiş"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-5">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tahsilat</p>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₺</span>
                      <input
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Tutar"
                        className="w-full pl-7 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                    <button onClick={collectPayment}
                      className="px-5 py-3 bg-emerald-500 text-white font-bold rounded-2xl text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">
                      Tahsil Et
                    </button>
                  </div>
                </div>

                {/* Transactions */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-5">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">İşlem Geçmişi</p>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-6">İşlem yok</p>
                    ) : transactions.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                          t.amount > 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                          {t.amount > 0
                            ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                            : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.description}</p>
                          <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleString("tr-TR")}</p>
                        </div>
                        <p className={cn("font-bold text-sm", t.amount > 0 ? "text-emerald-600" : "text-red-500")}>
                          {t.amount > 0 ? "+" : ""}{fmt(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Detay görmek için bir cari seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      <AnimatePresence>
        {showNew && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-7 space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Yeni Cari</h2>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {(["customer", "master"] as const).map((type) => (
                  <button key={type} onClick={() => setNewType(type)}
                    className={cn("py-2 text-sm font-semibold rounded-lg transition-all",
                      newType === type ? "bg-white dark:bg-slate-700 shadow text-blue-600" : "text-slate-500")}>
                    {type === "customer" ? "Müşteri" : "Usta"}
                  </button>
                ))}
              </div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ad Soyad *"
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Telefon (opsiyonel)"
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              <div className="flex gap-3">
                <button onClick={() => setShowNew(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-2xl text-sm">
                  İptal
                </button>
                <button onClick={addCustomer}
                  className="flex-[2] py-3 bg-blue-500 text-white font-bold rounded-2xl text-sm hover:bg-blue-600 shadow-lg shadow-blue-500/25">
                  Kaydet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
