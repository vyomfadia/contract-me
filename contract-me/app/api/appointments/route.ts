import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (request) => {
  try {
    const userId = request.user?.userId
    const role = request.user?.role

    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    let appointments

    if (role === 'CONTRACTOR') {
      // Get appointments for contractor
      appointments = await prisma.appointment.findMany({
        where: { contractorId: userId },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              jobStreet: true,
              jobCity: true,
              jobState: true,
              jobZipCode: true,
            }
          },
          customer: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
            }
          }
        },
        orderBy: { scheduledDate: 'asc' }
      })
    } else {
      // Get appointments for customer
      appointments = await prisma.appointment.findMany({
        where: { customerId: userId },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
            }
          },
          contractor: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
            }
          }
        },
        orderBy: { scheduledDate: 'asc' }
      })
    }

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Appointments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (request) => {
  try {
    const userId = request.user?.userId
    const body = await request.json()
    const { appointmentId, status, contractorNotes, quotedPrice } = body

    if (!userId || !appointmentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the user can update this appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { issue: true }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Only contractor or customer can update
    if (appointment.contractorId !== userId && appointment.customerId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this appointment' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (contractorNotes !== undefined) updateData.contractorNotes = contractorNotes
    if (quotedPrice !== undefined) updateData.quotedPrice = quotedPrice

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        issue: true,
        contractor: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
          }
        },
        customer: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment
    })
  } catch (error) {
    console.error('Appointment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
})