import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export interface WarrantyCertificateData {
  warrantyNumber: string;
  serialNumber: string;
  customerName: string;
  email?: string;
  mobile?: string;
  installationAddress?: string;
  productName: string;
  productModel: string;
  capacity?: string;
  mrp?: number | string;
  warrantyMonths?: number;
  purchaseDate?: string;
  installationDate?: string;
  startDate?: string;
  endDate?: string;
  dealerName?: string;
  dealerContact?: string;
  status?: string;
  batchNumber?: string;
}

export async function generateWarrantyCertificatePdf(data: WarrantyCertificateData): Promise<jsPDF> {
  // A4 portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;

  // 1. Background & Double Ornamental Border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Subtle background tint for certificate
  doc.setFillColor(254, 253, 250);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, "F");

  // Outer gold/amber border
  doc.setDrawColor(245, 158, 11); // Amber 500
  doc.setLineWidth(1.5);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Inner subtle dark border
  doc.setDrawColor(30, 41, 59); // Slate 800
  doc.setLineWidth(0.4);
  doc.rect(margin + 2.5, margin + 2.5, pageWidth - (margin + 2.5) * 2, pageHeight - (margin + 2.5) * 2);

  // Corner decorative accents
  const corners = [
    [margin + 5, margin + 5],
    [pageWidth - margin - 5, margin + 5],
    [margin + 5, pageHeight - margin - 5],
    [pageWidth - margin - 5, pageHeight - margin - 5],
  ];
  doc.setFillColor(245, 158, 11);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.2, "F");
  });

  let y = margin + 12;

  // 2. Header Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(234, 88, 12); // Brand Orange #ea580c
  doc.text("OLITEC", pageWidth / 2, y, { align: "center" });

  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("ELECTRONICS & SOLAR POWER SOLUTIONS", pageWidth / 2, y, { align: "center" });

  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin + 15, y, pageWidth - margin - 15, y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("CERTIFICATE OF WARRANTY REGISTRATION", pageWidth / 2, y, { align: "center" });

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Official genuine product warranty protection issued by Olitec Systems.", pageWidth / 2, y, { align: "center" });

  // 3. Highlight Pill Bar (Certificate No & Status)
  y += 6;
  const pillW = pageWidth - margin * 2 - 20;
  const pillX = margin + 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(pillX, y, pillW, 11, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text("CERTIFICATE NO:", pillX + 6, y + 7);

  doc.setFont("courier", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(217, 119, 6);
  doc.text(data.warrantyNumber || "WAR-" + (data.serialNumber || "PENDING"), pillX + 38, y + 7);

  const statusText = (data.status || "Active").toUpperCase();
  const isApproved = statusText === "ACTIVE" || statusText === "APPROVED";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  if (isApproved) {
    doc.setFillColor(236, 253, 245);
    doc.setTextColor(5, 150, 105);
    doc.roundedRect(pillX + pillW - 38, y + 2.5, 32, 6, 1.5, 1.5, "F");
    doc.text("● COVERAGE ACTIVE", pillX + pillW - 22, y + 6.8, { align: "center" });
  } else {
    doc.setFillColor(254, 243, 199);
    doc.setTextColor(180, 83, 9);
    doc.roundedRect(pillX + pillW - 42, y + 2.5, 36, 6, 1.5, 1.5, "F");
    doc.text("● " + statusText, pillX + pillW - 24, y + 6.8, { align: "center" });
  }

  y += 18;

  // 4. Two Main Boxes: Customer Details (Left) and Product Specs (Right)
  const colW = (pageWidth - margin * 2 - 26) / 2;
  const col1X = margin + 10;
  const col2X = col1X + colW + 6;
  const boxH = 55;

  // Box 1: Customer Details
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col1X, y, colW, boxH, 2, 2, "FD");

  // Box 1 Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(col1X, y, colW, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("CUSTOMER & INSTALLATION DETAILS", col1X + 5, y + 5.5);

  let curY = y + 14;
  const addField = (lbl: string, val: string, xPos: number, currentY: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, xPos, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const splitVal = doc.splitTextToSize(val || "—", colW - 10);
    doc.text(splitVal, xPos, currentY + 4);
    return currentY + (splitVal.length > 1 ? 9 : 8);
  };

  curY = addField("Customer Name", data.customerName || "—", col1X + 5, curY);
  curY = addField("Mobile Number", data.mobile ? `+91 ${data.mobile}` : "—", col1X + 5, curY);
  curY = addField("Email Address", data.email || "—", col1X + 5, curY);
  curY = addField("Installation Address", data.installationAddress || "Registered Site", col1X + 5, curY);

  // Box 2: Product Specifications
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, y, colW, boxH, 2, 2, "FD");

  // Box 2 Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(col2X, y, colW, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("PRODUCT & HARDWARE SPECIFICATIONS", col2X + 5, y + 5.5);

  curY = y + 14;
  curY = addField("Product Name", data.productName || "Olitec Unit", col2X + 5, curY);
  curY = addField("Model Number", data.productModel || "—", col2X + 5, curY);

  // Serial Number in distinct highlight box
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Unit Serial Number", col2X + 5, curY);

  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(col2X + 5, curY + 1.2, colW - 10, 6.5, 1, 1, "FD");
  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);
  doc.text(data.serialNumber || "—", col2X + 8, curY + 5.5);

  curY += 11;
  const capacityStr = data.capacity ? `${data.capacity}` : "Standard";
  const mrpStr = data.mrp ? `₹${Number(data.mrp).toLocaleString("en-IN")}` : "As per Invoice";
  addField("Capacity / Rating", `${capacityStr}  ·  MRP: ${mrpStr}`, col2X + 5, curY);

  y += boxH + 7;

  // 5. Warranty Coverage Table
  const tableW = pageWidth - margin * 2 - 20;
  const tableX = margin + 10;
  const tableH = 46;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(tableX, y, tableW, tableH, 2, 2, "FD");

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(tableX, y, tableW, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text("WARRANTY SCHEDULE & DEALER DETAILS", tableX + 5, y + 5.5);

  const tColW = tableW / 4;
  let ty = y + 15;

  const cell = (lbl: string, val: string, cx: number, cy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, cx, cy);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(val || "—", cx, cy + 4.5);
  };

  const periodMonths = data.warrantyMonths || 60;
  const periodYears = Math.round(periodMonths / 12);
  const periodStr = `${periodYears} Years (${periodMonths} Months)`;

  cell("Coverage Period", periodStr, tableX + 5, ty);
  cell("Purchase Date", data.purchaseDate ? new Date(data.purchaseDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—", tableX + tColW + 2, ty);
  cell("Start Date", data.startDate ? new Date(data.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Date of Invoice", tableX + tColW * 2 + 2, ty);
  cell("Expiry Date", data.endDate ? new Date(data.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Per Term End", tableX + tColW * 3 + 2, ty);

  ty += 14;
  doc.setDrawColor(241, 245, 249);
  doc.line(tableX + 5, ty - 2, tableX + tableW - 5, ty - 2);

  cell("Authorized Dealer", data.dealerName || "Direct / Authorized Olitec Channel", tableX + 5, ty + 2);
  cell("Dealer Contact", data.dealerContact || "1800-OLITEC-CARE", tableX + tColW + 2, ty + 2);
  cell("Batch Reference", data.batchNumber || "GEN-BATCH", tableX + tColW * 2 + 2, ty + 2);
  cell("Installation Date", data.installationDate ? new Date(data.installationDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Same as purchase", tableX + tColW * 3 + 2, ty + 2);

  y += tableH + 7;

  // 6. Security, QR Code & Digital Signature
  const secW = tableW;
  const secH = 46;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(tableX, y, secW, secH, 2, 2, "FD");

  // QR Code generation
  const qrUrl = `https://olitec.in/warranty-status?serial=${encodeURIComponent(data.serialNumber || "")}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: 120,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    doc.addImage(qrDataUrl, "PNG", tableX + 5, y + 4.5, 34, 34);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text("SCAN TO VERIFY", tableX + 22, y + 41.5, { align: "center" });
  } catch {
    // If QR generation fails, skip image
  }

  // Legal / Terms note
  const noteX = tableX + 44;
  const noteW = secW - 44 - 45;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("TERMS OF WARRANTY COVERAGE", noteX, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  const terms = [
    "• This certificate warrants the product against manufacturing defects under standard operating parameters.",
    "• Warranty covers replacement or repair of certified internal electronics and components.",
    "• Physical damage, unauthorized tampering, liquid ingress, or external surge voids terms.",
    "• Please retain this certificate along with your original purchase invoice for claims.",
  ];
  let termY = y + 13;
  terms.forEach((t) => {
    const splitT = doc.splitTextToSize(t, noteW);
    doc.text(splitT, noteX, termY);
    termY += splitT.length * 3.5;
  });

  // Digital Signature / Stamp box
  const stampX = tableX + secW - 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("AUTHENTICATED BY", stampX + 18, y + 8, { align: "center" });

  // Stamp circle
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.circle(stampX + 18, y + 21, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(217, 119, 6);
  doc.text("OLITEC QA", stampX + 18, y + 19.5, { align: "center" });
  doc.setFontSize(5);
  doc.text("CERTIFIED", stampX + 18, y + 23, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text("Authorized Signatory", stampX + 18, y + 36, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("Olitec Customer Care", stampX + 18, y + 39.5, { align: "center" });

  // 7. Footer
  const footerY = pageHeight - margin - 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin + 10, footerY - 5, pageWidth - margin - 10, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("Olitec Support Desk: support@olitec.in  |  Toll-Free: 1800-OLITEC (654832)  |  Web: www.olitec.in", pageWidth / 2, footerY - 1, { align: "center" });

  return doc;
}

export async function downloadWarrantyCertificate(data: WarrantyCertificateData): Promise<void> {
  const doc = await generateWarrantyCertificatePdf(data);
  const cleanNum = (data.warrantyNumber || data.serialNumber || "Certificate").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Olitec_Warranty_Certificate_${cleanNum}.pdf`);
}
