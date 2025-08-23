'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, apiRequest } from '@/lib/auth-client'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface JobContext {
  problem: string
  difficulty: string
  estimatedTime: number
}

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [jobContext, setJobContext] = useState<JobContext | null>(null)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (currentUser.role === 'USER') {
      router.push('/home')
      return
    }

    if (!jobId) {
      router.push('/jobs')
      return
    }

    // Add welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your repair technician assistant. I have full context of your job and I'm here to help you troubleshoot, provide step-by-step guidance, answer technical questions, and help you complete this repair successfully. 

You can ask me anything about the repair process, request clarification on steps, or even start a video call where I can see what you're working on and provide real-time guidance.

How can I help you today?`,
      timestamp: new Date()
    }])
  }, [router, jobId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim()
    if (!content || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          enrichedIssueId: jobId,
          message: content
        })
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        
        if (data.jobContext) {
          setJobContext(data.jobContext)
        }
      } else {
        throw new Error(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      
      setIsVideoCallActive(true)
      
      // Send automatic message about starting video call
      sendMessage("I just started a video call. I can now see my workspace. Please help me with the repair based on what you can observe.")
    } catch (error) {
      console.error('Error starting video call:', error)
      alert('Unable to access camera. Please check your permissions.')
    }
  }

  const stopVideoCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsVideoCallActive(false)
    setIsRecording(false)
    streamRef.current = null
  }

  const toggleRecording = () => {
    if (!streamRef.current) return

    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
    } else {
      const mediaRecorder = new MediaRecorder(streamRef.current)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        await sendVideoMessage("I've recorded a video of my current workspace. Please analyze what you see and provide guidance on the repair process.", blob)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      
      // Auto-stop recording after 30 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop()
          setIsRecording(false)
        }
      }, 30000)
    }
  }

  const sendVideoMessage = async (messageContent: string, videoBlob: Blob) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `${messageContent} [Video sent]`,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('enrichedIssueId', jobId!)
      formData.append('message', messageContent)
      formData.append('video', videoBlob, 'workspace-video.webm')

      const response = await fetch('/api/chat/video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, assistantMessage])
        
        if (data.jobContext) {
          setJobContext(data.jobContext)
        }
      } else {
        throw new Error(data.error || 'Failed to process video message')
      }
    } catch (error) {
      console.error('Failed to send video message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I had trouble processing the video. Please try again or describe what you\'re seeing.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/jobs" className="text-xl font-semibold text-gray-900">
                🔧 Repair Assistant
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {jobContext && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {jobContext.difficulty}
                  </span>
                  <span>~{jobContext.estimatedTime}h</span>
                </div>
              )}
              <Link
                href="/jobs"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm max-w-xs px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t bg-white p-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <div className="flex space-x-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask for repair guidance, troubleshooting help, or technical advice..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="mt-3 flex space-x-2">
              {!isVideoCallActive ? (
                <button
                  onClick={startVideoCall}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <span>📹</span>
                  <span>Start Video Assistance</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={toggleRecording}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <span>{isRecording ? '⏹️' : '🎥'}</span>
                    <span>{isRecording ? 'Stop Recording' : 'Record Situation'}</span>
                  </button>
                  <button
                    onClick={stopVideoCall}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    End Call
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Section */}
        {isVideoCallActive && (
          <div className="w-80 bg-white border-l">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Video Assistance</h3>
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full rounded-lg bg-gray-900"
                style={{ aspectRatio: '4/3' }}
              />
              <p className="text-xs text-gray-600 mt-2">
                Show me your work area and I'll provide real-time guidance
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}