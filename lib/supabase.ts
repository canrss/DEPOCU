import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnon);

/*
  ─── Supabase SQL Schema (run once in dashboard) ───────────────────────────

  create table products (
    id text primary key, name text not null, barcode text, category text,
    cost_price numeric, master_price numeric, retail_price numeric,
    stock int, min_stock int, vat_rate int, unit text,
    created_at timestamptz, updated_at timestamptz, shop_key text
  );

  create table sales (
    id text primary key, items jsonb, subtotal numeric, vat_amount numeric,
    vat_type text, total numeric, discount numeric, payment_method text,
    customer_id text, customer_name text, note text,
    created_at timestamptz, shop_key text
  );

  create table customers (
    id text primary key, name text, phone text, balance numeric,
    type text, created_at timestamptz, updated_at timestamptz, shop_key text
  );

  create table transactions (
    id text primary key, customer_id text, amount numeric, type text,
    description text, sale_id text, created_at timestamptz, shop_key text
  );

  create table licenses (
    id text primary key, key text unique not null, shop_name text,
    expires_at timestamptz, is_active boolean, created_at timestamptz
  );

  -- Enable RLS + allow anon reads on licenses (for key validation)
  alter table licenses enable row level security;
  create policy "Public license read" on licenses for select using (true);
*/
