'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, apiRequest } from '@/lib/auth-client'

interface ContractorProfile {
  id?: string
  skills: string[]
  specialties: string[]
  experienceYears?: number
  licenses: string[]
  certifications: string[]
  insuranceVerified: boolean
  bondedAndInsured: boolean
  serviceRadius?: number
  serviceZipCodes: string[]
  businessName?: string
  yearsInBusiness?: number
  employeeCount?: number
  preferredJobTypes: string[]
  minimumJobValue?: number
  maximumJobsPerDay?: number
  acceptAutoAssignment: boolean
  autoCallEnabled: boolean
  preferredContactTime?: string
}

const COMMON_SKILLS = [
  'plumbing', 'electrical', 'carpentry', 'painting', 'flooring', 'roofing',
  'hvac', 'drywall', 'tiling', 'appliance repair', 'landscaping', 'masonry',
  'insulation', 'windows', 'doors', 'fencing', 'concrete', 'siding'
]

const COMMON_SPECIALTIES = [
  'bathroom remodeling', 'kitchen renovation', 'basement finishing',
  'deck installation', 'fence installation', 'appliance installation',
  'emergency repairs', 'home automation', 'energy efficiency upgrades'
]

const JOB_DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert']

export default function ContractorProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ContractorProfile>({
    skills: [],
    specialties: [],
    licenses: [],
    certifications: [],
    insuranceVerified: false,
    bondedAndInsured: false,
    serviceZipCodes: [],
    preferredJobTypes: [],
    acceptAutoAssignment: false,
    autoCallEnabled: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state for adding new items
  const [newSkill, setNewSkill] = useState('')
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newLicense, setNewLicense] = useState('')
  const [newCertification, setNewCertification] = useState('')
  const [newZipCode, setNewZipCode] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (currentUser.role !== 'CONTRACTOR' && currentUser.role !== 'BOTH') {
      router.push('/home')
      return
    }

    fetchProfile()
  }, [router])

  const fetchProfile = async () => {
    try {
      const response = await apiRequest('/api/contractor/profile')
      const data = await response.json()

      if (response.ok && data.profile) {
        setProfile(data.profile)
      } else if (response.status === 404) {
        // Profile doesn't exist yet, keep default empty profile
      } else {
        setError(data.error || 'Failed to fetch profile')
      }
    } catch (err) {
      setError('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiRequest('/api/contractor/profile', {
        method: 'PUT',
        body: JSON.stringify(profile)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save profile')
      }
    } catch (err) {
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const addToArray = (field: keyof ContractorProfile, value: string) => {
    if (!value.trim()) return
    const currentArray = profile[field] as string[]
    if (!currentArray.includes(value.trim())) {
      setProfile(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }))
    }
  }

  const removeFromArray = (field: keyof ContractorProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(item => item !== value)
    }))
  }

  const toggleArrayItem = (field: keyof ContractorProfile, value: string) => {
    const currentArray = profile[field] as string[]
    if (currentArray.includes(value)) {
      removeFromArray(field, value)
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: [...currentArray, value]
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/home" className="text-xl font-semibold text-gray-900">ContractMe</Link>
            </div>
            <div className="flex items-center">
              <Link 
                href="/home" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Contractor Profile
            </h1>
            <p className="text-gray-600 mb-8">
              Complete your profile to receive more relevant job opportunities and enable automatic job assignments.
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                {success}
              </div>
            )}

            <div className="space-y-8">
              {/* Skills Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Trades</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select from common skills:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_SKILLS.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleArrayItem('skills', skill)}
                        className={`px-3 py-1 text-sm rounded-full border ${
                          profile.skills.includes(skill)
                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => {
                      addToArray('skills', newSkill)
                      setNewSkill('')
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                  >
                    Add
                  </button>
                </div>

                {profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {skill}
                        <button
                          onClick={() => removeFromArray('skills', skill)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profile.experienceYears || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      experienceYears: parseInt(e.target.value) || undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profile.yearsInBusiness || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      yearsInBusiness: parseInt(e.target.value) || undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Business Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.businessName || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      businessName: e.target.value || undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Size
                  </label>
                  <select
                    value={profile.employeeCount || ''}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      employeeCount: parseInt(e.target.value) || undefined
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select team size</option>
                    <option value="1">Just me (Solo)</option>
                    <option value="2">2-3 people</option>
                    <option value="5">4-10 people</option>
                    <option value="15">11+ people</option>
                  </select>
                </div>
              </div>

              {/* Service Area */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Area</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Radius (miles)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={profile.serviceRadius || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        serviceRadius: parseInt(e.target.value) || undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Service ZIP Codes
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="12345"
                        value={newZipCode}
                        onChange={(e) => setNewZipCode(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => {
                          if (newZipCode.match(/^\d{5}$/)) {
                            addToArray('serviceZipCodes', newZipCode)
                            setNewZipCode('')
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
                      >
                        Add
                      </button>
                    </div>
                    {profile.serviceZipCodes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {profile.serviceZipCodes.map(zip => (
                          <span
                            key={zip}
                            className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                          >
                            {zip}
                            <button
                              onClick={() => removeFromArray('serviceZipCodes', zip)}
                              className="ml-1 text-gray-600 hover:text-gray-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Preferences</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Difficulty Levels
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_DIFFICULTIES.map(difficulty => (
                      <button
                        key={difficulty}
                        onClick={() => toggleArrayItem('preferredJobTypes', difficulty)}
                        className={`px-3 py-1 text-sm rounded-full border ${
                          profile.preferredJobTypes.includes(difficulty)
                            ? 'bg-green-100 border-green-300 text-green-800'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {difficulty}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Job Value ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={profile.minimumJobValue || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        minimumJobValue: parseFloat(e.target.value) || undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Jobs Per Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={profile.maximumJobsPerDay || ''}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        maximumJobsPerDay: parseInt(e.target.value) || undefined
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="insuranceVerified"
                    checked={profile.insuranceVerified}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      insuranceVerified: e.target.checked
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="insuranceVerified" className="ml-2 text-sm text-gray-700">
                    Insurance Verified
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="bondedAndInsured"
                    checked={profile.bondedAndInsured}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      bondedAndInsured: e.target.checked
                    }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="bondedAndInsured" className="ml-2 text-sm text-gray-700">
                    Bonded & Insured
                  </label>
                </div>
              </div>

              {/* Auto Assignment Preferences */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">🤖 Auto Assignment Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="acceptAutoAssignment"
                      checked={profile.acceptAutoAssignment}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        acceptAutoAssignment: e.target.checked
                      }))}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="acceptAutoAssignment" className="ml-2 text-sm text-yellow-900">
                      Accept automatic job assignments
                    </label>
                  </div>

                  {profile.acceptAutoAssignment && (
                    <>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="autoCallEnabled"
                          checked={profile.autoCallEnabled}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            autoCallEnabled: e.target.checked
                          }))}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="autoCallEnabled" className="ml-2 text-sm text-yellow-900">
                          Enable automatic phone calls for job opportunities
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-yellow-900 mb-2">
                          Preferred Call Time
                        </label>
                        <select
                          value={profile.preferredContactTime || ''}
                          onChange={(e) => setProfile(prev => ({
                            ...prev,
                            preferredContactTime: e.target.value || undefined
                          }))}
                          className="px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="">Any time</option>
                          <option value="morning">Morning (8am - 12pm)</option>
                          <option value="afternoon">Afternoon (12pm - 5pm)</option>
                          <option value="evening">Evening (5pm - 8pm)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 p-3 bg-yellow-100 rounded-md">
                  <p className="text-xs text-yellow-800">
                    💡 When enabled, our AI assistant will automatically call you when jobs matching your skills and preferences become available. 
                    You can accept or decline each opportunity during the call.
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}