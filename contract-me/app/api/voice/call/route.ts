import {NextResponse} from 'next/server'
import {withAuth} from '@/lib/auth-middleware'
import {initiateIssueCollectionCall} from '@/lib/vapi-service'
import {prisma} from '@/lib/prisma'

export const POST = withAuth(async (request) => {
	try {
		const body = await request.json()
		const {phoneNumber, customerName, preferredTime} = body
		const userId = request.user?.userId

		if (!userId) {
			return NextResponse.json({error: 'User not authenticated'}, {status: 401})
		}

		if (!phoneNumber) {
			return NextResponse.json(
				{error: 'Phone number is required'},
				{status: 400}
			)
		}

		// Validate phone number format (basic validation)
		const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
		const phoneRegex = /^\+?[1-9]\d{9,14}$/
		if (!phoneRegex.test(cleanPhone)) {
			return NextResponse.json(
				{error: 'Invalid phone number format'},
				{status: 400}
			)
		}

		console.log(`Initiating VAPI call to ${phoneNumber} for user ${userId}`)

		// Initiate the VAPI call
		const call = await initiateIssueCollectionCall(phoneNumber, customerName)

		// Store call request in database for tracking
		const callRequest = await prisma.callRequest.create({
			data: {
				userId,
				phoneNumber,
				customerName: customerName || null,
				preferredTime: preferredTime || null,
				vapiCallId: call.id,
				status: 'INITIATED',
			}
		})

		return NextResponse.json({
			success: true,
			message: 'Voice call initiated successfully',
			callId: call.id,
			callRequestId: callRequest.id,
			estimatedCallTime: 'within 2 minutes'
		})
	} catch (error) {
		console.error('Voice call initiation error:', error)
		return NextResponse.json(
			{
				error: 'Failed to initiate voice call',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{status: 500}
		)
	}
})
