// ─── Core Domain Types ───────────────────────────────────────────────────────

export type VatType = "included" | "excluded" | "none";
export type PriceType = "retail" | "master" | "cost";
export type PaymentMethod = "cash" | "card" | "credit";
export type CustomerType = "customer" | "master";
export type TransactionType = "sale" | "payment" | "return";

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  category?: string;
  costPrice: number;
  masterPrice: number;
  retailPrice: number;
  stock: number;
  minStock: number;
  vatRate: 0 | 10 | 20;
  unit: string;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  priceType: PriceType;
  vatRate: number;
  vatAmount: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  vatAmount: number;
  vatType: VatType;
  total: number;
  discount: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  note?: string;
  createdAt: string;
  synced?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  balance: number; // negative = owes us
  type: CustomerType;
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  type: TransactionType;
  description: string;
  saleId?: string;
  createdAt: string;
  synced?: boolean;
}

export interface License {
  id: string;
  key: string;
  shopName: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Cart / POS ──────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  priceType: PriceType;
  vatRate: number;
  stock: number;
}

// ─── Dashboard Analytics ─────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  profit: number;
  cost: number;
}

export interface StockTrendPoint {
  date: string;
  [productName: string]: number | string;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  stockRemaining: number;
}
