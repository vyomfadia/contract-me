-- CreateTable
CREATE TABLE "public"."contractor_profiles" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "skills" TEXT[],
    "specialties" TEXT[],
    "experienceYears" INTEGER,
    "licenses" TEXT[],
    "certifications" TEXT[],
    "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
    "bondedAndInsured" BOOLEAN NOT NULL DEFAULT false,
    "serviceRadius" INTEGER,
    "serviceZipCodes" TEXT[],
    "businessName" TEXT,
    "yearsInBusiness" INTEGER,
    "employeeCount" INTEGER,
    "averageRating" DOUBLE PRECISION,
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "preferredJobTypes" TEXT[],
    "minimumJobValue" DOUBLE PRECISION,
    "maximumJobsPerDay" INTEGER,
    "acceptAutoAssignment" BOOLEAN NOT NULL DEFAULT false,
    "autoCallEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferredContactTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contractor_profiles_contractorId_key" ON "public"."contractor_profiles"("contractorId");

-- AddForeignKey
ALTER TABLE "public"."contractor_profiles" ADD CONSTRAINT "contractor_profiles_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
