// assets/config.js
(function (global) {
  "use strict";

  // ==== EDIT DI SINI (boleh angka atau string berformat) ====
  const RAW_PRICE = 99000;               // contoh: 99000 atau "Rp 99.000"
  const BUNDLE_VALUE = 3699000;          // untuk teks disilang (opsional)
  const COMPARE_AT_PRICE = 800000;       // untuk teks disilang (opsional)
  // ==========================================================

  function normalizePrice(v) {
    if (typeof v === "number" && isFinite(v)) return Math.round(v);
    if (typeof v === "string") {
      const digits = v.replace(/[^\d]/g, "");
      return digits ? parseInt(digits, 10) : 0;
    }
    return 0;
  }

  const CONFIG = {
    APP_ORIGIN: "https://gabungcuan.vercel.app",
    API_BASE: "https://gdc.msabiq-stan.workers.dev",
    SUPPORT_WA_E164: "6285156042869",
    PIXEL_ID: "1101231165101521",
    BUNDLE_VALUE: normalizePrice(BUNDLE_VALUE),
    COMPARE_AT_PRICE: normalizePrice(COMPARE_AT_PRICE),

    PRODUCT_DEFAULT: {
      id: "product-masterkit",
      name: "Akses Digital Licence Masterkit U PLR MRR",
      price: normalizePrice(RAW_PRICE),        // ← DIJAMIN number
      currency: "IDR",
      description:
        "Akses materi premium + bonus dikirim lewat email setelah pembayaran."
    },

    __VERSION: "2025-10-18-02",  // ubah ini jika masih ke-cache
  };

  try { Object.freeze(CONFIG.PRODUCT_DEFAULT); Object.freeze(CONFIG); } catch(_) {}
  global.CONFIG = CONFIG;
})(window);

