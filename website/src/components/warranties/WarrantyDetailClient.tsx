
"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";

import { WarrantyWithProduct, getWarrantyById } from "@/services/warranties";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProductImage } from "@/components/products/ProductImage";
import { DownloadWarrantyPdfButton } from "@/components/warranties/DownloadWarrantyPdfButton";

import {
  daysBetween,
  formatDate,
  formatDateTime,
  formatWarrantyPeriod,
} from "@/lib/format";

export default function WarrantyDetailClient() {
  const [warranty, setWarranty] =
    useState<WarrantyWithProduct | undefined>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWarranty() {
      const id = new URLSearchParams(
        window.location.search
      ).get("id");

      if (!id) {
        setError("Warranty ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const result = await getWarrantyById(id);

        if (!active) return;

        if (!result) {
          setError("Warranty details not found.");
        } else {
          setWarranty(result);
        }
      } catch (err) {
        console.error("Warranty loading error:", err);
        if (active) {
          setError("Unable to load warranty details.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWarranty();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Container>
        <div className="flex min-h-[350px] items-center justify-center">
          Loading warranty details...
        </div>
      </Container>
    );
  }

  if (error || !warranty) {
    return (
      <Container>
        <PageHeader title="Warranty details" />
        <Alert tone="error" title="Unable to load warranty">
          {error || "Warranty not found."}
        </Alert>
        <div className="mt-5">
          <ButtonLink href="/warranties">
            Back to warranties
          </ButtonLink>
        </div>
      </Container>
    );
  }

  const details = [
    { label: "Warranty number", value: warranty.warrantyNumber },
    { label: "Serial number", value: warranty.serialNumber },
    { label: "Purchase date", value: formatDate(warranty.purchaseDate) },
    { label: "Invoice number", value: warranty.invoiceNumber },
    { label: "Purchased from", value: warranty.dealerName },
    {
      label: "Coverage period",
      value: formatWarrantyPeriod(warranty.product.warrantyMonths),
    },
    { label: "Start date", value: formatDate(warranty.startDate) },
    { label: "End date", value: formatDate(warranty.endDate) },
  ];

  return (
    <Container>
      <PageHeader
        title={warranty.product.name}
        description={`Model ${warranty.product.model}`}
        back={{ href: "/warranties", label: "Dashboard" }}
        actions={
          <div className="flex flex-wrap gap-2">
            <DownloadWarrantyPdfButton
              data={{
                warrantyNumber: warranty.warrantyNumber,
                serialNumber: warranty.serialNumber,
                customerName:
                  (warranty as any).customerName || "Customer",
                email: (warranty as any).email,
                mobile: (warranty as any).mobile,
                installationAddress:
                  (warranty as any).installationAddress || undefined,
                productName: warranty.product.name,
                productModel: warranty.product.model,
                capacity: (warranty.product as any).capacity || "",
                mrp: warranty.product.priceInr,
                warrantyMonths: warranty.product.warrantyMonths,
                purchaseDate: warranty.purchaseDate,
                startDate: warranty.startDate || undefined,
                endDate: warranty.endDate || undefined,
                dealerName: warranty.dealerName,
                status: warranty.status,
              }}
              variant="primary"
            />

            <ButtonLink
              href={`/products/${warranty.product.slug}`}
              variant="secondary"
            >
              View Product &amp; 3D Model
            </ButtonLink>

            <ButtonLink href="/support" variant="secondary">
              Raise a support request
            </ButtonLink>
          </div>
        }
      />

      {warranty.status === "Rejected" && warranty.remark && (
        <Alert
          tone="error"
          title="Why this registration was rejected"
          className="mb-6"
        >
          {warranty.remark}
        </Alert>
      )}

      {warranty.status === "Pending" && (
        <Alert
          tone="warning"
          title="Verification in progress"
          className="mb-6"
        >
          We are checking your invoice. You will receive an SMS
          and email when your warranty is activated.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center gap-4 p-5">
              <ProductImage
                category={warranty.product.category}
                name={warranty.product.name}
                size="sm"
              />

              <div className="flex-1">
                <p className="text-sm text-slate-500">
                  Current status
                </p>
                <StatusBadge
                  status={warranty.status}
                  className="mt-1"
                />
              </div>
            </div>

            <CoverageProgress warranty={warranty} />
          </Card>

          <Card>
            <CardHeader title="Warranty details" />
            <dl className="grid sm:grid-cols-2">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="border-b border-slate-100 px-5 py-3 sm:odd:border-r"
                >
                  <dt className="text-xs text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-900">
                    {item.value || "-"}
                  </dd>
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

function CoverageProgress({
  warranty,
}: {
  warranty: WarrantyWithProduct;
}) {
  if (!warranty.startDate || !warranty.endDate) return null;

  const total = daysBetween(
    new Date(warranty.startDate),
    warranty.endDate
  );

  const remaining = Math.max(
    0,
    daysBetween(new Date(), warranty.endDate)
  );

  const usedPercent =
    total > 0
      ? Math.min(
          100,
          Math.round(((total - remaining) / total) * 100)
        )
      : 100;

  return (
    <div className="px-5 pb-5">
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={
            warranty.status === "Active"
              ? "h-full rounded-full bg-emerald-500"
              : "h-full rounded-full bg-slate-400"
          }
          style={{ width: `${usedPercent}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {warranty.status === "Active"
          ? `${remaining} days of cover remaining`
          : "Coverage period has ended"}
      </p>
    </div>
  );
}

function Timeline({
  warranty,
}: {
  warranty: WarrantyWithProduct;
}) {
  const steps = [
    {
      label: "Request submitted",
      date: formatDateTime(warranty.submittedAt),
      state: "done" as const,
    },
    warranty.status === "Rejected"
      ? {
          label: "Registration rejected",
          date: "See remark below",
          state: "failed" as const,
        }
      : {
          label: "Invoice verified",
          date:
            warranty.status === "Pending"
              ? "In review"
              : formatDate(warranty.startDate),
          state:
            warranty.status === "Pending"
              ? ("todo" as const)
              : ("done" as const),
        },
    ...(warranty.status === "Rejected"
      ? []
      : [
          {
            label:
              warranty.status === "Expired"
                ? "Warranty expired"
                : "Warranty ends",
            date: warranty.endDate
              ? formatDate(warranty.endDate)
              : "After approval",
            state:
              warranty.status === "Expired"
                ? ("done" as const)
                : ("todo" as const),
          },
        ]),
  ];

  return (
    <ol className="space-y-4 p-5">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          {step.state === "done" && (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
          )}
          {step.state === "failed" && (
            <XCircle className="size-5 shrink-0 text-red-500" />
          )}
          {step.state === "todo" && (
            <Circle className="size-5 shrink-0 text-slate-300" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-900">
              {step.label}
            </p>
            <p className="text-xs text-slate-500">
              {step.date}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
