// GANTI sesuai punyamu
const CONFIG = {
  // Domain publik (tanpa slash akhir)
  APP_ORIGIN: "https://gabungcuan.vercel.app",

  // Base API proxy di Cloudflare Worker (punyamu)
  API_BASE: "https://gdc.msabiq-stan.workers.dev",

  // WhatsApp bantuan (format E.164 tanpa plus, mis. 6285...)
  SUPPORT_WA_E164: "6285156042869",

  // Facebook Pixel (opsional)
  PIXEL_ID: "YOUR_PIXEL_ID",

  // Produk default (wajib untuk harga & nama di landing)
  PRODUCT_DEFAULT: {
    id: "product-masterkit",
    name: "Akses Digital Licence Masterkit U PLR MRR",
    price: 149000,
    currency: "IDR",
    description: "Akses materi premium + bonus dikirim lewat email."
  }
};
