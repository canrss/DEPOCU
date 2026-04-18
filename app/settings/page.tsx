"use client";
import { useLicenseStore } from "@/lib/store";
import { syncAll } from "@/lib/sync";
import { LogOut, RefreshCw, Shield } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { shopName, licenseKey, expiresAt, clear } = useLicenseStore();
  const daysLeft = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-lg mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ayarlar</h1>

        {/* License Info */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-6 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lisans Bilgisi</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Dükkan Adı</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Lisans Anahtarı</span>
              <span className="text-sm font-mono text-slate-600 dark:text-slate-300">{licenseKey}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Geçerlilik</span>
              <span className={`text-sm font-semibold ${daysLeft <= 7 ? "text-red-500" : "text-emerald-600"}`}>
                {daysLeft} gün kaldı
              </span>
            </div>
            {expiresAt && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Bitiş Tarihi</span>
                <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(expiresAt).toLocaleDateString("tr-TR")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-xl p-4 space-y-1">
          <button onClick={() => syncAll()}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
            <RefreshCw className="w-4 h-4 text-blue-500" />
            Manuel Senkronizasyon
          </button>
          <Link href="/admin"
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
            <Shield className="w-4 h-4 text-purple-500" />
            Admin Paneli
          </Link>
          <button onClick={() => { if (confirm("Çıkış yapmak istediğinizden emin misiniz?")) clear(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">Depocu v1.0.0 · Sanayi esnafı için</p>
      </div>
    </div>
  );
}
