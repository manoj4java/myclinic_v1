import bcrypt from 'bcryptjs';
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./shared/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database connection setup
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  password: process.env.DB_PASSWORD || "welcome123",
  database: process.env.DB_NAME || "postgres",
});

const db = drizzle(pool, { schema });

async function verifyUser() {
  try {
    console.log("🔍 Verifying user creation...");
    
    // Find the user
    const user = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, "sampleemail@mail.com"))
      .limit(1);
    
    if (user.length === 0) {
      console.log("❌ User not found in database!");
      return;
    }
    
    const userData = user[0];
    console.log("✅ User found in database:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`ID:         ${userData.id}`);
    console.log(`Username:   ${userData.username}`);
    console.log(`Email:      ${userData.email}`);
    console.log(`Name:       ${userData.firstName} ${userData.lastName}`);
    console.log(`Role:       ${userData.role}`);
    console.log(`Active:     ${userData.isActive ? 'Yes' : 'No'}`);
    console.log(`Has Password: ${userData.password ? 'Yes' : 'No'}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Test password verification
    if (userData.password) {
      console.log("\n🔐 Testing password verification...");
      const isValidPassword = await bcrypt.compare("samplepassword", userData.password);
      console.log(`Password test: ${isValidPassword ? '✅ Correct' : '❌ Failed'}`);
      
      // Test wrong password
      const isWrongPassword = await bcrypt.compare("wrongpassword", userData.password);
      console.log(`Wrong password test: ${isWrongPassword ? '❌ Should fail' : '✅ Correctly rejected'}`);
    }
    
  } catch (error) {
    console.error("❌ Error verifying user:", error);
  } finally {
    // Close database connection
    await pool.end();
    console.log("\n🔐 Database connection closed");
  }
}

// Run the verification
verifyUser().then(() => {
  console.log("\n✨ Verification completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});