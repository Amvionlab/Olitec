
import type { LoginBody, RegisterBody } from "../schemas/auth.schema.js";
import { execute, withTransaction } from "../db/pool.js";
import { hashPassword } from "../modules/ecommerce/shared/auth.js";
import { ConflictError, NotImplementedError } from "../utils/errors.js";

export interface AuthService {
  registerCustomer(input: RegisterBody): Promise<{
    id: number;
    name: string;
    email: string;
    mobile: string;
  }>;
  loginCustomer(input: LoginBody): Promise<never>;
  loginAdmin(input: LoginBody): Promise<never>;
  logout(): Promise<never>;
}

export const authService: AuthService = {
  async registerCustomer(input: RegisterBody) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const mobile = input.mobile.replace(/\D/g, "");
    const passwordHash = await hashPassword(input.password);

    try {
      const customer = await withTransaction(async (connection) => {
        // 1. Insert customer
        const customerResult = await execute(
          `INSERT INTO customers
            (name, email, mobile, password_hash)
           VALUES (?, ?, ?, ?)`,
          [name, email, mobile, passwordHash],
          connection
        );

        const customerId = customerResult.insertId;

        // 2. Insert corresponding user
        await execute(
          `INSERT INTO users
            (name, email, mobile, password_hash, status, customer_id)
           VALUES (?, ?, ?, ?, 'active', ?)`,
          [name, email, mobile, passwordHash, customerId],
          connection
        );

        return {
          id: Number(customerId),
          name,
          email,
          mobile,
        };
      });

      return customer;
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        throw new ConflictError(
          "This email or mobile number is already registered."
        );
      }
      throw error;
    }
  },

  async loginCustomer() {
    throw new NotImplementedError("Customer login");
  },

  async loginAdmin() {
    throw new NotImplementedError("Admin login");
  },

  async logout() {
    throw new NotImplementedError("Logout");
  },
};
