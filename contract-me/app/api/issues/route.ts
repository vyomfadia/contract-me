import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { title, description, attachments = [], priority = "NORMAL", jobStreet, jobCity, jobState, jobZipCode } = body;
    const userId = request.user?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }

    const issue = await prisma.issue.create({
      data: {
        title: title?.trim() || null,
        description: description.trim(),
        priority: priority as any,
        attachments: attachments,
        userId,
        jobStreet: jobStreet?.trim() || null,
        jobCity: jobCity?.trim() || null,
        jobState: jobState?.trim() || null,
        jobZipCode: jobZipCode?.trim() || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        issue,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Issue creation error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async (request) => {
  try {
    const userId = request.user?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    const issues = await prisma.issue.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error("Issues fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 },
    );
  }
});
