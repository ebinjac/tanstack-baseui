CREATE TABLE "ensemble"."application_group_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ensemble"."application_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20) DEFAULT '#6366f1',
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ensemble"."teams" ADD COLUMN "turnover_grouping_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ensemble"."application_group_memberships" ADD CONSTRAINT "application_group_memberships_group_id_application_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "ensemble"."application_groups"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ensemble"."application_group_memberships" ADD CONSTRAINT "application_group_memberships_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "ensemble"."applications"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ensemble"."application_groups" ADD CONSTRAINT "application_groups_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "app_group_membership_unique_idx" ON "ensemble"."application_group_memberships" USING btree ("group_id","application_id");--> statement-breakpoint
CREATE INDEX "app_group_membership_group_id_idx" ON "ensemble"."application_group_memberships" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "app_group_membership_app_id_idx" ON "ensemble"."application_group_memberships" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "app_group_membership_order_idx" ON "ensemble"."application_group_memberships" USING btree ("group_id","display_order");--> statement-breakpoint
CREATE INDEX "app_groups_team_id_idx" ON "ensemble"."application_groups" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "app_groups_display_order_idx" ON "ensemble"."application_groups" USING btree ("team_id","display_order");--> statement-breakpoint
CREATE INDEX "app_groups_is_enabled_idx" ON "ensemble"."application_groups" USING btree ("team_id","is_enabled");