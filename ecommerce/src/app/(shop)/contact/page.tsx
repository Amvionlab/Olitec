import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { Card, Container } from "@/components/ui";
import { getSettings } from "@/services/catalog";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = { title: "Contact us", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const settings = await getSettings().catch(() => null);
  const store = settings?.store;
  return (
    <Container className="space-y-6 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Contact us</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <ContactForm />
        </Card>
        <Card className="h-fit space-y-4 p-6 text-sm">
          <h2 className="text-lg font-semibold">Get in touch</h2>
          {store?.supportPhone && (
            <p className="flex gap-2">
              <Phone className="size-4 text-brand-600" aria-hidden />
              <a href={`tel:${store.supportPhone.replace(/\s/g, "")}`} className="hover:underline">{store.supportPhone}</a>
            </p>
          )}
          {store?.supportEmail && (
            <p className="flex gap-2">
              <Mail className="size-4 text-brand-600" aria-hidden />
              <a href={`mailto:${store.supportEmail}`} className="hover:underline">{store.supportEmail}</a>
            </p>
          )}
          {store?.address && (
            <p className="flex gap-2">
              <MapPin className="size-4 shrink-0 text-brand-600" aria-hidden /> {store.address}
            </p>
          )}
          {!store?.supportPhone && !store?.supportEmail && !store?.address && <p className="text-slate-500">Use the form and our team will reply by email.</p>}
        </Card>
      </div>
    </Container>
  );
}
