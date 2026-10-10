// Sandbox Payment Gateway (external entity of Process 7.0). Test tokens only; live payments are refused.
const METHODS = ["GCash", "Maya", "Card"];

export async function POST(req) {
  let b; try { b = await req.json(); } catch { return Response.json({ status: "Rejected", error: "Invalid JSON" }, { status: 400 }); }
  const { method, token, amount } = b;
  if (!/^tok_test_/.test(token || "")) return Response.json({ status: "Rejected", error: "Live payments are disabled. Use a sandbox test token." }, { status: 400 });
  if (!METHODS.includes(method) || !(amount > 0)) return Response.json({ status: "Rejected", error: "Invalid method or amount" }, { status: 400 });
  await new Promise((r) => setTimeout(r, 700));
  const declined = token.endsWith("_declined") || req.headers.get("x-simulate-decline");
  return Response.json({ status: declined ? "Failed" : "Success", reference: "SBX-" + Date.now().toString(36).toUpperCase(), message: declined ? "Simulated decline. No funds moved." : "Simulated approval. No funds moved." });
}
