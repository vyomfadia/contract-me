import { NextRequest, NextResponse } from "next/server";
import { withRoleAuth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { sendJobAssignmentNotification } from "@/lib/vapi-service";

export const POST = withRoleAuth([Role.CONTRACTOR])(async (request) => {
  try {
    const body = await request.json();
    const { enrichedIssueId } = body;
    const contractorId = request.user?.userId;

    if (!contractorId) {
      return NextResponse.json(
        { error: "Contractor not authenticated" },
        { status: 401 },
      );
    }

    if (!enrichedIssueId) {
      return NextResponse.json(
        { error: "Enriched issue ID is required" },
        { status: 400 },
      );
    }

    // Check if job is already claimed
    const existingJob = await prisma.enrichedIssue.findUnique({
      where: { id: enrichedIssueId },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (existingJob.claimedByContractorId) {
      return NextResponse.json(
        { error: "Job already claimed" },
        { status: 409 },
      );
    }

    // Find the next available appointment slot
    const availableSlot = await findNextAvailableSlot(contractorId, existingJob.issue.priority)

    // Claim the job and create appointment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const claimedJob = await tx.enrichedIssue.update({
        where: { id: enrichedIssueId },
        data: {
          claimedByContractorId: contractorId,
          claimedAt: new Date(),
        },
        include: {
          issue: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          contractorUser: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })

      // Update the original issue status
      await tx.issue.update({
        where: { id: existingJob.issueId },
        data: { status: "ASSIGNED" },
      })

      // Create appointment if we found an available slot
      let appointment = null
      if (availableSlot) {
        appointment = await tx.appointment.create({
          data: {
            issueId: existingJob.issueId,
            contractorId,
            customerId: existingJob.issue.userId,
            scheduledDate: availableSlot.scheduledDate,
            estimatedDuration: getEstimatedDuration(existingJob.estimatedTimeHours),
            quotedPrice: existingJob.totalEstimatedCost,
            status: 'SCHEDULED',
          }
        })
      }

      return { claimedJob, appointment }
    })

    const { claimedJob, appointment } = result

    // Send notification call to customer (don't wait for it to complete)
    if (claimedJob.issue.user.phoneNumber && appointment) {
      try {
        const appointmentDate = new Date(appointment.scheduledDate).toLocaleString()
        const estimatedCost = appointment.quotedPrice || claimedJob.totalQuotedPrice || 0
        
        sendJobAssignmentNotification(
          claimedJob.issue.user.phoneNumber,
          claimedJob.issue.user.username,
          claimedJob.contractorUser?.username || 'your contractor',
          appointmentDate,
          estimatedCost
        ).catch(error => {
          console.error('Failed to send notification call:', error)
          // Don't fail the job claim if notification fails
        })
      } catch (error) {
        console.error('Error preparing notification call:', error)
      }
    }

    return NextResponse.json({
      success: true,
      claimedJob,
      appointment,
    });
  } catch (error) {
    console.error("Job claim error:", error);
    return NextResponse.json({ error: "Failed to claim job" }, { status: 500 });
  }
});

// Helper function to find next available appointment slot
async function findNextAvailableSlot(contractorId: string, priority: string) {
  try {
    // Get contractor's availability
    const availability = await prisma.contractorAvailability.findMany({
      where: { 
        contractorId,
        isAvailable: true
      },
      orderBy: { dayOfWeek: 'asc' }
    })

    if (availability.length === 0) {
      return null // No availability set
    }

    // Get existing appointments to avoid conflicts
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        contractorId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    })

    // Priority-based scheduling: emergency gets next available slot
    const priorityOrder = { 'EMERGENCY': 0, 'URGENT': 1, 'NORMAL': 2, 'LOW': 3 }
    const priorityWeight = priorityOrder[priority as keyof typeof priorityOrder] || 2

    // For simplicity, schedule emergency/urgent jobs ASAP, others within a few days
    const daysToLookAhead = priority === 'EMERGENCY' ? 1 : 
                           priority === 'URGENT' ? 2 : 
                           priority === 'NORMAL' ? 7 : 14

    // Find the next available slot
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(now.getDate() + daysToLookAhead)

    for (let date = new Date(now); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()]
      
      const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek)
      
      for (const slot of dayAvailability) {
        const scheduledDate = new Date(date)
        const [startHour, startMinute] = slot.startTime.split(':').map(Number)
        scheduledDate.setHours(startHour, startMinute, 0, 0)

        // Skip past dates
        if (scheduledDate <= now) continue

        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(apt => {
          const aptDate = new Date(apt.scheduledDate)
          const aptEnd = new Date(aptDate.getTime() + apt.estimatedDuration * 60000)
          const slotEnd = new Date(scheduledDate.getTime() + 120 * 60000) // assume 2 hour slot
          
          return (scheduledDate < aptEnd && slotEnd > aptDate)
        })

        if (!hasConflict) {
          return { scheduledDate }
        }
      }
    }

    return null // No available slots found
  } catch (error) {
    console.error('Error finding available slot:', error)
    return null
  }
}

// Helper function to estimate duration in minutes based on hours
function getEstimatedDuration(estimatedHours?: number | null): number {
  if (!estimatedHours) return 120 // default 2 hours
  return Math.max(60, Math.min(480, estimatedHours * 60)) // between 1-8 hours
}
