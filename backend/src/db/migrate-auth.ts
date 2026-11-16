import { execute, query } from "./pool.js";

export async function migrateAuthTables(): Promise<void> {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(191) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        purpose ENUM('verify_email', 'reset_password') NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_email_purpose (email, purpose, is_used)
      ) ENGINE = InnoDB;
    `);
    console.log("[DB] email_otps table ensured.");

    const cols = await query<any>("SHOW COLUMNS FROM users LIKE 'is_email_verified'");
    if (!cols || cols.length === 0) {
      await execute("ALTER TABLE users ADD COLUMN is_email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER status");
      console.log("[DB] Added is_email_verified column to users table.");
    }
  } catch (err) {
    console.error("[DB] Migration error in migrateAuthTables:", err);
  }
}
