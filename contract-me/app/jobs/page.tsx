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
  questionsForUser: string[];
  contractorChecklist: string[];
  claimedByContractorId?: string;
  claimedAt?: string;
  issue: {
    id: string;
    title?: string;
    description: string;
    attachments: string[];
    createdAt: string;
    user: {
      id: string;
      username: string;
      email: string;
      phoneNumber?: string;
    };
  };
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [claimedJobs, setClaimedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "claimed">(
    "available",
  );
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
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-orange-100 text-orange-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {job.issue.title || "Untitled Issue"}
          </h3>
          <p className="text-sm text-gray-600">
            Customer: {job.issue.user.username} |{" "}
            {new Date(job.issue.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(job.difficultyLevel)}`}
          >
            {job.difficultyLevel}
          </span>
          {job.estimatedTimeHours && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              ~{job.estimatedTimeHours}h
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Problem Identified</h4>
          <p className="text-gray-700 text-sm">{job.identifiedProblem}</p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Repair Solution</h4>
          <p className="text-gray-700 text-sm">{job.repairSolution}</p>
        </div>

        {job.requiredItems.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Required Items</h4>
            <div className="space-y-1">
              {job.requiredItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {item.quantity ? `${item.quantity} ` : ""}
                    {item.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.estimatedCost)}
                  </span>
                </div>
              ))}
              {job.totalEstimatedCost && (
                <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-2">
                  <span>Total Estimated Cost</span>
                  <span>{formatCurrency(job.totalEstimatedCost)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {job.questionsForUser.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Questions for Customer
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {job.questionsForUser.map((question, index) => (
                <li key={index}>• {question}</li>
              ))}
            </ul>
          </div>
        )}

        {job.contractorChecklist.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              On-Site Checklist
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {job.contractorChecklist.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {job.issue.attachments.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
            <p className="text-sm text-gray-600">
              {job.issue.attachments.length} files available
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-gray-900 mb-1">Customer Contact</h4>
          <p className="text-sm text-gray-700">
            {job.issue.user.email}
            {job.issue.user.phoneNumber && ` | ${job.issue.user.phoneNumber}`}
          </p>
        </div>

        {showClaimButton && (
          <button
            onClick={() => claimJob(job.id)}
            disabled={claimingJobs.has(job.id)}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded font-medium"
          >
            {claimingJobs.has(job.id) ? "Claiming..." : "Claim Job"}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/home"
                className="text-xl font-semibold text-gray-900"
              >
                ContractMe
              </Link>
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

      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Jobs</h1>
          <p className="text-gray-600">
            Browse and claim jobs that match your expertise
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("available")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "available"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Available Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("claimed")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "claimed"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Jobs ({claimedJobs.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "available" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard key={job.id} job={job} showClaimButton={true} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No available jobs at the moment</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {claimedJobs.length > 0 ? (
              claimedJobs.map((job) => <JobCard key={job.id} job={job} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  You haven't claimed any jobs yet
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
