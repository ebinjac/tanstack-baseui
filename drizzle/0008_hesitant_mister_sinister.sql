CREATE TABLE "ensemble"."turnover_app_cmdb_cis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"cmdb_ci_name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ensemble"."turnover_app_cmdb_cis" ADD CONSTRAINT "turnover_app_cmdb_cis_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "ensemble"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "turnover_app_cmdb_cis_app_id_idx" ON "ensemble"."turnover_app_cmdb_cis" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "turnover_app_cmdb_cis_name_idx" ON "ensemble"."turnover_app_cmdb_cis" USING btree ("cmdb_ci_name");