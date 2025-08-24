import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    sixtyFourApiKey: process.env.SIXTYFOUR_API_KEY ? 'Present' : 'Missing',
    databaseUrl: process.env.DATABASE_URL ? 'Present' : 'Missing',
    jwtSecret: process.env.JWT_SECRET ? 'Present' : 'Missing',
    nodeEnv: process.env.NODE_ENV || 'Not set'
  });
}
