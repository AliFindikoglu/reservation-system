CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "TableAssignment"
ADD CONSTRAINT "TableAssignment_active_user_date_range_excl"
EXCLUDE USING gist (
  "userId" WITH =,
  daterange("startsOn", COALESCE("endsOn", 'infinity'::date), '[]') WITH &&
)
WHERE ("revokedAt" IS NULL);

ALTER TABLE "TableAssignment"
ADD CONSTRAINT "TableAssignment_active_table_date_range_excl"
EXCLUDE USING gist (
  "tableId" WITH =,
  daterange("startsOn", COALESCE("endsOn", 'infinity'::date), '[]') WITH &&
)
WHERE ("revokedAt" IS NULL);
