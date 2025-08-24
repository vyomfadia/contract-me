import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (request) => {
  try {
    const userId = request.user?.userId
    const role = request.user?.role

    if (!userId || role !== 'CONTRACTOR') {
      return NextResponse.json(
        { error: 'Only contractors can access availability' },
        { status: 403 }
      )
    }

    const availability = await prisma.contractorAvailability.findMany({
      where: { contractorId: userId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Availability fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (request) => {
  try {
    const userId = request.user?.userId
    const role = request.user?.role

    if (!userId || role !== 'CONTRACTOR') {
      return NextResponse.json(
        { error: 'Only contractors can manage availability' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { availability } = body

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { error: 'Invalid availability data' },
        { status: 400 }
      )
    }

    // Delete all existing availability for this contractor
    await prisma.contractorAvailability.deleteMany({
      where: { contractorId: userId }
    })

    // Create new availability slots
    if (availability.length > 0) {
      const validSlots = availability.filter(slot => 
        slot.dayOfWeek && slot.startTime && slot.endTime
      ).map(slot => ({
        contractorId: userId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: slot.isAvailable !== false // default to true
      }))

      if (validSlots.length > 0) {
        await prisma.contractorAvailability.createMany({
          data: validSlots
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully'
    })
  } catch (error) {
    console.error('Availability update error:', error)
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    )
  }
})