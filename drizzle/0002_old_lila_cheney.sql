CREATE TYPE "ensemble"."turnover_section" AS ENUM('RFC', 'INC', 'ALERTS', 'MIM', 'COMMS', 'FYI');--> statement-breakpoint
CREATE TYPE "ensemble"."turnover_status" AS ENUM('OPEN', 'RESOLVED');--> statement-breakpoint
CREATE TABLE "ensemble"."finalized_turnovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"snapshot_data" json NOT NULL,
	"total_applications" varchar(10) NOT NULL,
	"total_entries" varchar(10) NOT NULL,
	"important_count" varchar(10) NOT NULL,
	"notes" text,
	"finalized_by" varchar(255) NOT NULL,
	"finalized_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ensemble"."turnover_comms_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"email_subject" varchar(255),
	"slack_link" text,
	CONSTRAINT "turnover_comms_details_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "ensemble"."turnover_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"section" "ensemble"."turnover_section" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"comments" text,
	"status" "ensemble"."turnover_status" DEFAULT 'OPEN' NOT NULL,
	"is_important" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone,
	"resolved_by" varchar(255),
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ensemble"."turnover_inc_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"incident_number" varchar(50) NOT NULL,
	CONSTRAINT "turnover_inc_details_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "ensemble"."turnover_mim_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"mim_link" text NOT NULL,
	"mim_slack_link" text,
	CONSTRAINT "turnover_mim_details_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "ensemble"."turnover_rfc_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"rfc_number" varchar(50) NOT NULL,
	"rfc_status" varchar(50) NOT NULL,
	"validated_by" varchar(255) NOT NULL,
	CONSTRAINT "turnover_rfc_details_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
ALTER TABLE "ensemble"."finalized_turnovers" ADD CONSTRAINT "finalized_turnovers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_comms_details" ADD CONSTRAINT "turnover_comms_details_entry_id_turnover_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "ensemble"."turnover_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_entries" ADD CONSTRAINT "turnover_entries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_entries" ADD CONSTRAINT "turnover_entries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "ensemble"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_inc_details" ADD CONSTRAINT "turnover_inc_details_entry_id_turnover_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "ensemble"."turnover_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_mim_details" ADD CONSTRAINT "turnover_mim_details_entry_id_turnover_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "ensemble"."turnover_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_rfc_details" ADD CONSTRAINT "turnover_rfc_details_entry_id_turnover_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "ensemble"."turnover_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "finalized_turnovers_team_id_idx" ON "ensemble"."finalized_turnovers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "finalized_turnovers_finalized_at_idx" ON "ensemble"."finalized_turnovers" USING btree ("finalized_at");--> statement-breakpoint
CREATE INDEX "finalized_turnovers_team_date_idx" ON "ensemble"."finalized_turnovers" USING btree ("team_id","finalized_at");--> statement-breakpoint
CREATE INDEX "turnover_comms_entry_id_idx" ON "ensemble"."turnover_comms_details" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_team_id_idx" ON "ensemble"."turnover_entries" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_application_id_idx" ON "ensemble"."turnover_entries" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_section_idx" ON "ensemble"."turnover_entries" USING btree ("section");--> statement-breakpoint
CREATE INDEX "turnover_entries_status_idx" ON "ensemble"."turnover_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "turnover_entries_is_important_idx" ON "ensemble"."turnover_entries" USING btree ("is_important");--> statement-breakpoint
CREATE INDEX "turnover_entries_team_app_idx" ON "ensemble"."turnover_entries" USING btree ("team_id","application_id");--> statement-breakpoint
CREATE INDEX "turnover_entries_created_at_idx" ON "ensemble"."turnover_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "turnover_inc_entry_id_idx" ON "ensemble"."turnover_inc_details" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "turnover_inc_number_idx" ON "ensemble"."turnover_inc_details" USING btree ("incident_number");--> statement-breakpoint
CREATE INDEX "turnover_mim_entry_id_idx" ON "ensemble"."turnover_mim_details" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "turnover_rfc_entry_id_idx" ON "ensemble"."turnover_rfc_details" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "turnover_rfc_number_idx" ON "ensemble"."turnover_rfc_details" USING btree ("rfc_number");