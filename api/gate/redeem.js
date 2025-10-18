export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const ticket = url.searchParams.get('ticket');
  if (!ticket) return json({ ok:false, error:'no_ticket' }, 400);

  const APP_SCRIPT_URL = process.env.APP_SCRIPT_URL; // https://script.google.com/.../exec
  const BRIDGE_SECRET  = process.env.BRIDGE_SECRET;  // sama dgn di GAS & Worker
  const SESSION_TTL    = parseInt(process.env.SESSION_TTL_SECS || '120', 10);

  // Minta Apps Script apakah ticket valid & produk apa
  const r = await fetch(`${APP_SCRIPT_URL}?action=access`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ token: ticket })
  });
  if (!r.ok) return json({ ok:false, error:'bridge_fail' }, 502);
  const j = await r.json();
  if (!j.ok || !j.product_id) return json({ ok:false, error: j.error || 'invalid_ticket' }, 403);

  const productId = j.product_id;

  // Buat session cookie single-use berbasis UA + expiry + productId
  const ua  = req.headers.get('user-agent') || '';
  const uaH = await sha256b64url(ua);
  const exp = Math.floor(Date.now()/1000) + SESSION_TTL;
  const rnd = b64url(crypto.getRandomValues(new Uint8Array(8)));
  const payload = `${uaH}.${exp}.${rnd}.${productId}`;
  const sig = await hmac(BRIDGE_SECRET, payload);
  const sessVal = `${payload}.${sig}`;

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/api/gate/view',
      'Set-Cookie': `__sess=${sessVal}; Max-Age=${SESSION_TTL}; HttpOnly; Secure; SameSite=Lax; Path=/`,
      'Cache-Control': 'no-store'
    }
  });
}

/* utils */
function json(o,s=200){ return new Response(JSON.stringify(o),{ status:s, headers:{'Content-Type':'application/json','Cache-Control':'no-store'} }); }
async function sha256b64url(s){ const d=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return b64url(new Uint8Array(d)); }
async function hmac(secret,msg){ const key=await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']); const sig=await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(msg))); return b64url(new Uint8Array(sig)); }
function b64url(buf){ let b=''; buf.forEach(x=>b+=String.fromCharCode(x)); return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
