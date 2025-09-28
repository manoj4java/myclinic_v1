-- Migration: Add report templates and patient reports tables
-- Created: 2024-09-28

-- Report Templates table
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_type VARCHAR DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  file_size INTEGER,
  category VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR REFERENCES users(id),
  updated_by VARCHAR,
  ip_address VARCHAR
);

-- Patient Reports table
CREATE TABLE patient_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  template_id UUID REFERENCES report_templates(id),
  report_name VARCHAR NOT NULL,
  report_content TEXT,
  file_name VARCHAR,
  file_path VARCHAR,
  file_type VARCHAR,
  file_size INTEGER,
  status VARCHAR DEFAULT 'draft',
  doctor_id VARCHAR NOT NULL REFERENCES users(id),
  reviewed_by VARCHAR REFERENCES users(id),
  reviewed_at TIMESTAMP,
  finalized_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR,
  updated_by VARCHAR,
  ip_address VARCHAR
);

-- Update patients table report_status default value
ALTER TABLE patients ALTER COLUMN report_status SET DEFAULT 'N/A';

-- Create indexes for better performance
CREATE INDEX idx_report_templates_category ON report_templates(category);
CREATE INDEX idx_report_templates_active ON report_templates(is_active);
CREATE INDEX idx_patient_reports_patient_id ON patient_reports(patient_id);
CREATE INDEX idx_patient_reports_template_id ON patient_reports(template_id);
CREATE INDEX idx_patient_reports_doctor_id ON patient_reports(doctor_id);
CREATE INDEX idx_patient_reports_status ON patient_reports(status);
CREATE INDEX idx_patient_reports_created_at ON patient_reports(created_at DESC);