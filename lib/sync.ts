import { supabase } from "@/lib/supabase";
import {
  db, unsyncedProducts, unsyncedSales, unsyncedCustomers, unsyncedTransactions,
} from "@/lib/db";
import { useAppStore, useLicenseStore } from "@/lib/store";
import type { Customer, Product, Sale, Transaction } from "@/types";

async function getShopKey(): Promise<string> {
  return useLicenseStore.getState().licenseKey;
}

function isRemoteProductNewer(remote: { updated_at: string }, local?: Product) {
  if (!local) return true;
  if (local.synced === false) return false;
  return new Date(remote.updated_at).getTime() >= new Date(local.updatedAt).getTime();
}

function isRemoteCustomerNewer(remote: { updated_at: string }, local?: Customer) {
  if (!local) return true;
  if (local.synced === false) return false;
  return new Date(remote.updated_at).getTime() >= new Date(local.updatedAt).getTime();
}

async function syncProducts(shopKey: string) {
  const items = await unsyncedProducts();
  if (!items.length) return;

  const rows = items.map((p) => ({
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    category: p.category,
    cost_price: p.costPrice,
    master_price: p.masterPrice,
    retail_price: p.retailPrice,
    stock: p.stock,
    min_stock: p.minStock,
    vat_rate: p.vatRate,
    unit: p.unit,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    shop_key: shopKey,
  }));

  const { error } = await supabase.from("products").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.products.bulkUpdate(items.map((p) => ({ key: p.id, changes: { synced: true } })));
  }
}

async function pullProducts(shopKey: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, barcode, category, cost_price, master_price, retail_price, stock, min_stock, vat_rate, unit, created_at, updated_at")
    .eq("shop_key", shopKey);

  if (error || !data?.length) return;

  const localMap = new Map((await db.products.toArray()).map((item) => [item.id, item]));

  const merged = data
    .filter((row) => isRemoteProductNewer(row, localMap.get(row.id)))
    .map<Product>((row) => ({
      id: row.id,
      name: row.name,
      barcode: row.barcode ?? undefined,
      category: row.category ?? undefined,
      costPrice: Number(row.cost_price ?? 0),
      masterPrice: Number(row.master_price ?? 0),
      retailPrice: Number(row.retail_price ?? 0),
      stock: Number(row.stock ?? 0),
      minStock: Number(row.min_stock ?? 0),
      vatRate: row.vat_rate,
      unit: row.unit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      synced: true,
    }));

  if (merged.length) {
    await db.products.bulkPut(merged);
  }
}

async function syncSales(shopKey: string) {
  const items = await unsyncedSales();
  if (!items.length) return;

  const rows = items.map((s) => ({
    id: s.id,
    items: s.items,
    subtotal: s.subtotal,
    vat_amount: s.vatAmount,
    vat_type: s.vatType,
    total: s.total,
    discount: s.discount,
    payment_method: s.paymentMethod,
    customer_id: s.customerId,
    customer_name: s.customerName,
    note: s.note,
    created_at: s.createdAt,
    shop_key: shopKey,
  }));

  const { error } = await supabase.from("sales").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.sales.bulkUpdate(items.map((s) => ({ key: s.id, changes: { synced: true } })));
  }
}

async function pullSales(shopKey: string) {
  const { data, error } = await supabase
    .from("sales")
    .select("id, items, subtotal, vat_amount, vat_type, total, discount, payment_method, customer_id, customer_name, note, created_at")
    .eq("shop_key", shopKey);

  if (error || !data?.length) return;

  const merged = data.map<Sale>((row) => ({
    id: row.id,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal ?? 0),
    vatAmount: Number(row.vat_amount ?? 0),
    vatType: row.vat_type,
    total: Number(row.total ?? 0),
    discount: Number(row.discount ?? 0),
    paymentMethod: row.payment_method,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    synced: true,
  }));

  if (merged.length) {
    await db.sales.bulkPut(merged);
  }
}

async function syncCustomers(shopKey: string) {
  const items = await unsyncedCustomers();
  if (!items.length) return;

  const rows = items.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    balance: c.balance,
    type: c.type,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    shop_key: shopKey,
  }));

  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.customers.bulkUpdate(items.map((c) => ({ key: c.id, changes: { synced: true } })));
  }
}

async function pullCustomers(shopKey: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, balance, type, created_at, updated_at")
    .eq("shop_key", shopKey);

  if (error || !data?.length) return;

  const localMap = new Map((await db.customers.toArray()).map((item) => [item.id, item]));

  const merged = data
    .filter((row) => isRemoteCustomerNewer(row, localMap.get(row.id)))
    .map<Customer>((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone ?? undefined,
      balance: Number(row.balance ?? 0),
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      synced: true,
    }));

  if (merged.length) {
    await db.customers.bulkPut(merged);
  }
}

async function syncTransactions(shopKey: string) {
  const items = await unsyncedTransactions();
  if (!items.length) return;

  const rows = items.map((t) => ({
    id: t.id,
    customer_id: t.customerId,
    amount: t.amount,
    type: t.type,
    description: t.description,
    sale_id: t.saleId,
    created_at: t.createdAt,
    shop_key: shopKey,
  }));

  const { error } = await supabase.from("transactions").upsert(rows, { onConflict: "id" });
  if (!error) {
    await db.transactions.bulkUpdate(items.map((t) => ({ key: t.id, changes: { synced: true } })));
  }
}

async function pullTransactions(shopKey: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, customer_id, amount, type, description, sale_id, created_at")
    .eq("shop_key", shopKey);

  if (error || !data?.length) return;

  const merged = data.map<Transaction>((row) => ({
    id: row.id,
    customerId: row.customer_id,
    amount: Number(row.amount ?? 0),
    type: row.type,
    description: row.description,
    saleId: row.sale_id ?? undefined,
    createdAt: row.created_at,
    synced: true,
  }));

  if (merged.length) {
    await db.transactions.bulkPut(merged);
  }
}

let syncInFlight: Promise<void> | null = null;

export async function syncAll() {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const { setSyncStatus } = useAppStore.getState();
    setSyncStatus("syncing");

    try {
      const shopKey = await getShopKey();
      if (!shopKey) {
        setSyncStatus("idle");
        return;
      }

      await Promise.all([
        syncProducts(shopKey),
        syncSales(shopKey),
        syncCustomers(shopKey),
        syncTransactions(shopKey),
      ]);

      await Promise.all([
        pullProducts(shopKey),
        pullSales(shopKey),
        pullCustomers(shopKey),
        pullTransactions(shopKey),
      ]);

      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch {
      useAppStore.getState().setSyncStatus("error");
      setTimeout(() => useAppStore.getState().setSyncStatus("idle"), 5000);
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

let syncListenerMounted = false;

export function mountSyncListener() {
  if (syncListenerMounted || typeof window === "undefined") return;
  syncListenerMounted = true;

  const { setOnline } = useAppStore.getState();
  const online = navigator.onLine;
  setOnline(online);

  if (online) {
    void syncAll();
  }

  window.addEventListener("online", () => {
    setOnline(true);
    void syncAll();
  });

  window.addEventListener("offline", () => {
    setOnline(false);
  });
}
