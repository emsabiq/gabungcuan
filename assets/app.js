// assets/app.js
(function () {
  "use strict";

  // --------------------------- GUARD CONFIG ----------------------------
  if (!window.CONFIG || !CONFIG.PRODUCT_DEFAULT) {
    console.error("CONFIG tidak ditemukan. Pastikan assets/config.js diload sebelum app.js");
    return;
  }

  // --------------------------- UTILITIES -------------------------------
  const fmtIDR = (v) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
      (typeof v === "number" && isFinite(v)) ? v : 0
    );

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const setHref = (id, href) => {
    const el = document.getElementById(id);
    if (el) el.href = href;
  };

  function tonightDeadline() {
    // 23:59:59 hari ini (pakai timezone browser)
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    if (end - now <= 0) {
      end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 999);
    }
    return end;
  }

  function startCountdown(end, ids) {
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    function tick() {
      const now = new Date();
      let diff = Math.max(0, end - now);
      const hh = Math.floor(diff / 1000 / 60 / 60);
      diff -= hh * 60 * 60 * 1000;
      const mm = Math.floor(diff / 1000 / 60);
      diff -= mm * 60 * 1000;
      const ss = Math.floor(diff / 1000);

      ids.forEach(({ h, m, s }) => {
        const H = document.getElementById(h),
          M = document.getElementById(m),
          S = document.getElementById(s);
        if (H) H.textContent = pad(hh);
        if (M) M.textContent = pad(mm);
        if (S) S.textContent = pad(ss);
      });

      if (end - now <= 0) clearInterval(t);
    }
    const t = setInterval(tick, 1000);
    tick();
  }

  function bulanTahunID() {
    const namaBulan = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const d = new Date();
    return `${namaBulan[d.getMonth()]} ${d.getFullYear()}`;
  }

  // --------------------------- CONFIG & PRICE --------------------------
  const PROD = CONFIG.PRODUCT_DEFAULT || {};
  const PRICE_NUM = (typeof PROD.price === "number" && isFinite(PROD.price)) ? PROD.price : 0;
  const PRICE_TEXT = fmtIDR(PRICE_NUM);

  // Debug ringan
  console.log("[app.js] price =", PROD.price, "→", PRICE_NUM, PRICE_TEXT);

  // --------------------------- INJECT UI TEXTS -------------------------
  // Harga di semua badge/cta
  setText("priceBadge",  PRICE_TEXT);
  setText("priceMain",   PRICE_TEXT);
  setText("priceCta",    PRICE_TEXT);
  setText("priceFloat",  PRICE_TEXT);
  setText("priceInline", PRICE_TEXT);
  setText("priceFaq",    PRICE_TEXT);

  // Nama & deskripsi produk (opsional bila ada elemennya)
  const prodTitle  = document.getElementById("prodTitle");
  const prodDesc   = document.getElementById("prodDesc");
  if (prodTitle) prodTitle.textContent = PROD.name || "Produk Digital";
  if (prodDesc && PROD.description) prodDesc.textContent = PROD.description;

  // Label harga single (opsional bila ada)
  const priceLabel = document.getElementById("priceLabel");
  if (priceLabel) priceLabel.textContent = PRICE_TEXT;

  // WA help link (beberapa tempat)
  const wa = CONFIG.SUPPORT_WA_E164 || "6285156042869";
  setHref("waHelp", "https://wa.me/" + wa);
  setHref("faqWA",  "https://wa.me/" + wa);

  // Tanggal update penawaran
  const od = document.getElementById("offer-date");
  if (od) od.textContent = bulanTahunID();

  // Tahun footer
  const y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();

  // Floating CTA show/hide
  (function () {
    const floater = document.getElementById("floater");
    if (!floater) return;
    let shown = false;
    window.addEventListener("scroll", () => {
      if (window.scrollY > 480 && !shown) {
        floater.classList.add("show");
        floater.setAttribute("aria-hidden", "false");
        shown = true;
      }
      if (window.scrollY <= 120 && shown) {
        floater.classList.remove("show");
        floater.setAttribute("aria-hidden", "true");
        shown = false;
      }
    });
  })();

  // Countdown (dua set timer: hero & pricing)
  startCountdown(tonightDeadline(), [
    { h: "h", m: "m", s: "s" },
    { h: "h2", m: "m2", s: "s2" },
  ]);

  // --------------------------- JSON-LD (SEO) ---------------------------
  try {
    const schemaEl = document.querySelector("#schema-product");
    if (schemaEl) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": PROD.name || "Produk Digital",
        "brand": { "@type": "Organization", "name": "gabungcuan" },
        "description": PROD.description || "Akses materi premium.",
        "offers": {
          "@type": "Offer",
          "priceCurrency": PROD.currency || "IDR",
          "price": String(PRICE_NUM),
          "availability": "https://schema.org/InStock"
        }
      };
      schemaEl.textContent = JSON.stringify(schema);
    }
  } catch (_) {}

  // --------------------------- PREFILL FORM ----------------------------
  // Prefill dari localStorage (kalau ada): umkm_prefill {name, contact}
  try {
    const raw = localStorage.getItem("umkm_prefill");
    if (raw) {
      const pre = JSON.parse(raw);
      const fName = document.getElementById("nama");
      const fWA   = document.getElementById("wa");
      const fEmail= document.getElementById("email");

      if (fName && pre.name) fName.value = pre.name;

      if (pre.contact) {
        if (/@/.test(pre.contact)) {
          if (fEmail) fEmail.value = pre.contact;
        } else if (/^\d+$/.test(pre.contact)) {
          // jika hanya digit, upayakan ke format 62...
          const v = pre.contact.startsWith("62") ? pre.contact : ("62" + pre.contact.replace(/^0+/, ""));
          if (fWA) fWA.value = v;
        }
      }
    }
  } catch (_) {}

  // --------------------------- FORM SUBMIT -----------------------------
  const form = document.getElementById("leadForm");
  if (!form) {
    console.warn("[app.js] leadForm tidak ditemukan di halaman ini.");
    return;
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = document.getElementById("btnBayar");
    const msg = document.getElementById("msg");

    const nama  = (document.getElementById("nama")  || {}).value?.trim()  || "";
    const waIn  = (document.getElementById("wa")    || {}).value?.trim()  || "";
    const email = (document.getElementById("email") || {}).value?.trim()  || "";

    const waOK   = /^62[0-9]{8,15}$/.test(waIn);
    const mailOK = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nama || !waOK || !mailOK) {
      form.classList.add("was-validated");
      if (msg) {
        msg.className = "small mt-3 text-danger";
        msg.textContent = "Cek kembali inputan kamu.";
      }
      return;
    }

    // Pixel: AddToCart saat klik bayar
    try { if (window.fbq) fbq("track", "AddToCart", { content_name: PROD.name, value: PRICE_NUM, currency: "IDR" }); } catch (_) {}

    if (btn) btn.disabled = true;
    if (msg) {
      msg.className = "small mt-3 text-muted";
      msg.textContent = "Membuat invoice…";
    }

    // Log visit (opsional)
    try {
      await fetch(`${CONFIG.API_BASE}/api/log-visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_id: "pre-" + Date.now() }),
      });
    } catch (_) {}

    // Create Xendit invoice via Worker (→ App Script)
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId:   PROD.id,
          productName: PROD.name,
          amount:      PRICE_NUM,
          currency:    PROD.currency || "IDR",
          baseUrl:     CONFIG.APP_ORIGIN,
          customer: { name: nama, wa: waIn, email }
        }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok || !j || !j.ok || !j.invoice_url) {
        throw new Error((j && j.error) ? j.error : "create_failed");
      }

      // Pixel: InitiateCheckout
      try { if (window.fbq) fbq("track", "InitiateCheckout", { value: PRICE_NUM, currency: "IDR" }); } catch (_) {}

      // Simpan harga untuk Purchase event di success page (kalau dipakai)
      try { localStorage.setItem("lastPrice", String(PRICE_NUM)); } catch (_) {}

      // Redirect ke Xendit invoice URL
      location.assign(j.invoice_url);

    } catch (e) {
      console.error("[create-invoice]", e);
      if (btn) btn.disabled = false;
      if (msg) {
        msg.className = "small mt-3 text-danger";
        msg.textContent = "Gagal membuat invoice. Coba lagi beberapa saat.";
      }
    }
  });

})();
