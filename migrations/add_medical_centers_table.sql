-- Migration: Add medical_centers table
-- Created: 2025-09-29
-- Description: Create medical_centers table for managing medical facilities

CREATE TABLE IF NOT EXISTS medical_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR,
  email VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR,
  updated_by VARCHAR,
  ip_address VARCHAR
);

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_medical_centers_code ON medical_centers(code);

-- Create index on is_active for filtering active centers
CREATE INDEX IF NOT EXISTS idx_medical_centers_active ON medical_centers(is_active);

-- Insert initial data
INSERT INTO medical_centers (name, code, address, phone, email, is_active, created_at, updated_at) 
VALUES 
  ('Deesa Medical Center', 'DEESA', 'Deesa, Banaskantha, Gujarat, India', '+91-9876543210', 'info@deesamedical.com', true, NOW(), NOW()),
  ('RM Sachore Hospital', 'RMSACHORE', 'RM Sachore, Banaskantha, Gujarat, India', '+91-9876543211', 'info@rmsachore.com', true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Display created centers
SELECT 
  name,
  code,
  CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END as status,
  created_at
FROM medical_centers
ORDER BY name;