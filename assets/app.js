/* /assets/app.js */
(() => {
  'use strict';

  // === Guard Config ===
  if (!window.CONFIG) {
    console.error('[app] window.CONFIG tidak ditemukan. Pastikan /assets/config.js dimuat sebelum app.js');
    return;
  }

  const {
    PRODUCT_DEFAULT,
    WORKER_BASE,
    PUBLIC_ORIGIN
  } = window.CONFIG;

  // === Elemen DOM ===
  const el = {
    year:  document.getElementById('year'),
    title: document.getElementById('productTitle'),
    price: document.getElementById('priceLabel'),
    form:  document.getElementById('leadForm'),
    btn:   document.getElementById('btnBayar'),
    msg:   document.getElementById('msg'),
    nama:  document.getElementById('nama'),
    wa:    document.getElementById('wa')
  };

  // === Render awal ===
  if (el.year)  el.year.textContent  = new Date().getFullYear();
  if (el.title) el.title.textContent = PRODUCT_DEFAULT?.name || 'Produk Digital';
  if (el.price) {
    const ccy = PRODUCT_DEFAULT?.currency || 'IDR';
    const price = PRODUCT_DEFAULT?.price || 0;
    el.price.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: ccy }).format(price);
  }
  if (!el.form) return; // halaman bukan checkout

  // === Utils ===
  const setLoading = (loading) => {
    if (!el.btn) return;
    el.btn.disabled = loading;
    const label = el.btn.querySelector('.btn-label');
    const spin  = el.btn.querySelector('.btn-loading');
    if (label) label.classList.toggle('d-none', loading);
    if (spin)  spin.classList.toggle('d-none', !loading);
  };

  const setMsg = (text, isError = false) => {
    if (!el.msg) return;
    el.msg.textContent = text || '';
    el.msg.classList.toggle('text-danger', !!isError);
    el.msg.classList.toggle('text-secondary', !isError);
  };

  const validWa = (val) => /^62[0-9]{8,15}$/.test(String(val || '').trim());

  // Beacon helper (fallback ke fetch keepalive jika beacon tidak tersedia/ditolak)
  const sendJsonBeacon = (url, payloadObj) => {
    try {
      const blob = new Blob([JSON.stringify(payloadObj || {})], { type: 'application/json' });
      if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return true;
    } catch (_) {}
    // fallback
    try {
      fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payloadObj || {}), keepalive: true })
        .catch(() => {});
    } catch (_) {}
    return false;
  };

  // === Submit handler ===
  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama = (el.nama?.value || '').trim();
    const wa   = (el.wa?.value   || '').trim();

    if (!nama) { setMsg('Nama wajib diisi.', true); el.nama?.focus(); return; }
    if (!validWa(wa)) { setMsg('Nomor WA harus format 62xxxxxxxxxx.', true); el.wa?.focus(); return; }

    // Pixel: user klik bayar → AddToCart
    try { window.safeTrack && window.safeTrack('AddToCart', { value: PRODUCT_DEFAULT.price, currency: PRODUCT_DEFAULT.currency, content_name: PRODUCT_DEFAULT.name }); } catch(_) {}

    setLoading(true);
    setMsg('Membuat invoice...');

    // Base URL sukses: WAJIB HTTPS di produksi (Vercel). Fallback ke origin kalau belum diset.
    const baseUrl = (PUBLIC_ORIGIN && PUBLIC_ORIGIN.startsWith('http')) ? PUBLIC_ORIGIN : location.origin;

    const payload = {
      productId:   PRODUCT_DEFAULT.id,
      productName: PRODUCT_DEFAULT.name,
      amount:      PRODUCT_DEFAULT.price,
      currency:    PRODUCT_DEFAULT.currency || 'IDR',
      customer:    { name: nama, wa },
      baseUrl
    };

    try {
      // Buat invoice via Worker proxy (anti-CORS)
      const resp = await fetch(`${WORKER_BASE}/api/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(()=> '');
        throw new Error(`Gagal membuat invoice (${resp.status}) ${txt}`);
      }

      const data = await resp.json().catch(() => ({}));
      if (!data.ok || !data.invoice_url) {
        throw new Error('Respon server tidak valid. (invoice_url kosong)');
      }

      // Pixel: InitiateCheckout ketika invoice berhasil terbentuk
      try { window.safeTrack && window.safeTrack('InitiateCheckout', { value: PRODUCT_DEFAULT.price, currency: PRODUCT_DEFAULT.currency }); } catch(_) {}

      // Log pengguna menuju payment page (best-effort)
      sendJsonBeacon(`${WORKER_BASE}/api/log-visit`, {
        external_id: data.external_id,
        stage: 'PAYMENT_PAGE'
      });

      setMsg('Mengarahkan ke halaman pembayaran...');
      // Redirect ke halaman invoice Xendit
      location.href = data.invoice_url;

    } catch (err) {
      console.error('[app] create-invoice error:', err);
      setMsg('Maaf, sedang ada gangguan. Coba lagi sebentar.', true);
      setLoading(false);
    }
  });

  // Opsional: realtime validasi WA
  if (el.wa) {
    el.wa.addEventListener('input', () => {
      const ok = validWa(el.wa.value);
      el.wa.classList.toggle('is-invalid', !ok && el.wa.value.length > 0);
    });
  }

})();
