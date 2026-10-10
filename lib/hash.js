// Salted SHA-256 (Web Crypto). Stored as "salt$hash" in USER.PasswordHash.
export async function hashPw(pw, salt) {
  const b = new TextEncoder().encode(salt + ":" + pw);
  const h = await crypto.subtle.digest("SHA-256", b);
  return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
export const newSalt = () => Math.random().toString(36).slice(2, 10);
export async function makeHash(pw) { const s = newSalt(); return s + "$" + (await hashPw(pw, s)); }
export async function checkHash(pw, stored) { const [s, h] = String(stored).split("$"); return (await hashPw(pw, s)) === h; }
