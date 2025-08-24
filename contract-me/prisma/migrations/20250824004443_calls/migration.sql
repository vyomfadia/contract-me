-- CreateEnum
CREATE TYPE "public"."IssuePriority" AS ENUM ('EMERGENCY', 'URGENT', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "public"."enriched_issues" ADD COLUMN     "laborCost" DOUBLE PRECISION,
ADD COLUMN     "materialsCost" DOUBLE PRECISION,
ADD COLUMN     "totalQuotedPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."issues" ADD COLUMN     "jobCity" TEXT,
ADD COLUMN     "jobLatitude" DOUBLE PRECISION,
ADD COLUMN     "jobLongitude" DOUBLE PRECISION,
ADD COLUMN     "jobState" TEXT,
ADD COLUMN     "jobStreet" TEXT,
ADD COLUMN     "jobZipCode" TEXT,
ADD COLUMN     "priority" "public"."IssuePriority" NOT NULL DEFAULT 'NORMAL';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "public"."contractor_availability" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "dayOfWeek" "public"."DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."appointments" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "quotedPrice" DOUBLE PRECISION,
    "finalPrice" DOUBLE PRECISION,
    "contractorNotes" TEXT,
    "customerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contractor_availability_contractorId_dayOfWeek_startTime_key" ON "public"."contractor_availability"("contractorId", "dayOfWeek", "startTime");

-- AddForeignKey
ALTER TABLE "public"."contractor_availability" ADD CONSTRAINT "contractor_availability_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."appointments" ADD CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
