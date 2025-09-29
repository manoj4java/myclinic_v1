import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "./shared/schema";
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

// Initial medical centers data
const medicalCentersData = [
  {
    name: "Deesa Medical Center",
    code: "DEESA",
    address: "Deesa, Banaskantha, Gujarat, India",
    phone: "+91-9876543210",
    email: "info@deesamedical.com",
    isActive: true,
  },
  {
    name: "RM Sachore Hospital",
    code: "RMSACHORE",
    address: "RM Sachore, Banaskantha, Gujarat, India", 
    phone: "+91-9876543211",
    email: "info@rmsachore.com",
    isActive: true,
  }
];

async function seedMedicalCenters() {
  try {
    console.log("🏥 Starting to seed medical centers...");

    for (const centerData of medicalCentersData) {
      try {
        console.log(`🏥 Creating medical center: ${centerData.name} (${centerData.code})`);
        
        // Check if center already exists
        const existingCenter = await db
          .select()
          .from(schema.medicalCenters)
          .where(eq(schema.medicalCenters.code, centerData.code))
          .limit(1);

        if (existingCenter.length > 0) {
          console.log(`⚠️  Medical center ${centerData.code} already exists, skipping...`);
          continue;
        }

        const newCenter = await db.insert(schema.medicalCenters).values({
          name: centerData.name,
          code: centerData.code,
          address: centerData.address,
          phone: centerData.phone,
          email: centerData.email,
          isActive: centerData.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        console.log(`✅ Successfully created medical center: ${newCenter[0].name}`);
      } catch (error) {
        console.error(`❌ Error creating medical center ${centerData.name}:`, error);
      }
    }

    console.log("\n🎉 Medical centers seeding completed!");
    
    // Display all medical centers
    console.log("\n📋 Current medical centers in database:");
    const allCenters = await db.select().from(schema.medicalCenters);
    allCenters.forEach((center, index) => {
      console.log(`${index + 1}. ${center.name} (${center.code}) - ${center.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error("❌ Error seeding medical centers:", error);
  } finally {
    // Close database connection
    await pool.end();
    console.log("\n🔐 Database connection closed");
  }
}

// Run the seeding
seedMedicalCenters().then(() => {
  console.log("\n✨ Seeding completed");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});