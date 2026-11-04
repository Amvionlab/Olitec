"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Alert, Button, Stars, TextArea, TextField } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import { useStore } from "@/store/StoreProvider";
import type { Review } from "@/types";
import { cn, formatDate } from "@/utils/format";

interface ReviewData {
  items: Review[];
  distribution: { rating: number; count: number }[];
}

/** Approved reviews plus a form for customers who received the product (checked by the backend). */
export function Reviews({ slug, average, count }: { slug: string; average: number; count: number }) {
  const { customer } = useStore();
  const [data, setData] = useState<ReviewData | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<ReviewData>(`/products/${slug}/reviews?pageSize=10`).then(setData).catch(() => setData({ items: [], distribution: [] }));
  }, [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating) return setState({ kind: "error", text: "Choose a star rating." });
    setBusy(true);
    try {
      await api.post(`/products/${slug}/reviews`, { rating, title: title || undefined, body: body || undefined });
      setState({ kind: "success", text: "Thank you! Your review will appear after it has been checked." });
      setRating(0);
      setTitle("");
      setBody("");
    } catch (error) {
      setState({ kind: "error", text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="reviews-heading" className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <h2 id="reviews-heading" className="text-2xl font-bold text-slate-900">
          Customer reviews
        </h2>
        {count > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold">{average.toFixed(1)}</span>
              <div>
                <Stars value={average} size="md" />
                <p className="text-sm text-slate-500">{count} reviews</p>
              </div>
            </div>
            {data?.distribution.map((row) => (
              <div key={row.rating} className="flex items-center gap-2 text-sm">
                <span className="w-8">{row.rating}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full bg-brand-400" style={{ width: `${count ? (row.count / count) * 100 : 0}%` }} />
                </span>
                <span className="w-8 text-right text-slate-500">{row.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No reviews yet.</p>
        )}

        {customer ? (
          <form onSubmit={submit} className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold">Write a review</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value > 1 ? "s" : ""}`} onClick={() => setRating(value)}>
                  <Star className={cn("size-7", value <= rating ? "fill-brand-400 text-brand-400" : "text-slate-300")} />
                </button>
              ))}
            </div>
            <TextField label="Title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
            <div className="space-y-1.5">
              <label htmlFor="review-body" className="block text-sm font-medium text-slate-700">
                Review
              </label>
              <TextArea id="review-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} />
            </div>
            {state && <Alert kind={state.kind}>{state.text}</Alert>}
            <Button type="submit" loading={busy} size="sm">
              Submit review
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">
            <Link href={`/login?next=/products/${slug}`} className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>{" "}
            to review a product you have received.
          </p>
        )}
      </div>
      <div className="space-y-4">
        {data?.items.map((review) => (
          <article key={review.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-2">
              <Stars value={review.rating} />
              <time className="text-xs text-slate-500" dateTime={review.createdAt}>
                {formatDate(review.createdAt)}
              </time>
            </div>
            {review.title && <h3 className="mt-2 font-semibold text-slate-900">{review.title}</h3>}
            {review.body && <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{review.body}</p>}
            <p className="mt-3 text-xs font-medium text-slate-500">{review.author}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
