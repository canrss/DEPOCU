import Dexie, { Table } from "dexie";
import type { Product, Sale, SaleItem, Customer, Transaction, License } from "@/types";

class DepocuDB extends Dexie {
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  saleItems!: Table<SaleItem, string>;
  customers!: Table<Customer, string>;
  transactions!: Table<Transaction, string>;
  licenses!: Table<License, string>;

  constructor() {
    super("DepocuDB");
    this.version(1).stores({
      products:  "id, barcode, category, name, stock, synced, updatedAt",
      sales:     "id, createdAt, customerId, synced",
      saleItems: "id, saleId, productId",
      customers: "id, name, type, synced, updatedAt",
      transactions: "id, customerId, type, createdAt, synced",
      licenses:  "id, key, isActive",
    });
  }
}

export const db = new DepocuDB();

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function now(): string {
  return new Date().toISOString();
}

export async function getActiveLicense(): Promise<License | undefined> {
  return db.licenses.where("isActive").equals(1).first();
}

export async function unsyncedProducts(): Promise<Product[]> {
  return db.products.where("synced").equals(0).toArray();
}

export async function unsyncedSales(): Promise<Sale[]> {
  return db.sales.where("synced").equals(0).toArray();
}

export async function unsyncedCustomers(): Promise<Customer[]> {
  return db.customers.where("synced").equals(0).toArray();
}

export async function unsyncedTransactions(): Promise<Transaction[]> {
  return db.transactions.where("synced").equals(0).toArray();
}
