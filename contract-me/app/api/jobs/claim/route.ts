import { NextRequest, NextResponse } from "next/server";
import { withRoleAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const POST = withRoleAuth([Role.CONTRACTOR])(async (request) => {
  try {
    const body = await request.json();
    const { enrichedIssueId } = body;
    const contractorId = request.user?.userId;

    if (!contractorId) {
      return NextResponse.json(
        { error: "Contractor not authenticated" },
        { status: 401 },
      );
    }

    if (!enrichedIssueId) {
      return NextResponse.json(
        { error: "Enriched issue ID is required" },
        { status: 400 },
      );
    }

    // Check if job is already claimed
    const existingJob = await prisma.enrichedIssue.findUnique({
      where: { id: enrichedIssueId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (existingJob.claimedByContractorId) {
      return NextResponse.json(
        { error: "Job already claimed" },
        { status: 409 },
      );
    }

    // Claim the job
    const claimedJob = await prisma.enrichedIssue.update({
      where: { id: enrichedIssueId },
      data: {
        claimedByContractorId: contractorId,
        claimedAt: new Date(),
      },
      include: {
        issue: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        contractorUser: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Update the original issue status
    await prisma.issue.update({
      where: { id: existingJob.issueId },
      data: { status: "ASSIGNED" },
    });

    return NextResponse.json({
      success: true,
      claimedJob,
    });
  } catch (error) {
    console.error("Job claim error:", error);
    return NextResponse.json({ error: "Failed to claim job" }, { status: 500 });
  }
});
