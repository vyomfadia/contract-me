import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withRoleAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const POST = withRoleAuth([Role.CONTRACTOR])(async (request) => {
  try {
    const body = await request.json()
    const { enrichedIssueId, message, attachments = [] } = body

    if (!enrichedIssueId || !message) {
      return NextResponse.json(
        { error: 'Enriched issue ID and message are required' },
        { status: 400 }
      )
    }

    // Get the enriched issue with full context
    const enrichedIssue = await prisma.enrichedIssue.findUnique({
      where: { id: enrichedIssueId },
      include: {
        issue: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!enrichedIssue) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Create context for the repair technician
    const systemPrompt = `You are an expert repair technician with 25+ years of experience across all home repair domains (plumbing, electrical, HVAC, appliance repair, carpentry, roofing, etc.). 

You are helping a contractor who has claimed this job. Provide detailed, step-by-step technical guidance.

JOB CONTEXT:
- Problem: ${enrichedIssue.identifiedProblem}
- Current Solution Plan: ${enrichedIssue.repairSolution}
- Difficulty Level: ${enrichedIssue.difficultyLevel}
- Estimated Time: ${enrichedIssue.estimatedTimeHours} hours
- Required Items: ${JSON.stringify(enrichedIssue.requiredItems)}
- Customer Questions: ${enrichedIssue.questionsForUser.join(', ')}
- Contractor Checklist: ${enrichedIssue.contractorChecklist.join(', ')}

ORIGINAL CUSTOMER ISSUE:
"${enrichedIssue.issue.description}"

GUIDELINES:
- Provide practical, actionable advice
- Include safety warnings when relevant
- Suggest alternative approaches if needed
- Help troubleshoot unexpected complications
- Recommend tools or techniques for efficiency
- Be conversational but professional
- If asked about something outside your expertise, be honest
- Focus on helping the contractor succeed with this specific job`

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: systemPrompt
    })

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    })

    const result = await chat.sendMessage(message)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      response: text,
      jobContext: {
        problem: enrichedIssue.identifiedProblem,
        difficulty: enrichedIssue.difficultyLevel,
        estimatedTime: enrichedIssue.estimatedTimeHours
      }
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
})