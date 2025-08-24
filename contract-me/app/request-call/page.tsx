'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, apiRequest } from '@/lib/auth-client'

export default function RequestCallPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    phoneNumber: '',
    customerName: '',
    preferredTime: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [callInfo, setCallInfo] = useState<{
    callId: string
    estimatedTime: string
  } | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (currentUser.role === 'CONTRACTOR') {
      router.push('/home')
      return
    }

    // Pre-fill name and phone if available
    setFormData(prev => ({
      ...prev,
      customerName: currentUser.username || '',
      phoneNumber: currentUser.phoneNumber ? formatPhoneNumber(currentUser.phoneNumber) : ''
    }))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiRequest('/api/voice/call', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setCallInfo({
          callId: data.callId,
          estimatedTime: data.estimatedCallTime
        })
      } else {
        throw new Error(data.error || 'Failed to request call')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request call')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length >= 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
    }
    return phoneNumber
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      phoneNumber: formatted
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/home" className="text-xl font-semibold text-gray-900">ContractMe</Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Call Request Submitted!</h2>
              <div className="space-y-3 text-left bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-800">
                  <strong>📞 Expect our call:</strong> {callInfo?.estimatedTime || 'within a few minutes'}
                </p>
                <p className="text-blue-800">
                  <strong>📋 What to expect:</strong> Our AI assistant Sarah will call you to gather details about your repair issue
                </p>
                <p className="text-blue-800">
                  <strong>⏱️ Call duration:</strong> Usually 5-10 minutes
                </p>
                <p className="text-blue-800">
                  <strong>📝 After the call:</strong> We'll analyze your issue and connect you with a qualified contractor
                </p>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Please keep your phone nearby!</strong> Our system will call the number you provided ({formData.phoneNumber}) shortly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/home"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded font-medium inline-block"
                >
                  Return to Home
                </Link>
                <Link
                  href="/submit-issue"
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded font-medium inline-block"
                >
                  Or Submit Issue Online Instead
                </Link>
              </div>
            </div>
          </div>
        </div>
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

      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Request a Call</h1>
              <p className="text-gray-600">
                We'll call you to understand your repair needs and connect you with the right contractor
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                  value={formData.customerName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                />
                <p className="mt-2 text-sm text-gray-500">
                  We'll call this number within 2 minutes to discuss your repair needs
                </p>
              </div>

              <div>
                <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Call Time (optional)
                </label>
                <select
                  id="preferredTime"
                  name="preferredTime"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.preferredTime}
                  onChange={handleChange}
                >
                  <option value="">Call me now</option>
                  <option value="morning">Morning (8am - 12pm)</option>
                  <option value="afternoon">Afternoon (12pm - 5pm)</option>
                  <option value="evening">Evening (5pm - 8pm)</option>
                  <option value="weekend">Weekend</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">📞 What happens during the call?</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Sarah, our AI assistant, will call you</li>
                  <li>• She'll ask about your repair issue in detail</li>
                  <li>• The call usually takes 5-10 minutes</li>
                  <li>• We'll analyze your needs and find the right contractor</li>
                  <li>• You'll hear from a contractor within 24 hours</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !formData.phoneNumber.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Requesting Call...</span>
                    </>
                  ) : (
                    <>
                      <span>📞</span>
                      <span>Request Call Now</span>
                    </>
                  )}
                </button>
                <Link
                  href="/submit-issue"
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-center"
                >
                  Submit Online Instead
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}