'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, apiRequest } from '@/lib/auth-client'

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' }
]

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

interface AvailabilitySlot {
  id?: string
  dayOfWeek: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

export default function AvailabilityPage() {
  const router = useRouter()
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (currentUser.role !== 'CONTRACTOR') {
      router.push('/home')
      return
    }

    fetchAvailability()
  }, [router])

  const fetchAvailability = async () => {
    try {
      const response = await apiRequest('/api/availability')
      const data = await response.json()

      if (response.ok) {
        setAvailability(data.availability || [])
      } else {
        setError(data.error || 'Failed to fetch availability')
      }
    } catch (err) {
      setError('Failed to fetch availability')
    } finally {
      setLoading(false)
    }
  }

  const addTimeSlot = () => {
    setAvailability([...availability, {
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    }])
  }

  const updateTimeSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updated = [...availability]
    updated[index] = { ...updated[index], [field]: value }
    setAvailability(updated)
  }

  const removeTimeSlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index))
  }

  const saveAvailability = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await apiRequest('/api/availability', {
        method: 'PUT',
        body: JSON.stringify({ availability })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Availability updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save availability')
      }
    } catch (err) {
      setError('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading availability...</div>
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
              Manage Your Availability
            </h1>
            <p className="text-gray-600 mb-8">
              Set your available hours for each day of the week. This helps customers know when you're available for appointments.
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

            <div className="space-y-4 mb-6">
              {availability.map((slot, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day
                      </label>
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) => updateTimeSlot(index, 'dayOfWeek', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <select
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <select
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={slot.isAvailable}
                          onChange={(e) => updateTimeSlot(index, 'isAvailable', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Available
                        </label>
                      </div>
                      <button
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {availability.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No availability slots set. Add your first time slot below.
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={addTimeSlot}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Add Time Slot
              </button>
              <button
                onClick={saveAvailability}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
              >
                {saving ? 'Saving...' : 'Save Availability'}
              </button>
            </div>

            <div className="mt-8 bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">💡 Tips</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Set realistic time windows that account for travel between jobs</li>
                <li>• You can have multiple time slots per day (e.g., morning and afternoon)</li>
                <li>• Uncheck "Available" to temporarily disable a time slot</li>
                <li>• Jobs will be automatically scheduled based on your availability and priority</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}