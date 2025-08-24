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
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Issue Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-4">
                We've received your issue and will analyze it to find the best
                contractor for the job. You'll be notified when a contractor is
                assigned.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to home in 3 seconds...
              </p>
            </div>
          </div>
        </div>
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

      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Describe Your Issue
            </h1>
            <p className="text-gray-600 mb-8">
              Tell us about the problem you need help with. Be as detailed as
              possible - this helps us find the right contractor and provide
              accurate estimates.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Issue Title (optional)
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brief title for your issue (e.g., 'Leaky faucet in kitchen')"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Issue Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={8}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  The more details you provide, the better we can match you with
                  the right contractor and estimate costs.
                </p>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Priority Level
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Location (if different from your address)
                </label>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <input
                      name="jobStreet"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Street Address (optional)"
                      value={formData.jobStreet}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      name="jobCity"
                      type="text"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="City (optional)"
                      value={formData.jobCity}
                      onChange={handleChange}
                    />
                    <input
                      name="jobState"
                      type="text"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="State (optional)"
                      value={formData.jobState}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="w-1/2">
                    <input
                      name="jobZipCode"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos & Videos (optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
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
                      PNG, JPG, GIF, WebP up to 10MB each | MP4, WebM, MOV, AVI
                      up to 10MB each
                    </p>
                  </div>
                </div>

                {/* Uploading Files */}
                {uploadingFiles.size > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600 mb-2">
                      Uploading files...
                    </div>
                    {Array.from(uploadingFiles).map((fileKey) => (
                      <div
                        key={fileKey}
                        className="flex items-center space-x-2 mb-1"
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-sm text-gray-600">
                          {fileKey.split("-")[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded Files */}
                {attachments.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-700 mb-2">
                      Uploaded files:
                    </div>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {getFileTypeIcon(attachment)}
                            </span>
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

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  What happens next?
                </h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>
                    • We'll analyze your issue and research potential solutions
                  </li>
                  <li>
                    • Find contractors in your area who specialize in this type
                    of work
                  </li>
                  <li>• Provide cost estimates for materials and labor</li>
                  <li>• Connect you with available contractors</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !formData.description.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {loading ? "Submitting..." : "Submit Issue"}
                </button>
                <Link
                  href="/home"
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium text-center"
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
