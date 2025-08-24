import { NextRequest, NextResponse } from 'next/server'
import { processCallResults } from '@/lib/vapi-service'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook signature for security
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-vapi-signature')
      // In production, verify the signature matches the webhook secret
    }

    const webhookData = await request.json()
    console.log('Received VAPI webhook:', JSON.stringify(webhookData, null, 2))

    // Check if this is a call end event with analysis
    const { type, analysis, call } = webhookData.message

    if (type !== 'end-of-call-report' || !analysis?.structuredData) {
      console.log('Webhook is not a call-end event or missing analysis data')
      return NextResponse.json({ received: true })
    }

    // Process the call results
    const extractedData = processCallResults(webhookData)
    
    if (!extractedData) {
      console.error('Failed to extract data from call results')
      return NextResponse.json({ error: 'Failed to process call data' }, { status: 400 })
    }

    console.log('Extracted data:', extractedData)

    // Find the call request in our database
    const callRequest = await prisma.callRequest.findFirst({
      where: { 
        vapiCallId: call.id
      },
      include: {
        user: true
      }
    })

    if (!callRequest) {
      console.error(`No call request found for VAPI call ID: ${call.id}`)
      return NextResponse.json({ error: 'Call request not found' }, { status: 404 })
    }

    // Create the issue from the extracted voice data
    const issue = await prisma.issue.create({
      data: {
        title: extractedData.issueTitle,
        description: `${extractedData.issueDescription}

VOICE CALL DETAILS:
- Problem Type: ${extractedData.problemType}
- Urgency: ${extractedData.urgencyLevel}
- Location: ${extractedData.locationDetails}
- Customer Name: ${extractedData.customerName || callRequest.customerName || 'Not provided'}
- Phone: ${extractedData.phoneNumber}
${extractedData.preferredCallbackTime ? `- Preferred Contact Time: ${extractedData.preferredCallbackTime}` : ''}
${extractedData.additionalNotes ? `- Additional Notes: ${extractedData.additionalNotes}` : ''}

This issue was collected via voice call and may need additional clarification.`,
        status: 'SUBMITTED',
        userId: callRequest.userId,
        attachments: [],
      }
    })

    // Update the call request status
    await prisma.callRequest.update({
      where: { id: callRequest.id },
      data: {
        status: 'COMPLETED',
        extractedData: extractedData as any, // Store the full extracted data
        resultingIssueId: issue.id,
      }
    })

    console.log(`Successfully created issue ${issue.id} from voice call`)

    // Optionally trigger enrichment immediately for voice-collected issues
    // This could be done asynchronously or via the existing cron job

    return NextResponse.json({
      success: true,
      issueId: issue.id,
      message: 'Issue created successfully from voice call'
    })
  } catch (error) {
    console.error('VAPI webhook processing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification if needed
export async function GET() {
  return NextResponse.json({ message: 'VAPI webhook endpoint is active' })
}