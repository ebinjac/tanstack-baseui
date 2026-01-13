CREATE TABLE "ensemble"."scorecard_publish_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_by" varchar(255),
	"published_at" timestamp with time zone,
	"unpublished_by" varchar(255),
	"unpublished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ensemble"."scorecard_publish_status" ADD CONSTRAINT "scorecard_publish_status_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "scorecard_publish_status_team_id_idx" ON "ensemble"."scorecard_publish_status" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scorecard_publish_status_team_year_month_idx" ON "ensemble"."scorecard_publish_status" USING btree ("team_id","year","month");--> statement-breakpoint
CREATE INDEX "scorecard_publish_status_is_published_idx" ON "ensemble"."scorecard_publish_status" USING btree ("is_published");