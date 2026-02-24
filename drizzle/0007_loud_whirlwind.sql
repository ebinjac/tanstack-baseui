CREATE TABLE "ensemble"."turnover_app_assignment_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"type" "ensemble"."itsm_record_type" NOT NULL,
	"group_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_settings" ALTER COLUMN "max_search_days" SET DEFAULT 30;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_itsm_records" ADD COLUMN "application_id" uuid;--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_app_assignment_groups" ADD CONSTRAINT "turnover_app_assignment_groups_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "ensemble"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "turnover_app_groups_app_id_idx" ON "ensemble"."turnover_app_assignment_groups" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "turnover_app_groups_name_idx" ON "ensemble"."turnover_app_assignment_groups" USING btree ("group_name");--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_itsm_records" ADD CONSTRAINT "turnover_itsm_records_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "ensemble"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "turnover_itsm_records_team_id_idx" ON "ensemble"."turnover_itsm_records" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "turnover_itsm_records_status_idx" ON "ensemble"."turnover_itsm_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "turnover_itsm_records_team_status_idx" ON "ensemble"."turnover_itsm_records" USING btree ("team_id","status");--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_settings" DROP COLUMN "rfc_assignment_group";--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_settings" DROP COLUMN "inc_assignment_group";