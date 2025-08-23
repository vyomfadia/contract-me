import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { getUserById } from '@/lib/auth'

export const GET = withAuth(async (request) => {
  try {
    const userId = request.user?.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = await getUserById(userId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
})