import { query, execute } from "../db/pool.js";
import { hashPassword, verifyPassword } from "../utils/crypto.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";

export const customerService = {
  async getProfile(userId: number | string) {
    const rows = await query<any>(
      `SELECT id, name, email, mobile, city, state, address, pincode, role, status, is_email_verified, created_at
       FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (!rows || rows.length === 0) {
      throw new NotFoundError("Customer not found");
    }
    const r = rows[0];
    return {
      ...r,
      is_email_verified: Boolean(r.is_email_verified),
    };
  },

  async getDashboard(userId: number | string, email?: string, mobile?: string) {
    // 1. Profile from users table
    const user = await this.getProfile(userId).catch(() => null);

    const userEmail = email || user?.email || "";
    const userMobile = mobile || user?.mobile || "";

    // 2. Warranties matching user_id OR email OR mobile
    const warranties = await query<any>(
      `SELECT w.id, w.warranty_number, w.product_id, w.product_model, w.serial_number,
              w.purchase_date, w.installation_date, w.dealer_name, w.status,
              w.start_date, w.end_date, w.submitted_at,
              p.name as product_name, p.slug as product_slug, p.category as product_category, p.image_url
       FROM warranties w
       LEFT JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? OR w.email = ? OR (w.mobile = ? AND w.mobile != '')
       ORDER BY w.submitted_at DESC`,
      [userId, userEmail, userMobile]
    );

    // 3. Registered products (from warranties that are not rejected)
    const registeredProducts = warranties.filter((w: any) => w.status !== "rejected");

    // 4. Inquiries matching user email or mobile
   
// 4. Inquiries matching user email or mobile
const inquiries = await query<any>(
  `SELECT
      id,
      kind,
      reference_no,
      name,
      email,
      mobile,
      city,
      status,
      details,
      file_url,
      admin_notes,
      engineer_name,
      engineer_contact,
      created_at
   FROM inquiries
   WHERE email = ? OR (mobile = ? AND mobile != '')
   ORDER BY created_at DESC`,
  [userEmail, userMobile]
);


    const parsedInquiries = inquiries.map((inq: any) => ({
      ...inq,
      details: typeof inq.details === "string" ? JSON.parse(inq.details) : inq.details || {},
    }));

    const serviceRequests = parsedInquiries.filter((inq: any) => inq.kind === "service");
    const otherSubmissions = parsedInquiries.filter((inq: any) => ["consultation", "partner"].includes(inq.kind));
    const careerApplications = parsedInquiries.filter((inq: any) => inq.kind === "career");

    return {
      profile: user,
      registeredProducts,
      warranties,
      serviceRequests,
      otherSubmissions,
      careerApplications,
    };
  },

  async updateProfile(userId: number | string, changes: any) {
    const fields: string[] = [];
    const params: any[] = [];
    if (changes.name) {
      fields.push("name = ?");
      params.push(changes.name.trim());
    }
    if (changes.mobile) {
      fields.push("mobile = ?");
      params.push(changes.mobile.replace(/\D/g, ""));
    }
    if (changes.city !== undefined) {
      fields.push("city = ?");
      params.push(changes.city?.trim() || null);
    }
    if (changes.state !== undefined) {
      fields.push("state = ?");
      params.push(changes.state?.trim() || null);
    }
    if (changes.address !== undefined) {
      fields.push("address = ?");
      params.push(changes.address?.trim() || null);
    }
    if (changes.pincode !== undefined) {
      fields.push("pincode = ?");
      params.push(changes.pincode?.trim() || null);
    }

    if (fields.length > 0) {
      params.push(userId);
      await execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);
    }

    return this.getProfile(userId);
  },

  async changePassword(userId: number | string, currentPass: string, newPass: string) {
    if (!currentPass || !newPass) {
      throw new BadRequestError("Both current password and new password are required.");
    }
    if (newPass.length < 6) {
      throw new BadRequestError("New password must be at least 6 characters long.");
    }
    const rows = await query<any>("SELECT id, password_hash FROM users WHERE id = ? LIMIT 1", [userId]);
    if (!rows || rows.length === 0) {
      throw new NotFoundError("Customer not found.");
    }
    const user = rows[0];
    const isMatch = await verifyPassword(currentPass, user.password_hash);
    if (!isMatch) {
      throw new BadRequestError("The current password you entered is incorrect.");
    }
    const newHash = await hashPassword(newPass);
    await execute("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, userId]);
    return { success: true, message: "Password updated successfully." };
  },
};
