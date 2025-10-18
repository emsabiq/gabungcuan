export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const BRIDGE_SECRET = process.env.BRIDGE_SECRET;
    const ASSET_MAP_JSON = process.env.ASSET_MAP_JSON;
    if (!BRIDGE_SECRET || !ASSET_MAP_JSON) {
      return boom('missing_env', { BRIDGE_SECRET: !!BRIDGE_SECRET, ASSET_MAP_JSON: !!ASSET_MAP_JSON });
    }

    const cookies = req.headers.get('cookie') || '';
    const sess = getCookie(cookies, '__sess');
    if (!sess) return text('No session', 401);

    const parts = sess.split('.');
    if (parts.length !== 5) return text('Bad session', 401);
    const [uaH, expStr, rnd, productId, sig] = parts;

    const payload = `${uaH}.${expStr}.${rnd}.${productId}`;
    const expect = await hmac(BRIDGE_SECRET, payload);
    if (sig !== expect) return text('Bad sig', 401);

    const nowUaH = await sha256b64url(req.headers.get('user-agent') || '');
    if (uaH !== nowUaH) return text('UA mismatch', 401);

    if (Math.floor(Date.now()/1000) > Number(expStr)) return text('Session expired', 401);

    let map={}; try { map = JSON.parse(ASSET_MAP_JSON); } catch { return boom('bad_asset_map'); }
    const origin = map[productId];
    if (!origin) return text('Unknown product', 404);

    const up = await fetch(origin, { headers: { 'User-Agent': 'Vercel-Gate/1.0' } });
    if (!up.ok) return text('Origin fetch fail', 502);

    const h = new Headers(up.headers);
    h.set('Cache-Control', 'no-store');
    h.set('Content-Disposition', 'inline; filename="content"');
    h.append('Set-Cookie', '__sess=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/');

    return new Response(up.body, { status:200, headers:h });
  } catch (e) {
    return boom('unhandled', { message: String(e?.message || e) });
  }
}

/* utils */
function getCookie(c,n){ const m=c.match(new RegExp(`(?:^|; )${n}=([^;]*)`)); return m?decodeURIComponent(m[1]):''; }
function text(t,s=200){ return new Response(t,{status:s,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}}); }
function boom(code, detail){ return new Response(JSON.stringify({ ok:false, error:code, detail }), { status:500, headers:{'Content-Type':'application/json','Cache-Control':'no-store'} }); }
async function sha256b64url(s){ const d=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return b64url(new Uint8Array(d)); }
async function hmac(secret,msg){ const key=await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']); const sig=await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(msg))); return b64url(new Uint8Array(sig)); }
function b64url(buf){ let b=''; buf.forEach(x=>b+=String.fromCharCode(x)); return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
