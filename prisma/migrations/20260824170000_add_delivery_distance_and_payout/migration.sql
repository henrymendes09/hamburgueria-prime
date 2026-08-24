-- AlterTable
ALTER TABLE "Restaurant"
ADD COLUMN "storeCep" TEXT,
ADD COLUMN "deliveryFeePerKm" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN "deliveryRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 15;

UPDATE "Restaurant"
SET "storeCep" = '12240-030'
WHERE "slug" = 'hamburgueria-prime' AND "storeCep" IS NULL;

-- AlterTable
ALTER TABLE "Address"
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "deliveryDistanceKm" DOUBLE PRECISION,
ADD COLUMN "deliveryPayout" DOUBLE PRECISION NOT NULL DEFAULT 0;
