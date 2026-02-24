import { getPool } from "./database";
import * as fs from "fs";
import * as path from "path";

const MIGRATIONS_DIR = path.join(__dirname, "sql");

export async function runMigrations(): Promise<void> {
  if (process.env.AUTO_MIGRATE === "false") {
    console.log("⏭ Auto-migration disabled (AUTO_MIGRATE=false)");
    return;
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf8");
      await client.query(sql);
      console.log(`✓ Ran migration: ${file}`);
    }

    console.log(`✓ Database migrated (${files.length} file(s))`);
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  } finally {
    client.release();
  }
}
