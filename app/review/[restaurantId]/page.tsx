"use client";
// Screen 1 — /review/[restaurantId]
// Collects exactly three things and hands them to POST /api/reviews.
// No validation logic invented here: if the backend says 400, we show ITS message.

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Fixed color coding per star position: 1-2 red, 3 yellow, 4-5 green.
function starColor(position: number): string {
  if (position <= 2) return "text-red-500";
  if (position === 3) return "text-yellow-400";
  return "text-green-500";
}

export default function ReviewPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Restaurant not found.");
        return res.json() as Promise<{ name: string }>;
      })
      .then((d) => setRestaurantName(d.name))
      .catch((e: Error) => setRestaurantError(e.message));
  }, [restaurantId]);

  const canSubmit = selected >= 1 && comment.trim() !== "" && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: Number(restaurantId),
          rating: selected,
          comment: comment.trim(),
        }),
      });
      if (res.status === 201) {
        setThanks(true);
        setTimeout(() => router.push(`/restaurant/${restaurantId}`), 700);
        return;
      }
      if (res.status === 400) {
        const body = await res.json();
        setApiError(body.error ?? "The backend rejected this."); // display what the backend said
        return;
      }
      setApiError(`Unexpected response (HTTP ${res.status}).`);
    } catch {
      setApiError("Could not reach the kitchen (network error).");
    } finally {
      setSubmitting(false);
    }
  }

  if (restaurantError) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-8">
        <div className="text-center space-y-4 anim-fade-up">
          <p className="text-2xl font-bold text-red-400">{restaurantError}</p>
          <Link href="/restaurant/1" className="text-orange-400 underline">
            ← Back to the restaurant page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* restaurant name at the top, so the user knows what they are reviewing */}
        <Link
          href={`/restaurant/${restaurantId}`}
          className="mb-6 inline-block text-sm font-semibold text-neutral-400 transition hover:text-orange-400"
        >
          ← Back to the restaurant page
        </Link>
        <h1 className="anim-fade-up text-3xl font-black md:text-4xl">
          Review{" "}
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            {restaurantName ?? "…"}
          </span>
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8 anim-fade-up">
          {/* star picker, 1 to 5 */}
          <div>
            <label className="mb-3 block text-sm font-bold uppercase tracking-widest text-neutral-400">
              Your stars
            </label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((position) => {
                const active = (hovered || selected) >= position;
                return (
                  <button
                    key={position}
                    type="button"
                    onMouseEnter={() => setHovered(position)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setSelected(position)}
                    aria-label={`${position} star${position === 1 ? "" : "s"}`}
                    className={`text-5xl transition-transform anim-pop ${
                      active ? `${starColor(position)} scale-110` : "text-neutral-700 hover:scale-105"
                    }`}
                  >
                    ★
                  </button>
                );
              })}
            </div>
            <p className="mt-2 h-6 text-sm font-semibold">
              {selected >= 1 && (
                <span className={starColor(selected)}>
                  {selected <= 2
                    ? "Rough — noted honestly (red)"
                    : selected === 3
                      ? "Mixed experience (yellow)"
                      : "Great experience (green)"}
                </span>
              )}
            </p>
          </div>

          {/* comment box */}
          <div>
            <label htmlFor="comment" className="mb-3 block text-sm font-bold uppercase tracking-widest text-neutral-400">
              Your comment
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="What did you think of the paneer burrito?"
              className="w-full rounded-2xl border border-neutral-700 bg-neutral-900 p-4 text-lg outline-none transition focus:border-orange-400"
            />
          </div>

          {/* backend's error, shown verbatim (we invent nothing) */}
          {apiError && (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 font-semibold text-red-300">
              The kitchen said: {apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 py-4 text-lg font-black text-white shadow-lg transition enabled:hover:scale-[1.02] enabled:hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Sending to the kitchen…" : "Submit review"}
          </button>
        </form>
      </div>

      {thanks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80">
          <p className="anim-pop text-5xl font-black text-green-400">Thanks! 🌯</p>
        </div>
      )}
    </main>
  );
}
