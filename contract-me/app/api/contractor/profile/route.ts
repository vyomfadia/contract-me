import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (request) => {
  try {
    const userId = request.user?.userId
    const role = request.user?.role

    if (!userId || (role !== 'CONTRACTOR' && role !== 'BOTH')) {
      return NextResponse.json(
        { error: 'Only contractors can access profiles' },
        { status: 403 }
      )
    }

    const profile = await prisma.contractorProfile.findUnique({
      where: { contractorId: userId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (request) => {
  try {
    const userId = request.user?.userId
    const role = request.user?.role

    if (!userId || (role !== 'CONTRACTOR' && role !== 'BOTH')) {
      return NextResponse.json(
        { error: 'Only contractors can manage profiles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      skills = [],
      specialties = [],
      experienceYears,
      licenses = [],
      certifications = [],
      insuranceVerified = false,
      bondedAndInsured = false,
      serviceRadius,
      serviceZipCodes = [],
      businessName,
      yearsInBusiness,
      employeeCount,
      preferredJobTypes = [],
      minimumJobValue,
      maximumJobsPerDay,
      acceptAutoAssignment = false,
      autoCallEnabled = false,
      preferredContactTime,
    } = body

    // Upsert the profile
    const profile = await prisma.contractorProfile.upsert({
      where: { contractorId: userId },
      create: {
        contractorId: userId,
        skills,
        specialties,
        experienceYears,
        licenses,
        certifications,
        insuranceVerified,
        bondedAndInsured,
        serviceRadius,
        serviceZipCodes,
        businessName,
        yearsInBusiness,
        employeeCount,
        preferredJobTypes,
        minimumJobValue,
        maximumJobsPerDay,
        acceptAutoAssignment,
        autoCallEnabled,
        preferredContactTime,
      },
      update: {
        skills,
        specialties,
        experienceYears,
        licenses,
        certifications,
        insuranceVerified,
        bondedAndInsured,
        serviceRadius,
        serviceZipCodes,
        businessName,
        yearsInBusiness,
        employeeCount,
        preferredJobTypes,
        minimumJobValue,
        maximumJobsPerDay,
        acceptAutoAssignment,
        autoCallEnabled,
        preferredContactTime,
      }
    })

    return NextResponse.json({
      success: true,
      profile
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
})