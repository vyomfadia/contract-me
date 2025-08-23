import { NextRequest, NextResponse } from "next/server";
import { enrichPendingIssues } from "@/lib/openai-service";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret token for cron job security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting issue enrichment process...");
    const results = await enrichPendingIssues();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `Enrichment process completed. Success: ${successful}, Failed: ${failed}`,
    );

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Enrichment endpoint error:", error);
    return NextResponse.json(
      {
        error: "Failed to process enrichment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request);
}
