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

// VAPI Assistant for offering jobs to contractors
export const createContractorJobOfferAssistant = async () => {
	const assistantConfig = {
		name: "ContractMe Contractor Job Offer",
		model: {
			provider: "openai",
			model: "gpt-4o",
			temperature: 0.7,
			messages: [
				{
					role: "system" as const,
					content: `You are a professional representative from ContractMe calling a contractor with a job opportunity that matches their skills and preferences.

CONVERSATION FLOW:
1. Greet the contractor professionally and confirm their identity
2. Briefly explain you're calling from ContractMe with a job opportunity
3. Present the job details clearly (type, location, estimated value, timeline)
4. Ask if they're interested and available for this appointment time
5. If YES: Confirm they accept the job and will contact the customer
6. If NO: Thank them politely and end the call
7. Keep the call brief and professional (under 2 minutes)

IMPORTANT INFORMATION TO PROVIDE:
- Job type and description
- Customer location (general area)
- Estimated job value
- Proposed appointment time
- Customer contact information (if job accepted)

TONE:
- Professional and respectful
- Clear and concise
- Acknowledge their expertise
- Enthusiastic about the opportunity

DECISION HANDLING:
- If they accept: Get confirmation they'll contact the customer and be available for the appointment
- If they decline: Thank them and let them know about future opportunities
- If unsure: Give them brief time to consider but need an answer

Remember: You're calling because this job matches their listed skills and preferences.`
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
		firstMessage: "Hi! This is Sarah from ContractMe. I hope I'm catching you at a good time. I'm calling because we have a job opportunity that matches your skills perfectly. Do you have a moment to hear about it?",
		transcriber: {
			provider: "deepgram",
			model: "nova-2",
			language: "en-US"
		},
		analysisPlan: {
			summaryPrompt: "Summarize this contractor job offer call, focusing on whether they accepted or declined the job opportunity and any important details discussed.",
			structuredDataPrompt: "Extract the contractor's response to the job offer.",
			structuredDataSchema: {
				type: "object",
				properties: {
					jobAccepted: {
						type: "boolean",
						description: "Whether the contractor accepted the job"
					},
					contractorResponse: {
						type: "string",
						enum: ["accepted", "declined", "needs_time", "unavailable"],
						description: "Contractor's response to the job offer"
					},
					reasonForDecline: {
						type: "string",
						description: "Reason given for declining, if applicable"
					},
					additionalNotes: {
						type: "string",
						description: "Any other important information from the call"
					},
					enrichedIssueId: {
						type: "string",
						description: "The job ID that was offered"
					}
				},
				required: ["jobAccepted", "contractorResponse", "enrichedIssueId"],
				additionalProperties: false
			}
		},
		endCallMessage: "Thank you for your time! We appreciate working with skilled contractors like you. Have a great day!",
		recordingEnabled: true,
		maxDurationSeconds: 180, // 3 minute max
		silenceTimeoutSeconds: 15,
	}

	try {
		return await vapi.assistants.create(assistantConfig)
	} catch (error) {
		console.error('Error creating contractor job offer assistant:', error)
		throw error
	}
}

// Make job offer call to contractor
export const sendContractorJobOffer = async (
	phoneNumber: string, 
	contractorName: string,
	jobTitle: string,
	jobDescription: string,
	estimatedPrice: number,
	customerInfo: {
		name: string
		location: string
		phone?: string
	},
	appointmentTime: string,
	enrichedIssueId: string
) => {
	try {
		const assistant = await createContractorJobOfferAssistant()
		
		const customFirstMessage = `Hi ${contractorName}! This is Sarah from ContractMe. I hope I'm catching you at a good time. I'm calling because we have a ${jobTitle} job opportunity in ${customerInfo.location} that matches your skills perfectly. The estimated value is $${estimatedPrice} and the customer needs it done ${appointmentTime}. Do you have a moment to hear more details and see if you're interested?`

		const callConfig = {
			assistantId: assistant.id,
			phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
			customer: {
				number: phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/[\s\-\(\)]/g, '')}`,
				name: contractorName
			},
			// Pass job details in assistant instructions for the call
			assistantOverrides: {
				variableValues: {
					jobTitle,
					jobDescription: jobDescription.substring(0, 200), // Truncate for voice
					estimatedPrice: estimatedPrice.toString(),
					customerName: customerInfo.name,
					customerLocation: customerInfo.location,
					customerPhone: customerInfo.phone || 'to be provided',
					appointmentTime,
					enrichedIssueId
				}
			}
		}

		// Update the first message for this specific call
		await vapi.assistants.update(assistant.id, {
			firstMessage: customFirstMessage
		})

		return await vapi.calls.create(callConfig)
	} catch (error) {
		console.error('Error sending contractor job offer:', error)
		throw error
	}
}

export {vapi}
