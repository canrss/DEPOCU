"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, Trash2, Receipt, CreditCard, Banknote, Users } from "lucide-react";
import { db, generateId, now } from "@/lib/db";
import { useCartStore } from "@/lib/store";
import type { Product, VatType, PriceType, PaymentMethod, Customer } from "@/types";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

// ─── VAT Toggle Bar ───────────────────────────────────────────────────────────

function VATEngine() {
  const { vatType, vatRate, manualVat, useManualVat, setVatType, setVatRate, setManualVat, setUseManualVat } = useCartStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">KDV Modu</span>
        <button
          onClick={() => setUseManualVat(!useManualVat)}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium transition-all",
            useManualVat
              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          )}
        >
          Manuel KDV
        </button>
      </div>

      {/* VAT Type Selector */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
        {(["included", "excluded", "none"] as VatType[]).map((type) => (
          <button
            key={type}
            onClick={() => setVatType(type)}
            className={cn(
              "py-2 text-xs font-semibold rounded-xl transition-all",
              vatType === type
                ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {type === "included" ? "KDV Dahil" : type === "excluded" ? "KDV Hariç" : "KDV Yok"}
          </button>
        ))}
      </div>

      {/* VAT Rate Selector */}
      {vatType !== "none" && !useManualVat && (
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
          {([0, 10, 20] as const).map((rate) => (
            <button
              key={rate}
              onClick={() => setVatRate(rate)}
              className={cn(
                "py-2 text-xs font-bold rounded-xl transition-all",
                vatRate === rate
                  ? "bg-blue-500 shadow text-white"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              %{rate}
            </button>
          ))}
        </div>
      )}

      {/* Manual VAT Input */}
      {useManualVat && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
          <input
            type="number"
            min="0"
            value={manualVat || ""}
            onChange={(e) => setManualVat(parseFloat(e.target.value) || 0)}
            placeholder="Manuel KDV tutarı"
            className="w-full pl-7 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      )}
    </div>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartRow({ item, onRemove, onQty }: {
  item: ReturnType<typeof useCartStore.getState>["items"][0];
  onRemove: () => void;
  onQty: (q: number) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/40 dark:border-slate-700/40"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{item.productName}</p>
        <p className="text-xs text-slate-400">{fmt(item.unitPrice)} × {item.quantity}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onQty(item.quantity - 1)}
          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <Minus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
        </button>
        <span className="text-sm font-bold w-6 text-center text-slate-800 dark:text-white">{item.quantity}</span>
        <button onClick={() => onQty(item.quantity + 1)}
          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      <div className="text-right">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{fmt(item.unitPrice * item.quantity)}</p>
      </div>

      <button onClick={onRemove} className="p-1 text-slate-300 hover:text-red-400 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Product Search Panel ─────────────────────────────────────────────────────

function ProductSearch({ onAdd }: { onAdd: (p: Product, type: PriceType) => void }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (product: Product, type: PriceType = "retail") => {
    onAdd(product, type);
    setQuery("");
    setProducts([]);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (!query.trim()) { setProducts([]); return; }
    db.products
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode === query)
      .limit(8)
      .toArray()
      .then(setProducts);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ürün ara veya barkod gir..."
          className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-slate-200/60 dark:border-slate-700/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
        />
      </div>

      <AnimatePresence>
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 top-full mt-2 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden"
          >
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleAdd(p, "retail")}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.name}</p>
                  <p className="text-xs text-slate-400">Stok: {p.stock} {p.unit} · Perakende: {fmt(p.retailPrice)}</p>
                </div>
                <div className="flex gap-1.5">
                  {(["retail", "master", "cost"] as PriceType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdd(p, type);
                      }}
                      className={cn(
                        "px-2 py-1 text-xs rounded-lg font-medium transition-all",
                        type === "retail" && "bg-blue-500 text-white",
                        type === "master" && "bg-emerald-500 text-white",
                        type === "cost" && "bg-slate-500 text-white",
                      )}
                    >
                      {type === "retail" ? "P" : type === "master" ? "U" : "M"}
                    </button>
                  ))}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main POS Component ───────────────────────────────────────────────────────

export default function POSSystem() {
  const cart = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const subtotal = cart.getSubtotal();
  const vatAmount = cart.getVatAmount();
  const total = cart.getTotal();

  const loadCustomers = async () => {
    const rows = await db.customers.orderBy("name").toArray();
    setCustomers(rows);
  };

  useEffect(() => {
    if (paymentMethod === "credit") {
      loadCustomers();
    }
  }, [paymentMethod]);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerQuery.toLowerCase()) ||
    customer.phone?.includes(customerQuery)
  );

  async function createCustomerForPOS() {
    if (!newCustomerName.trim()) return;

    const customer: Customer = {
      id: generateId(),
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || undefined,
      balance: 0,
      type: "customer",
      createdAt: now(),
      updatedAt: now(),
      synced: false,
    };

    await db.customers.add(customer);
    await loadCustomers();
    cart.setCustomer(customer);
    setCustomerQuery("");
    setNewCustomerName("");
    setNewCustomerPhone("");
    setIsCreatingCustomer(false);
  }

  async function completeSale() {
    if (cart.items.length === 0) return;
    if (paymentMethod === "credit" && !cart.selectedCustomer) return;

    setIsProcessing(true);

    const saleId = generateId();
    const saleItems = cart.items.map((i) => ({
      id: generateId(),
      saleId,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      priceType: i.priceType,
      vatRate: cart.vatRate,
      vatAmount: i.unitPrice * i.quantity * (cart.vatRate / 100),
      lineTotal: i.unitPrice * i.quantity,
    }));

    const sale = {
      id: saleId,
      items: saleItems,
      subtotal,
      vatAmount,
      vatType: cart.vatType,
      total,
      discount: cart.discount,
      paymentMethod,
      customerId: cart.selectedCustomer?.id,
      customerName: cart.selectedCustomer?.name,
      createdAt: now(),
      synced: false,
    };

    await db.transaction("rw", [db.sales, db.saleItems, db.products, db.customers, db.transactions], async () => {
      await db.sales.add(sale);
      await db.saleItems.bulkAdd(saleItems);
      // Decrement stock
      for (const item of cart.items) {
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, {
            stock: Math.max(0, product.stock - item.quantity),
            updatedAt: now(),
            synced: false,
          });
        }
      }
      // Update customer balance if credit
      if (paymentMethod === "credit" && cart.selectedCustomer) {
        const nextBalance = (cart.selectedCustomer.balance ?? 0) - total;

        await db.customers.update(cart.selectedCustomer.id, {
          balance: nextBalance,
          updatedAt: now(),
          synced: false,
        });
        await db.transactions.add({
          id: generateId(),
          customerId: cart.selectedCustomer.id,
          amount: -total,
          type: "sale",
          description: `Satış #${saleId.slice(-6)}`,
          saleId,
          createdAt: now(),
          synced: false,
        });

        cart.setCustomer({
          ...cart.selectedCustomer,
          balance: nextBalance,
          updatedAt: now(),
          synced: false,
        });
      }
    });

    await loadCustomers();
    setShowSuccess(true);
    cart.clearCart();
    setCustomerQuery("");
    setIsProcessing(false);
    setTimeout(() => setShowSuccess(false), 2200);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 h-full">

        {/* Left — Product Search */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Satış Noktası</h2>
            <ProductSearch onAdd={cart.addItem} />

            {/* Price type legend */}
            <div className="flex gap-3 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">P</span> Perakende</span>
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">U</span> Usta/İndirimli</span>
              <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-slate-500 text-white flex items-center justify-center text-[10px] font-bold">M</span> Maliyet</span>
            </div>
          </motion.div>

          {/* Cart Items */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-6 space-y-2"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200">Sepet</h3>
              {cart.items.length > 0 && (
                <button onClick={cart.clearCart} className="text-xs text-red-400 hover:text-red-500 transition-colors">Temizle</button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {cart.items.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-slate-400 text-sm py-8"
                >
                  Sepet boş — ürün arayarak ekleyin
                </motion.p>
              ) : (
                cart.items.map((item) => (
                  <CartRow
                    key={item.productId}
                    item={item}
                    onRemove={() => cart.removeItem(item.productId)}
                    onQty={(q) => cart.updateQty(item.productId, q)}
                  />
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right — Totals & Payment */}
        <div className="space-y-4">
          {/* VAT Engine */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-5"
          >
            <VATEngine />
          </motion.div>

          {/* Totals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-5 space-y-3"
          >
            <div className="flex justify-between text-sm text-slate-500">
              <span>Ara Toplam</span><span className="font-medium text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>KDV {cart.vatType !== "none" && `(%${cart.vatRate})`}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{fmt(vatAmount)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>İndirim</span><span>-{fmt(cart.discount)}</span>
              </div>
            )}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-lg">Toplam</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-2xl">{fmt(total)}</span>
            </div>

            {/* Discount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₺</span>
              <input
                type="number"
                min="0"
                value={cart.discount || ""}
                onChange={(e) => cart.setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="İndirim tutarı"
                className="w-full pl-7 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-5"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Ödeme Yöntemi</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "cash", label: "Nakit", icon: Banknote },
                { value: "card", label: "Kart", icon: CreditCard },
                { value: "credit", label: "Cari", icon: Users },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMethod(value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all",
                    paymentMethod === value
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {paymentMethod === "credit" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cari Seçimi</p>
                {cart.selectedCustomer && (
                  <button
                    type="button"
                    onClick={() => cart.setCustomer(null)}
                    className="text-xs text-red-500 font-medium"
                  >
                    Seçimi Temizle
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Cari ara..."
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {cart.selectedCustomer ? (
                <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{cart.selectedCustomer.name}</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    {cart.selectedCustomer.phone ? `${cart.selectedCustomer.phone} · ` : ""}
                    Bakiye: {fmt(Math.abs(cart.selectedCustomer.balance))} {cart.selectedCustomer.balance < 0 ? "borç" : cart.selectedCustomer.balance > 0 ? "alacak" : "denk"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-2xl px-4 py-3">
                  Cari satış için mevcut bir cari seçin veya yeni cari oluşturun.
                </p>
              )}

              <div className="max-h-56 overflow-y-auto space-y-2">
                {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => cart.setCustomer(customer)}
                    className={cn(
                      "w-full text-left rounded-2xl border px-4 py-3 transition-all",
                      cart.selectedCustomer?.id === customer.id
                        ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{customer.name}</p>
                        <p className="text-xs text-slate-400">{customer.phone || "Telefon yok"}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold",
                          customer.balance < 0 ? "text-red-500" : customer.balance > 0 ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {fmt(Math.abs(customer.balance))}
                        </p>
                        <p className="text-xs text-slate-400">
                          {customer.balance < 0 ? "Borçlu" : customer.balance > 0 ? "Alacaklı" : "Denk"}
                        </p>
                      </div>
                    </div>
                  </button>
                )) : (
                  <p className="text-sm text-slate-400 text-center py-3">Kayıtlı cari bulunamadı</p>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Yeni Cari Oluştur</p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCustomer((prev) => !prev)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400"
                  >
                    {isCreatingCustomer ? "Kapat" : "Yeni Cari"}
                  </button>
                </div>

                {isCreatingCustomer && (
                  <div className="space-y-3">
                    <input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Cari adı *"
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <input
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="Telefon (opsiyonel)"
                      className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <button
                      type="button"
                      onClick={createCustomerForPOS}
                      disabled={!newCustomerName.trim()}
                      className="w-full py-3 rounded-2xl bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm hover:bg-blue-600 transition-colors"
                    >
                      Cariyi Oluştur ve Seç
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Complete Button */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={completeSale}
            disabled={cart.items.length === 0 || isProcessing || (paymentMethod === "credit" && !cart.selectedCustomer)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "w-full py-4 rounded-2xl font-bold text-white text-base transition-all flex items-center justify-center gap-2",
              cart.items.length === 0 || (paymentMethod === "credit" && !cart.selectedCustomer)
                ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-blue-600 shadow-xl shadow-blue-500/30 hover:from-blue-600 hover:to-blue-700"
            )}
          >
            <Receipt className="w-5 h-5" />
            {isProcessing ? "İşleniyor..." : `Satışı Tamamla · ${fmt(total)}`}
          </motion.button>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-emerald-500/40 font-semibold text-sm flex items-center gap-2 z-50"
          >
            <span className="text-xl">✓</span>
            Satış başarıyla kaydedildi
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
