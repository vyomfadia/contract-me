"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-client";

interface Contractor {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
}

export default function FindContractorsPage() {
  const router = useRouter();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState({
    search: "",
    city: "",
    state: ""
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    
    // Load all contractors initially
    searchContractors();
  }, [router]);

  const searchContractors = async () => {
    try {
      setLoading(true);
      
      // Simulate loading delay for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dummy data for demo purposes
      const dummyContractors: Contractor[] = [
        {
          id: "1",
          username: "Mike's Plumbing",
          email: "mike@plumbingpro.com",
          phoneNumber: "(555) 123-4567",
          street: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zipCode: "94102",
          createdAt: "2023-01-15T10:30:00Z"
        },
        {
          id: "2", 
          username: "Sarah Electric Co",
          email: "sarah@electricco.com",
          phoneNumber: "(555) 987-6543",
          street: "456 Oak Ave",
          city: "Oakland",
          state: "CA",
          zipCode: "94601",
          createdAt: "2023-03-22T14:15:00Z"
        },
        {
          id: "3",
          username: "Tony's Handyman Services",
          email: "tony@handymanservices.com", 
          phoneNumber: "(555) 555-0123",
          street: "789 Pine St",
          city: "Berkeley",
          state: "CA", 
          zipCode: "94704",
          createdAt: "2023-02-10T09:45:00Z"
        },
        {
          id: "4",
          username: "Green Roof Solutions",
          email: "info@greenroof.com",
          phoneNumber: "(555) 444-7890",
          street: "321 Elm Dr",
          city: "San Jose",
          state: "CA",
          zipCode: "95110", 
          createdAt: "2022-11-08T16:20:00Z"
        },
        {
          id: "5",
          username: "Elite Contractors Inc",
          email: "contact@elitecontractors.com",
          phoneNumber: "(555) 333-2211",
          street: "654 Maple Blvd",
          city: "Palo Alto", 
          state: "CA",
          zipCode: "94301",
          createdAt: "2023-05-01T11:00:00Z"
        },
        {
          id: "6",
          username: "Bob's HVAC Repair",
          email: "bob@hvacrepair.com",
          phoneNumber: "(555) 222-1100",
          street: "987 Cedar Ln",
          city: "Fremont",
          state: "CA",
          zipCode: "94536",
          createdAt: "2023-01-28T13:30:00Z"
        }
      ];

      // Simple filtering based on search criteria
      let filteredContractors = dummyContractors;
      
      if (searchData.search) {
        const searchTerm = searchData.search.toLowerCase();
        filteredContractors = filteredContractors.filter(contractor =>
          contractor.username.toLowerCase().includes(searchTerm) ||
          contractor.email.toLowerCase().includes(searchTerm)
        );
      }
      
      if (searchData.city) {
        const cityTerm = searchData.city.toLowerCase();
        filteredContractors = filteredContractors.filter(contractor =>
          contractor.city?.toLowerCase().includes(cityTerm)
        );
      }
      
      if (searchData.state) {
        const stateTerm = searchData.state.toLowerCase();
        filteredContractors = filteredContractors.filter(contractor =>
          contractor.state?.toLowerCase().includes(stateTerm)
        );
      }

      setContractors(filteredContractors);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchContractors();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Find Contractors</h1>
          <p className="text-gray-600">
            Search for contractors in your area
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search by name or email
                </label>
                <input
                  id="search"
                  name="search"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Contractor name or email"
                  value={searchData.search}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="City"
                  value={searchData.city}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="State"
                  value={searchData.state}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
              >
                {loading ? "Searching..." : "Search Contractors"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchData({ search: "", city: "", state: "" });
                  searchContractors();
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Contractors Found ({contractors.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-600">Searching...</div>
            </div>
          ) : contractors.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">No contractors found matching your criteria</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contractors.map((contractor) => (
                <div key={contractor.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {contractor.username}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          📧 {contractor.email}
                        </p>
                        {contractor.phoneNumber && (
                          <p className="text-sm text-gray-600">
                            📞 {contractor.phoneNumber}
                          </p>
                        )}
                        {(contractor.street || contractor.city || contractor.state) && (
                          <p className="text-sm text-gray-600">
                            📍 {[contractor.street, contractor.city, contractor.state, contractor.zipCode]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          Member since {new Date(contractor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => {
                          if (contractor.email) {
                            window.location.href = `mailto:${contractor.email}`;
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}