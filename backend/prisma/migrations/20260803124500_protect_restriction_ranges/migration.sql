DROP INDEX "UserRestriction_one_active_per_user_key";

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "UserRestriction"
ADD CONSTRAINT "UserRestriction_active_user_date_range_excl"
EXCLUDE USING gist (
  "userId" WITH =,
  daterange("startsOn", "endsOn", '[]') WITH &&
)
WHERE ("revokedAt" IS NULL);
