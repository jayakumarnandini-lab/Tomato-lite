// scripts/db-setup.mjs — run with:  npm run db:setup
// Applies db/schema.sql, then seeds 1 restaurant + 42 reviews spread over ~6 weeks.
// Safe to re-run: it starts by dropping tables.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // 1) Apply schema, runnign each statement in turn (the file only contains them).
  const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  for (const statement of schema.split(";")) {
    const trimmed = statement.trim();
    if (trimmed) {
      await sql.query(trimmed);
    }
  }
  console.log("✓ schema applied (2 tables: restaurants, reviews)");

  // 2) Reset data (idempotent: re-running starts clean)
  await sql`DROP TABLE IF EXISTS tmp_placeholder`; // noop to keep http connection warm
  await sql.query("TRUNCATE reviews, restaurants RESTART IDENTITY CASCADE;");

  // 3) Seed the one restaurant we care about
  const rows = await sql`
    INSERT INTO restaurants (name, cuisine, area)
    VALUES ('California Burrito', 'Mexican', 'Sector 32')
    RETURNING id, name, cuisine, area;
  `;
  const r = rows[0];
  console.log(`✓ restaurant: #${r.id} ${r.name} — ${r.cuisine}, ${r.area}`);
  const restaurantId = r.id;

  // 4) Seed reviews. [rating, comment, daysAgo, hour, minute]
  //    Deterministic on purpose — same seed every time => same demo.
  const reviews = [
    [5, "Paneer burrito is unreal", 8, 19, 14],
    [4, "Good, but slow service", 6, 13, 2],
    [4, "Solid. Would repeat.", 2, 21, 30],
    [5, "Would come again tomorrow", 0, 11, 45],
    [4, "Chunky salsa, generous cheese", 1, 18, 20],
    [3, "Fine for a quick lunch", 4, 12, 30],
    [3, "Portion felt smaller this time", 6, 20, 5],
    [2, "Beans were watery today", 10, 13, 40],
    [4, "Quesadilla kids loved", 12, 19, 0],
    [5, "Best Drive-through meal in sector 32", 13, 21, 10],
    [3, "Packed at 1pm, expect wait", 15, 13, 15],
    [4, "Cilantro rice tastes great", 16, 18, 50],
    [1, "Found a hair in my wrap", 18, 14, 20],
    [4, "Bell pepper crunch is nice", 20, 19, 35],
    [2, "Forgot my guac, twice", 21, 12, 55],
    [5, "Smoky chipotle mayo", 23, 20, 40],
    [3, "Okay-ish, pricey for the size", 25, 13, 5],
    [4, "Fresh salad bases offerings", 27, 18, 25],
    [2, "Too spicy, no milder option", 29, 19, 55],
    [4, "Staff fixed my order quickly", 31, 12, 45],
    [5, "Crunchy shell, or soft, either wins", 33, 20, 15],
    [3, "AC down, was stuffy inside", 35, 14, 10],
    [4, "Recommend the chickpea bowl", 37, 18, 5],
    [2, "Indoor seating is cramped", 39, 13, 25],
    [5, "Birthday group of 8, all happy", 41, 21, 0],
    [4, "Cheesy garlic bread side = wow", 43, 19, 45],
    [3, "Turnover time at tables is slow", 45, 12, 15],
    [2, "My order arrived cold", 47, 20, 55],
    [4, "Sour cream portion is generous", 49, 13, 35],
    [5, "Friday night packed, but worth it", 51, 21, 40],
    [1, "Waited 25 minutes for a wrap", 53, 14, 45],
    [4, "Thai basil crema is a surprise", 55, 18, 10],
    [3, "Could use more veggie options", 57, 19, 20],
    [4, "clean toilets, well lit", 59, 12, 5],
    [5, "The mango salsa is genius", 61, 20, 30],
    [3, "Vert good, will retry after a month", 63, 13, 55],
    [4, "PORTIONS large, easy to share", 65, 18, 35],
    [2, "Music too loud to talk", 67, 19, 5],
    [4, "Quick service despite rush", 69, 12, 20],
    [5, "Ellss-chaotic, cozy perfection", 71, 21, 15],
    [4, "Nachos loaded properly, not skimpy", 73, 14, 55],
    [3, "Drinks menu needs work", 75, 18, 45],
  ];

  // Build ONE multi-row INSERT (fast — a single round trip to Neon).
  const esc = (s) => s.replace(/'/g, "''");
  const values = reviews.map(([rating, comment, daysAgo, hour, minute]) => {
    const when = new Date();
    when.setDate(when.getDate() - daysAgo);
    when.setHours(hour, minute, 0, 0);
    return `(${restaurantId}, ${rating}, '${esc(comment)}', '${when.toISOString()}')`;
  });

  await sql.query(
    `INSERT INTO reviews (restaurant_id, rating, comment, created_at) VALUES ${values.join(",")};`
  );
  console.log(`✓ seeded ${reviews.length} reviews (spread over the last ~75 days)`);

  // 5) Show what landed
  const histogram = await sql`
    SELECT rating, COUNT(*)::int AS count FROM reviews GROUP BY rating ORDER BY rating;
  `;
  const latest = await sql`
    SELECT id, rating, comment, created_at FROM reviews ORDER BY created_at DESC LIMIT 5;
  `;
  const stats = await sql`
    SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS total FROM reviews;
  `;
  console.log("\nRating histogram:", histogram.map((h) => `${h.rating}★ x${h.count}`).join("  "));
  console.log("Facts stored (NOT stored): avg=", stats[0].avg_rating, "count=", stats[0].total, " — computed just now, by askers, never saved");
  console.log("\nNewest 5 reviews:");
  for (const row of latest) {
    console.log(`  ${row.id}  ${row.rating}★  ${new Date(row.created_at).toLocaleString()}  ${row.comment}`);
  }
}

main().catch((err) => {
  console.error("db setup FAILED:", err);
  process.exit(1);
});
