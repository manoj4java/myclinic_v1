-- Migration: Add patient_comments table
-- Created: 2024-09-28

CREATE TABLE patient_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id VARCHAR NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR,
  updated_by VARCHAR,
  ip_address VARCHAR
);

-- Create index on patient_id for faster queries
CREATE INDEX idx_patient_comments_patient_id ON patient_comments(patient_id);

-- Create index on doctor_id for faster queries
CREATE INDEX idx_patient_comments_doctor_id ON patient_comments(doctor_id);

-- Create index on created_at for sorting
CREATE INDEX idx_patient_comments_created_at ON patient_comments(created_at DESC);