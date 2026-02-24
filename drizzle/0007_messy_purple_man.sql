ALTER TABLE "ensemble"."turnover_settings" ALTER COLUMN "max_search_days" SET DEFAULT 30;
CREATE INDEX IF NOT EXISTS "turnover_itsm_records_team_id_idx" ON "ensemble"."turnover_itsm_records" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "turnover_itsm_records_status_idx" ON "ensemble"."turnover_itsm_records" USING btree ("status");
CREATE INDEX IF NOT EXISTS "turnover_itsm_records_team_status_idx" ON "ensemble"."turnover_itsm_records" USING btree ("team_id","status");
