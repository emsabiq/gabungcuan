(function(){
  const fmtIDR = v => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(v);

  const PROD = CONFIG.PRODUCT_DEFAULT;
  const priceLabel = document.getElementById('priceLabel');
  const prodTitle  = document.getElementById('prodTitle');
  const prodDesc   = document.getElementById('prodDesc');
  const waHelp     = document.getElementById('waHelp');

  if (priceLabel) priceLabel.textContent = fmtIDR(PROD.price);
  if (prodTitle)  prodTitle.textContent = PROD.name || 'Produk Digital';
  if (prodDesc && PROD.description) prodDesc.textContent = PROD.description;
  if (waHelp) waHelp.href = "https://wa.me/" + (CONFIG.SUPPORT_WA_E164 || "6285156042869");

  const form = document.getElementById('leadForm');
  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = document.getElementById('btnBayar');
    const msg = document.getElementById('msg');

    // validate
    const nama  = document.getElementById('nama').value.trim();
    const wa    = document.getElementById('wa').value.trim();
    const email = document.getElementById('email').value.trim();
    const waOK  = /^62[0-9]{8,15}$/.test(wa);
    const mailOK = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nama || !waOK || !mailOK) {
      form.classList.add('was-validated');
      msg.className = "small mt-3 text-danger";
      msg.textContent = "Cek kembali inputan kamu.";
      return;
    }

    // Pixel: AddToCart pada klik bayar
    try { if (window.fbq) fbq('track', 'AddToCart', {content_name: PROD.name, value: PROD.price, currency: 'IDR'}); } catch(_){}

    btn.disabled = true;
    msg.className = "small mt-3 text-muted";
    msg.textContent = "Membuat invoice…";

    // log visit (opsional)
    try {
      await fetch(`${CONFIG.API_BASE}/api/log-visit`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ external_id: 'pre-' + Date.now() })
      });
    } catch(_){}

    // create invoice via Worker → Apps Script
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/create-invoice`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          productId: PROD.id,
          productName: PROD.name,
          amount: PROD.price,
          currency: PROD.currency || 'IDR',
          baseUrl: CONFIG.APP_ORIGIN,
          customer: { name: nama, wa, email }
        })
      });
      const j = await res.json();

      if (!res.ok || !j.ok) {
        throw new Error(j && j.error ? j.error : 'create_failed');
      }

      // Pixel: InitiateCheckout
      try { if (window.fbq) fbq('track', 'InitiateCheckout', {value: PROD.price, currency:'IDR'}); } catch(_){}

      // simpan harga utk Purchase event di success page
      try { localStorage.setItem('lastPrice', String(PROD.price)); } catch(_){}

      // redirect ke Xendit invoice URL
      location.assign(j.invoice_url);
    } catch (e) {
      console.error(e);
      btn.disabled = false;
      msg.className = "small mt-3 text-danger";
      msg.textContent = "Gagal membuat invoice. Coba lagi beberapa saat.";
    }
  });
})();
