import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";
import { Role } from "@prisma/client";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const tokenCookie = request.cookies.get("auth-token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payload;

    return handler(authenticatedRequest);
  };
}

export function withRoleAuth(requiredRoles: Role[]) {
  return function (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  ) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const token = getTokenFromRequest(request);

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 },
        );
      }

      if (!requiredRoles.includes(payload.role) && payload.role !== Role.BOTH) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 },
        );
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = payload;

      return handler(authenticatedRequest);
    };
  };
}

export async function getCurrentUser(
  request: NextRequest,
): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}
