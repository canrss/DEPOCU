import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "depocu2025";

interface CreatePayload {
  shopName?: string;
}

interface UpdatePayload {
  id?: string;
  action?: "renew" | "revoke";
}

function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
}

function missingConfig() {
  return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
}

function getAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function isAuthorized(request: Request) {
  return request.headers.get("x-admin-password") === adminPassword;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (!supabaseUrl || !serviceRoleKey) return missingConfig();

  const body = (await request.json()) as CreatePayload;
  const shopName = body.shopName?.trim();

  if (!shopName) {
    return NextResponse.json({ error: "Dükkan adı gerekli" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("licenses")
    .insert({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      key: generateLicenseKey(),
      shop_name: shopName,
      expires_at: expiresAt,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  if (!isAuthorized(request)) return unauthorized();
  if (!supabaseUrl || !serviceRoleKey) return missingConfig();

  const body = (await request.json()) as UpdatePayload;

  if (!body.id || !body.action) {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const payload = body.action === "renew"
    ? {
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      }
    : {
        is_active: false,
      };

  const { error } = await supabase.from("licenses").update(payload).eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
