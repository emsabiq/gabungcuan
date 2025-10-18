// assets/config.js
// Konfigurasi global untuk landing + checkout (dibaca oleh assets/app.js & assets/pixel.js)
(function (global) {
  "use strict";

  // --- EDIT DI SINI SAJA ----------------------------------------------------
  // Kamu BOLEH mengisi harga sebagai angka (disarankan) atau string berformat.
  // Contoh valid:
  //   99000
  //   "99000"
  //   "99.000"
  //   "Rp 99.000"
  //   "Rp99,000"
  const RAW_PRICE = 99000; // ← ubah harga di sini (dalam Rupiah)

  const SETTINGS = {
    APP_ORIGIN: "https://gabungcuan.vercel.app",
    API_BASE:   "https://gdc.msabiq-stan.workers.dev",
    SUPPORT_WA_E164: "6285156042869",
    PIXEL_ID: "1328311132182013",

    // Opsional: untuk tampilan perbandingan harga di UI
    BUNDLE_VALUE: 3699000,   // Nilai bundle (untuk tulisan disilang)
    COMPARE_AT_PRICE: 800000 // Harga normal (untuk tulisan disilang)
  };
  // --------------------------------------------------------------------------

  // Normalisasi harga agar selalu number (IDR) meski input string berformat.
  function normalizePrice(v) {
    if (typeof v === "number" && isFinite(v)) return Math.round(v);
    if (typeof v === "string") {
      const digits = v.replace(/[^\d]/g, ""); // ambil digit saja
      return digits ? parseInt(digits, 10) : 0;
    }
    return 0;
  }

  const price = normalizePrice(RAW_PRICE);

  const CONFIG = {
    APP_ORIGIN: SETTINGS.APP_ORIGIN,
    API_BASE: SETTINGS.API_BASE,
    SUPPORT_WA_E164: SETTINGS.SUPPORT_WA_E164,
    PIXEL_ID: SETTINGS.PIXEL_ID,
    BUNDLE_VALUE: normalizePrice(SETTINGS.BUNDLE_VALUE),
    COMPARE_AT_PRICE: normalizePrice(SETTINGS.COMPARE_AT_PRICE),

    PRODUCT_DEFAULT: {
      id: "product-masterkit",
      name: "Akses Digital Licence Masterkit U PLR MRR",
      price: price,               // ← sudah dijamin number
      currency: "IDR",
      description:
        "Akses materi premium + bonus dikirim lewat email setelah pembayaran."
    },

    // Versi config untuk cache-busting (ubah jika masih ke-cache)
    __VERSION: "2025-10-18-01"
  };

  try { Object.freeze(CONFIG.PRODUCT_DEFAULT); Object.freeze(CONFIG); } catch (_) {}
  global.CONFIG = CONFIG;

})(window);
