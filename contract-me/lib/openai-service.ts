import OpenAI from "openai";
import { prisma } from "./prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EnrichmentResult {
  identifiedProblem: string;
  repairSolution: string;
  estimatedTimeHours?: number;
  difficultyLevel: "Easy" | "Medium" | "Hard" | "Expert";
  requiredItems: Array<{
    name: string;
    estimatedCost: number;
    quantity?: number;
    unit?: string;
  }>;
  totalEstimatedCost?: number;
  questionsForUser: string[];
  contractorChecklist: string[];
}

export async function enrichIssueWithOpenAI(
  issueId: string,
  title: string | null,
  description: string,
  attachments: string[],
): Promise<EnrichmentResult> {
  const prompt = `
You are an expert home repair and maintenance contractor with 20+ years of experience. Analyze the following customer issue and provide a comprehensive assessment.

Issue Title: ${title || "Not provided"}
Issue Description: ${description}
Attachments: ${attachments.length > 0 ? `${attachments.length} files attached` : "No attachments"}

Please provide a detailed analysis in JSON format with the following structure:

{
  "identifiedProblem": "Clear, specific identification of the problem",
  "repairSolution": "Step-by-step solution with professional recommendations",
  "estimatedTimeHours": 2.5, // Realistic time estimate in hours
  "difficultyLevel": "Easy|Medium|Hard|Expert", // Based on DIY vs professional requirements
  "requiredItems": [
    {
      "name": "Item name",
      "estimatedCost": 25.99, // USD estimate
      "quantity": 2,
      "unit": "pieces" // optional: pieces, feet, gallons, etc.
    }
  ],
  "totalEstimatedCost": 150.99, // Sum of all item costs
  "questionsForUser": [
    "What specific questions would help clarify the scope?",
    "Any additional details needed from customer?"
  ],
  "contractorChecklist": [
    "What should the contractor verify on-site?",
    "What measurements or assessments are needed?",
    "Any safety considerations to check?"
  ]
}

Guidelines:
- Be realistic with cost estimates (use current market prices)
- Consider regional variations but use average US prices
- Include safety considerations in contractor checklist
- Ask clarifying questions that would affect scope/cost
- Difficulty levels:
  - Easy: Simple DIY, basic tools, low risk
  - Medium: Some experience needed, moderate tools, moderate risk
  - Hard: Skilled trade knowledge required, specialized tools
  - Expert: Licensed professional required, high risk/complexity

Provide only valid JSON response, no additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional contractor and home repair expert. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(responseContent) as EnrichmentResult;

    // Validate required fields
    if (
      !parsed.identifiedProblem ||
      !parsed.repairSolution ||
      !parsed.difficultyLevel
    ) {
      throw new Error("Invalid response structure from OpenAI");
    }

    return parsed;
  } catch (error) {
    console.error("OpenAI enrichment error:", error);
    throw new Error(
      `Failed to enrich issue: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function enrichPendingIssues() {
  try {
    // Find issues that haven't been enriched yet
    const unenrichedIssues = await prisma.issue.findMany({
      where: {
        enriched: null,
        status: "SUBMITTED",
      },
      take: 5, // Process max 5 at a time to avoid API rate limits
      orderBy: {
        createdAt: "asc", // Oldest first
      },
    });

    const results = [];

    for (const issue of unenrichedIssues) {
      try {
        console.log(`Enriching issue ${issue.id}...`);

        // Update status to ANALYZING
        await prisma.issue.update({
          where: { id: issue.id },
          data: { status: "ANALYZING" },
        });

        const enrichmentResult = await enrichIssueWithOpenAI(
          issue.id,
          issue.title,
          issue.description,
          issue.attachments,
        );

        // Save enrichment to database
        const enrichedIssue = await prisma.enrichedIssue.create({
          data: {
            issueId: issue.id,
            identifiedProblem: enrichmentResult.identifiedProblem,
            repairSolution: enrichmentResult.repairSolution,
            estimatedTimeHours: enrichmentResult.estimatedTimeHours,
            difficultyLevel: enrichmentResult.difficultyLevel,
            requiredItems: enrichmentResult.requiredItems,
            totalEstimatedCost: enrichmentResult.totalEstimatedCost,
            questionsForUser: enrichmentResult.questionsForUser,
            contractorChecklist: enrichmentResult.contractorChecklist,
          },
        });

        // Update issue status to PENDING_CONTRACTOR
        await prisma.issue.update({
          where: { id: issue.id },
          data: { status: "PENDING_CONTRACTOR" },
        });

        results.push({
          issueId: issue.id,
          enrichedIssueId: enrichedIssue.id,
          success: true,
        });

        console.log(`Successfully enriched issue ${issue.id}`);
      } catch (error) {
        console.error(`Failed to enrich issue ${issue.id}:`, error);

        // Reset status back to SUBMITTED so it can be retried
        await prisma.issue.update({
          where: { id: issue.id },
          data: { status: "SUBMITTED" },
        });

        results.push({
          issueId: issue.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Add delay between requests to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  } catch (error) {
    console.error("Error in enrichPendingIssues:", error);
    throw error;
  }
}
