import { prisma } from './prisma'
import { sendContractorJobOffer } from './vapi-service'

interface MatchingCriteria {
  skills: string[]
  difficulty: string
  priority: string
  location?: {
    zipCode?: string
    latitude?: number
    longitude?: number
  }
  estimatedValue: number
}

interface ContractorMatch {
  contractorId: string
  contractor: {
    id: string
    username: string
    email: string
    phoneNumber?: string
  }
  profile: {
    skills: string[]
    preferredJobTypes: string[]
    serviceZipCodes: string[]
    serviceRadius?: number
    minimumJobValue?: number
    acceptAutoAssignment: boolean
    autoCallEnabled: boolean
    preferredContactTime?: string
  }
  matchScore: number
}

// Find contractors that match job criteria
export async function findMatchingContractors(
  criteria: MatchingCriteria
): Promise<ContractorMatch[]> {
  try {
    // Build the where clause for matching
    const whereClause: any = {
      acceptAutoAssignment: true,
      contractor: {
        role: { in: ['CONTRACTOR', 'BOTH'] },
        phoneNumber: { not: null }, // Must have phone for auto-calling
      }
    }

    // Find contractors with matching skills
    if (criteria.skills.length > 0) {
      whereClause.skills = {
        hasSome: criteria.skills
      }
    }

    // Filter by preferred job types (difficulty levels)
    if (criteria.difficulty) {
      whereClause.OR = [
        { preferredJobTypes: { isEmpty: true } }, // Accept any if not specified
        { preferredJobTypes: { has: criteria.difficulty } }
      ]
    }

    // Filter by minimum job value
    if (criteria.estimatedValue > 0) {
      whereClause.OR = whereClause.OR || []
      whereClause.OR.push(
        { minimumJobValue: null }, // Accept any if not specified
        { minimumJobValue: { lte: criteria.estimatedValue } }
      )
    }

    // Find contractors in service area
    if (criteria.location?.zipCode) {
      whereClause.OR = whereClause.OR || []
      whereClause.OR.push(
        { serviceZipCodes: { isEmpty: true } }, // No restrictions
        { serviceZipCodes: { has: criteria.location.zipCode } },
        { serviceRadius: { gte: 10 } } // Assume within service radius
      )
    }

    const contractors = await prisma.contractorProfile.findMany({
      where: whereClause,
      include: {
        contractor: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
          }
        }
      }
    })

    // Calculate match scores and sort by relevance
    const matches = contractors
      .map(profile => ({
        contractorId: profile.contractorId,
        contractor: profile.contractor,
        profile: {
          skills: profile.skills,
          preferredJobTypes: profile.preferredJobTypes,
          serviceZipCodes: profile.serviceZipCodes,
          serviceRadius: profile.serviceRadius,
          minimumJobValue: profile.minimumJobValue,
          acceptAutoAssignment: profile.acceptAutoAssignment,
          autoCallEnabled: profile.autoCallEnabled,
          preferredContactTime: profile.preferredContactTime,
        },
        matchScore: calculateMatchScore(profile, criteria)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)

    return matches
  } catch (error) {
    console.error('Error finding matching contractors:', error)
    throw error
  }
}

// Calculate how well a contractor matches the job criteria
function calculateMatchScore(profile: any, criteria: MatchingCriteria): number {
  let score = 0

  // Skill matching (highest weight)
  const skillMatches = criteria.skills.filter(skill => 
    profile.skills.some((contractorSkill: string) => 
      contractorSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(contractorSkill.toLowerCase())
    )
  ).length

  score += (skillMatches / Math.max(criteria.skills.length, 1)) * 50

  // Difficulty preference matching
  if (profile.preferredJobTypes.includes(criteria.difficulty)) {
    score += 20
  } else if (profile.preferredJobTypes.length === 0) {
    score += 10 // Accept all if no preference
  }

  // Priority handling (emergency gets bonus)
  if (criteria.priority === 'EMERGENCY') {
    score += 15
  } else if (criteria.priority === 'URGENT') {
    score += 10
  }

  // Value matching
  if (!profile.minimumJobValue || criteria.estimatedValue >= profile.minimumJobValue) {
    score += 15
  }

  // Auto-call enabled gets bonus for speed
  if (profile.autoCallEnabled) {
    score += 10
  }

  // Experience bonus (years in business)
  if (profile.yearsInBusiness) {
    score += Math.min(profile.yearsInBusiness * 2, 20)
  }

  // Insurance bonus
  if (profile.bondedAndInsured) {
    score += 5
  }

  return Math.round(score)
}

// Initiate calls to matching contractors in priority order
export async function initiateContractorCalls(
  enrichedIssueId: string,
  jobTitle: string,
  jobDescription: string,
  estimatedPrice: number,
  priority: string,
  customerInfo: {
    name: string
    location: string
    phone?: string
  }
): Promise<{ success: boolean; callsInitiated: number; errors: any[] }> {
  try {
    // Extract skills from job description for matching
    const skills = extractSkillsFromDescription(jobDescription)
    
    const criteria: MatchingCriteria = {
      skills,
      difficulty: 'Medium', // Default, could be enhanced
      priority,
      estimatedValue: estimatedPrice
    }

    const matchingContractors = await findMatchingContractors(criteria)
    
    if (matchingContractors.length === 0) {
      console.log('No matching contractors found for job:', enrichedIssueId)
      return { success: false, callsInitiated: 0, errors: ['No matching contractors found'] }
    }

    console.log(`Found ${matchingContractors.length} matching contractors for job ${enrichedIssueId}`)

    const callPromises = matchingContractors
      .filter(match => match.profile.autoCallEnabled && match.contractor.phoneNumber)
      .slice(0, 5) // Limit to top 5 matches to avoid spam
      .map(async (match, index) => {
        try {
          // Stagger calls by 30 seconds to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, index * 30000))
          
          const appointmentTime = getEstimatedAppointmentTime(priority)
          
          const call = await sendContractorJobOffer(
            match.contractor.phoneNumber!,
            match.contractor.username,
            jobTitle,
            jobDescription,
            estimatedPrice,
            customerInfo,
            appointmentTime,
            enrichedIssueId
          )

          console.log(`Initiated call to contractor ${match.contractor.username}:`, call.id)
          
          return { success: true, contractorId: match.contractorId, callId: call.id }
        } catch (error) {
          console.error(`Failed to call contractor ${match.contractor.username}:`, error)
          return { success: false, contractorId: match.contractorId, error }
        }
      })

    const results = await Promise.allSettled(callPromises)
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'rejected' ? r.reason : (r as any).value.error)

    return {
      success: successful > 0,
      callsInitiated: successful,
      errors
    }
  } catch (error) {
    console.error('Error initiating contractor calls:', error)
    return {
      success: false,
      callsInitiated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}

// Extract relevant skills from job description using keyword matching
function extractSkillsFromDescription(description: string): string[] {
  const skillKeywords = {
    'plumbing': ['plumb', 'pipe', 'leak', 'faucet', 'toilet', 'drain', 'water', 'sink'],
    'electrical': ['electric', 'wire', 'outlet', 'switch', 'light', 'circuit', 'breaker', 'power'],
    'hvac': ['heat', 'air', 'furnace', 'ac', 'vent', 'duct', 'thermostat', 'cooling'],
    'carpentry': ['wood', 'door', 'window', 'frame', 'cabinet', 'shelf', 'trim', 'floor'],
    'painting': ['paint', 'color', 'wall', 'ceiling', 'brush', 'primer'],
    'appliance repair': ['appliance', 'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'stove'],
    'roofing': ['roof', 'shingle', 'gutter', 'leak', 'tile'],
    'flooring': ['floor', 'carpet', 'tile', 'hardwood', 'vinyl', 'laminate']
  }

  const lowerDescription = description.toLowerCase()
  const detectedSkills: string[] = []

  Object.entries(skillKeywords).forEach(([skill, keywords]) => {
    if (keywords.some(keyword => lowerDescription.includes(keyword))) {
      detectedSkills.push(skill)
    }
  })

  return detectedSkills.length > 0 ? detectedSkills : ['general repair']
}

// Get estimated appointment time based on priority
function getEstimatedAppointmentTime(priority: string): string {
  const now = new Date()
  
  switch (priority) {
    case 'EMERGENCY':
      return 'within the next 2-4 hours'
    case 'URGENT':
      return 'within the next 24 hours'
    case 'NORMAL':
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return `within the next 2-3 days`
    case 'LOW':
      return 'within the next week'
    default:
      return 'within the next few days'
  }
}