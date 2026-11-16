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
