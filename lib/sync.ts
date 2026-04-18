import { supabase } from "@/lib/supabase";
import {
  db, unsyncedProducts, unsyncedSales, unsyncedCustomers, unsyncedTransactions
} from "@/lib/db";
import { useAppStore } from "@/lib/store";
import { useLicenseStore } from "@/lib/store";

async function getShopKey(): Promise<string> {
  return useLicenseStore.getState().licenseKey;
}

async function syncProducts(shopKey: string) {
  const items = await unsyncedProducts();
  if (!items.length) return;

  const rows = items.map((p) => ({
    id: p.id, name: p.name, barcode: p.barcode, category: p.category,
    cost_price: p.costPrice, master_price: p.masterPrice, retail_price: p.retailPrice,
    stock: p.stock, min_stock: p.minStock, vat_rate: p.vatRate, unit: p.unit,
    created_at: p.createdAt, updated_at: p.updatedAt, shop_key: shopKey,
  }));

  const { error } = await supabase.from("products").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.products.bulkUpdate(items.map((p) => ({ key: p.id, changes: { synced: true } })));
  }
}

async function syncSales(shopKey: string) {
  const items = await unsyncedSales();
  if (!items.length) return;

  const rows = items.map((s) => ({
    id: s.id, items: s.items, subtotal: s.subtotal, vat_amount: s.vatAmount,
    vat_type: s.vatType, total: s.total, discount: s.discount,
    payment_method: s.paymentMethod, customer_id: s.customerId,
    customer_name: s.customerName, note: s.note,
    created_at: s.createdAt, shop_key: shopKey,
  }));

  const { error } = await supabase.from("sales").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.sales.bulkUpdate(items.map((s) => ({ key: s.id, changes: { synced: true } })));
  }
}

async function syncCustomers(shopKey: string) {
  const items = await unsyncedCustomers();
  if (!items.length) return;

  const rows = items.map((c) => ({
    id: c.id, name: c.name, phone: c.phone, balance: c.balance,
    type: c.type, created_at: c.createdAt, updated_at: c.updatedAt, shop_key: shopKey,
  }));

  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.customers.bulkUpdate(items.map((c) => ({ key: c.id, changes: { synced: true } })));
  }
}

async function syncTransactions(shopKey: string) {
  const items = await unsyncedTransactions();
  if (!items.length) return;

  const rows = items.map((t) => ({
    id: t.id, customer_id: t.customerId, amount: t.amount, type: t.type,
    description: t.description, sale_id: t.saleId, created_at: t.createdAt, shop_key: shopKey,
  }));

  const { error } = await supabase.from("transactions").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.transactions.bulkUpdate(items.map((t) => ({ key: t.id, changes: { synced: true } })));
  }
}

export async function syncAll() {
  const { setSyncStatus } = useAppStore.getState();
  setSyncStatus("syncing");

  try {
    const shopKey = await getShopKey();
    await Promise.all([
      syncProducts(shopKey),
      syncSales(shopKey),
      syncCustomers(shopKey),
      syncTransactions(shopKey),
    ]);
    setSyncStatus("success");
    setTimeout(() => setSyncStatus("idle"), 3000);
  } catch {
    setSyncStatus("error");
    setTimeout(() => setSyncStatus("idle"), 5000);
  }
}

// ─── Network Listener (mount once in layout) ──────────────────────────────────

let syncListenerMounted = false;

export function mountSyncListener() {
  if (syncListenerMounted || typeof window === "undefined") return;
  syncListenerMounted = true;

  const { setOnline } = useAppStore.getState();

  window.addEventListener("online", () => {
    setOnline(true);
    syncAll(); // silent background sync
  });

  window.addEventListener("offline", () => {
    setOnline(false);
  });
}
