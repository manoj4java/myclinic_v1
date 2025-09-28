// Test script to create a report template directly
import { storage } from './server/storage.js';

async function testCreateTemplate() {
  try {
    console.log('Testing report template creation...');
    
    const testTemplate = {
      name: 'Test Template Direct',
      description: 'Direct test template',
      template: 'This is a test template with {{patient_name}} and {{date}}',
      category: 'general',
      isActive: true,
      createdBy: '11111111-1111-1111-1111-111111111111',
      updatedBy: '11111111-1111-1111-1111-111111111111'
    };
    
    console.log('Creating template with data:', testTemplate);
    const created = await storage.createReportTemplate(testTemplate);
    console.log('Created template:', created);
    
    console.log('Fetching all templates...');
    const allTemplates = await storage.getAllReportTemplates();
    console.log(`Found ${allTemplates.length} templates:`, allTemplates);
    
  } catch (error) {
    console.error('Error testing template creation:', error);
  }
}

testCreateTemplate();