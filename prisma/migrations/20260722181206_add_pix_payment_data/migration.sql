-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentExternalId" TEXT,
ADD COLUMN     "pixQrCode" TEXT,
ADD COLUMN     "pixQrCodeBase64" TEXT;
