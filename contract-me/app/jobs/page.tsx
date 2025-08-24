"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, apiRequest } from "@/lib/auth-client";

interface Job {
  id: string;
  identifiedProblem: string;
  repairSolution: string;
  estimatedTimeHours?: number;
  difficultyLevel: string;
  requiredItems: Array<{
    name: string;
    estimatedCost: number;
    quantity?: number;
    unit?: string;
  }>;
  totalEstimatedCost?: number;
  laborCost?: number;
  materialsCost?: number;
  totalQuotedPrice?: number;
  questionsForUser: string[];
  contractorChecklist: string[];
  claimedByContractorId?: string;
  claimedAt?: string;
  issue: {
    id: string;
    title?: string;
    description: string;
    priority: string;
    attachments: string[];
    createdAt: string;
    jobStreet?: string;
    jobCity?: string;
    jobState?: string;
    jobZipCode?: string;
    user: {
      id: string;
      username: string;
      email: string;
      phoneNumber?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [claimedJobs, setClaimedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "claimed">("available");
  const [claimingJobs, setClaimingJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role === "USER") {
      router.push("/home");
      return;
    }

    fetchJobs();
  }, [router, activeTab]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const [availableRes, claimedRes] = await Promise.all([
        apiRequest("/api/jobs"),
        apiRequest("/api/jobs?claimed=true"),
      ]);

      const [availableData, claimedData] = await Promise.all([
        availableRes.json(),
        claimedRes.json(),
      ]);

      if (availableRes.ok) setJobs(availableData.jobs);
      if (claimedRes.ok) setClaimedJobs(claimedData.jobs);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimJob = async (enrichedIssueId: string) => {
    setClaimingJobs((prev) => new Set(prev).add(enrichedIssueId));

    try {
      const response = await apiRequest("/api/jobs/claim", {
        method: "POST",
        body: JSON.stringify({ enrichedIssueId }),
      });

      if (response.ok) {
        await fetchJobs(); // Refresh both lists
      } else {
        const error = await response.json();
        alert(error.error || "Failed to claim job");
      }
    } catch (error) {
      console.error("Failed to claim job:", error);
      alert("Failed to claim job");
    } finally {
      setClaimingJobs((prev) => {
        const updated = new Set(prev);
        updated.delete(enrichedIssueId);
        return updated;
      });
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "easy":
        return "badge-success";
      case "medium":
        return "badge-warning";
      case "hard":
        return "badge-danger";
      case "expert":
        return "badge-danger";
      default:
        return "badge-info";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "emergency":
        return "badge-danger";
      case "urgent":
        return "badge-warning";
      case "normal":
        return "badge-info";
      case "low":
        return "badge-info";
      default:
        return "badge-info";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const JobCard = ({
    job,
    showClaimButton = false,
  }: {
    job: Job;
    showClaimButton?: boolean;
  }) => (
    <div className="card hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {job.issue.title || "Untitled Issue"}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              {job.issue.user.username}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              {new Date(job.issue.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`badge ${getPriorityColor(job.issue.priority)}`}>
            {job.issue.priority}
          </span>
          <span className={`badge ${getDifficultyColor(job.difficultyLevel)}`}>
            {job.difficultyLevel}
          </span>
          {job.estimatedTimeHours && (
            <span className="badge badge-info">
              ~{job.estimatedTimeHours}h
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Job Location */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            Job Location
          </h4>
          <p className="text-amber-800 text-sm">
            {job.issue.jobStreet || job.issue.user.street ? (
              <>
                {job.issue.jobStreet || job.issue.user.street}, {job.issue.jobCity || job.issue.user.city}, {job.issue.jobState || job.issue.user.state} {job.issue.jobZipCode || job.issue.user.zipCode}
              </>
            ) : (
              'Address to be provided'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              Problem Identified
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{job.identifiedProblem}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Repair Solution
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{job.repairSolution}</p>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
            </svg>
            Cost Estimate
          </h4>
          <div className="space-y-3">
            {job.materialsCost && (
              <div className="flex justify-between text-sm">
                <span className="text-orange-800">Materials Cost:</span>
                <span className="font-semibold text-orange-900">{formatCurrency(job.materialsCost)}</span>
              </div>
            )}
            {job.laborCost && (
              <div className="flex justify-between text-sm">
                <span className="text-orange-800">Labor Cost:</span>
                <span className="font-semibold text-orange-900">{formatCurrency(job.laborCost)}</span>
              </div>
            )}
            {job.totalQuotedPrice && (
              <div className="flex justify-between text-sm font-bold border-t border-orange-200 pt-3 mt-3">
                <span className="text-orange-900">Total Price:</span>
                <span className="text-orange-900 text-lg">{formatCurrency(job.totalQuotedPrice)}</span>
              </div>
            )}
          </div>
        </div>

        {job.requiredItems.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              Required Items
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {job.requiredItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">
                    {item.quantity ? `${item.quantity} ` : ""}
                    {item.name}
                  </span>
                  <span className="font-semibold text-indigo-600">
                    {formatCurrency(item.estimatedCost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {job.questionsForUser.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Questions for Customer
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                {job.questionsForUser.map((question, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.contractorChecklist.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                On-Site Checklist
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                {job.contractorChecklist.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {job.issue.attachments.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
              </svg>
              Attachments
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {job.issue.attachments.map((attachment, index) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment)
                const isVideo = /\.(mp4|webm|mov|avi)$/i.test(attachment)
                
                return (
                  <div key={index} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    {isImage ? (
                      <div>
                        <img 
                          src={attachment} 
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(attachment, '_blank')}
                        />
                        <div className="p-3 bg-gray-50">
                          <p className="text-xs text-gray-600 truncate">
                            {attachment.split('/').pop()}
                          </p>
                        </div>
                      </div>
                    ) : isVideo ? (
                      <div>
                        <video 
                          className="w-full h-32 object-cover"
                          controls
                          preload="metadata"
                        >
                          <source src={attachment} />
                          Your browser does not support video playback.
                        </video>
                        <div className="p-3 bg-gray-50">
                          <p className="text-xs text-gray-600 truncate">
                            {attachment.split('/').pop()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-100 h-32 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl mb-2">📁</div>
                          <p className="text-xs text-gray-600 truncate mb-2">
                            {attachment.split('/').pop()}
                          </p>
                          <button
                            onClick={() => window.open(attachment, '_blank')}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            View File
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Customer Contact
          </h4>
          <div className="flex items-center space-x-4 text-sm text-gray-700">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              {job.issue.user.email}
            </span>
            {job.issue.user.phoneNumber && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {job.issue.user.phoneNumber}
              </span>
            )}
          </div>
        </div>

        {showClaimButton ? (
          <button
            onClick={() => claimJob(job.id)}
            disabled={claimingJobs.has(job.id)}
            className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claimingJobs.has(job.id) ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Claiming...</span>
              </div>
            ) : (
              "Claim Job"
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <Link
              href={`/chat?jobId=${job.id}`}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 px-4 rounded-lg font-semibold text-center block transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>🔧 Chat with Repair Assistant</span>
              </div>
            </Link>
            <p className="text-xs text-gray-600 text-center">
              Get step-by-step guidance and video assistance
            </p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Navigation */}
              <nav className="bg-amber-50 shadow-lg border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/home" className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <span className="text-xl font-bold text-amber-800">ContractMe</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link
                href="/home"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-amber-800 mb-2">Available Jobs</h1>
            <p className="text-gray-600 text-lg">
              Browse and claim jobs that match your expertise
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-amber-50 rounded-xl shadow-md p-1 max-w-md mx-auto">
            <div className="flex">
              <button
                onClick={() => setActiveTab("available")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "available"
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-amber-100"
                }`}
              >
                Available Jobs ({jobs.length})
              </button>
              <button
                onClick={() => setActiveTab("claimed")}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "claimed"
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-amber-100"
                }`}
              >
                My Jobs ({claimedJobs.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === "available" ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard key={job.id} job={job} showClaimButton={true} />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No available jobs</h3>
                <p className="text-gray-500">Check back later for new opportunities</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {claimedJobs.length > 0 ? (
              claimedJobs.map((job) => <JobCard key={job.id} job={job} />)
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No claimed jobs yet</h3>
                <p className="text-gray-500">Start by claiming your first job from the available jobs tab</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
