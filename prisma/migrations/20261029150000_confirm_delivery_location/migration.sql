ALTER TABLE "Address" ADD COLUMN "navigationLatitude" DOUBLE PRECISION, ADD COLUMN "navigationLongitude" DOUBLE PRECISION;
ALTER TABLE "Address" ADD CONSTRAINT "Address_navigation_point_valid" CHECK (
  ("navigationLatitude" IS NULL AND "navigationLongitude" IS NULL) OR
  ("navigationLatitude" IS NOT NULL AND "navigationLongitude" IS NOT NULL AND "navigationLatitude" BETWEEN -90 AND 90 AND "navigationLongitude" BETWEEN -180 AND 180)
);
