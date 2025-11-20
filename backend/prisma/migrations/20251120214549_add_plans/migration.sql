-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'STARTER', 'PRO');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "plan" "PlanType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
