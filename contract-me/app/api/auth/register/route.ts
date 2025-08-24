import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, phoneNumber, role = "USER", street, city, state, zipCode } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 },
      );
    }

    const user = await createUser({
      email,
      username,
      password,
      phoneNumber,
      role: role as Role,
      street,
      city,
      state,
      zipCode,
    });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 },
    );
  }
}
