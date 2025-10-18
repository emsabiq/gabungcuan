// /assets/config.js
window.CONFIG = {
  PIXEL_ID: 'YOUR_PIXEL_ID', // opsional, isi kalau pakai Pixel
  WORKER_BASE: 'https://gdc.msabiq-stan.workers.dev',
  PUBLIC_ORIGIN: 'https://gabungcuan.vercel.app', // ← domain produksi kamu (HTTPS)
  PRODUCT_DEFAULT: {
    id: 'product-masterkit', // => harus ada di ASSET_MAP_JSON Worker
    name: 'Akses Digital Licence Masterkit U PLR MRR',
    price: 149000,
    currency: 'IDR'
  }
};
