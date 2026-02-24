CREATE TYPE "ensemble"."import_mode" AS ENUM('AUTO', 'REVIEW');--> statement-breakpoint
CREATE TYPE "ensemble"."itsm_record_status" AS ENUM('PENDING', 'IMPORTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "ensemble"."itsm_record_type" AS ENUM('RFC', 'INC');--> statement-breakpoint
CREATE TABLE "ensemble"."turnover_itsm_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"external_id" varchar(50) NOT NULL,
	"type" "ensemble"."itsm_record_type" NOT NULL,
	"status" "ensemble"."itsm_record_status" DEFAULT 'PENDING' NOT NULL,
	"raw_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ensemble"."turnover_settings" (
	"team_id" uuid PRIMARY KEY NOT NULL,
	"rfc_assignment_group" varchar(255),
	"inc_assignment_group" varchar(255),
	"max_search_days" integer DEFAULT 5 NOT NULL,
	"rfc_import_mode" "ensemble"."import_mode" DEFAULT 'REVIEW' NOT NULL,
	"inc_import_mode" "ensemble"."import_mode" DEFAULT 'REVIEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_itsm_records" ADD CONSTRAINT "turnover_itsm_records_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_settings" ADD CONSTRAINT "turnover_settings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE no action;