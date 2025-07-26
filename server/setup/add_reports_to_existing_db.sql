-- Create reports table and sequences
-- This script adds the report system to your existing database

-- Create sequence for reports table
DROP SEQUENCE IF EXISTS "public"."reports_report_id_seq";
CREATE SEQUENCE "public"."reports_report_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- Create sequence for report_reasons table
DROP SEQUENCE IF EXISTS "public"."report_reasons_reason_id_seq";
CREATE SEQUENCE "public"."report_reasons_reason_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- Create reports table
DROP TABLE IF EXISTS "public"."reports";
CREATE TABLE "public"."reports" (
    "report_id" int4 NOT NULL DEFAULT nextval('reports_report_id_seq'::regclass),
    "reporter_user_id" int4 NOT NULL,
    "reported_item_type" varchar(20) NOT NULL,
    "reported_item_id" int4 NOT NULL,
    "reported_user_id" int4 NOT NULL,
    "reason" varchar(100) NOT NULL,
    "description" text,
    "status" varchar(20) DEFAULT 'pending',
    "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
);

-- Create report_reasons table
DROP TABLE IF EXISTS "public"."report_reasons";
CREATE TABLE "public"."report_reasons" (
    "reason_id" int4 NOT NULL DEFAULT nextval('report_reasons_reason_id_seq'::regclass),
    "reason_text" varchar(100) NOT NULL,
    "description" text,
    "is_active" bool DEFAULT true,
    "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints to reports table
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id");
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_reported_item_type_check" CHECK (reported_item_type IN ('post', 'comment', 'review'));
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_status_check" CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed'));
ALTER TABLE "public"."reports" ADD CONSTRAINT "reports_unique_user_item" UNIQUE ("reporter_user_id", "reported_item_type", "reported_item_id");

-- Add constraints to report_reasons table
ALTER TABLE "public"."report_reasons" ADD CONSTRAINT "report_reasons_pkey" PRIMARY KEY ("reason_id");
ALTER TABLE "public"."report_reasons" ADD CONSTRAINT "report_reasons_reason_text_unique" UNIQUE ("reason_text");

-- Add foreign key constraints
ALTER TABLE "public"."reports" ADD CONSTRAINT "fk_reports_reporter_user_id" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user" ("user_id") ON DELETE CASCADE;
ALTER TABLE "public"."reports" ADD CONSTRAINT "fk_reports_reported_user_id" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user" ("user_id") ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX "idx_reports_status" ON "public"."reports" ("status");
CREATE INDEX "idx_reports_reporter" ON "public"."reports" ("reporter_user_id");
CREATE INDEX "idx_reports_reported_user" ON "public"."reports" ("reported_user_id");
CREATE INDEX "idx_reports_item" ON "public"."reports" ("reported_item_type", "reported_item_id");
CREATE INDEX "idx_reports_created_at" ON "public"."reports" ("created_at" DESC);

-- Set sequence ownership
ALTER SEQUENCE "public"."reports_report_id_seq" OWNED BY "public"."reports"."report_id";
ALTER SEQUENCE "public"."report_reasons_reason_id_seq" OWNED BY "public"."report_reasons"."reason_id";

-- Insert default report reasons
INSERT INTO "public"."report_reasons" ("reason_text", "description") VALUES
('Spam', 'Content is repetitive, unwanted, or promotional spam'),
('Harassment', 'Content contains harassment, bullying, or personal attacks'),
('Hate Speech', 'Content promotes hatred or discrimination'),
('Inappropriate Content', 'Content is inappropriate, offensive, or violates community guidelines'),
('False Information', 'Content contains misleading or false information'),
('Copyright Violation', 'Content violates copyright or intellectual property rights'),
('Personal Information', 'Content contains personal or private information'),
('Violence', 'Content promotes or depicts violence'),
('Other', 'Other reason not listed above');

-- Set initial sequence values
SELECT setval('"public"."reports_report_id_seq"', 1, false);
SELECT setval('"public"."report_reasons_reason_id_seq"', 9, true);
