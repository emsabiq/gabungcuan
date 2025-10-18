export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    // ===== ENV =====
    const APP_SCRIPT_URL = process.env.APP_SCRIPT_URL;
    const BRIDGE_SECRET  = process.env.BRIDGE_SECRET;
    const SESSION_TTL    = parseInt(process.env.SESSION_TTL_SECS || '120', 10);

    if (!APP_SCRIPT_URL || !BRIDGE_SECRET) {
      return boom('missing_env', { APP_SCRIPT_URL: !!APP_SCRIPT_URL, BRIDGE_SECRET: !!BRIDGE_SECRET });
    }

    // ===== PARAM =====
    const url = new URL(req.url);
    const ticket = url.searchParams.get('ticket');
    if (!ticket) return boom('no_ticket');

    // ===== VALIDATE to GAS =====
    const r = await fetch(`${APP_SCRIPT_URL}?action=access`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ token: ticket })
    });
    if (!r.ok) return boom('bridge_fail', { status: r.status });
    const j = await r.json();
    if (!j.ok || !j.product_id) return boom('invalid_ticket', j);

    const productId = j.product_id;

    // ===== BUILD SESSION COOKIE =====
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
  } catch (e) {
    return boom('unhandled', { message: String(e?.message || e) });
  }
}

/* utils */
function boom(code, detail){ return json({ ok:false, error:code, detail }, 500); }
function json(o,s=200){ return new Response(JSON.stringify(o),{ status:s, headers:{'Content-Type':'application/json','Cache-Control':'no-store'} }); }
async function sha256b64url(s){ const d=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return b64url(new Uint8Array(d)); }
async function hmac(secret,msg){ const key=await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']); const sig=await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(msg))); return b64url(new Uint8Array(sig)); }
function b64url(buf){ let b=''; buf.forEach(x=>b+=String.fromCharCode(x)); return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
