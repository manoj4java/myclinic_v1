// Quick script to check report templates in database
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { reportTemplates } from './shared/schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function checkTemplates() {
  try {
    console.log('Checking report templates in database...');
    const templates = await db.select().from(reportTemplates);
    console.log(`Found ${templates.length} templates:`);
    
    templates.forEach((template, index) => {
      console.log(`\nTemplate ${index + 1}:`);
      console.log(`  ID: ${template.id}`);
      console.log(`  Name: ${template.name}`);
      console.log(`  Description: ${template.description}`);
      console.log(`  Template: ${template.template?.substring(0, 100)}...`);
      console.log(`  Category: ${template.category}`);
      console.log(`  Active: ${template.isActive}`);
      console.log(`  Created: ${template.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error checking templates:', error);
  } finally {
    await pool.end();
  }
}

checkTemplates();