import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // jsPDF and xlsx are dynamically imported (browser-only) — no special config needed
};

export default nextConfig;
