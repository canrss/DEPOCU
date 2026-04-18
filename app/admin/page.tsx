"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Key, RefreshCw, Plus, Clock, CheckCircle, XCircle } from "lucide-react";

interface LicenseRow {
  id: string;
  key: string;
  shop_name: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

function generateLicenseKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "depocu2025";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");

  async function fetchLicenses() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.from("licenses").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    setLicenses(data ?? []);
    setLoading(false);
  }

  useEffect(() => { if (authed) fetchLicenses(); }, [authed]);

  async function createLicense() {
    if (!newShopName.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/admin/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ shopName: newShopName.trim() }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Lisans oluşturulamadı");

      setNewShopName("");
      await fetchLicenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lisans oluşturulamadı");
    } finally {
      setGenerating(false);
    }
  }

  async function renewLicense(id: string) {
    setError("");

    try {
      const response = await fetch("/api/admin/licenses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ id, action: "renew" }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Lisans yenilenemedi");

      await fetchLicenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lisans yenilenemedi");
    }
  }

  async function revokeLicense(id: string) {
    setError("");

    try {
      const response = await fetch("/api/admin/licenses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ id, action: "revoke" }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Lisans iptal edilemedi");

      await fetchLicenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lisans iptal edilemedi");
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 space-y-6"
        >
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Paneli</h1>
            <p className="text-slate-400 text-sm mt-1">Yetkili giriş gerekli</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && password === ADMIN_PASSWORD) setAuthed(true); }}
            placeholder="Şifre"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          />
          <button
            onClick={() => { if (password === ADMIN_PASSWORD) setAuthed(true); }}
            className="w-full py-3.5 bg-blue-500 text-white font-bold rounded-2xl text-sm"
          >
            Giriş
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lisans Yönetimi</h1>
          <button onClick={fetchLicenses} className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Create License */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-6"
        >
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Yeni Lisans Oluştur</h2>
          <div className="flex gap-3">
            <input
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              placeholder="Dükkan adı"
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              onClick={createLicense}
              disabled={generating || !newShopName.trim()}
              className="px-6 py-3 bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-2xl text-sm flex items-center gap-2 hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {generating ? "Üretiliyor..." : "Oluştur (30 gün)"}
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* License List */}
        <div className="space-y-3">
          {licenses.map((lic, i) => {
            const expired = new Date(lic.expires_at) < new Date();
            const daysLeft = Math.ceil((new Date(lic.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={lic.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-slate-700/40 shadow p-5 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  lic.is_active && !expired ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                }`}>
                  {lic.is_active && !expired
                    ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                    : <XCircle className="w-5 h-5 text-red-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white">{lic.shop_name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{lic.key}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {expired ? "Süresi Doldu" : `${daysLeft} gün kaldı`}
                    </span>
                    <span>Bitiş: {new Date(lic.expires_at).toLocaleDateString("tr-TR")}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => renewLicense(lic.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    +30 Gün
                  </button>
                  {lic.is_active && (
                    <button
                      onClick={() => revokeLicense(lic.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      İptal
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
