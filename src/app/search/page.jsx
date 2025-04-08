"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import FilterPanel from "@/components/FilterPanel";
import axios from "axios";
import Link from "next/link";

// 1) Wrap your actual search results in a component that doesn't run until Suspense is ready
function SearchResults() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const keyword = searchParams.get("keyword") || "";
        const postedDate = searchParams.get("postedDate") || "";
        const location = searchParams.get("location") || "";
        const desiredStartDate = searchParams.get("desiredStartDate") || "";
        const desiredEndDate = searchParams.get("desiredEndDate") || "";

        const queryObj = new URLSearchParams();
        if (keyword) queryObj.set("keyword", keyword);
        if (postedDate) queryObj.set("postedDate", postedDate);
        if (location) queryObj.set("location", location);
        if (desiredStartDate) queryObj.set("desiredStartDate", desiredStartDate);
        if (desiredEndDate) queryObj.set("desiredEndDate", desiredEndDate);

        const response = await axios.get(`${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/search/tools?${queryObj.toString()}`);

        if (response.data.success) {
          setResults(response.data.listings || []);
        } else {
          throw new Error(response.data.message || "Failed to fetch results");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 text-center">Error: {error}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        No results found. Try adjusting your filters or search terms.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {results.map((tool) => (
        <Link href={`/listing/${tool.id}`} key={tool.id}>
          <div className="border rounded-lg p-2 shadow hover:shadow-lg transition-shadow flex flex-col h-full">
            <div className="h-48 mb-2 relative">
              <img
                src={tool.listingImages?.[0]?.url || "/placeholder-tool.png"}
                alt={tool.title || "Tool image"}
                className="object-contain w-full h-full rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder-tool.png";
                }}
              />
            </div>
            <h3 className="text-lg font-semibold">{tool.title}</h3>
            <p className="text-gray-600 line-clamp-2 flex-grow">
              {tool.description}
            </p>
            <p className="text-green-600 font-bold mt-2">${tool.rate}/day</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// 2) This component also uses useSearchParams (for the initial keyword) 
//    but is itself only rendered within a Suspense boundary (see below).
function SearchPageClient() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";

  return (
    <div className="px-8 py-8 flex flex-col space-y-6">
      <h1 className="text-2xl font-bold">Search Tools</h1>
      <div className="flex gap-8">
        {/* Left column: Filter Panel */}
        <div className="w-64 hidden lg:block">
          <div className="bg-white rounded-lg shadow p-4">
            <FilterPanel />
          </div>
        </div>

        {/* Right column: search bar at the top, listings below */}
        <div className="flex-1 flex flex-col space-y-6">
          <div className="flex justify-center">
            <div className="w-[40rem]">
              <SearchBar initialKeyword={keyword} />
            </div>
          </div>

          {/* Our second Suspense specifically for the listings */}
          <Suspense fallback={<div>Loading search results...</div>}>
            <SearchResults />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// 3) The default export is a client page that forcibly avoids SSR/static. 
//    It wraps the entire "SearchPageClient" in a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<div>Loading search page...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
