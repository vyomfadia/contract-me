"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, apiRequest } from "@/lib/auth-client";

export default function SubmitIssuePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "NORMAL",
    jobStreet: "",
    jobCity: "",
    jobState: "",
    jobZipCode: "",
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role === "CONTRACTOR") {
      router.push("/home");
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/issues", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          attachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit issue");
      }

      setSuccess(true);
      setFormData({ title: "", description: "", priority: "NORMAL", jobStreet: "", jobCity: "", jobState: "", jobZipCode: "" });
      setAttachments([]);
      setTimeout(() => {
        router.push("/home");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit issue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const fileKey = `${file.name}-${Date.now()}`;
      setUploadingFiles((prev) => new Set(prev).add(fileKey));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const token = getCurrentUser()
          ? localStorage.getItem("auth-token")
          : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          headers,
        });

        const data = await response.json();

        if (response.ok) {
          setAttachments((prev) => [...prev, data.filePath]);
        } else {
          setError(data.error || "Failed to upload file");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload file");
      } finally {
        setUploadingFiles((prev) => {
          const updated = new Set(prev);
          updated.delete(fileKey);
          return updated;
        });
      }
    }

    // Reset file input
    e.target.value = "";
  };

  const removeAttachment = (attachmentPath: string) => {
    setAttachments((prev) => prev.filter((path) => path !== attachmentPath));
  };

  const getFileTypeIcon = (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return "📷";
    } else if (["mp4", "webm", "mov", "avi"].includes(extension || "")) {
      return "🎥";
    }
    return "📁";
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full opacity-10 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full opacity-10 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="form-modern text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Issue Submitted Successfully!</h2>
              <p className="text-gray-600 mb-6">
                We've received your issue and will analyze it to find the best contractor for the job. You'll be notified when a contractor is assigned.
              </p>
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">Redirecting to home in 3 seconds...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full opacity-10 animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-400 to-yellow-600 rounded-full opacity-10 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

      <div className="relative z-10 min-h-screen">
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

        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-amber-800 mb-2">Describe Your Issue</h1>
            <p className="text-gray-600 text-lg">
              Tell us about the problem you need help with. Be as detailed as possible - this helps us find the right contractor and provide accurate estimates.
            </p>
          </div>

          {/* Form */}
          <div className="form-modern">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                      Issue Title (optional)
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      className="input-modern w-full"
                      placeholder="Brief title for your issue (e.g., 'Leaky faucet in kitchen')"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                      Issue Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={8}
                      required
                      className="input-modern w-full resize-none"
                      placeholder="Describe your issue in detail. Include:
• What's the problem?
• Where is it located?
• When did it start?
• What have you tried so far?
• Any relevant details about your home/property"
                      value={formData.description}
                      onChange={handleChange}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      The more details you provide, the better we can match you with the right contractor and estimate costs.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      className="input-modern w-full"
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      <option value="LOW">Low - Can wait a few weeks</option>
                      <option value="NORMAL">Normal - Within next week</option>
                      <option value="URGENT">Urgent - Within 1-2 days</option>
                      <option value="EMERGENCY">Emergency - Immediate attention needed</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                      This helps us prioritize your request and find contractors with appropriate availability.
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Job Location (if different from your address)
                    </label>
                    <div className="space-y-4">
                      <div>
                        <input
                          name="jobStreet"
                          type="text"
                          className="input-modern w-full"
                          placeholder="Street Address (optional)"
                          value={formData.jobStreet}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          name="jobCity"
                          type="text"
                          className="input-modern w-full"
                          placeholder="City (optional)"
                          value={formData.jobCity}
                          onChange={handleChange}
                        />
                        <input
                          name="jobState"
                          type="text"
                          className="input-modern w-full"
                          placeholder="State (optional)"
                          value={formData.jobState}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="w-1/2">
                        <input
                          name="jobZipCode"
                          type="text"
                          className="input-modern w-full"
                          placeholder="ZIP Code (optional)"
                          value={formData.jobZipCode}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Leave blank to use your registered address. Only fill if the job is at a different location.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Photos & Videos (optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="mt-2">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-indigo-600 font-medium hover:text-indigo-500">
                              Click to upload files
                            </span>
                            <span className="text-gray-500"> or drag and drop</span>
                          </label>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileUpload}
                            className="sr-only"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF, WebP up to 10MB each | MP4, WebM, MOV, AVI up to 10MB each
                        </p>
                      </div>
                    </div>

                    {/* Uploading Files */}
                    {uploadingFiles.size > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-600 mb-2">Uploading files...</div>
                        {Array.from(uploadingFiles).map((fileKey) => (
                          <div key={fileKey} className="flex items-center space-x-2 mb-1">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            <span className="text-sm text-gray-600">{fileKey.split("-")[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Uploaded Files */}
                    {attachments.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-700 mb-2">Uploaded files:</div>
                        <div className="space-y-2">
                          {attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getFileTypeIcon(attachment)}</span>
                                <span className="text-sm text-gray-600 truncate">
                                  {attachment.split("/").pop()}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(attachment)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* What happens next section */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  What happens next?
                </h3>
                <ul className="text-amber-800 text-sm space-y-1">
                  <li>• We'll analyze your issue and research potential solutions</li>
                  <li>• Find contractors in your area who specialize in this type of work</li>
                  <li>• Provide cost estimates for materials and labor</li>
                  <li>• Connect you with available contractors</li>
                </ul>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !formData.description.trim()}
                  className="btn-primary flex-1 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit Issue"
                  )}
                </button>
                <Link
                  href="/home"
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-center transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
