"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, History, XCircle } from "lucide-react";
import type { AdminUser, WarrantyStatus, WarrantyWithRelations } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SelectField, TextAreaField } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { reviewWarranty, type ReviewInput } from "@/services/warranties";
import { allowedStatusTransitions, can } from "@/lib/permissions";
import { formatDate, formatDateTime, formatMobile } from "@/lib/format";

type PendingAction = { action: ReviewInput["action"]; status?: WarrantyStatus } | null;

const MIN_REMARK = 10;

export function WarrantyReview({ initialWarranty, admin }: { initialWarranty: WarrantyWithRelations; admin: AdminUser }) {
  const [warranty, setWarranty] = useState(initialWarranty);
  const [remark, setRemark] = useState("");
  const [remarkError, setRemarkError] = useState<string>();
  const [newStatus, setNewStatus] = useState<WarrantyStatus | "">("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();

  const canReview = can(admin.role, "reviewWarranties") && warranty.status === "Pending";
  const transitions = can(admin.role, "updateWarrantyStatus") ? allowedStatusTransitions[warranty.status] : [];

  /** Rejections and manual status changes need a reason; approvals may have an optional note. */
  function requestAction(action: ReviewInput["action"], status?: WarrantyStatus) {
    setNotice(undefined);
    if (action !== "approve" && remark.trim().length < MIN_REMARK) {
      setRemarkError(`Add a remark of at least ${MIN_REMARK} characters explaining this decision.`);
      return;
    }
    setRemarkError(undefined);
    setPendingAction({ action, status });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setSaving(true);
    const updated = await reviewWarranty(warranty, { ...pendingAction, remark, adminName: admin.name });
    setSaving(false);
    setWarranty(updated);
    setPendingAction(null);
    setRemark("");
    setNewStatus("");
    setNotice(`Warranty ${updated.warrantyNumber} is now ${updated.status}. (Demo: this change is not saved and resets on reload.)`);
  }

  const dialogCopy = {
    approve: {
      title: "Approve this warranty?",
      body: (
        <>
          Coverage will run from <strong>{formatDate(warranty.purchaseDate)}</strong> for {warranty.product.warrantyMonths} months, and the
          customer will be notified.
        </>
      ),
      label: "Approve warranty",
      tone: "primary" as const,
    },
    reject: {
      title: "Reject this warranty request?",
      body: <>The customer will see your remark and will need to submit a new registration.</>,
      label: "Reject request",
      tone: "danger" as const,
    },
    status: {
      title: `Change status to ${pendingAction?.status}?`,
      body: <>This overrides the current status ({warranty.status}). Your remark is recorded in the audit history.</>,
      label: "Change status",
      tone: "primary" as const,
    },
  };
  const dialog = pendingAction ? dialogCopy[pendingAction.action] : dialogCopy.approve;

  const details = [
    { label: "Serial number", value: warranty.serialNumber },
    { label: "Purchase date", value: formatDate(warranty.purchaseDate) },
    { label: "Invoice number", value: warranty.invoiceNumber },
    { label: "Dealer", value: warranty.dealerName },
    { label: "Submitted", value: formatDateTime(warranty.submittedAt) },
    { label: "Warranty period", value: `${warranty.product.warrantyMonths} months` },
    { label: "Start date", value: formatDate(warranty.startDate) },
    { label: "End date", value: formatDate(warranty.endDate) },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {notice && <Alert tone="success">{notice}</Alert>}

        <Card>
          <CardHeader title="Warranty details" action={<StatusBadge status={warranty.status} />} />
          <dl className="grid sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="border-b border-slate-100 px-5 py-3 sm:odd:border-r">
                <dt className="text-xs text-slate-500">{item.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
          {warranty.remark && (
            <div className="px-5 py-4">
              <p className="text-xs text-slate-500">Latest admin remark</p>
              <p className="mt-1 text-sm text-slate-800">{warranty.remark}</p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Product & invoice" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="font-medium text-slate-900">{warranty.product.name}</p>
              <p className="text-sm text-slate-500">
                Model {warranty.product.model} · {warranty.product.category}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <FileText className="size-8 shrink-0 text-brand-600" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{warranty.invoiceFileName}</p>
                <p className="text-xs text-slate-500">Invoice preview is available once document upload is implemented (Phase 2).</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Audit history" />
          <ol className="space-y-4 p-5">
            {[...warranty.history].reverse().map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="flex gap-3">
                <History className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">{entry.action}</p>
                  <p className="text-xs text-slate-500">
                    {entry.by} · {formatDateTime(entry.at)}
                  </p>
                  {entry.remark && <p className="mt-1 text-slate-600">“{entry.remark}”</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Customer" />
          <div className="space-y-1 p-5 text-sm">
            <Link href={`/customers/${warranty.customer.id}`} className="font-medium text-brand-700 hover:underline">
              {warranty.customer.name}
            </Link>
            <p className="text-slate-600">{warranty.customer.email}</p>
            <p className="text-slate-600">{formatMobile(warranty.customer.mobile)}</p>
            <p className="text-slate-500">
              {warranty.customer.city}, {warranty.customer.state}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Actions" description={canReview ? "Verify the invoice before deciding." : undefined} />
          <div className="space-y-4 p-5">
            {!canReview && transitions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No actions are available for a warranty with status {warranty.status}
                {can(admin.role, "updateWarrantyStatus") ? "." : " for your role."}
              </p>
            ) : (
              <>
                <TextAreaField
                  label="Admin remark"
                  value={remark}
                  onChange={(e) => {
                    setRemark(e.target.value);
                    setRemarkError(undefined);
                  }}
                  error={remarkError}
                  hint="Required for rejections and status changes. Visible to the customer."
                  maxLength={500}
                />
                {canReview && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => requestAction("approve")}>
                      <CheckCircle2 className="size-4" aria-hidden /> Approve
                    </Button>
                    <Button variant="danger" onClick={() => requestAction("reject")}>
                      <XCircle className="size-4" aria-hidden /> Reject
                    </Button>
                  </div>
                )}
                {transitions.length > 0 && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <SelectField label="Update status" value={newStatus} onChange={(e) => setNewStatus(e.target.value as WarrantyStatus | "")}>
                      <option value="">Select new status</option>
                      {transitions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </SelectField>
                    <Button variant="secondary" className="w-full" disabled={!newStatus} onClick={() => newStatus && requestAction("status", newStatus)}>
                      Update status
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={dialog.title}
        description={dialog.body}
        confirmLabel={dialog.label}
        tone={dialog.tone}
        loading={saving}
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
      >
        {remark.trim() && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <span className="block text-xs text-slate-500">Remark</span>
            {remark.trim()}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
