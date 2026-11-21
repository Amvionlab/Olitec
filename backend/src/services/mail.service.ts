import nodemailer from "nodemailer";
import { query, execute } from "../db/pool.js";

export interface SmtpConfig {
  id?: number;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  from_email: string;
  from_name: string;
  admin_email: string;
  is_enabled: boolean;
}

export async function getSmtpSettings(): Promise<SmtpConfig> {
  try {
    const rows = await query<any>(
      "SELECT id, host, port, secure, username, password, from_email, from_name, admin_email, is_enabled FROM smtp_settings WHERE id = 1 LIMIT 1"
    );
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        host: r.host || "smtp.gmail.com",
        port: Number(r.port) || 587,
        secure: Boolean(r.secure),
        username: r.username || "arish@amvionlabs.com",
        password: r.password || "",
        from_email: r.from_email || "arish@amvionlabs.com",
        from_name: r.from_name || "Olitec Clean Energy",
        admin_email: r.admin_email || "arish@amvionlabs.com",
        is_enabled: Boolean(r.is_enabled),
      };
    }
  } catch (err) {
    console.error("Failed to read smtp_settings from DB:", err);
  }

  return {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    username: "arish@amvionlabs.com",
    password: "",
    from_email: "arish@amvionlabs.com",
    from_name: "Olitec Clean Energy",
    admin_email: "arish@amvionlabs.com",
    is_enabled: true,
  };
}

export async function updateSmtpSettings(input: Partial<SmtpConfig>): Promise<SmtpConfig> {
  const current = await getSmtpSettings();
  const updated: SmtpConfig = {
    ...current,
    ...input,
    port: Number(input.port ?? current.port),
    secure: Boolean(input.secure ?? current.secure),
    is_enabled: Boolean(input.is_enabled ?? current.is_enabled),
  };

  // If password was omitted or empty in request and we had one, keep existing password
  if (input.password === undefined && current.password) {
    updated.password = current.password;
  }

  await execute(
    `INSERT INTO smtp_settings (id, host, port, secure, username, password, from_email, from_name, admin_email, is_enabled)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       host = VALUES(host),
       port = VALUES(port),
       secure = VALUES(secure),
       username = VALUES(username),
       password = IF(VALUES(password) != '', VALUES(password), password),
       from_email = VALUES(from_email),
       from_name = VALUES(from_name),
       admin_email = VALUES(admin_email),
       is_enabled = VALUES(is_enabled)`,
    [
      updated.host,
      updated.port,
      updated.secure ? 1 : 0,
      updated.username,
      updated.password || "",
      updated.from_email,
      updated.from_name,
      updated.admin_email,
      updated.is_enabled ? 1 : 0,
    ]
  );

  return getSmtpSettings();
}

export async function createTransporter(config?: SmtpConfig) {
  const smtp = config || (await getSmtpSettings());

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.username && smtp.password
        ? {
            user: smtp.username,
            pass: smtp.password,
          }
        : undefined,
    tls: {
      rejectUnauthorized: false,
    },
  });

  return { transporter, smtp };
}

export async function sendTestEmail(targetEmail?: string): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter, smtp } = await createTransporter();
    const recipient = targetEmail || smtp.admin_email || "arish@amvionlabs.com";

    // First verify connection
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${smtp.from_name}" <${smtp.from_email}>`,
      to: recipient,
      subject: `[Olitec] SMTP Test Email - ${new Date().toLocaleTimeString()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
          <h2 style="color: #f99f1e; margin-top: 0;">Olitec Clean Energy</h2>
          <h3 style="color: #0f172a;">SMTP Configuration Test Successful</h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">
            This email confirms that your SMTP settings are configured properly on the Olitec Admin Portal.
          </p>
          <table style="width: 100%; font-size: 13px; color: #334155; margin-top: 16px; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-weight: bold;">Host:</td><td>${smtp.host}:${smtp.port}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Username:</td><td>${smtp.username}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Sender:</td><td>${smtp.from_email}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Timestamp:</td><td>${new Date().toISOString()}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Automated notification from Olitec Platform.</p>
        </div>
      `,
    });

    return {
      success: true,
      message: `Test email sent successfully to ${recipient} (Message ID: ${info.messageId})`,
    };
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return {
      success: false,
      message: error?.message || "Failed to send test email. Please check your SMTP host, port, user and password.",
    };
  }
}

export async function sendInquiryNotification(inquiry: {
  kind: string;
  reference_no: string;
  name: string;
  email: string;
  mobile: string;
  city?: string;
  details: Record<string, any>;
}): Promise<void> {
  try {
    const { transporter, smtp } = await createTransporter();
    if (!smtp.is_enabled) return;

    const kindTitles: Record<string, string> = {
      service: "Service Request",
      career: "Job Application",
      partner: "Channel Partner Inquiry",
      consultation: "Free Energy Consultation Request",
    };

    const title = kindTitles[inquiry.kind] || "Website Inquiry";

    let detailsHtml = "";
    for (const [key, val] of Object.entries(inquiry.details || {})) {
      if (val && typeof val === "string" && !["name", "email", "mobile"].includes(key)) {
        detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold; width: 40%; text-transform: capitalize;">${key.replace(/([A-Z])/g, " $1")}:</td><td style="padding: 6px 0; color: #1e293b;">${val}</td></tr>`;
      }
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #f99f1e; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #f99f1e; margin: 0; font-size: 20px; font-weight: 800;">OLITEC CLEAN ENERGY</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">New Form Submission: <strong>${title}</strong></p>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
          <span style="font-size: 12px; font-weight: bold; color: #b45309; text-transform: uppercase;">Reference Number</span>
          <p style="font-size: 18px; font-weight: 800; color: #78350f; margin: 2px 0 0 0;">${inquiry.reference_no}</p>
        </div>

        <h4 style="color: #0f172a; margin: 0 0 10px 0; font-size: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Contact Information</h4>
        <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 18px;">
          <tr><td style="padding: 6px 0; font-weight: bold; width: 40%;">Full Name:</td><td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${inquiry.name}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Email Address:</td><td style="padding: 6px 0; color: #0284c7;"><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">Mobile Number:</td><td style="padding: 6px 0; color: #0f172a;"><a href="tel:${inquiry.mobile}">${inquiry.mobile}</a></td></tr>
          ${inquiry.city ? `<tr><td style="padding: 6px 0; font-weight: bold;">City / Location:</td><td style="padding: 6px 0; color: #0f172a;">${inquiry.city}</td></tr>` : ""}
        </table>

        ${
          detailsHtml
            ? `
          <h4 style="color: #0f172a; margin: 16px 0 10px 0; font-size: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Submission Details</h4>
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 18px;">
            ${detailsHtml}
          </table>
        `
            : ""
        }

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          This is an automated notification from the Olitec Portal. You can view and manage all inquiries in the Admin Dashboard.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${smtp.from_name}" <${smtp.from_email}>`,
      to: smtp.admin_email || "arish@amvionlabs.com",
      subject: `[New ${title}] Ref: ${inquiry.reference_no} - ${inquiry.name}`,
      html,
    });
  } catch (err) {
    console.error("Failed to send inquiry notification email:", err);
    // Silent fail; do not reject form submission
  }
}

export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  purpose: "verify_email" | "reset_password";
  name?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const { transporter, smtp } = await createTransporter();
    const isReset = params.purpose === "reset_password";
    const subject = isReset
      ? `[Olitec] Your Password Reset Code: ${params.otp}`
      : `[Olitec] Your Email Verification Code: ${params.otp}`;
    const heading = isReset ? "Reset Your Password" : "Verify Your Email Address";
    const actionDesc = isReset
      ? "We received a request to reset your password for your Olitec account. Use the verification code below to set a new password."
      : "Thank you for being with Olitec Clean Energy. Please enter the verification code below to verify your email address.";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b;">
        <div style="border-bottom: 2px solid #f99f1e; padding-bottom: 14px; margin-bottom: 22px;">
          <h2 style="color: #f99f1e; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">OLITEC CLEAN ENERGY</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Customer Account Security</p>
        </div>

        <h3 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">${heading}</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          ${params.name ? `Hello <strong>${params.name}</strong>,<br/>` : "Hello,<br/>"}
          ${actionDesc}
        </p>

        <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 2px dashed #f59e0b; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Your 6-Digit One-Time Password</span>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #92400e; padding-left: 10px;">
            ${params.otp}
          </div>
          <span style="font-size: 12px; color: #78350f; font-weight: 600; display: block; margin-top: 8px;">Valid for 10 minutes</span>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px; margin-top: 20px; border: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
            🔒 <strong>Security Warning:</strong> Never share this code with anyone. Olitec support team members will never ask for your OTP. If you did not make this request, you can safely ignore this email.
          </p>
        </div>

        <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          © ${new Date().getFullYear()} Olitec Clean Energy. All rights reserved.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${smtp.from_name}" <${smtp.from_email}>`,
      to: params.to,
      subject,
      html,
    });

    return { success: true };
  } catch (err: any) {
    console.error("Failed to send OTP email:", err);
    return {
      success: false,
      message: err?.message || "Failed to send verification code via email.",
    };
  }
}

export async function sendServiceStatusChangeEmail(params: {
  inquiry: {
    reference_no: string;
    name: string;
    email: string;
    mobile?: string | null;
    city?: string | null;
    kind?: string | null;
    details?: Record<string, any> | null;
    engineer_name?: string | null;
    engineer_contact?: string | null;
    admin_notes?: string | null;
  };
  oldStatus?: string;
  newStatus: string;
  adminNotes?: string;
  engineerName?: string;
  engineerContact?: string;
}): Promise<void> {
  try {
    if (!params.inquiry.email || !params.inquiry.email.includes("@")) {
      console.warn("sendServiceStatusChangeEmail skipped: no valid recipient email.", params.inquiry);
      return;
    }

    const { transporter, smtp } = await createTransporter();
    if (!smtp.is_enabled) return;

    const statusMeta: Record<
      string,
      { label: string; bg: string; color: string; desc: string }
    > = {
      new: {
        label: "Received",
        bg: "#fef3c7",
        color: "#b45309",
        desc: "Your service request has been successfully registered and logged in our service portal. Our dispatch team is reviewing your details.",
      },
      assigned: {
        label: "Engineer Assigned",
        bg: "#e0f2fe",
        color: "#0369a1",
        desc: "A certified Olitec service technician has been assigned to attend to your service request and will contact you shortly.",
      },
      technician_visit: {
        label: "Technician Visit Scheduled",
        bg: "#f3e8ff",
        color: "#7e22ce",
        desc: "Our technician has scheduled a site visit to inspect and diagnose your equipment. Please ensure someone is available at the premises.",
      },
      under_service: {
        label: "Under Service & Diagnostics",
        bg: "#cffafe",
        color: "#0e7490",
        desc: "Your equipment is actively under inspection, maintenance, or component servicing by our technical team.",
      },
      resolved: {
        label: "Service Completed / Resolved",
        bg: "#d1fae5",
        color: "#047857",
        desc: "The reported issue has been successfully resolved and operationally verified by our service engineer. Your equipment is operating normally.",
      },
      closed: {
        label: "Request Closed",
        bg: "#f1f5f9",
        color: "#475569",
        desc: "This service request has been concluded and marked as closed in our records. Thank you for your continued trust in Olitec Clean Energy.",
      },
      contacted: {
        label: "Customer Contacted",
        bg: "#e0e7ff",
        color: "#4338ca",
        desc: "Our customer service support representative has initiated communication regarding your request.",
      },
      in_progress: {
        label: "In Progress",
        bg: "#fef9c3",
        color: "#a16207",
        desc: "Work on your service inquiry is actively in progress with our technical team.",
      },
    };

    const currentStatus = statusMeta[params.newStatus] || {
      label: params.newStatus.replace(/_/g, " ").toUpperCase(),
      bg: "#fef3c7",
      color: "#b45309",
      desc: "The status of your service request has been updated.",
    };

    const details = params.inquiry.details || {};
    const model = details.productModel || details.model || details.product || "Olitec Equipment";
    const serial = details.serialNumber || details.serial || "";
    const issue = details.issueDescription || details.message || details.issue || "";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <!-- Brand Header -->
        <div style="border-bottom: 2px solid #f99f1e; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="color: #f99f1e; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">OLITEC CLEAN ENERGY</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Customer Service & Technical Support</p>
          </div>
        </div>

        <!-- Greeting -->
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
          Dear <strong>${params.inquiry.name || "Customer"}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          This is an official status update regarding your registered Olitec Service Request.
        </p>

        <!-- Status Card -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 22px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Reference</td>
              <td style="text-align: right; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Current Status</td>
            </tr>
            <tr>
              <td style="font-size: 18px; font-weight: 800; color: #0f172a; padding-top: 4px;">
                ${params.inquiry.reference_no}
              </td>
              <td style="text-align: right; padding-top: 4px;">
                <span style="display: inline-block; background-color: ${currentStatus.bg}; color: ${currentStatus.color}; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: capitalize;">
                  ${currentStatus.label}
                </span>
              </td>
            </tr>
          </table>

          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #334155; line-height: 1.6;">
            ${currentStatus.desc}
          </div>
        </div>

        <!-- Engineer Assigned Box (if applicable) -->
        ${
          params.engineerName
            ? `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 16px; margin-bottom: 22px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <span style="font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Assigned Service Engineer</span>
            </div>
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-weight: 600; color: #1e3a8a; width: 35%;">Engineer Name:</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${params.engineerName}</td>
              </tr>
              ${
                params.engineerContact
                  ? `
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; color: #1e3a8a;">Contact Number:</td>
                  <td style="padding: 4px 0;">
                    <a href="tel:${params.engineerContact}" style="color: #2563eb; font-weight: 700; text-decoration: none;">${params.engineerContact}</a>
                  </td>
                </tr>
              `
                  : ""
              }
            </table>
          </div>
        `
            : ""
        }

        <!-- Admin / Engineer Notes (if provided) -->
        ${
          params.adminNotes
            ? `
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 14px; padding: 16px; margin-bottom: 22px;">
            <span style="font-size: 12px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Engineer / Service Remarks</span>
            <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.6; font-style: italic;">
              "${params.adminNotes}"
            </p>
          </div>
        `
            : ""
        }

        <!-- Service Details Summary -->
        <h4 style="color: #0f172a; margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Equipment Information</h4>
        <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 5px 0; font-weight: 600; width: 35%;">Product / Model:</td>
            <td style="padding: 5px 0; color: #0f172a; font-weight: 600;">${model}</td>
          </tr>
          ${
            serial
              ? `<tr>
            <td style="padding: 5px 0; font-weight: 600;">Serial Number:</td>
            <td style="padding: 5px 0; color: #0f172a; font-family: monospace; font-weight: 700;">${serial}</td>
          </tr>`
              : ""
          }
          ${
            params.inquiry.city
              ? `<tr>
            <td style="padding: 5px 0; font-weight: 600;">Registered City:</td>
            <td style="padding: 5px 0; color: #0f172a;">${params.inquiry.city}</td>
          </tr>`
              : ""
          }
          ${
            issue
              ? `<tr>
            <td style="padding: 5px 0; font-weight: 600;">Reported Issue:</td>
            <td style="padding: 5px 0; color: #334155;">${issue}</td>
          </tr>`
              : ""
          }
        </table>

        <!-- Support Info -->
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 14px; border: 1px solid #f1f5f9; font-size: 12px; color: #64748b; line-height: 1.5;">
          Have questions or require immediate assistance? Please contact our customer support helpdesk at <a href="mailto:support@olitec.in" style="color: #f99f1e; text-decoration: none; font-weight: 600;">support@olitec.in</a> or call our toll-free customer care.
        </div>

        <!-- Footer -->
        <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          © ${new Date().getFullYear()} Olitec Clean Energy. All rights reserved. Automated Service Notification.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${smtp.from_name}" <${smtp.from_email}>`,
      to: params.inquiry.email,
      subject: `[Olitec Service Update] Ref: ${params.inquiry.reference_no} is now "${currentStatus.label}"`,
      html,
    });

    console.log(`[Service Mail] Status update email sent to ${params.inquiry.email} for ticket ${params.inquiry.reference_no} (${currentStatus.label}).`);
  } catch (err: any) {
    console.error("[Service Mail] Failed to send service status email:", err);
  }
}
