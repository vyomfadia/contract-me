import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import {Role} from "@prisma/client";

export interface CreateUserInput {
  email: string
  username: string
  password: string
  phoneNumber?: string
  role?: Role
}

export interface LoginInput {
  email: string
  password: string
}

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: Role
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function createUser(userData: CreateUserInput) {
  const { email, username, password, phoneNumber, role = Role.USER } = userData

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  })

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('User with this email already exists')
    }
    if (existingUser.username === username) {
      throw new Error('User with this username already exists')
    }
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      phoneNumber,
      role,
    },
    select: {
      id: true,
      email: true,
      username: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
    }
  })

  return user
}

export async function loginUser(loginData: LoginInput) {
  const { email, password } = loginData

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const isValidPassword = await comparePassword(password, user.password)

  if (!isValidPassword) {
    throw new Error('Invalid email or password')
  }

  const tokenPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  }

  const token = generateToken(tokenPayload)

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      role: user.role,
    }
  }
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
    }
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
    }
  })
}