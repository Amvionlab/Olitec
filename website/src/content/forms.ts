/**
 * Field lists for the enquiry forms from the Olitec HTML design
 * (channel partners, homes and businesses, careers, service request).
 * Rendered by components/legacy/EnquiryForm.tsx.
 */
import { productModelGroups } from "./pages";

export type EnquiryKind = "partner" | "consultation" | "career" | "service";

export type OptionGroup = { label: string; options: readonly string[] };

export interface EnquiryField {
  name: string;
  label: string;
  type: "text" | "name" | "tel" | "email" | "number" | "url" | "date" | "pincode" | "serial" | "file" | "select" | "textarea";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  /** Text of the empty first option of a select. */
  emptyOption?: string;
  options?: readonly string[];
  groups?: readonly OptionGroup[];
  full?: boolean;
  accept?: string;
  acceptTypes?: readonly string[];
  maxMb?: number;
}

export interface EnquiryFormConfig {
  fields: readonly EnquiryField[];
  consent: string;
  submitLabel: string;
  success: { title: string; message: string };
}

const contactFields = (nameLabel: string): EnquiryField[] => [
  { name: "name", label: nameLabel, type: "name", required: true },
  { name: "mobile", label: "Mobile number", type: "tel", required: true },
  { name: "email", label: "Email address", type: "email", required: true },
];

export const enquiryForms: Record<EnquiryKind, EnquiryFormConfig> = {
  partner: {
    fields: [
      { name: "name", label: "Your name", type: "name", required: true },
      { name: "company", label: "Company name", type: "text", required: true },
      { name: "mobile", label: "Mobile number", type: "tel", required: true },
      { name: "email", label: "Email address", type: "email", required: true },
      {
        name: "partnershipType",
        label: "Partnership type",
        type: "select",
        required: true,
        emptyOption: "Select",
        options: ["Distributor", "Dealer or retailer", "Installer", "EPC company"],
      },
      { name: "city", label: "City and state", type: "text", required: true },
      { name: "gst", label: "GST number", type: "text" },
      { name: "years", label: "Years in business", type: "number" },
      {
        name: "about",
        label: "Tell us about your business",
        type: "textarea",
        full: true,
        placeholder: "Products you sell today, customers you serve, team size",
      },
    ],
    consent: "I agree to Olitec contacting me about partnership opportunities.",
    submitLabel: "Submit enquiry",
    success: {
      title: "Enquiry received",
      message: "Thank you for your interest in partnering with Olitec. Our channel team will contact you within two working days.",
    },
  },
  consultation: {
    fields: [
      ...contactFields("Your name"),
      { name: "city", label: "City and PIN code", type: "text", required: true },
      {
        name: "use",
        label: "I need power for",
        type: "select",
        required: true,
        emptyOption: "Select",
        options: [
          "Home",
          "Shop or office",
          "School, clinic or institution",
          "Factory or commercial building",
          "Farm or remote site",
          "Vehicle or mobile unit",
          "Other",
        ],
      },
      {
        name: "goal",
        label: "Main goal",
        type: "select",
        required: true,
        emptyOption: "Select",
        options: ["Backup during power cuts", "Lower electricity bills", "Off-grid power", "Reduce generator use"],
      },
      { name: "phase", label: "Supply type", type: "select", emptyOption: "Not sure", options: ["Single-phase", "Three-phase"] },
      { name: "bill", label: "Average monthly bill (₹)", type: "number" },
      {
        name: "notes",
        label: "Anything else we should know",
        type: "textarea",
        full: true,
        placeholder: "Appliances you want to run during outages, roof or land available, existing generator",
      },
    ],
    consent: "I agree to Olitec and its authorised partners contacting me about my enquiry.",
    submitLabel: "Request consultation",
    success: {
      title: "Request received",
      message: "Thank you. An Olitec engineer will call you within one working day to understand your requirement.",
    },
  },
  career: {
    fields: [
      ...contactFields("Full name"),
      {
        name: "area",
        label: "Area of interest",
        type: "select",
        required: true,
        emptyOption: "Select",
        options: [
          "Research and development",
          "Manufacturing and quality",
          "Project engineering",
          "Sales and channel",
          "Service and support",
          "Graduate programme",
        ],
      },
      { name: "qualification", label: "Highest qualification", type: "text", required: true },
      { name: "experience", label: "Years of experience", type: "number", required: true },
      { name: "location", label: "Current location", type: "text", required: true },
      { name: "linkedin", label: "LinkedIn profile", type: "url", placeholder: "https://" },
      {
        name: "resume",
        label: "Resume",
        type: "file",
        required: true,
        full: true,
        accept: ".pdf,.doc,.docx",
        acceptTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxMb: 5,
        hint: "PDF or Word, up to 5 MB",
      },
      { name: "why", label: "Why Olitec?", type: "textarea", full: true },
    ],
    consent: "I agree to Olitec storing my details for recruitment purposes.",
    submitLabel: "Submit application",
    success: {
      title: "Application received",
      message:
        "Thank you for your interest in Olitec. Our team will review your profile and contact you if there is a suitable opening.",
    },
  },
  service: {
    fields: [
      ...contactFields("Full name"),
      { name: "model", label: "Product model", type: "select", required: true, emptyOption: "Select your product", groups: productModelGroups },
      { name: "serial", label: "Serial number", type: "serial", required: true },
      {
        name: "issue",
        label: "Type of issue",
        type: "select",
        required: true,
        emptyOption: "Select the issue",
        options: [
          "No output or system not starting",
          "Error or fault code on display",
          "Battery not charging or discharging",
          "Low solar generation",
          "Backup not working during outage",
          "App or monitoring issue",
          "Physical damage",
          "Other",
        ],
      },
      {
        name: "description",
        label: "Describe the problem",
        type: "textarea",
        required: true,
        full: true,
        placeholder: "Tell us what happened, when it started and any error code shown",
      },
      { name: "visitDate", label: "Preferred visit date", type: "date" },
      { name: "pincode", label: "Installation PIN code", type: "pincode", required: true },
      {
        name: "photos",
        label: "Photos of the product or error",
        type: "file",
        full: true,
        accept: ".jpg,.jpeg,.png",
        acceptTypes: ["image/jpeg", "image/png"],
        maxMb: 10,
        hint: "Optional. JPG or PNG, up to 10 MB",
      },
    ],
    consent: "I agree to Olitec and its authorised service partners contacting me about this request.",
    submitLabel: "Submit request",
    success: {
      title: "Service request registered",
      // {reference} is replaced with the ticket number returned by the service.
      message: "Thank you. Your request has been logged with ticket number {reference}. Our service team will call you shortly.",
    },
  },
};
