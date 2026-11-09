// POST /api/reviews — save a review.
// The ONLY logic in this file is validation + one INSERT.
// Backend validation is security — it stops everyone who talks to the API
// directly, bypassing our star picker (anyone with a terminal can do this).
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL ?? "");

export async function POST(request: Request) {
  let body: { restaurantId?: unknown; rating?: unknown; comment?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // Validation order is part of the contract (module 3 spec):
  // 1) rating is an integer from 1 to 5
  if (
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return Response.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // 2) comment is a non-empty string after trimming whitespace
  if (typeof body.comment !== "string" || body.comment.trim() === "") {
    return Response.json({ error: "Comment cannot be empty." }, { status: 400 });
  }

  // 3) restaurantId must refer to a restaurant that actually exists (DB lookup)
  if (typeof body.restaurantId !== "number") {
    return Response.json(
      { error: "restaurantId must be a number." },
      { status: 400 }
    );
  }
  const found = await sql.query(
    "SELECT id FROM restaurants WHERE id = $1;",
    [body.restaurantId]
  );
  if (found.length === 0) {
    return Response.json(
      { error: `Restaurant ${body.restaurantId} does not exist.` },
      { status: 400 }
    );
  }

  // Validated. Insert exactly one row — nothing else in the database changes.
  const rows = await sql.query(
    "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id;",
    [body.restaurantId, body.rating, body.comment.trim()]
  );

  return Response.json(
    { success: true, reviewId: rows[0].id as number },
    { status: 201 }
  );
}
