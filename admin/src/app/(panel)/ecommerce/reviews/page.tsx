"use client";

import { Suspense } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadState, Pager, RequirePermission, StatusPill, inputClass, useAction, useApi, useUrlFilters } from "@/components/ecommerce/kit";
import { formatDateTime } from "@/lib/format";
import { ecomApi, qs } from "@/services/ecommerce/api";

interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: string;
  customerName: string;
  product: { name: string; slug: string };
}

function ReviewsContent() {
  const { get, set } = useUrlFilters();
  const status = get("status") || "pending";
  const { data, meta, error, loading, reload } = useApi<Review[]>(`/admin/reviews${qs({ status: status === "all" ? undefined : status, page: get("page") || 1, pageSize: 20 })}`);
  const { run, busy } = useAction();
  const decide = async (id: number, next: "approved" | "rejected") => {
    await run(() => ecomApi.patch(`/admin/reviews/${id}`, { status: next }), next === "approved" ? "Review published" : "Review rejected");
    reload();
  };
  return (
    <>
      <PageHeader title="Reviews" description="Only customers with a delivered order can review. Reviews appear on the shop after approval." />
      <Card>
        <div className="border-b border-slate-100 p-4">
          <select aria-label="Status" className={`${inputClass} sm:w-48`} value={status} onChange={(event) => set({ status: event.target.value })}>
            <option value="pending">Awaiting moderation</option>
            <option value="approved">Published</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        </div>
        <LoadState loading={loading} error={error} empty={!data}>
          {data?.length === 0 ? <EmptyState title="Nothing to moderate" /> : (
            <ul className="divide-y divide-slate-100">
              {data?.map((review) => (
                <li key={review.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-1" aria-label={`${review.rating} out of 5`}>
                      {[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`size-4 ${value <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} aria-hidden />)}
                      <span className="ml-2 font-medium text-slate-900">{review.title}</span>
                    </p>
                    {review.body && <p className="whitespace-pre-line text-slate-700">{review.body}</p>}
                    <p className="text-xs text-slate-500">{review.customerName} on {review.product.name} · {formatDateTime(review.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill status={review.status} />
                    {review.status !== "approved" && <Button size="sm" onClick={() => void decide(review.id, "approved")} disabled={busy}>Approve</Button>}
                    {review.status !== "rejected" && <Button size="sm" variant="secondary" onClick={() => void decide(review.id, "rejected")} disabled={busy}>Reject</Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Pager meta={meta} onPage={(page) => set({ page })} />
        </LoadState>
      </Card>
    </>
  );
}

export default function ReviewsPage() {
  return (
    <RequirePermission permission="products.manage">
      <Suspense>
        <ReviewsContent />
      </Suspense>
    </RequirePermission>
  );
}
