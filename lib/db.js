import { RULES0, buildCatalog } from "@/lib/seed";
import { makeHash } from "@/lib/hash";

export const KEYS = ["user", "user_preference", "audit_log", "destination", "activity", "accommodation", "meal_option", "transport_option", "itinerary", "itinerary_item", "trip_budget", "expense", "availability", "booking", "transaction", "route", "pdf_report"];
export const PK = { user: "UserID", user_preference: "PreferenceID", audit_log: "AuditLogID", destination: "DestinationID", activity: "ActivityID", accommodation: "AccommodationID", meal_option: "MealID", transport_option: "TransportID", itinerary: "ItineraryID", itinerary_item: "ItineraryItemID", trip_budget: "BudgetID", expense: "ExpenseID", availability: "AvailabilityID", booking: "BookingID", transaction: "TransactionID", route: "RouteID", pdf_report: "ReportID" };
const STORE = "bitips_db_v2";
export const now = () => new Date().toISOString();

export function insert(db, t, row) {
  db._seq[t] = (db._seq[t] || 0) + 1;
  const r = { [PK[t]]: db._seq[t], ...row };
  db[t].push(r);
  return r;
}
export function audit(db, uid, type, desc, status = "Success") {
  insert(db, "audit_log", { UserID: uid, ActionType: type, ActionDescription: desc, ActionDateTime: now(), IPAddress: "127.0.0.1 (simulated)", ActivityStatus: status });
}
export async function freshDb() {
  const db = { _seq: {}, system_rule: structuredClone(RULES0) };
  KEYS.forEach((k) => (db[k] = []));
  buildCatalog(db, insert);
  const mk = async (f, l, e, pw, role) => insert(db, "user", { FirstName: f, LastName: l, Email: e, PasswordHash: await makeHash(pw), PhoneNumber: "", UserRole: role, AccountStatus: "Active", CreatedAt: now(), UpdatedAt: null });
  await mk("Demo", "Traveler", "demo@bitips.ph", "bitips123", "Traveler");
  const a = await mk("System", "Administrator", "admin@bitips.ph", "admin1234", "Administrator");
  audit(db, a.UserID, "SYSTEM_INIT", "Database initialised with pilot catalog");
  return db;
}
export const loadDb = () => { try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; } };
export const saveDb = (db) => { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch {} };
export const resetDb = () => { try { localStorage.removeItem(STORE); } catch {} };
