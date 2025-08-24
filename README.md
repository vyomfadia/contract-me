# ContractMe

A contractor marketplace platform that connects homeowners with skilled contractors for repair and maintenance services.

## Overview

ContractMe streamlines the process of finding and hiring contractors by using AI to analyze repair issues, match contractors, and automate communication. The platform handles the entire workflow from issue submission to contractor assignment.

## Features

- **AI-Powered Issue Analysis**: Uses OpenAI GPT-4 to analyze submitted issues and generate detailed repair solutions, cost estimates, and contractor requirements
- **Intelligent Contractor Matching**: Matches contractors based on skills, location, availability, and job preferences
- **Automated Voice Calling**: Integrates with VAPI.ai for automated job offers to contractors and customer notifications
- **Role-Based Interface**: Separate dashboards for customers and contractors with appropriate functionality
- **Real-Time Status Tracking**: Track issue status from submission through completion
- **Scheduling System**: Automatic appointment scheduling based on contractor availability
- **File Upload Support**: Customers can attach photos and videos to their issues

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **AI Integration**: OpenAI GPT-4
- **Voice Services**: VAPI.ai
- **Authentication**: JWT with bcrypt password hashing

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key for issue analysis
- `VAPI_API_KEY`: VAPI.ai API key for voice calls
- `VAPI_PHONE_NUMBER_ID`: VAPI phone number ID

## Project Structure

- `/app`: Next.js app router pages and API routes
- `/lib`: Utility functions and services
- `/prisma`: Database schema and migrations
- `/public`: Static assets

## License

MIT
