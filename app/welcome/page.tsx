"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { db, generateId, now } from "@/lib/db";
import { useLicenseStore } from "@/lib/store";

export default function WelcomePage() {
  const router = useRouter();
  const { isActivated, activate } = useLicenseStore();
  const [shopName, setShopName] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"welcome" | "form">("welcome");

  useEffect(() => {
    if (isActivated) router.replace("/");
  }, [isActivated, router]);

  async function handleActivate() {
    if (!shopName.trim() || licenseKey.trim().length !== 10) {
      setError("Dükkan adını ve 10 haneli lisans anahtarını girin.");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: supaErr } = await supabase
      .from("licenses")
      .select("*")
      .eq("key", licenseKey.trim().toUpperCase())
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (supaErr || !data) {
      // Offline fallback — check local DB
      const local = await db.licenses.where("key").equals(licenseKey.trim().toUpperCase()).first();
      if (!local || !local.isActive || new Date(local.expiresAt) < new Date()) {
        setError("Geçersiz veya süresi dolmuş lisans anahtarı.");
        setLoading(false);
        return;
      }
      activate(shopName.trim(), licenseKey.trim().toUpperCase(), local.expiresAt);
    } else {
      // Cache locally
      await db.licenses.put({
        id: data.id,
        key: data.key,
        shopName: data.shop_name,
        expiresAt: data.expires_at,
        isActive: data.is_active,
        createdAt: data.created_at,
      });
      activate(shopName.trim(), data.key, data.expires_at);
    }

    setLoading(false);
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 flex items-center justify-center p-4">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {step === "welcome" ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, y: -20 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center max-w-md w-full space-y-8"
          >
            {/* App Icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-[30px] shadow-2xl shadow-blue-500/40 flex items-center justify-center text-4xl"
            >
              📦
            </motion.div>

            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold text-white tracking-tight"
              >
                Depocu
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="text-blue-200/70 text-lg"
              >
                Sanayi esnafı için akıllı depo yönetimi
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
              className="flex flex-col gap-3 text-sm text-blue-200/50 items-center"
            >
              {["Offline-First çalışır", "Otomatik bulut yedeklemesi", "KDV dahil/hariç satış"].map((feat) => (
                <span key={feat} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{feat}
                </span>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setStep("form")}
              className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition-all text-base"
            >
              Başla
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-md bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-white">Dükkanınızı kurun</h2>
              <p className="text-blue-200/60 text-sm mt-1">Lisans anahtarınızı satıcınızdan alın</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-blue-200/70 mb-2 uppercase tracking-wider">Dükkan Adı</label>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Örn: Ahmet Usta Yedek Parça"
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-blue-200/70 mb-2 uppercase tracking-wider">Lisans Anahtarı</label>
                <input
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXXXX"
                  maxLength={10}
                  className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-sm font-mono tracking-widest"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-300 text-sm text-center bg-red-500/10 px-4 py-2.5 rounded-xl"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("welcome")}
                className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 text-white/70 font-medium rounded-2xl transition-all text-sm"
              >
                Geri
              </button>
              <button
                onClick={handleActivate}
                disabled={loading}
                className="flex-[2] py-3.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition-all text-sm"
              >
                {loading ? "Doğrulanıyor..." : "Aktivasyon"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
