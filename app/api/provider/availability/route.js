// Mock Provider API (external entity of Process 6.0). Deterministic simulated inventory.
const h = (s) => { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) >>> 0; return x; };

export async function POST(req) {
  if (req.headers.get("x-simulate-outage")) return Response.json({ error: "Provider timeout (simulated)" }, { status: 503 });
  let body; try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const items = Array.isArray(body.items) ? body.items.slice(0, 5000) : [];
  const results = items.map(({ type, id, date }) => {
    const v = h(`${type}:${id}:${date}`);
    const status = v % 17 === 0 ? "Unavailable" : v % 7 === 0 ? "Limited" : "Available";
    return { type, id, date, status, qty: status === "Unavailable" ? 0 : status === "Limited" ? 3 : 20 };
  });
  return Response.json({ source: "mock-provider", checkedAt: new Date().toISOString(), results });
}
