-- Simple script to create medical_centers table
-- Run this directly in your PostgreSQL database

-- Create the medical_centers table
CREATE TABLE IF NOT EXISTS medical_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    ip_address VARCHAR(45)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medical_centers_code ON medical_centers(code);
CREATE INDEX IF NOT EXISTS idx_medical_centers_active ON medical_centers(is_active);
CREATE INDEX IF NOT EXISTS idx_medical_centers_name ON medical_centers(name);

-- Insert initial data (will be ignored if already exists)
INSERT INTO medical_centers (name, code, address, phone, email, is_active) 
VALUES 
    ('Deesa Medical Center', 'DEESA', 'Deesa, Banaskantha, Gujarat, India', '+91-9876543210', 'info@deesamedical.com', true),
    ('RM Sachore Hospital', 'RMSACHORE', 'RM Sachore, Banaskantha, Gujarat, India', '+91-9876543211', 'info@rmsachore.com', true)
ON CONFLICT (code) DO NOTHING;

-- Verify the data was inserted
SELECT 
    name,
    code,
    CASE WHEN is_active THEN 'Active' ELSE 'Inactive' END as status,
    created_at
FROM medical_centers
ORDER BY name;