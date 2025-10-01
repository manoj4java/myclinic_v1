import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { reportTemplates } from './shared/schema.js';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/myclinic';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function seedReportTemplates() {
  console.log('Seeding report templates with rich content...');

  const templates = [
    {
      name: 'CT Scan Report',
      description: 'Standard CT scan report template with structured formatting',
      category: 'Radiology',
      isActive: true,
      template: `
<h1>CT SCAN REPORT</h1>

<table class="patient-header-table">
  <tr>
    <td class="label">Patient ID:</td>
    <td class="value">{{patientId}}</td>
    <td class="label">Patient Name:</td>
    <td class="value">{{patientName}}</td>
  </tr>
  <tr>
    <td class="label">Age/Sex:</td>
    <td class="value">{{age}}/{{gender}}</td>
    <td class="label">Date:</td>
    <td class="value">{{studyDate}}</td>
  </tr>
  <tr>
    <td class="label">Referred By:</td>
    <td class="value">{{refBy}}</td>
    <td class="label">Reported Date:</td>
    <td class="value">{{currentDate}}</td>
  </tr>
</table>

<div class="content-section">
  <h2>CLINICAL HISTORY:</h2>
  <p>{{chiefComplaint}}</p>
</div>

<div class="content-section">
  <h2>TECHNIQUE:</h2>
  <p>{{studyDesc}}</p>
  <p><strong>Modality:</strong> {{modality}}</p>
  <p><strong>Contrast:</strong> [Enter contrast details if applicable]</p>
</div>

<div class="content-section">
  <h2>FINDINGS:</h2>
  <p>[Enter detailed CT scan findings here]</p>
  
  <h3>Brain:</h3>
  <ul>
    <li>[Enter brain findings]</li>
  </ul>
  
  <h3>Vessels:</h3>
  <ul>
    <li>[Enter vascular findings]</li>
  </ul>
</div>

<div class="content-section">
  <h2>IMPRESSION:</h2>
  <p>[Enter clinical impression and recommendations]</p>
</div>

<div class="signature-section">
  <p><strong>Reported by:</strong> {{reportedBy}}</p>
  <p><strong>Date:</strong> {{currentDate}}</p>
  <p><strong>Time:</strong> {{currentTime}}</p>
</div>
      `.trim()
    },
    {
      name: 'MRI Brain Report',
      description: 'Comprehensive MRI brain report with detailed sections',
      category: 'Radiology',
      isActive: true,
      template: `
<h1 style="text-align: center; color: #2c3e50; font-weight: bold;">MRI BRAIN REPORT</h1>

<table class="patient-header-table">
  <tr>
    <td class="label">Patient ID:</td>
    <td class="value">{{patientId}}</td>
    <td class="label">Patient Name:</td>
    <td class="value">{{patientName}}</td>
  </tr>
  <tr>
    <td class="label">Age/Sex:</td>
    <td class="value">{{age}}/{{gender}}</td>
    <td class="label">Date:</td>
    <td class="value">{{studyDate}}</td>
  </tr>
  <tr>
    <td class="label">Referred By:</td>
    <td class="value">{{refBy}}</td>
    <td class="label">Reported Date:</td>
    <td class="value">{{currentDate}}</td>
  </tr>
</table>

<div class="content-section">
  <h2>CLINICAL HISTORY:</h2>
  <p>{{chiefComplaint}}</p>
  <p><strong>Past Medical History:</strong> {{medicalHistory}}</p>
</div>

<div class="content-section">
  <h2>TECHNIQUE:</h2>
  <p>{{studyDesc}}</p>
  <p><strong>MRI sequences performed:</strong></p>
  <ul>
    <li>T1-weighted images</li>
    <li>T2-weighted images</li>
    <li>FLAIR images</li>
    <li>DWI (Diffusion Weighted Imaging)</li>
    <li>Post-contrast T1-weighted images (if applicable)</li>
  </ul>
</div>

<div class="content-section">
  <h2>FINDINGS:</h2>
  
  <h3>Gray Matter:</h3>
  <p>[Enter gray matter findings]</p>
  
  <h3>White Matter:</h3>
  <p>[Enter white matter findings]</p>
  
  <h3>Ventricular System:</h3>
  <p>[Enter ventricular findings]</p>
  
  <h3>Extra-axial Spaces:</h3>
  <p>[Enter extra-axial findings]</p>
  
  <h3>Vascular Structures:</h3>
  <p>[Enter vascular findings]</p>
</div>

<div class="content-section">
  <h2>IMPRESSION:</h2>
  <ol>
    <li>[Primary finding]</li>
    <li>[Secondary finding]</li>
    <li>[Additional findings]</li>
  </ol>
  
  <p><strong>Recommendation:</strong> [Enter clinical recommendations]</p>
</div>

<div class="signature-section">
  <table style="width: 100%; border: none;">
    <tr>
      <td style="border: none;"><strong>Reported by:</strong> {{reportedBy}}</td>
      <td style="border: none; text-align: right;"><strong>Date:</strong> {{currentDate}}</td>
    </tr>
    <tr>
      <td style="border: none;"><strong>Medical Center:</strong> {{center}}</td>
      <td style="border: none; text-align: right;"><strong>Time:</strong> {{currentTime}}</td>
    </tr>
  </table>
</div>
      `.trim()
    },
    {
      name: 'General Medical Report',
      description: 'General purpose medical report template',
      category: 'General Medicine',
      isActive: true,
      template: `
<h1 style="text-align: center;">MEDICAL REPORT</h1>

<table class="patient-header-table">
  <tr>
    <td class="label">Patient ID:</td>
    <td class="value">{{patientId}}</td>
    <td class="label">Patient Name:</td>
    <td class="value">{{patientName}}</td>
  </tr>
  <tr>
    <td class="label">Age/Sex:</td>
    <td class="value">{{age}}/{{gender}}</td>
    <td class="label">Date:</td>
    <td class="value">{{studyDate}}</td>
  </tr>
  <tr>
    <td class="label">Referred By:</td>
    <td class="value">{{refBy}}</td>
    <td class="label">Reported Date:</td>
    <td class="value">{{currentDate}}</td>
  </tr>
</table>

<div class="content-section">
  <h2>CHIEF COMPLAINT:</h2>
  <p>{{chiefComplaint}}</p>
</div>

<div class="content-section">
  <h2>HISTORY OF PRESENT ILLNESS:</h2>
  <p>[Enter detailed history of present illness]</p>
</div>

<div class="content-section">
  <h2>PAST MEDICAL HISTORY:</h2>
  <p>{{medicalHistory}}</p>
</div>

<div class="content-section">
  <h2>PHYSICAL EXAMINATION:</h2>
  
  <h3>Vital Signs:</h3>
  <ul>
    <li>Blood Pressure: ___/__ mmHg</li>
    <li>Heart Rate: ___ bpm</li>
    <li>Temperature: ___°F</li>
    <li>Respiratory Rate: ___ /min</li>
    <li>Oxygen Saturation: ___%</li>
  </ul>
  
  <h3>General Examination:</h3>
  <p>[Enter general examination findings]</p>
  
  <h3>Systemic Examination:</h3>
  <p>[Enter systemic examination findings]</p>
</div>

<div class="content-section">
  <h2>INVESTIGATIONS:</h2>
  <p>{{studyDesc}}</p>
  <p>[Enter laboratory and imaging results]</p>
</div>

<div class="content-section">
  <h2>DIAGNOSIS:</h2>
  <ol>
    <li>[Primary diagnosis]</li>
    <li>[Secondary diagnosis]</li>
  </ol>
</div>

<div class="content-section">
  <h2>TREATMENT PLAN:</h2>
  <p>[Enter treatment recommendations]</p>
</div>

<div class="signature-section">
  <p><strong>Attending Physician:</strong> {{reportedBy}}</p>
  <p><strong>Medical Center:</strong> {{center}}</p>
  <p><strong>Date:</strong> {{currentDate}} | <strong>Time:</strong> {{currentTime}}</p>
</div>
      `.trim()
    }
  ];

  try {
    for (const template of templates) {
      await db.insert(reportTemplates).values({
        ...template,
        createdBy: 'system',
        updatedBy: 'system'
      });
      console.log(`✅ Created template: ${template.name}`);
    }
    
    console.log('✅ Report templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    await sql.end();
  }
}

seedReportTemplates();