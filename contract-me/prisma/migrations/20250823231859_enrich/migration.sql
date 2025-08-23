-- CreateTable
CREATE TABLE "public"."enriched_issues" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "identifiedProblem" TEXT NOT NULL,
    "repairSolution" TEXT NOT NULL,
    "estimatedTimeHours" DOUBLE PRECISION,
    "difficultyLevel" TEXT NOT NULL,
    "requiredItems" JSONB NOT NULL,
    "totalEstimatedCost" DOUBLE PRECISION,
    "questionsForUser" TEXT[],
    "contractorChecklist" TEXT[],
    "claimedByContractorId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enriched_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enriched_issues_issueId_key" ON "public"."enriched_issues"("issueId");

-- AddForeignKey
ALTER TABLE "public"."enriched_issues" ADD CONSTRAINT "enriched_issues_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enriched_issues" ADD CONSTRAINT "enriched_issues_claimedByContractorId_fkey" FOREIGN KEY ("claimedByContractorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
