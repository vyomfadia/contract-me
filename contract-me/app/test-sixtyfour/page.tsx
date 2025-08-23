"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/auth-client";

interface ContractorInfo {
  name: string;
  title?: string;
  company?: string;
  location?: string;
  linkedin?: string;
}

interface EnrichedContractorData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  industry?: string;
  specializations?: string[];
  service_areas?: string[];
  verified_credentials?: boolean;
  confidence_score?: number;
}

export default function TestSixtyFourPage() {
  const [formData, setFormData] = useState<ContractorInfo>({
    name: "",
    title: "",
    company: "",
    location: "",
    linkedin: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EnrichedContractorData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await apiRequest("/api/contractors/enrich", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enrich contractor");
      }

      setResult(data.contractor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enrich contractor");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test SixtyFour Contractor Enrichment
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Enter Contractor Information
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., John Smith"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., General Contractor"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                name="company"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Smith Construction"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., San Francisco, CA"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., https://linkedin.com/in/johnsmith"
                value={formData.linkedin}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {loading ? "Enriching..." : "Enrich Contractor Profile"}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Enriched Contractor Data
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Basic Information</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{result.name}</dd>
                  </div>
                  {result.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{result.email}</dd>
                    </div>
                  )}
                  {result.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{result.phone}</dd>
                    </div>
                  )}
                  {result.title && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Title</dt>
                      <dd className="text-sm text-gray-900">{result.title}</dd>
                    </div>
                  )}
                  {result.company && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Company</dt>
                      <dd className="text-sm text-gray-900">{result.company}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Additional Details</h3>
                <dl className="space-y-2">
                  {result.location && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="text-sm text-gray-900">{result.location}</dd>
                    </div>
                  )}
                  {result.industry && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Industry</dt>
                      <dd className="text-sm text-gray-900">{result.industry}</dd>
                    </div>
                  )}
                  {result.website && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Website</dt>
                      <dd className="text-sm text-gray-900">
                        <a href={result.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                          {result.website}
                        </a>
                      </dd>
                    </div>
                  )}
                  {result.linkedin && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                      <dd className="text-sm text-gray-900">
                        <a href={result.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                          View Profile
                        </a>
                      </dd>
                    </div>
                  )}
                  {result.confidence_score && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Confidence Score</dt>
                      <dd className="text-sm text-gray-900">{result.confidence_score}%</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {result.specializations && result.specializations.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {result.specializations.map((spec, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.service_areas && result.service_areas.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Service Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {result.service_areas.map((area, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">Credentials Verified:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  result.verified_credentials 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {result.verified_credentials ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
