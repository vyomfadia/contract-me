import { NextRequest, NextResponse } from "next/server";
import { withRoleAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Get available jobs for contractors
export const GET = withRoleAuth([Role.CONTRACTOR])(async (request) => {
  try {
    const url = new URL(request.url);
    const claimed = url.searchParams.get("claimed") === "true";

    const jobs = await prisma.enrichedIssue.findMany({
      where: claimed
        ? { claimedByContractorId: request.user?.userId }
        : { claimedByContractorId: null },
      include: {
        issue: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                street: true,
                city: true,
                state: true,
                zipCode: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Jobs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 },
    );
  }
});
