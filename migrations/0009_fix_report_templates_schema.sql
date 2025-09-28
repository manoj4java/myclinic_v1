-- Migration: Fix report templates schema to make file fields optional and add template content
-- Date: 2025-01-10

-- Make fileName and filePath nullable, add template column
ALTER TABLE "report_templates" 
  ALTER COLUMN "file_name" DROP NOT NULL,
  ALTER COLUMN "file_path" DROP NOT NULL,
  ADD COLUMN "template" text NOT NULL DEFAULT '',
  ALTER COLUMN "file_type" SET DEFAULT 'text/plain';

-- Update any existing templates with empty template content
UPDATE "report_templates" 
SET "template" = COALESCE("description", ''), 
    "file_type" = 'text/plain'
WHERE "template" = '';