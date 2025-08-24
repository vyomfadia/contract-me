import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { enrichContractorProfile, ContractorInfo } from "@/lib/sixtyfour";

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const { name, title, company, location, linkedin }: ContractorInfo = body;

    if (!name) {
      return NextResponse.json(
        { error: "Contractor name is required" },
        { status: 400 }
      );
    }

    const contractorInfo: ContractorInfo = {
      name,
      title,
      company,
      location,
      linkedin
    };

    console.log('API Route - Contractor Info:', contractorInfo);

    const enrichedData = await enrichContractorProfile(contractorInfo);

    if (!enrichedData) {
      return NextResponse.json(
        { error: "Failed to enrich contractor profile - no data returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contractor: enrichedData
    });
  } catch (error) {
    console.error("Contractor enrichment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to enrich contractor profile";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
