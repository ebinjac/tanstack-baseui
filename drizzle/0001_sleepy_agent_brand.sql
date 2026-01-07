CREATE TYPE "ensemble"."link_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TABLE "ensemble"."link_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ensemble"."links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"application_id" uuid,
	"category_id" uuid,
	"title" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"visibility" "ensemble"."link_visibility" DEFAULT 'private' NOT NULL,
	"tags" text[],
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone,
	CONSTRAINT "links_url_check" CHECK ("ensemble"."links"."url" ~* '^https?://.+')
);
--> statement-breakpoint
ALTER TABLE "ensemble"."link_categories" ADD CONSTRAINT "link_categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."links" ADD CONSTRAINT "links_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "ensemble"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."links" ADD CONSTRAINT "links_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "ensemble"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ensemble"."links" ADD CONSTRAINT "links_category_id_link_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "ensemble"."link_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_categories_team_id_idx" ON "ensemble"."link_categories" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "link_categories_team_name_idx" ON "ensemble"."link_categories" USING btree ("team_id","name");--> statement-breakpoint
CREATE INDEX "links_team_id_idx" ON "ensemble"."links" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "links_user_email_idx" ON "ensemble"."links" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "links_application_id_idx" ON "ensemble"."links" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "links_category_id_idx" ON "ensemble"."links" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "links_visibility_idx" ON "ensemble"."links" USING btree ("visibility");