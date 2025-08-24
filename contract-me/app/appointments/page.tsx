'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, apiRequest } from '@/lib/auth-client'

interface Appointment {
  id: string
  scheduledDate: string
  estimatedDuration: number
  status: string
  quotedPrice?: number
  finalPrice?: number
  contractorNotes?: string
  customerNotes?: string
  issue: {
    id: string
    title?: string
    description: string
    priority: string
  }
  contractor?: {
    id: string
    username: string
    email: string
    phoneNumber?: string
  }
  customer?: {
    id: string
    username: string
    email: string
    phoneNumber?: string
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    setUserRole(currentUser.role)
    fetchAppointments()
  }, [router])

  const fetchAppointments = async () => {
    try {
      const response = await apiRequest('/api/appointments')
      const data = await response.json()

      if (response.ok) {
        setAppointments(data.appointments || [])
      } else {
        setError(data.error || 'Failed to fetch appointments')
      }
    } catch (err) {
      setError('Failed to fetch appointments')
    } finally {
      setLoading(false)
    }
  }


  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await apiRequest('/api/appointments', {
        method: 'PUT',
        body: JSON.stringify({
          appointmentId,
          status: newStatus,
        })
      })

      if (response.ok) {
        await fetchAppointments() // Refresh the list
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update appointment')
      }
    } catch (err) {
      setError('Failed to update appointment')
    }
  }

  // Group appointments by status
  const upcomingAppointments = appointments.filter(apt => 
    ['SCHEDULED', 'CONFIRMED'].includes(apt.status)
  ).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

  const pastAppointments = appointments.filter(apt => 
    ['COMPLETED', 'CANCELLED'].includes(apt.status)
  ).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())

  const inProgressAppointments = appointments.filter(apt => 
    apt.status === 'IN_PROGRESS'
  ).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading appointments...</div>
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

      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === 'CONTRACTOR' ? 'My Schedule' : 'My Appointments'}
          </h1>
          <p className="text-gray-600 mt-2">
            {userRole === 'CONTRACTOR' 
              ? 'View and manage your upcoming appointments with customers'
              : 'Track your scheduled appointments with contractors'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No appointments scheduled</div>
            <Link
              href={userRole === 'CONTRACTOR' ? '/jobs' : '/submit-issue'}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {userRole === 'CONTRACTOR' ? 'Browse Available Jobs' : 'Submit a New Issue'}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* In Progress Appointments */}
            {inProgressAppointments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">🔧 In Progress</h2>
                <div className="grid gap-4">
                  {inProgressAppointments.map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment} 
                      userRole={userRole}
                      onUpdateStatus={updateAppointmentStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📅 Upcoming</h2>
                <div className="grid gap-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment} 
                      userRole={userRole}
                      onUpdateStatus={updateAppointmentStatus}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Past</h2>
                <div className="grid gap-4">
                  {pastAppointments.map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id} 
                      appointment={appointment} 
                      userRole={userRole}
                      onUpdateStatus={updateAppointmentStatus}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions for the AppointmentCard component
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'emergency':
      return 'bg-red-100 text-red-800'
    case 'urgent':
      return 'bg-orange-100 text-orange-800'
    case 'normal':
      return 'bg-blue-100 text-blue-800'
    case 'low':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-gray-100 text-gray-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'rescheduled':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function AppointmentCard({ 
  appointment, 
  userRole, 
  onUpdateStatus 
}: { 
  appointment: Appointment
  userRole: string
  onUpdateStatus: (id: string, status: string) => void
}) {
  const isUpcoming = ['SCHEDULED', 'CONFIRMED'].includes(appointment.status)
  const isInProgress = appointment.status === 'IN_PROGRESS'
  const isContractor = userRole === 'CONTRACTOR'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {appointment.issue.title || 'Repair Job'}
            </h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(appointment.issue.priority)}`}>
              {appointment.issue.priority}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{appointment.issue.description}</p>
          <div className="text-sm text-gray-500">
            {isContractor ? (
              <span>Customer: {appointment.customer?.username} | {appointment.customer?.email}</span>
            ) : (
              <span>Contractor: {appointment.contractor?.username} | {appointment.contractor?.email}</span>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
          {appointment.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-blue-800 text-sm font-medium">📅 Date & Time</div>
          <div className="text-blue-900 font-semibold">
            {formatDate(appointment.scheduledDate)}
          </div>
          <div className="text-blue-800">
            {formatTime(appointment.scheduledDate)} ({appointment.estimatedDuration} min)
          </div>
        </div>

        {appointment.quotedPrice && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-green-800 text-sm font-medium">💰 Price</div>
            <div className="text-green-900 font-semibold">
              {formatCurrency(appointment.finalPrice || appointment.quotedPrice)}
            </div>
            {appointment.finalPrice && appointment.finalPrice !== appointment.quotedPrice && (
              <div className="text-green-700 text-sm">
                Originally: {formatCurrency(appointment.quotedPrice)}
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-700 text-sm font-medium">📞 Contact</div>
          <div className="text-gray-900">
            {isContractor 
              ? appointment.customer?.phoneNumber || appointment.customer?.email
              : appointment.contractor?.phoneNumber || appointment.contractor?.email
            }
          </div>
        </div>
      </div>

      {/* Notes */}
      {(appointment.contractorNotes || appointment.customerNotes) && (
        <div className="mb-4">
          {appointment.contractorNotes && (
            <div className="bg-yellow-50 p-3 rounded mb-2">
              <div className="text-yellow-800 text-sm font-medium">🔧 Contractor Notes:</div>
              <div className="text-yellow-900">{appointment.contractorNotes}</div>
            </div>
          )}
          {appointment.customerNotes && (
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-blue-800 text-sm font-medium">👤 Customer Notes:</div>
              <div className="text-blue-900">{appointment.customerNotes}</div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons for contractors */}
      {isContractor && (isUpcoming || isInProgress) && (
        <div className="flex gap-2 pt-4 border-t">
          {appointment.status === 'SCHEDULED' && (
            <button
              onClick={() => onUpdateStatus(appointment.id, 'CONFIRMED')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Confirm Appointment
            </button>
          )}
          {appointment.status === 'CONFIRMED' && (
            <button
              onClick={() => onUpdateStatus(appointment.id, 'IN_PROGRESS')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Start Job
            </button>
          )}
          {appointment.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(appointment.id, 'COMPLETED')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Complete Job
            </button>
          )}
          <button
            onClick={() => onUpdateStatus(appointment.id, 'CANCELLED')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}