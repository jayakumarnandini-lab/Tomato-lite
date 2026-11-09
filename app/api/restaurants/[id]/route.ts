// GET /api/restaurants/[id] — everything Screen 2 needs, shaped like the screen.
// All three "answers" (average, count, latest) are COMPUTED here at read time.
// There is no average_rating column anywhere — this query IS the average.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL ?? "");

export const dynamic = "force-dynamic"; // always compute fresh, never cache

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isInteger(restaurantId)) {
    return Response.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const restaurants = await sql.query(
    "SELECT name, cuisine, area FROM restaurants WHERE id = $1;",
    [restaurantId]
  );
  if (restaurants.length === 0) {
    return Response.json({ error: "Restaurant not found." }, { status: 404 });
  }
  const r = restaurants[0];

  // computed: AVG(rating) rounded to one decimal — null when no reviews yet
  const stats = await sql.query(
    "SELECT ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*)::int AS total FROM reviews WHERE restaurant_id = $1;",
    [restaurantId]
  );
  const totalReviews = stats[0].total as number;
  const averageRating = totalReviews > 0 ? Number(stats[0].avg_rating) : null;

  // computed: newest review by created_at
  const latestRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 1;",
    [restaurantId]
  );
  const latestReview =
    totalReviews === 0
      ? null
      : {
          id: latestRows[0].id as number,
          rating: latestRows[0].rating as number,
          comment: latestRows[0].comment as string,
          createdAt: new Date(latestRows[0].created_at as string).toISOString(),
        };

  // every review EXCEPT the latest, newest first (page shows latest separately — no double print)
  const olderRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC OFFSET 1;",
    [restaurantId]
  );

  return Response.json({
    name: r.name,
    cuisine: r.cuisine,
    area: r.area,
    averageRating,
    totalReviews,
    latestReview,
    reviews: olderRows.map((row) => ({
      id: row.id as number,
      rating: row.rating as number,
      comment: row.comment as string,
      createdAt: new Date(row.created_at as string).toISOString(),
    })),
  });
}
