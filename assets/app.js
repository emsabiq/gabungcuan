/* /assets/app.js */
(() => {
  'use strict';

  if (!window.CONFIG) {
    console.error('[app] window.CONFIG tidak ditemukan. Pastikan /assets/config.js dimuat sebelum app.js');
    return;
  }

  const { PRODUCT_DEFAULT, WORKER_BASE, PUBLIC_ORIGIN } = window.CONFIG;

  const el = {
    year:  document.getElementById('year'),
    title: document.getElementById('productTitle'),
    price: document.getElementById('priceLabel'),
    form:  document.getElementById('leadForm'),
    btn:   document.getElementById('btnBayar'),
    msg:   document.getElementById('msg'),
    nama:  document.getElementById('nama'),
    wa:    document.getElementById('wa'),
    email: document.getElementById('email')
  };

  if (el.year)  el.year.textContent  = new Date().getFullYear();
  if (el.title) el.title.textContent = PRODUCT_DEFAULT?.name || 'Produk Digital';
  if (el.price) {
    const ccy = PRODUCT_DEFAULT?.currency || 'IDR';
    const price = PRODUCT_DEFAULT?.price || 0;
    el.price.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: ccy }).format(price);
  }
  if (!el.form) return;

  const setLoading = (loading) => {
    if (!el.btn) return;
    el.btn.disabled = loading;
    el.btn.querySelector('.btn-label')?.classList.toggle('d-none', loading);
    el.btn.querySelector('.btn-loading')?.classList.toggle('d-none', !loading);
  };
  const setMsg = (text, isError = false) => {
    if (!el.msg) return;
    el.msg.textContent = text || '';
    el.msg.classList.toggle('text-danger', !!isError);
    el.msg.classList.toggle('text-secondary', !isError);
  };
  const validWa = (val) => /^62[0-9]{8,15}$/.test(String(val || '').trim());
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||'').trim());

  const sendJsonBeacon = (url, payloadObj) => {
    try {
      const blob = new Blob([JSON.stringify(payloadObj || {})], { type: 'application/json' });
      if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return true;
    } catch (_) {}
    try {
      fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payloadObj || {}), keepalive: true })
        .catch(() => {});
    } catch (_) {}
    return false;
  };

  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nama  = (el.nama?.value || '').trim();
    const wa    = (el.wa?.value   || '').trim();
    const email = (el.email?.value || '').trim();

    if (!nama) { setMsg('Nama wajib diisi.', true); el.nama?.focus(); return; }
    if (!validWa(wa)) { setMsg('Nomor WA harus format 62xxxxxxxxxx.', true); el.wa?.focus(); return; }
    if (email && !isEmail(email)) { setMsg('Format email tidak valid.', true); el.email?.focus(); return; }

    try { window.safeTrack?.('AddToCart', { value: PRODUCT_DEFAULT.price, currency: PRODUCT_DEFAULT.currency, content_name: PRODUCT_DEFAULT.name }); } catch(_) {}

    setLoading(true);
    setMsg('Membuat invoice...');

    const baseUrl = (PUBLIC_ORIGIN && PUBLIC_ORIGIN.startsWith('http')) ? PUBLIC_ORIGIN : location.origin;

    const payload = {
      productId:   PRODUCT_DEFAULT.id,
      productName: PRODUCT_DEFAULT.name,
      amount:      PRODUCT_DEFAULT.price,
      currency:    PRODUCT_DEFAULT.currency || 'IDR',
      customer:    { name: nama, wa, email },
      baseUrl
    };

    try {
      const resp = await fetch(`${WORKER_BASE}/api/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Gagal membuat invoice (${resp.status})`);
      const data = await resp.json().catch(() => ({}));
      if (!data.ok || !data.invoice_url) throw new Error('Respon server tidak valid (invoice_url kosong)');

      try { window.safeTrack?.('InitiateCheckout', { value: PRODUCT_DEFAULT.price, currency: PRODUCT_DEFAULT.currency }); } catch(_) {}

      sendJsonBeacon(`${WORKER_BASE}/api/log-visit`, {
        external_id: data.external_id,
        stage: 'PAYMENT_PAGE'
      });

      setMsg('Mengarahkan ke halaman pembayaran...');
      location.href = data.invoice_url;
    } catch (err) {
      console.error('[app] create-invoice error:', err);
      setMsg('Maaf, sedang ada gangguan. Coba lagi sebentar.', true);
      setLoading(false);
    }
  });

  if (el.wa) {
    el.wa.addEventListener('input', () => {
      el.wa.classList.toggle('is-invalid', !validWa(el.wa.value) && el.wa.value.length>0);
    });
  }
})();
