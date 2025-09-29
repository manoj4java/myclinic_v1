import bcrypt from 'bcryptjs';
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./shared/schema.ts";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Database connection setup
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "clinic_connect",
});

const db = drizzle(pool, { schema });

// User details to create
const USER_DETAILS = {
  username: "sampleuser",
  email: "sampleemail@mail.com",
  password: "samplepassword",
  firstName: "Sample",
  lastName: "User",
  role: "technician", // Default role
  isActive: true,
  emailNotifications: true,
};

async function createSampleUser() {
  try {
    console.log("🚀 Starting user creation process...");
    
    // Check if user already exists
    console.log("🔍 Checking if user already exists...");
    const existingUserByEmail = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, USER_DETAILS.email))
      .limit(1);
    
    const existingUserByUsername = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, USER_DETAILS.username))
      .limit(1);
    
    if (existingUserByEmail.length > 0) {
      console.log("❌ User with this email already exists!");
      console.log("Existing user:", {
        id: existingUserByEmail[0].id,
        email: existingUserByEmail[0].email,
        username: existingUserByEmail[0].username,
        name: `${existingUserByEmail[0].firstName} ${existingUserByEmail[0].lastName}`,
        role: existingUserByEmail[0].role
      });
      return;
    }
    
    if (existingUserByUsername.length > 0) {
      console.log("❌ User with this username already exists!");
      console.log("Existing user:", {
        id: existingUserByUsername[0].id,
        email: existingUserByUsername[0].email,
        username: existingUserByUsername[0].username,
        name: `${existingUserByUsername[0].firstName} ${existingUserByUsername[0].lastName}`,
        role: existingUserByUsername[0].role
      });
      return;
    }
    
    // Hash the password using bcrypt with salt rounds 12 (same as used in the application)
    console.log("🔐 Hashing password...");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(USER_DETAILS.password, saltRounds);
    console.log("✅ Password hashed successfully");
    
    // Create the user
    console.log("👤 Creating user in database...");
    const [newUser] = await db
      .insert(schema.users)
      .values({
        username: USER_DETAILS.username,
        email: USER_DETAILS.email,
        password: hashedPassword,
        firstName: USER_DETAILS.firstName,
        lastName: USER_DETAILS.lastName,
        role: USER_DETAILS.role,
        isActive: USER_DETAILS.isActive,
        emailNotifications: USER_DETAILS.emailNotifications,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    console.log("✅ User created successfully!");
    console.log("\n📋 User Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`ID:         ${newUser.id}`);
    console.log(`Username:   ${newUser.username}`);
    console.log(`Email:      ${newUser.email}`);
    console.log(`Name:       ${newUser.firstName} ${newUser.lastName}`);
    console.log(`Role:       ${newUser.role}`);
    console.log(`Active:     ${newUser.isActive ? 'Yes' : 'No'}`);
    console.log(`Notifications: ${newUser.emailNotifications ? 'Enabled' : 'Disabled'}`);
    console.log(`Created:    ${newUser.createdAt}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    console.log("\n🔑 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email:      ${USER_DETAILS.email}`);
    console.log(`Password:   ${USER_DETAILS.password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Verify the password hash works correctly
    console.log("\n🔍 Verifying password hash...");
    const isValidPassword = await bcrypt.compare(USER_DETAILS.password, hashedPassword);
    console.log(`Password verification: ${isValidPassword ? '✅ Success' : '❌ Failed'}`);
    
  } catch (error) {
    console.error("❌ Error creating user:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  } finally {
    // Close database connection
    await pool.end();
    console.log("\n🔐 Database connection closed");
  }
}

// Run the script
createSampleUser().then(() => {
  console.log("\n✨ Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});

export { createSampleUser };