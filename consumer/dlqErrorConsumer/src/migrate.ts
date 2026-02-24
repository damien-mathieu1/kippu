import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "messages",
  user: process.env.POSTGRES_USER || "app",
  password: process.env.POSTGRES_PASSWORD || "app",
});

async function runMigration(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("🚀 Démarrage de la migration...");

    // Lire le fichier schema.sql
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("📄 Exécution du schéma SQL...");
    await client.query(schema);

    console.log("✓ Migration terminée avec succès !");
    console.log("\nTable créée: dlq_errors");
    console.log("Index créés: idx_dlq_errors_source_topic, idx_dlq_errors_status, idx_dlq_errors_created_at, idx_dlq_errors_error_timestamp");
    console.log("Trigger créé: update_dlq_errors_updated_at");

    // Afficher un résumé
    const countResult = await client.query("SELECT COUNT(*) FROM dlq_errors");
    console.log(`\n📊 Nombre d'erreurs existantes: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error("✗ Erreur lors de la migration:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration
runMigration()
  .then(() => {
    console.log("\n✅ Migration complète");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Migration échouée:", err.message);
    process.exit(1);
  });
