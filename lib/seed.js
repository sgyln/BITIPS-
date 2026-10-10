// Pilot catalog (D2). Coordinates are approximate seed data: Administrators maintain them in the Admin Portal.
export const RULES0 = {
  speedKmh: 25, circuity: 1.3, mealMinutes: 60, maxDays: 7,
  breakfastStart: 480, dinnerStart: 1110, minMorning: 570, minAfternoon: 780, minEvening: 1020,
  tricycleCapacity: 3, taxiCapacity: 4,
  alloc: { lodging: 0.4, meals: 0.25, activities: 0.2, transport: 0.1, other: 0.05 },
  weights: { pref: 0.3, budget: 0.3, schedule: 0.15, data: 0.1, route: 0.15 },
};
export const CURS = { PHP: { s: "₱", r: 1 }, USD: { s: "$", r: 0.0175 }, EUR: { s: "€", r: 0.016 }, JPY: { s: "¥", r: 2.6 } };

const B = "Bacolod Metro", S = "Silay", M = "Mambukal";
// key, name, region, city, lat, lng, kind, access
const PLACES = [
  ["bac", "Bacolod City", B, "Bacolod City", 10.6713, 122.9511, "City"],
  ["cath", "San Sebastian Cathedral", B, "Bacolod City", 10.6763, 122.9512],
  ["plaza", "Bacolod Public Plaza", B, "Bacolod City", 10.6764, 122.9517],
  ["lagoon", "Capitol Park and Lagoon", B, "Bacolod City", 10.6815, 122.957],
  ["negmus", "The Negros Museum", B, "Bacolod City", 10.6747, 122.9585],
  ["art", "Bacolod Art District", B, "Bacolod City", 10.669, 122.956],
  ["mkt", "Libertad Public Market", B, "Bacolod City", 10.6679, 122.947],
  ["ruins", "The Ruins", B, "Talisay City", 10.7371, 122.9682],
  ["camp", "Campuestohan Highland Resort", B, "Talisay City", 10.7285, 122.989],
  ["lakawon", "Lakawon Island Jetty", B, "Cadiz City", 11.048, 123.225, "POI", "Boat"],
  ["street", "Lacson Street Food Stalls", B, "Bacolod City", 10.682, 122.9535],
  ["carin", "Libertad Carinderia", B, "Bacolod City", 10.662, 122.948],
  ["cafe", "Downtown Café", B, "Bacolod City", 10.677, 122.9545],
  ["gard", "Garden Hotel", B, "Bacolod City", 10.675, 122.958],
  ["manok", "Manokan Country", B, "Bacolod City", 10.6606, 122.941],
  ["seaf", "Reclamation Seafood Grill", B, "Bacolod City", 10.658, 122.9395],
  ["roof", "Rooftop Lounge", B, "Bacolod City", 10.6755, 122.9525],
  ["inn", "Downtown Budget Inn", B, "Bacolod City", 10.668, 122.95],
  ["city", "City Boutique Hotel", B, "Bacolod City", 10.6725, 122.9535],
  ["beach", "Beachfront Resort", B, "Bacolod City", 10.7, 122.93],
  ["seares", "Seaside Resort", B, "Bacolod City", 10.69, 122.925],
  ["sil", "Silay Heritage District", S, "Silay City", 10.7997, 122.9739, "City"],
  ["balay", "Balay Negrense", S, "Silay City", 10.801, 122.9745],
  ["sugar", "Sugar Museum", S, "Silay City", 10.802, 122.9712],
  ["ances", "Silay Ancestral Houses", S, "Silay City", 10.7995, 122.9731],
  ["sdpc", "San Diego Pro-Cathedral", S, "Silay City", 10.7996, 122.9749],
  ["silcafe", "Silay Heritage Café", S, "Silay City", 10.7992, 122.9736],
  ["silinn", "Silay Heritage Inn", S, "Silay City", 10.8001, 122.9741],
  ["silodge", "Silay Budget Lodge", S, "Silay City", 10.7985, 122.9728],
  ["mam", "Mambukal Mountain Resort", M, "Murcia", 10.513, 123.076, "City"],
  ["falls", "Seven Falls Trail", M, "Murcia", 10.51, 123.074],
  ["hot", "Mambukal Hot Springs", M, "Murcia", 10.5135, 123.0765],
  ["garden", "Mambukal Garden Trail", M, "Murcia", 10.514, 123.077],
  ["mcant", "Mambukal Resort Canteen", M, "Murcia", 10.5128, 123.0758],
  ["mcott", "Mambukal Cottage", M, "Murcia", 10.5133, 123.0762],
  ["mcabin", "Mambukal Cabin", M, "Murcia", 10.5126, 123.0766],
  ["dgt", "Dumaguete City", "Dumaguete", "Dumaguete City", 9.3068, 123.3054, "City"],
];
// place, name, type, cost, minutes, open, close, description, data status
const ACTS = [
  ["cath", "Heritage Church Visit", "Heritage", 0, 60, "06:00", "18:00", "San Sebastian Cathedral and the old plaza church.", "Admin-Maintained"],
  ["plaza", "Old Town Walking Tour", "Heritage", 200, 120, "08:00", "17:00", "Guided walk through the heritage district.", "Admin-Maintained"],
  ["negmus", "Negros Museum Tour", "Heritage", 120, 120, "09:00", "17:00", "Local art, culture and history exhibits.", "Admin-Maintained"],
  ["art", "Art District Gallery Walk", "Heritage", 80, 60, "10:00", "18:00", "Murals and small galleries downtown.", "Admin-Maintained"],
  ["lagoon", "Plaza & Lagoon Walk", "Nature", 0, 60, "05:00", "22:00", "Free, easy walk around the lagoon park.", "Estimated"],
  ["ruins", "Sunset at The Ruins", "Heritage", 100, 60, "08:00", "19:00", "Golden-hour visit to the famous mansion ruins.", "Admin-Maintained"],
  ["camp", "Campuestohan Highland Tour", "Nature", 500, 180, "08:00", "18:00", "Highland resort with views and gardens.", "Admin-Maintained"],
  ["lakawon", "Lakawon Island Day Tour", "Coastal", 1800, 300, "07:00", "16:00", "Boat tour of the island and sandbars.", "Estimated"],
  ["mkt", "Piaya & Pasalubong Market Tour", "Culinary", 250, 90, "08:00", "17:00", "Taste local delicacies and shop for pasalubong.", "Estimated"],
  ["street", "Night Market Crawl", "Culinary", 350, 120, "17:00", "22:00", "Street-food tasting crawl.", "Estimated"],
  ["balay", "Balay Negrense Visit", "Heritage", 120, 90, "09:00", "17:00", "Heritage house museum of a sugar baron.", "Admin-Maintained"],
  ["sugar", "Sugar Museum Tour", "Heritage", 150, 120, "09:00", "17:00", "Sugar-era history, tools and stories.", "Admin-Maintained"],
  ["ances", "Ancestral House Circuit", "Heritage", 450, 180, "08:00", "17:00", "Walk the ancestral houses with a local guide.", "Admin-Maintained"],
  ["sdpc", "San Diego Pro-Cathedral Visit", "Heritage", 0, 45, "06:00", "18:00", "Historic church on the plaza.", "Admin-Maintained"],
  ["falls", "Seven Falls Trail", "Nature", 600, 240, "07:00", "16:00", "Resort trail with waterfalls.", "Admin-Maintained"],
  ["hot", "Hot Springs Soak", "Nature", 120, 90, "06:00", "21:00", "Hot spring pools in the resort.", "Admin-Maintained"],
  ["garden", "Garden Trail Walk", "Nature", 0, 60, "06:00", "18:00", "Easy trail through resort gardens.", "Estimated"],
];
// place, name, type, price, cuisine, description, data status
const MEALS = [
  ["carin", "Carinderia Breakfast", "Breakfast", 120, "Local Cuisine", "Rice meals at a neighborhood carinderia.", "Estimated"],
  ["cafe", "Café Breakfast Set", "Breakfast", 280, "Café", "Coffee and breakfast set downtown.", "Estimated"],
  ["mkt", "Public Market Breakfast", "Breakfast", 320, "Local Cuisine", "Breakfast among the market stalls.", "Estimated"],
  ["gard", "Hotel Buffet Breakfast", "Breakfast", 650, "Hotel Dining", "Full buffet at the hotel.", "Estimated"],
  ["manok", "Chicken Inasal Dinner", "Dinner", 260, "Local Cuisine", "Bacolod's grilled chicken signature.", "Estimated"],
  ["seaf", "Seaside Seafood Dinner", "Dinner", 780, "Local Cuisine", "Fresh seafood by the bay.", "Estimated"],
  ["roof", "Hotel Rooftop Dinner", "Dinner", 950, "Hotel Dining", "Rooftop dinner with city views.", "Estimated"],
  ["street", "Street Food Grill Dinner", "Dinner", 200, "Street Food", "Grilled street food by the stalls.", "Estimated"],
  ["silcafe", "Heritage Café Breakfast", "Breakfast", 250, "Café", "Café breakfast in the heritage district.", "Estimated"],
  ["silodge", "Silay Carinderia Breakfast", "Breakfast", 100, "Local Cuisine", "Local rice meals.", "Estimated"],
  ["silcafe", "Heritage Café Dinner", "Dinner", 420, "Café", "Dinner at the heritage café.", "Estimated"],
  ["ances", "Silay Kapehan Dinner", "Dinner", 220, "Local Cuisine", "Home-style dinner near the ancestral houses.", "Estimated"],
  ["mcant", "Resort Canteen Breakfast", "Breakfast", 150, "Local Cuisine", "Canteen breakfast.", "Estimated"],
  ["mcott", "Cottage Breakfast Set", "Breakfast", 300, "Hotel Dining", "Breakfast set at the cottage.", "Estimated"],
  ["mcant", "Resort Canteen Dinner", "Dinner", 230, "Local Cuisine", "Canteen dinner.", "Estimated"],
  ["mcott", "Cottage Dinner Set", "Dinner", 450, "Hotel Dining", "Dinner set at the cottage.", "Estimated"],
];
// place, name, type, price per night, rating
const STAYS = [
  ["inn", "Downtown Budget Inn", "Budget Inn", 900, 3.8],
  ["gard", "Garden Hotel Twin Room", "Hotel", 2500, 4.2],
  ["city", "City Boutique Hotel", "Hotel", 2800, 4.4],
  ["beach", "Beachfront Resort Suite", "Resort", 4800, 4.5],
  ["seares", "Seaside Resort Suite", "Resort", 5600, 4.7],
  ["silodge", "Silay Budget Lodge", "Budget Inn", 800, 3.7],
  ["silinn", "Silay Heritage Inn", "Hotel", 2200, 4.3],
  ["mcabin", "Mambukal Cabin", "Budget Inn", 900, 3.9],
  ["mcott", "Mambukal Cottage", "Hotel", 1800, 4.1],
];
const TRANS = [["Jeepney", "Local Jeepney", 15], ["Tricycle", "Local Tricycle", 60], ["Taxi", "Taxi / ride-hailing", 150]];

export function buildCatalog(db, insert) {
  const id = {};
  PLACES.forEach((p) => {
    const r = insert(db, "destination", {
      DestinationName: p[1], Country: "Philippines", Region: p[2], City: p[3],
      Description: p[6] === "City" ? `${p[1]} (main destination)` : `${p[1]}, ${p[3]}`,
      Latitude: p[4], Longitude: p[5], Status: p[0] === "dgt" ? "Limited" : "Active", Accessibility: p[7] || "Road",
    });
    id[p[0]] = r.DestinationID;
  });
  ACTS.forEach((a) => insert(db, "activity", { DestinationID: id[a[0]], ActivityName: a[1], ActivityType: a[2], Description: a[7], Duration: a[4], ActivityCost: a[3], OpeningTime: a[5], ClosingTime: a[6], AvailabilityStatus: "Available", DataStatus: a[8] }));
  MEALS.forEach((m) => insert(db, "meal_option", { DestinationID: id[m[0]], MealName: m[1], MealType: m[2], Description: m[5], Price: m[3], AvailabilityStatus: "Available", Cuisine: m[4], DataStatus: m[6] }));
  STAYS.forEach((s) => insert(db, "accommodation", { DestinationID: id[s[0]], AccommodationName: s[1], AccommodationType: s[2], Address: "", ContactNumber: "", PricePerNight: s[3], Rating: s[4], AvailabilityStatus: "Available", DataStatus: "Admin-Maintained" }));
  ["bac", "sil", "mam"].forEach((c) => TRANS.forEach((t) => insert(db, "transport_option", { DestinationID: id[c], TransportType: t[0], ProviderName: t[1], RouteDescription: "Local trip between stops", EstimatedDuration: null, Fare: t[2], AvailabilityStatus: "Available", DataStatus: "Admin-Maintained" })));
}
