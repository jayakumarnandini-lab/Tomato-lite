"use client";
// Screen 2 — /restaurant/[id]
// This file is a DISPLAY LAYER. It fetches GET /api/restaurants/[id] and renders.
// There is no adding, no dividing, no sorting anywhere in this file.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { RestaurantData } from "@/lib/types";

const BURRITO_IMG =
  "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=1600&q=80";

// Star badge colors — display rule only (same family as the picker: 1-2 red, 3 yellow, 4-5 green)
function badgeClass(rating: number): string {
  if (rating <= 2) return "bg-red-500 text-white";
  if (rating === 3) return "bg-yellow-400 text-black";
  return "bg-green-500 text-white";
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// Counter-style animation: welcomes the number from 0 up to what the API said.
function AnimatedRating({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // display easing, not business logic
      setShown(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  // M4 checkpoint: this line ONLY prints the number. It never computes the average.
  return <span className="tabular-nums">{shown.toFixed(1)}</span>;
}

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<RestaurantData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    fetch(`/api/restaurants/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Restaurant not found.");
        return res.json() as Promise<RestaurantData>;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-8">
        <div className="text-center space-y-4 anim-fade-up">
          <p className="text-2xl font-bold text-red-400">{error}</p>
          <Link href="/restaurant/1" className="text-orange-400 underline">
            ← Back to California Burrito
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-8">
        <p className="text-lg text-neutral-400 anim-fade-up">
          The kitchen is computing AVG, COUNT and the sort right now… 🌯
        </p>
      </main>
    );
  }

  const counts = Object.fromEntries(data.ratingCounts.map((c) => [c.rating, c.count]));
  const shown = filter ? data.reviews.filter((r) => r.rating === filter) : data.reviews;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* ── Banner: name + a real burrito ─────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-neutral-800 shadow-2xl anim-fade-up">
          <img
            src={BURRITO_IMG}
            alt="A fresh burrito sliced open on a wooden board"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/10" />
          <div className="relative px-8 pb-8 pt-24 md:px-10 md:pb-10 md:pt-32">
            <p className="mb-1 text-sm font-bold uppercase tracking-[0.3em] text-orange-400 anim-pop">
              🌯 Tomato-Lite presents
            </p>
            <h1 className="text-4xl font-black leading-tight text-white drop-shadow-lg md:text-6xl">
              California Burrito
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-neutral-200">
              <span className="rounded-full bg-orange-500/90 px-3 py-1 text-sm font-bold text-white">
                {data.cuisine}
              </span>
              <span className="rounded-full bg-neutral-800/80 px-3 py-1 text-sm">{data.area}</span>
            </p>
          </div>
        </section>

        {/* ── Big rating panel + Amazon-style star filter ───────────────── */}
        <section className="grid gap-6 md:grid-cols-[auto,1fr]">
          <div className="anim-pop flex h-64 w-64 flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 shadow-[0_0_60px_-10px_rgba(244,63,94,0.7)]">
            <div className="text-7xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] md:text-8xl">
              {data.averageRating === null ? "–" : <AnimatedRating value={data.averageRating} />}
            </div>
            <div className="mt-1 text-lg font-bold text-white/90">out of 5 🌟</div>
            <div className="mt-3 text-sm font-semibold text-white/80">
              {data.totalReviews} review{data.totalReviews === 1 ? "" : "s"}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 anim-fade-up">
            <h2 className="mb-4 text-lg font-bold text-neutral-300">Filter by stars</h2>
            <div className="space-y-2">
              <button
                onClick={() => setFilter(null)}
                className={`w-full rounded-xl px-4 py-2 text-left font-semibold transition hover:bg-neutral-800 ${
                  filter === null ? "bg-neutral-800 text-white" : "text-neutral-400"
                }`}
              >
                ★ All ratings
              </button>
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilter(filter === r ? null : r)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-2 transition hover:bg-neutral-800 ${
                    filter === r ? "bg-neutral-800" : ""
                  }`}
                >
                  <span className="font-semibold text-neutral-200">
                    <span className="text-amber-400">{"★".repeat(r)}</span>
                    <span className="text-neutral-600">{"★".repeat(5 - r)}</span>
                  </span>
                  <span className="text-sm text-neutral-400">{counts[r] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Empty state (nothing yet? invite the first review) ─────────── */}
        {data.totalReviews === 0 && (
          <section className="anim-fade-up rounded-3xl border-2 border-dashed border-neutral-700 p-10 text-center">
            <p className="text-xl font-bold">No reviews yet — the cold storage is empty.</p>
            <p className="mt-2 text-neutral-400">Be the first to describe your burrito.</p>
            <Link
              href={`/review/${id}`}
              className="mt-4 inline-block rounded-full bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-400"
            >
              Write the first review →
            </Link>
          </section>
        )}

        {/* ── Latest review, highlighted ─────────────────────────────────── */}
        {data.latestReview && (
          <section className="anim-fade-up rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 shadow-[0_0_40px_-15px_rgba(251,191,36,0.5)]">
            <p className="mb-3 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-widest text-black">
              ⚡ Latest review — most trusted
            </p>
            <div className="flex items-baseline gap-3">
              <span className={`rounded-lg px-2 py-1 text-sm font-black ${badgeClass(data.latestReview.rating)}`}>
                {data.latestReview.rating}★
              </span>
              <p className="text-xl font-semibold text-white">{data.latestReview.comment}</p>
            </div>
            <p className="mt-2 text-sm text-neutral-400">{fmtDate(data.latestReview.createdAt)}</p>
          </section>
        )}

        {/* ── Older reviews (filtered, in the order the API handed over) ──── */}
        {shown.length > 0 && (
          <section className="space-y-3 anim-fade-up">
            <h2 className="text-lg font-bold text-neutral-300">
              {filter ? `Reviews with ${filter}★` : "All reviews"}{" "}
              <span className="text-neutral-500">(newest first)</span>
            </h2>
            {shown.map((r) => (
              <article
                key={r.id}
                className="flex items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-600"
              >
                <span className={`rounded-lg px-2 py-1 text-sm font-black ${badgeClass(r.rating)}`}>
                  {r.rating}★
                </span>
                <p className="flex-1 text-neutral-200">{r.comment}</p>
                <time className="shrink-0 text-sm text-neutral-500">{fmtDate(r.createdAt)}</time>
              </article>
            ))}
          </section>
        )}

        {/* ── Link to the write-a-review screen ──────────────────────────── */}
        <section className="anim-fade-up">
          <Link
            href={`/review/${id}`}
            className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            ✍️ Write a review
          </Link>
        </section>
      </div>
    </main>
  );
}
