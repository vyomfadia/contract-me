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

export {vapi}
