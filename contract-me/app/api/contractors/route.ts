import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const city = url.searchParams.get("city") || "";
    const state = url.searchParams.get("state") || "";

    const contractors = await prisma.user.findMany({
      where: {
        role: Role.CONTRACTOR,
        AND: [
          search ? {
            OR: [
              { username: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } }
            ]
          } : {},
          city ? { city: { contains: city, mode: "insensitive" } } : {},
          state ? { state: { contains: state, mode: "insensitive" } } : {}
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        street: true,
        city: true,
        state: true,
        zipCode: true,
        createdAt: true
      },
      orderBy: {
        username: "asc"
      }
    });

    return NextResponse.json({ contractors });
  } catch (error) {
    console.error("Contractor search error:", error);
    return NextResponse.json(
      { error: "Failed to search contractors" },
      { status: 500 }
    );
  }
}