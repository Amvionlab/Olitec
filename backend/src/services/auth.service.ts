
import type { LoginBody, RegisterBody } from "../schemas/auth.schema.js";
import { execute, queryOne } from "../db/pool.js";
import { hashPassword, verifyPassword, createToken } from "../utils/crypto.js";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../utils/errors.js";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: "customer" | "admin";
  status: "active" | "inactive";
  is_email_verified?: boolean;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  mobile: string;
  password_hash: string;
  role: "customer" | "admin";
  status: "active" | "inactive";
  is_email_verified?: boolean | number;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  last_login_at: Date | null;
  created_at: Date;
}

export interface AuthService {
  registerCustomer(input: RegisterBody): Promise<AuthResponse>;
  loginCustomer(input: LoginBody): Promise<AuthResponse>;
  loginAdmin(input: LoginBody): Promise<AuthResponse>;
  getCurrentUser(id: number): Promise<UserProfile>;
  logout(): Promise<{ success: boolean; message: string }>;
}

export const authService: AuthService = {
  async registerCustomer(input: RegisterBody): Promise<AuthResponse> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const mobile = input.mobile.replace(/\D/g, "");

    // Check if email already registered
    const existingEmail = await queryOne<UserRow>("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail) {
      throw new ConflictError("This email address is already registered.");
    }

    // Check if mobile already registered
    const existingMobile = await queryOne<UserRow>("SELECT id FROM users WHERE mobile = ?", [mobile]);
    if (existingMobile) {
      throw new ConflictError("This mobile number is already registered.");
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const result = await execute(
        `INSERT INTO users (name, email, mobile, password_hash, role, status)
         VALUES (?, ?, ?, ?, 'customer', 'active')`,
        [name, email, mobile, passwordHash],
      );

      const userId = Number(result.insertId);
      const user: UserProfile = {
        id: userId,
        name,
        email,
        mobile,
        role: "customer",
        status: "active",
      };

      const token = createToken({
        id: userId,
        email,
        role: "customer",
        name,
      });

      return { user, token };
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        throw new ConflictError("This email or mobile number is already registered.");
      }
      throw error;
    }
  },

  async loginCustomer(input: LoginBody): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await queryOne<UserRow>("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    if (user.status === "inactive") {
      throw new ForbiddenError("Your account is deactivated. Please contact support.");
    }

    // Update last login
    await execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);

    const userProfile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
    };

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return { user: userProfile, token };
  },

  async loginAdmin(input: LoginBody): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await queryOne<UserRow>("SELECT * FROM users WHERE email = ? AND role = 'admin'", [email]);

    if (!user) {
      throw new UnauthorizedError("Invalid admin credentials.");
    }

    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError("Invalid admin credentials.");
    }

    if (user.status === "inactive") {
      throw new ForbiddenError("This admin account is deactivated.");
    }

    // Update last login
    await execute("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);

    const userProfile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
    };

    const token = createToken({
      id: user.id,
      email: user.email,
      role: "admin",
      name: user.name,
    });

    return { user: userProfile, token };
  },

  async getCurrentUser(id: number): Promise<UserProfile> {
    const user = await queryOne<UserRow>(
      "SELECT id, name, email, mobile, role, status, is_email_verified, address, city, state, pincode FROM users WHERE id = ?",
      [id],
    );
    if (!user) throw new NotFoundError("User not found");

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      is_email_verified: Boolean(user.is_email_verified),
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
    };
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: "Logged out successfully" };
  },
};
