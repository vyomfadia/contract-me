-- CreateEnum
CREATE TYPE "public"."CallRequestStatus" AS ENUM ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."call_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "customerName" TEXT,
    "preferredTime" TEXT,
    "vapiCallId" TEXT,
    "status" "public"."CallRequestStatus" NOT NULL DEFAULT 'INITIATED',
    "extractedData" JSONB,
    "resultingIssueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_requests_vapiCallId_key" ON "public"."call_requests"("vapiCallId");

-- AddForeignKey
ALTER TABLE "public"."call_requests" ADD CONSTRAINT "call_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
