"use client";

import { useEffect, useState } from "react";
import { LifeBuoy } from "lucide-react";
import { Alert, ButtonLink, Card, EmptyState, Spinner, StatusPill } from "@/components/ui";
import { api, errorMessage } from "@/services/api";
import { formatDate } from "@/utils/format";

interface Ticket {
  ticketNumber: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  response: string | null;
  orderNumber: string | null;
  createdAt: string;
}

const tone = { open: "amber", in_progress: "blue", resolved: "green", closed: "slate" } as const;

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Ticket[]>("/account/support").then(setTickets).catch((reason) => setError(errorMessage(reason)));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!tickets) return <Spinner label="Loading requests" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Support requests</h1>
        <ButtonLink href="/contact">New request</ButtonLink>
      </div>
      {tickets.length === 0 ? (
        <EmptyState icon={<LifeBuoy className="size-10" />} title="No support requests">
          Questions about an order or a product? Send us a request and track the reply here.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => (
            <li key={ticket.ticketNumber}>
              <Card className="space-y-2 p-5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {ticket.subject} <span className="font-normal text-slate-500">· {ticket.ticketNumber}</span>
                  </p>
                  <StatusPill label={ticket.status.replace("_", " ")} tone={tone[ticket.status]} />
                </div>
                <p className="text-xs text-slate-500">
                  {formatDate(ticket.createdAt, true)}
                  {ticket.orderNumber && ` · Order ${ticket.orderNumber}`}
                </p>
                <p className="whitespace-pre-line text-slate-700">{ticket.message}</p>
                {ticket.response && (
                  <div className="rounded-lg bg-brand-50 p-3">
                    <p className="text-xs font-semibold text-brand-800">Reply from OLITEC</p>
                    <p className="whitespace-pre-line text-slate-700">{ticket.response}</p>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
