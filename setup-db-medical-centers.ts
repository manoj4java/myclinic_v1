import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  password: process.env.DB_PASSWORD || "welcome123",
  database: process.env.DB_NAME || "postgres",
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log("🔗 Connected to database");
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "create-medical-centers.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    console.log("📝 Executing SQL migration...");
    
    // Execute the SQL
    const result = await client.query(sql);
    
    console.log("✅ Migration completed successfully!");
    console.log("📋 Results:");
    
    // If there are results, display them
    if (result.rows && result.rows.length > 0) {
      console.table(result.rows);
    }
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
    console.log("🔐 Database connection closed");
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log("\n✨ Setup completed successfully!");
    console.log("🎉 Medical centers table is ready!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Setup failed:", error.message);
    process.exit(1);
  });