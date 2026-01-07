CREATE SCHEMA "ensemble";
--> statement-breakpoint
CREATE TYPE "ensemble"."application_status" AS ENUM('active', 'inactive', 'deprecated', 'archived');--> statement-breakpoint
CREATE TYPE "ensemble"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'processed');--> statement-breakpoint
CREATE TYPE "ensemble"."sync_status" AS ENUM('pending', 'syncing', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "ensemble"."applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"asset_id" integer NOT NULL,
	"application_name" varchar(255) NOT NULL,
	"tla" varchar(12) NOT NULL,
	"life_cycle_status" varchar(50),
	"tier" varchar(50),
	"vp_name" varchar(100),
	"vp_email" varchar(255),
	"director_name" varchar(100),
	"director_email" varchar(255),
	"escalation_email" varchar(255),
	"contact_email" varchar(255),
	"team_email" varchar(255),
	"application_owner_name" varchar(100),
	"application_owner_email" varchar(255),
	"application_owner_band" varchar(10),
	"application_manager_name" varchar(100),
	"application_manager_email" varchar(255),
	"application_manager_band" varchar(10),
	"application_owner_leader1_name" varchar(100),
	"application_owner_leader1_email" varchar(255),
	"application_owner_leader1_band" varchar(10),
	"application_owner_leader2_name" varchar(100),
	"application_owner_leader2_email" varchar(255),
	"application_owner_leader2_band" varchar(10),
	"owner_svp_name" varchar(100),
	"owner_svp_email" varchar(255),
	"owner_svp_band" varchar(10),
	"business_owner_name" varchar(100),
	"business_owner_email" varchar(255),
	"business_owner_band" varchar(10),
	"business_owner_leader1_name" varchar(100),
	"business_owner_leader1_email" varchar(255),
	"business_owner_leader1_band" varchar(10),
	"production_support_owner_name" varchar(100),
	"production_support_owner_email" varchar(255),
	"production_support_owner_band" varchar(10),
	"production_support_owner_leader1_name" varchar(100),
	"production_support_owner_leader1_email" varchar(255),
	"production_support_owner_leader1_band" varchar(10),
	"pmo_name" varchar(100),
	"pmo_email" varchar(255),
	"pmo_band" varchar(10),
	"unit_cio_name" varchar(100),
	"unit_cio_email" varchar(255),
	"unit_cio_band" varchar(10),
	"snow_group" varchar(255),
	"slack_channel" varchar(100),
	"description" text,
	"status" "ensemble"."application_status" DEFAULT 'active' NOT NULL,
	"last_central_api_sync" timestamp with time zone,
	"central_api_sync_status" "ensemble"."sync_status" DEFAULT 'pending',
	"sync_error_message" text,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_slack_check" CHECK ("ensemble"."applications"."slack_channel" IS NULL OR "ensemble"."applications"."slack_channel" LIKE '#%'),
	CONSTRAINT "applications_email_checks" CHECK (
    ("ensemble"."applications"."vp_email" IS NULL OR "ensemble"."applications"."vp_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."director_email" IS NULL OR "ensemble"."applications"."director_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."escalation_email" IS NULL OR "ensemble"."applications"."escalation_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."contact_email" IS NULL OR "ensemble"."applications"."contact_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."team_email" IS NULL OR "ensemble"."applications"."team_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."application_owner_email" IS NULL OR "ensemble"."applications"."application_owner_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."application_manager_email" IS NULL OR "ensemble"."applications"."application_manager_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."business_owner_email" IS NULL OR "ensemble"."applications"."business_owner_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$') AND
    ("ensemble"."applications"."production_support_owner_email" IS NULL OR "ensemble"."applications"."production_support_owner_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$')
  )
);
--> statement-breakpoint
CREATE TABLE "ensemble"."team_registration_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_name" varchar(100) NOT NULL,
	"user_group" varchar(100) NOT NULL,
	"admin_group" varchar(100) NOT NULL,
	"contact_name" varchar(100) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"status" "ensemble"."approval_status" DEFAULT 'pending' NOT NULL,
	"requested_by" varchar(255) NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" varchar(255),
	"reviewed_at" timestamp with time zone,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "team_reg_email_check" CHECK ("ensemble"."team_registration_requests"."contact_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$')
);
--> statement-breakpoint
CREATE TABLE "ensemble"."teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_name" varchar(100) NOT NULL,
	"user_group" varchar(100) NOT NULL,
	"admin_group" varchar(100) NOT NULL,
	"contact_name" varchar(100) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone,
	CONSTRAINT "teams_team_name_unique" UNIQUE("team_name"),
	CONSTRAINT "teams_email_check" CHECK ("ensemble"."teams"."contact_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$')
);
--> statement-breakpoint
ALTER TABLE "ensemble"."applications" ADD CONSTRAINT "applications_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "applications_team_id_idx" ON "ensemble"."applications" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "ensemble"."applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_tla_idx" ON "ensemble"."applications" USING btree ("tla");--> statement-breakpoint
CREATE INDEX "applications_tier_idx" ON "ensemble"."applications" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "applications_life_cycle_status_idx" ON "ensemble"."applications" USING btree ("life_cycle_status");--> statement-breakpoint
CREATE INDEX "applications_asset_id_idx" ON "ensemble"."applications" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "applications_sync_status_idx" ON "ensemble"."applications" USING btree ("central_api_sync_status");--> statement-breakpoint
CREATE INDEX "applications_team_status_idx" ON "ensemble"."applications" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "applications_team_status_created_idx" ON "ensemble"."applications" USING btree ("team_id","status","created_at");--> statement-breakpoint
CREATE INDEX "applications_name_idx" ON "ensemble"."applications" USING btree ("application_name");--> statement-breakpoint
CREATE INDEX "team_reg_status_idx" ON "ensemble"."team_registration_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "team_reg_requested_by_idx" ON "ensemble"."team_registration_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "team_reg_requested_at_idx" ON "ensemble"."team_registration_requests" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "team_reg_status_requested_at_idx" ON "ensemble"."team_registration_requests" USING btree ("status","requested_at");--> statement-breakpoint
CREATE INDEX "team_reg_team_name_idx" ON "ensemble"."team_registration_requests" USING btree ("team_name");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_team_name_idx" ON "ensemble"."teams" USING btree ("team_name");--> statement-breakpoint
CREATE INDEX "teams_contact_email_idx" ON "ensemble"."teams" USING btree ("contact_email");--> statement-breakpoint
CREATE INDEX "teams_is_active_idx" ON "ensemble"."teams" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "teams_user_group_idx" ON "ensemble"."teams" USING btree ("user_group");