import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductImage } from "@/components/products/ProductImage";
import { getWarrantyById, type WarrantyWithProduct } from "@/services/warranties";
import { mockWarranties } from "@/mock/data";
import { daysBetween, formatDate, formatDateTime, formatWarrantyPeriod } from "@/lib/format";

export const metadata: Metadata = { title: "Warranty details", robots: { index: false } };

export function generateStaticParams() {
  return mockWarranties.map((w) => ({ id: w.id }));
}

interface WarrantyDetailPageProps {
  params: Promise<{ id: string }>;
}

function CoverageProgress({ warranty }: { warranty: WarrantyWithProduct }) {
  if (!warranty.startDate || !warranty.endDate) return null;
  const total = daysBetween(new Date(warranty.startDate), warranty.endDate);
  const remaining = Math.max(0, daysBetween(new Date(), warranty.endDate));
  const usedPercent = Math.min(100, Math.round(((total - remaining) / total) * 100));
  return (
    <div className="px-5 pb-5">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={warranty.status === "Active" ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-slate-400"}
          style={{ width: `${usedPercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {warranty.status === "Active" ? `${remaining} days of cover remaining` : "Coverage period has ended"}
      </p>
    </div>
  );
}

function Timeline({ warranty }: { warranty: WarrantyWithProduct }) {
  const steps = [
    { label: "Request submitted", date: formatDateTime(warranty.submittedAt), state: "done" as const },
    warranty.status === "Rejected"
      ? { label: "Registration rejected", date: "See remark below", state: "failed" as const }
      : {
          label: "Invoice verified",
          date: warranty.status === "Pending" ? "In review" : formatDate(warranty.startDate),
          state: warranty.status === "Pending" ? ("todo" as const) : ("done" as const),
        },
    ...(warranty.status === "Rejected"
      ? []
      : [
          {
            label: warranty.status === "Expired" ? "Warranty expired" : "Warranty ends",
            date: warranty.endDate ? formatDate(warranty.endDate) : "After approval",
            state: warranty.status === "Expired" ? ("done" as const) : ("todo" as const),
          },
        ]),
  ];
  return (
    <ol className="space-y-4 p-5">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          {step.state === "done" && <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-hidden />}
          {step.state === "failed" && <XCircle className="size-5 shrink-0 text-red-500" aria-hidden />}
          {step.state === "todo" && <Circle className="size-5 shrink-0 text-slate-300" aria-hidden />}
          <div>
            <p className="text-sm font-medium text-slate-900">{step.label}</p>
            <p className="text-xs text-slate-500">{step.date}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function WarrantyDetailPage({ params }: WarrantyDetailPageProps) {
  const warranty = await getWarrantyById((await params).id);
  if (!warranty) notFound();

  const details = [
    { label: "Warranty number", value: warranty.warrantyNumber },
    { label: "Serial number", value: warranty.serialNumber },
    { label: "Purchase date", value: formatDate(warranty.purchaseDate) },
    { label: "Invoice number", value: warranty.invoiceNumber },
    { label: "Purchased from", value: warranty.dealerName },
    { label: "Coverage period", value: formatWarrantyPeriod(warranty.product.warrantyMonths) },
    { label: "Start date", value: formatDate(warranty.startDate) },
    { label: "End date", value: formatDate(warranty.endDate) },
  ];

  return (
    <Container>
      <PageHeader
        title={warranty.product.name}
        description={`Model ${warranty.product.model}`}
        back={{ href: "/warranties", label: "My warranties" }}
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/products/${warranty.product.slug}`} variant="secondary">
              View Product & 3D Model
            </ButtonLink>
            <ButtonLink href="/support" variant="secondary">
              Raise a support request
            </ButtonLink>
          </div>
        }
      />

      {warranty.status === "Rejected" && warranty.remark && (
        <Alert tone="error" title="Why this registration was rejected" className="mb-6">
          {warranty.remark}
        </Alert>
      )}
      {warranty.status === "Pending" && (
        <Alert tone="warning" title="Verification in progress" className="mb-6">
          We are checking your invoice. You will receive an SMS and email when your warranty is activated.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center gap-4 p-5">
              <ProductImage category={warranty.product.category} name={warranty.product.name} size="sm" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">Current status</p>
                <StatusBadge status={warranty.status} className="mt-1" />
              </div>
            </div>
            <CoverageProgress warranty={warranty} />
          </Card>

          <Card>
            <CardHeader title="Warranty details" />
            <dl className="grid sm:grid-cols-2">
              {details.map((item) => (
                <div key={item.label} className="border-b border-slate-100 px-5 py-3 sm:odd:border-r">
                  <dt className="text-xs text-slate-500">{item.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Progress" />
          <Timeline warranty={warranty} />
        </Card>
      </div>
    </Container>
  );
}
