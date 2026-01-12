CREATE TABLE "ensemble"."scorecard_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scorecard_entry_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"availability" numeric(5, 2) NOT NULL,
	"reason" text,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ensemble"."scorecard_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"scorecard_identifier" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"availability_threshold" numeric(5, 2) DEFAULT '98.00' NOT NULL,
	"volume_change_threshold" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone,
	CONSTRAINT "scorecard_entries_scorecard_identifier_unique" UNIQUE("scorecard_identifier")
);
--> statement-breakpoint
CREATE TABLE "ensemble"."scorecard_volume" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scorecard_entry_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"volume" bigint NOT NULL,
	"reason" text,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(255),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ensemble"."scorecard_availability" ADD CONSTRAINT "scorecard_availability_scorecard_entry_id_scorecard_entries_id_fk" FOREIGN KEY ("scorecard_entry_id") REFERENCES "ensemble"."scorecard_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ensemble"."scorecard_entries" ADD CONSTRAINT "scorecard_entries_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "ensemble"."applications"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ensemble"."scorecard_volume" ADD CONSTRAINT "scorecard_volume_scorecard_entry_id_scorecard_entries_id_fk" FOREIGN KEY ("scorecard_entry_id") REFERENCES "ensemble"."scorecard_entries"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "scorecard_availability_entry_id_idx" ON "ensemble"."scorecard_availability" USING btree ("scorecard_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scorecard_availability_entry_year_month_idx" ON "ensemble"."scorecard_availability" USING btree ("scorecard_entry_id","year","month");--> statement-breakpoint
CREATE INDEX "scorecard_availability_year_idx" ON "ensemble"."scorecard_availability" USING btree ("year");--> statement-breakpoint
CREATE INDEX "scorecard_entries_application_id_idx" ON "ensemble"."scorecard_entries" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scorecard_entries_identifier_idx" ON "ensemble"."scorecard_entries" USING btree ("scorecard_identifier");--> statement-breakpoint
CREATE INDEX "scorecard_entries_name_idx" ON "ensemble"."scorecard_entries" USING btree ("name");--> statement-breakpoint
CREATE INDEX "scorecard_volume_entry_id_idx" ON "ensemble"."scorecard_volume" USING btree ("scorecard_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scorecard_volume_entry_year_month_idx" ON "ensemble"."scorecard_volume" USING btree ("scorecard_entry_id","year","month");--> statement-breakpoint
CREATE INDEX "scorecard_volume_year_idx" ON "ensemble"."scorecard_volume" USING btree ("year");