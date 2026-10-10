# BITIPS — Next.js + Tailwind (aligned with *BITIPS_Final_revised.docx*)

Budget-Based Intelligent Travel Itinerary Planning System. Desktop web app + Admin Portal, pilot destinations Bacolod, Silay and Mambukal.

## Run
```bash
npm install
npm run dev        # http://localhost:3000   (needs a Node server: the provider & payment adapters are API routes)
```
| Role | Login |
|---|---|
| Traveler | `demo@bitips.ph` / `bitips123` (or register) |
| Administrator | `admin@bitips.ph` / `admin1234` → redirected to `/admin` |

Press **F** on an itinerary to simulate a provider outage + a declined payment. Press **A** to add an activity.

## Traceability to the document
| Document | Implementation |
|---|---|
| **Objectives / Scope: user management** (traveler + administrator, profiles, preference weights) | `/login` (sign in + register: first/last name, email, phone, salted SHA-256 hash), `/onboarding`, `/profile`, `/settings`, role routing in `components/Providers.js`, `/admin/users` (roles, suspend) |
| **Process 2.0 Travel Master Data** with data-status labels | `/admin/catalog` — add/edit/archive destinations & POIs, activities, accommodations, meals, transport fares. Badges: Admin-Maintained / Estimated / Cached / Live |
| **Process 3.0 Budget Allocation & Expense Computation** | `lib/engine.js` `computeBudget`, `refreshBudget`; category budgets from admin allocation rules (`TRIP_BUDGET`), currency snapshot (`DisplayCurrency`, `ExchangeRate`), deficit + status; `/budget` |
| **Process 4.0 Rule-based generation, validation, suggestions** | `generate()` filters by preferences, sequences Morning/Afternoon/Evening blocks, enforces **opening/closing hours**, durations and **transit times**; `suggestAdjustments()` ranks cheaper alternatives by **preference match, budget benefit, schedule fit, data completeness, route fit** (weights editable in `/admin/settings`); traveler **accepts or rejects each** suggestion in the Optimize modal; nothing is removed without consent; plan is recalculated and revalidated |
| **Process 5.0 Map & Routes** (Leaflet + OpenStreetMap) | `components/MapView.js`: OSM tiles, numbered markers, route polylines with km/min, worldwide pan + search (Nominatim), Boat-access places show the "route unavailable · ocean boundary" state; `/map`; `ROUTE` rows rebuilt on every change |
| **Process 6.0 Provider Inventory Query** (Mock Provider API, cache, catalog fallback) | `app/api/provider/availability/route.js`; `lib/provider.js` writes `AVAILABILITY`; outage → cached records → catalog status; "Check availability" button; unavailable items are never scheduled |
| **Process 7.0 Digital Payment** (mock GCash, Maya, card; test tokens) | `/trips/[id]/checkout`, `app/api/payment/charge/route.js` (rejects non-`tok_test_` tokens). Creates `BOOKING` (Pending→Confirmed), `TRANSACTION`, `EXPENSE` rows; itinerary becomes **Booked**; receipt page |
| **Process 8.0 Admin Dashboard & Analytics** | `/admin`: report request (date range) → aggregation over users, itineraries, budgets, transactions, audit → destination popularity, preference mix, spending trends, peak dates; CSV export |
| **Audit log (D7)** | `/admin/audit`; every login, registration, preference/profile change, catalog edit, booking, PDF export and rule change is logged |
| **Process 9.0 PDF export** | `lib/pdf.js`: schedule, route overview, itemised expenses, simulated transaction reference; records a `PDF_REPORT` row |
| **ERD / Data Dictionary (17 entities, 3NF)** | `db/schema.sql` is **generated directly from the dictionary tables** (types, PK/FK/UQ/NN); `lib/db.js` keeps the same 17 tables and field names; `db/seed.sql` = pilot catalog |
| **Out of scope** (no live payments, no GDS/PMS, no generative AI, no turn-by-turn) | Respected: payments are sandbox-only, the generator is deterministic, no AI model is used |
| **Limitations** (curated pilot coverage) | Dumaguete is map-browse only ("Map browsing only" screen) |

### Extensions beyond the dictionary (flagged `EXTENSION` in `schema.sql`)
`DESTINATION.Accessibility`, `*.DataStatus`, `MEAL_OPTION.Cuisine`, `ITINERARY.Origin / NumberOfTravelers`, `TRIP_BUDGET.DisplayCurrency / ExchangeRate`, `USER_PREFERENCE.TravelPace / DisplayCurrency / Language / Notify*`. These carry intake parameters and Figma settings the dictionary doesn't list.

## Honest limitations
- **Storage**: the 17 tables live in browser `localStorage` (`lib/db.js`), not a SQL server. `db/schema.sql` + `db/seed.sql` are ready for MySQL; swap `commit()` in `Providers.js` for API calls to move to a real DB. Auth is client-side, so it is not secure for production.
- **Catalog coordinates and prices are approximate seed data**; Administrators are expected to maintain them. Verify before using for real planning.
- Inter-city transport (origin → destination) is not modelled; transport cost is local legs priced from `TRANSPORT_OPTION` fares.
- **Not built**: the Mobile Traveler App module, and the testing/documentation deliverables (WBS 5.x).
- Not yet run through `next build` in my environment (no network): JSX syntax, imports, the engine and both API routes were checked, but expect to fix small issues on first run.
