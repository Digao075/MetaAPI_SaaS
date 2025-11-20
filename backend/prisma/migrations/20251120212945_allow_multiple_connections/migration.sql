-- DropIndex
DROP INDEX "WhatsappConnection_tenantId_key";

-- AlterTable
ALTER TABLE "WhatsappConnection" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'WhatsApp Principal';
