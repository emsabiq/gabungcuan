export const config = { runtime: 'edge' };

export default async function handler() {
  const ok = {
    APP_SCRIPT_URL: !!process.env.APP_SCRIPT_URL,
    BRIDGE_SECRET:  !!process.env.BRIDGE_SECRET,
    SESSION_TTL_SECS: !!process.env.SESSION_TTL_SECS,
    ASSET_MAP_JSON:  isValidJsonEnv(process.env.ASSET_MAP_JSON)
  };
  return json({ ok, runtime: 'edge' });
}

function isValidJsonEnv(s){ if (!s) return false; try { JSON.parse(s); return true; } catch { return false; } }
function json(o,s=200){ return new Response(JSON.stringify(o),{ status:s, headers:{'Content-Type':'application/json','Cache-Control':'no-store'} }); }
