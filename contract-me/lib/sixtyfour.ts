export interface ContractorInfo {
  name: string;
  title?: string;
  company?: string;
  location?: string;
  linkedin?: string;
}

export interface EnrichedContractorData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  industry?: string;
  specializations?: string[];
  service_areas?: string[];
  verified_credentials?: boolean;
  confidence_score?: number;
}

export async function enrichContractorProfile(contractorInfo: ContractorInfo): Promise<EnrichedContractorData | null> {
  try {
    const response = await fetch('https://api.sixtyfour.ai/enrich-lead', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.SIXTYFOUR_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lead_info: contractorInfo,
        struct: {
          name: "The contractor's full name",
          email: "Verified email address",
          phone: "Verified phone number", 
          company: "Company name",
          title: "Professional title",
          linkedin: "LinkedIn profile URL",
          website: "Company website",
          location: "Service location",
          industry: "Primary industry",
          specializations: "List of specializations as array",
          service_areas: "Geographic service areas as array",
          verified_credentials: "Whether credentials are verified (boolean)",
          confidence_score: "Confidence score of the data (number)"
        }
      })
    });

    if (!response.ok) {
      console.error('SixtyFour API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Parse the structured data
    const structuredData = data.structured_data || {};
    
    return {
      name: structuredData.name || contractorInfo.name,
      email: structuredData.email,
      phone: structuredData.phone,
      company: structuredData.company || contractorInfo.company,
      title: structuredData.title || contractorInfo.title,
      linkedin: structuredData.linkedin || contractorInfo.linkedin,
      website: structuredData.website,
      location: structuredData.location || contractorInfo.location,
      industry: structuredData.industry,
      specializations: Array.isArray(structuredData.specializations) 
        ? structuredData.specializations 
        : structuredData.specializations?.split(',').map((s: string) => s.trim()) || [],
      service_areas: Array.isArray(structuredData.service_areas)
        ? structuredData.service_areas
        : structuredData.service_areas?.split(',').map((s: string) => s.trim()) || [],
      verified_credentials: structuredData.verified_credentials || false,
      confidence_score: structuredData.confidence_score || 0
    };
  } catch (error) {
    console.error('Error enriching contractor profile:', error);
    return null;
  }
}

export async function searchContractors(query: string, location?: string): Promise<EnrichedContractorData[]> {
  // For now, this is a simple implementation that would need to be expanded
  // based on SixtyFour's search capabilities when they become available
  try {
    // This is a placeholder - you'll need to implement actual search logic
    // when SixtyFour releases their search endpoints
    console.log(`Searching for contractors with query: ${query} in location: ${location}`);
    
    // For now, return empty array - this would be replaced with actual search
    return [];
  } catch (error) {
    console.error('Error searching contractors:', error);
    return [];
  }
}
