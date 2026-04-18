import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, CartItem, Customer, Sale, VatType, PriceType } from "@/types";
import { db, generateId, now } from "@/lib/db";

// ─── License Store ────────────────────────────────────────────────────────────

interface LicenseState {
  shopName: string;
  licenseKey: string;
  expiresAt: string | null;
  isActivated: boolean;
  activate: (shopName: string, key: string, expiresAt: string) => void;
  clear: () => void;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set) => ({
      shopName: "",
      licenseKey: "",
      expiresAt: null,
      isActivated: false,
      activate: (shopName, licenseKey, expiresAt) =>
        set({ shopName, licenseKey, expiresAt, isActivated: true }),
      clear: () =>
        set({ shopName: "", licenseKey: "", expiresAt: null, isActivated: false }),
    }),
    { name: "depocu-license" }
  )
);

// ─── POS / Cart Store ─────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  vatType: VatType;
  vatRate: 0 | 10 | 20;
  manualVat: number;
  useManualVat: boolean;
  discount: number;
  selectedCustomer: Customer | null;

  addItem: (product: Product, priceType: PriceType) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  updatePriceType: (productId: string, priceType: PriceType) => void;
  setVatType: (type: VatType) => void;
  setVatRate: (rate: 0 | 10 | 20) => void;
  setManualVat: (amount: number) => void;
  setUseManualVat: (v: boolean) => void;
  setDiscount: (amount: number) => void;
  setCustomer: (c: Customer | null) => void;
  clearCart: () => void;

  // Computed helpers (called inline — not reactive selectors)
  getSubtotal: () => number;
  getVatAmount: () => number;
  getTotal: () => number;
}

const priceFor = (product: Product, priceType: PriceType): number => {
  if (priceType === "master") return product.masterPrice;
  if (priceType === "cost") return product.costPrice;
  return product.retailPrice;
};

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  vatType: "included",
  vatRate: 20,
  manualVat: 0,
  useManualVat: false,
  discount: 0,
  selectedCustomer: null,

  addItem: (product, priceType) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      set({ items: items.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({
        items: [...items, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: priceFor(product, priceType),
          priceType,
          vatRate: product.vatRate,
          stock: product.stock,
        }],
      });
    }
  },

  removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

  updateQty: (productId, qty) => {
    if (qty <= 0) { get().removeItem(productId); return; }
    set({ items: get().items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i) });
  },

  updatePriceType: (productId, priceType) =>
    set({ items: get().items.map((i) => i.productId === productId ? { ...i, priceType } : i) }),

  setVatType: (vatType) => set({ vatType }),
  setVatRate: (vatRate) => set({ vatRate }),
  setManualVat: (manualVat) => set({ manualVat }),
  setUseManualVat: (useManualVat) => set({ useManualVat }),
  setDiscount: (discount) => set({ discount }),
  setCustomer: (selectedCustomer) => set({ selectedCustomer }),
  clearCart: () => set({ items: [], discount: 0, selectedCustomer: null, manualVat: 0, useManualVat: false }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  getVatAmount: () => {
    const { items, vatType, vatRate, manualVat, useManualVat } = get();
    if (useManualVat) return manualVat;
    if (vatType === "none") return 0;
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    if (vatType === "included") {
      return subtotal - subtotal / (1 + vatRate / 100);
    }
    return subtotal * (vatRate / 100);
  },

  getTotal: () => {
    const { vatType, discount } = get();
    const subtotal = get().getSubtotal();
    const vat = get().getVatAmount();
    const gross = vatType === "excluded" ? subtotal + vat : subtotal;
    return Math.max(0, gross - discount);
  },
}));

// ─── App / UI Store ───────────────────────────────────────────────────────────

interface AppState {
  isOnline: boolean;
  syncStatus: "idle" | "syncing" | "error" | "success";
  setOnline: (v: boolean) => void;
  setSyncStatus: (s: AppState["syncStatus"]) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  syncStatus: "idle",
  setOnline: (isOnline) => set({ isOnline }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
}));
