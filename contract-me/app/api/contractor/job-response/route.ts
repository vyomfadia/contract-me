import {NextRequest, NextResponse} from 'next/server'
import {prisma} from '@/lib/prisma'
import {sendJobAssignmentNotification} from '@/lib/vapi-service'
import {Role} from '@prisma/client'

export async function POST(request: NextRequest) {
	try {
		// Verify webhook from VAPI (you should add signature verification in production)
		const webhookData = await request.json()
		console.log('Received contractor job response webhook:', JSON.stringify(webhookData, null, 2))

		const {type, call, analysis, assistant} = webhookData.message

		if (type !== 'end-of-call-report' || !analysis?.structuredData) {
			console.log('Webhook is not a call-end event or missing analysis data')
			return NextResponse.json({received: true})
		}

		const responseData = analysis.structuredData
		const {jobAccepted, contractorResponse, reasonForDecline} = responseData
		const enrichedIssueId = assistant.variableValues.enrichedIssueId

		if (!enrichedIssueId) {
			console.error('No enrichedIssueId found in webhook data')
			return NextResponse.json({error: 'Missing job ID'}, {status: 400})
		}

		// Find the enriched issue and contractor
		const enrichedIssue = await prisma.enrichedIssue.findUnique({
			where: {id: enrichedIssueId},
			include: {
				issue: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
								email: true,
								phoneNumber: true,
							}
						}
					}
				}
			}
		})

		if (!enrichedIssue) {
			console.error(`Enriched issue not found: ${enrichedIssueId}`)
			return NextResponse.json({error: 'Job not found'}, {status: 404})
		}

		// Extract contractor info from VAPI call data
		const contractorPhone = call.customer?.number
		if (!contractorPhone) {
			console.error('No contractor phone number in call data')
			return NextResponse.json({error: 'Contractor not identified'}, {status: 400})
		}

		// Find contractor by phone number
		const contractor = await prisma.user.findFirst({
			where: {
				phoneNumber: contractorPhone,
				role: {in: [Role.CONTRACTOR, Role.BOTH]}
			}
		})

		if (!contractor) {
			console.error(`Contractor not found with phone: ${contractorPhone}`)
			return NextResponse.json({error: 'Contractor not found'}, {status: 404})
		}

		console.log(`Contractor ${contractor.username} ${jobAccepted ? 'accepted' : 'declined'} job ${enrichedIssueId}`)

		if (jobAccepted && contractorResponse === 'accepted') {
			// Check if job is still available
			if (enrichedIssue.claimedByContractorId) {
				console.log(`Job ${enrichedIssueId} already claimed by another contractor`)
				return NextResponse.json({
					success: false,
					message: 'Job was already claimed by another contractor'
				})
			}

			// Find next available appointment slot for this contractor
			const availableSlot = await findNextAvailableSlot(contractor.id, enrichedIssue.issue.priority)

			// Claim the job and create appointment in a transaction
			const result = await prisma.$transaction(async (tx) => {
				// Claim the job
				const claimedJob = await tx.enrichedIssue.update({
					where: {id: enrichedIssueId},
					data: {
						claimedByContractorId: contractor.id,
						claimedAt: new Date(),
					},
					include: {
						issue: {
							include: {
								user: {
									select: {
										id: true,
										username: true,
										email: true,
										phoneNumber: true,
									}
								}
							}
						},
						contractorUser: {
							select: {
								id: true,
								username: true,
								email: true,
							}
						}
					}
				})

				// Update issue status
				await tx.issue.update({
					where: {id: enrichedIssue.issueId},
					data: {status: 'ASSIGNED'},
				})

				// Create appointment if we found an available slot
				let appointment = null
				if (availableSlot) {
					appointment = await tx.appointment.create({
						data: {
							issueId: enrichedIssue.issueId,
							contractorId: contractor.id,
							customerId: enrichedIssue.issue.userId,
							scheduledDate: availableSlot.scheduledDate,
							estimatedDuration: getEstimatedDuration(enrichedIssue.estimatedTimeHours),
							quotedPrice: enrichedIssue.totalQuotedPrice,
							status: 'SCHEDULED',
						}
					})
				}

				return {claimedJob, appointment}
			})

			const {claimedJob, appointment} = result

			// Send notification call to customer (async)
			if (claimedJob.issue.user.phoneNumber && appointment) {
				try {
					const appointmentDate = new Date(appointment.scheduledDate).toLocaleString()
					const estimatedCost = appointment.quotedPrice || claimedJob.totalQuotedPrice || 0

					sendJobAssignmentNotification(
						claimedJob.issue.user.phoneNumber,
						claimedJob.issue.user.username,
						contractor.username,
						appointmentDate,
						estimatedCost
					).catch(error => {
						console.error('Failed to send customer notification call:', error)
					})
				} catch (error) {
					console.error('Error preparing customer notification call:', error)
				}
			}

			console.log(`Successfully assigned job ${enrichedIssueId} to contractor ${contractor.username}`)

			return NextResponse.json({
				success: true,
				message: 'Job successfully assigned',
				jobId: enrichedIssueId,
				contractorId: contractor.id,
				appointmentId: appointment?.id
			})
		} else {
			// Contractor declined - log it and potentially try other contractors
			console.log(`Contractor ${contractor.username} declined job ${enrichedIssueId}. Reason: ${reasonForDecline || 'Not specified'}`)

			// Could implement logic here to try the next contractor in the queue
			// For now, just acknowledge the response

			return NextResponse.json({
				success: true,
				message: 'Contractor response recorded',
				jobId: enrichedIssueId,
				contractorResponse: 'declined'
			})
		}
	} catch (error) {
		console.error('Contractor job response webhook error:', error)
		return NextResponse.json(
			{
				error: 'Failed to process contractor response',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{status: 500}
		)
	}
}

// Handle GET requests for webhook verification if needed
export async function GET() {
	return NextResponse.json({message: 'Contractor job response webhook endpoint is active'})
}

// Helper function to estimate duration in minutes based on hours
function getEstimatedDuration(estimatedHours?: number | null): number {
	if (!estimatedHours) return 120 // default 2 hours
	return Math.max(60, Math.min(480, estimatedHours * 60)) // between 1-8 hours
}

async function findNextAvailableSlot(contractorId: string, priority: string) {
	try {
		// Get contractor's availability
		const availability = await prisma.contractorAvailability.findMany({
			where: {
				contractorId,
				isAvailable: true
			},
			orderBy: { dayOfWeek: 'asc' }
		})

		if (availability.length === 0) {
			return null // No availability set
		}

		// Get existing appointments to avoid conflicts
		const existingAppointments = await prisma.appointment.findMany({
			where: {
				contractorId,
				status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
			}
		})

		// Priority-based scheduling: emergency gets next available slot
		const priorityOrder = { 'EMERGENCY': 0, 'URGENT': 1, 'NORMAL': 2, 'LOW': 3 }
		const priorityWeight = priorityOrder[priority as keyof typeof priorityOrder] || 2

		// For simplicity, schedule emergency/urgent jobs ASAP, others within a few days
		const daysToLookAhead = priority === 'EMERGENCY' ? 1 :
			priority === 'URGENT' ? 2 :
				priority === 'NORMAL' ? 7 : 14

		// Find the next available slot
		const now = new Date()
		const endDate = new Date()
		endDate.setDate(now.getDate() + daysToLookAhead)

		for (let date = new Date(now); date <= endDate; date.setDate(date.getDate() + 1)) {
			const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()]

			const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek)

			for (const slot of dayAvailability) {
				const scheduledDate = new Date(date)
				const [startHour, startMinute] = slot.startTime.split(':').map(Number)
				scheduledDate.setHours(startHour, startMinute, 0, 0)

				// Skip past dates
				if (scheduledDate <= now) continue

				// Check if this slot conflicts with existing appointments
				const hasConflict = existingAppointments.some(apt => {
					const aptDate = new Date(apt.scheduledDate)
					const aptEnd = new Date(aptDate.getTime() + apt.estimatedDuration * 60000)
					const slotEnd = new Date(scheduledDate.getTime() + 120 * 60000) // assume 2 hour slot

					return (scheduledDate < aptEnd && slotEnd > aptDate)
				})

				if (!hasConflict) {
					return { scheduledDate }
				}
			}
		}

		return null // No available slots found
	} catch (error) {
		console.error('Error finding available slot:', error)
		return null
	}
}