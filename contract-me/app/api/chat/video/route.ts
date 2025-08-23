import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withRoleAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const POST = withRoleAuth([Role.CONTRACTOR])(async (request) => {
  try {
    const formData = await request.formData()
    const enrichedIssueId = formData.get('enrichedIssueId') as string
    const message = formData.get('message') as string
    const videoFile = formData.get('video') as File

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
    const systemPrompt = `You are an expert repair technician with 25+ years of experience providing real-time video assistance to contractors in the field.

JOB CONTEXT:
- Problem: ${enrichedIssue.identifiedProblem}
- Current Solution Plan: ${enrichedIssue.repairSolution}
- Difficulty Level: ${enrichedIssue.difficultyLevel}
- Estimated Time: ${enrichedIssue.estimatedTimeHours} hours
- Required Items: ${JSON.stringify(enrichedIssue.requiredItems)}

ORIGINAL CUSTOMER ISSUE: "${enrichedIssue.issue.description}"

You are now viewing the contractor's live workspace${videoFile ? ' along with a video recording' : ''}. 

INSTRUCTIONS:
- Analyze what you can see in the video/workspace
- Provide specific, actionable guidance based on visual information
- Point out safety concerns if you notice any
- Help troubleshoot based on what you observe
- Suggest next steps based on the visual context
- Be encouraging and supportive
- Ask clarifying questions about what you see if needed

Focus on what you can visually observe and provide practical guidance.`

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      systemInstruction: systemPrompt
    })

    let prompt = message

    // If video file is provided, convert it to base64 and include in the prompt
    if (videoFile) {
      try {
        const bytes = await videoFile.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64,
              mimeType: videoFile.type
            }
          }
        ])

        const response = await result.response
        const text = response.text()

        return NextResponse.json({
          success: true,
          response: text,
          hasVideo: true,
          jobContext: {
            problem: enrichedIssue.identifiedProblem,
            difficulty: enrichedIssue.difficultyLevel,
            estimatedTime: enrichedIssue.estimatedTimeHours
          }
        })
      } catch (error) {
        console.error('Video processing error:', error)
        // Fall back to text-only response
      }
    }

    // Text-only response
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    })

    const result = await chat.sendMessage(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({
      success: true,
      response: text,
      hasVideo: false,
      jobContext: {
        problem: enrichedIssue.identifiedProblem,
        difficulty: enrichedIssue.difficultyLevel,
        estimatedTime: enrichedIssue.estimatedTimeHours
      }
    })
  } catch (error) {
    console.error('Video chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process video chat message' },
      { status: 500 }
    )
  }
})