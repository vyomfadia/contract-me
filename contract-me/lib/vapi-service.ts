import {VapiClient} from '@vapi-ai/server-sdk'

const vapi = new VapiClient({
	token: process.env.VAPI_API_KEY || ''
})

export interface IssueExtractionData {
	issueTitle: string
	issueDescription: string
	problemType: string
	urgencyLevel: string
	locationDetails: string
	customerName: string
	phoneNumber: string
	preferredCallbackTime?: string
	additionalNotes?: string
}

// VAPI Assistant Configuration for Issue Collection
export const createIssueCollectionAssistant = async () => {
	try {
		return await vapi.assistants.get("f1e0080b-2ab5-439d-b475-8a89c453ff9c")
	} catch (error) {
		console.error('Error getting VAPI assistant:', error)
		throw error
	}
}

// Make an outbound call to collect issue information
export const initiateIssueCollectionCall = async (phoneNumber: string, customerName?: string) => {
	try {
		// First, ensure we have an assistant (create or get existing)
		const assistant = await createIssueCollectionAssistant()

		// Convert phone number to E.164 format
		const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
		const e164PhoneNumber = cleanPhoneNumber.startsWith('+')
			? cleanPhoneNumber
			: `+1${cleanPhoneNumber}`

		const callConfig = {
			assistantId: assistant.id,
			phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
			customer: {
				number: e164PhoneNumber,
				name: customerName || 'Customer'
			}
		}

		return await vapi.calls.create(callConfig)
	} catch (error) {
		console.error('Error initiating VAPI call:', error)
		throw error
	}
}

// Process webhook data from VAPI call completion
export const processCallResults = (webhookData: any): IssueExtractionData | null => {
	try {
		const {call} = webhookData

		if (!call?.analysis?.structuredData) {
			console.error('No structured data found in webhook')
			return null
		}

		const extractedData = call.analysis.structuredData as IssueExtractionData

		// Validate required fields
		if (!extractedData.issueDescription || !extractedData.phoneNumber) {
			console.error('Missing required fields in extracted data')
			return null
		}

		return extractedData
	} catch (error) {
		console.error('Error processing VAPI call results:', error)
		return null
	}
}

// Notification call to inform customer about job assignment
export const createJobNotificationAssistant = async () => {
	const assistantConfig = {
		name: "ContractMe Job Assignment Notifier",
		model: {
			provider: "openai",
			model: "gpt-4o",
			temperature: 0.7,
			messages: [
				{
					role: "system" as const,
					content: `You are a professional customer service representative for ContractMe calling to notify a customer that their home repair issue has been assigned to a contractor.

CONVERSATION FLOW:
1. Greet the customer warmly and confirm their identity
2. Inform them that their repair issue has been assigned to a qualified contractor
3. Provide appointment details (contractor name, scheduled date/time, estimated cost)
4. Confirm their contact information
5. Let them know they can reschedule if needed
6. Thank them and end the call professionally

TONE:
- Professional and friendly
- Clear and informative
- Reassuring about contractor quality
- Brief but thorough

IMPORTANT:
- Keep the call under 2 minutes
- Ensure customer understands next steps
- Confirm they're available for the scheduled appointment
- Provide ContractMe contact info if they have questions`
				}
			]
		},
		voice: {
			provider: "11labs",
			voiceId: "sarah",
			speed: 1.0,
			stability: 0.5,
			similarityBoost: 0.5
		},
		firstMessage: "Hi! This is Sarah from ContractMe calling with great news about your recent repair request. Do you have a moment to discuss your upcoming appointment?",
		transcriber: {
			provider: "deepgram",
			model: "nova-2",
			language: "en-US"
		},
		endCallMessage: "Thank you! Your contractor will contact you before the appointment. If you have any questions, you can always reach ContractMe support. Have a great day!",
		recordingEnabled: true,
		maxDurationSeconds: 180, // 3 minute max
		silenceTimeoutSeconds: 15,
	}

	try {
		return await vapi.assistants.create(assistantConfig)
	} catch (error) {
		console.error('Error creating job notification assistant:', error)
		throw error
	}
}

// Make notification call to customer about job assignment
export const sendJobAssignmentNotification = async (
	phoneNumber: string, 
	customerName: string,
	contractorName: string,
	appointmentDate: string,
	estimatedCost: number
) => {
	try {
		const assistant = await createJobNotificationAssistant()
		
		const customFirstMessage = `Hi ${customerName}! This is Sarah from ContractMe calling with great news about your recent repair request. I'm calling to let you know that we've found a qualified contractor, ${contractorName}, to help you. They're scheduled to visit you on ${appointmentDate} with an estimated cost of $${estimatedCost}. Do you have a moment to confirm this appointment?`

		const callConfig = {
			assistantId: assistant.id,
			phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
			customer: {
				number: phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/[\s\-\(\)]/g, '')}`,
				name: customerName || 'Customer'
			}
		}

		// Update the first message for this specific call
		await vapi.assistants.update(assistant.id, {
			firstMessage: customFirstMessage
		})

		return await vapi.calls.create(callConfig)
	} catch (error) {
		console.error('Error sending job assignment notification:', error)
		throw error
	}
}

export {vapi}
