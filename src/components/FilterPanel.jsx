// client/src/components/FilterPanel.jsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for filters
  const [postedDate, setPostedDate] = useState("");
  const [location, setLocation] = useState("");
  const [usageStart, setUsageStart] = useState("");
  const [usageEnd, setUsageEnd] = useState("");

  // On apply, we’ll update the URL query params so that our search page re-fetches
  const handleFilter = () => {
    const keyword = searchParams.get("keyword") || "";

    // Build query object
    const query = new URLSearchParams();

    // Keep the existing keyword param
    if (keyword) query.set("keyword", keyword);

    // Add posted date
    if (postedDate) query.set("postedDate", postedDate);

    // Add location
    if (location) query.set("location", location);

    // Add usage date range
    if (usageStart) query.set("desiredStartDate", usageStart);
    if (usageEnd) query.set("desiredEndDate", usageEnd);

    // Navigate to /search with these params
    router.push(`/search?${query.toString()}`);
  };

  return (
    <div className="p-4 w-60">
      <h3 className="font-bold mb-2">Filters</h3>
      
      <label className="block mb-2">
        Posted Date:
        <input
          type="date"
          value={postedDate}
          onChange={(e) => setPostedDate(e.target.value)}
          className="border rounded p-1 w-full"
        />
      </label>

      <label className="block mb-2">
        Preferred Location:
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Saskatoon"
          className="border rounded p-1 w-full"
        />
      </label>

      <label className="block mb-2">
        Usage Start Date:
        <input
          type="date"
          value={usageStart}
          onChange={(e) => setUsageStart(e.target.value)}
          className="border rounded p-1 w-full"
        />
      </label>

      <label className="block mb-2">
        Usage End Date:
        <input
          type="date"
          value={usageEnd}
          onChange={(e) => setUsageEnd(e.target.value)}
          className="border rounded p-1 w-full"
        />
      </label>

      <button
        onClick={handleFilter}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Apply Filters
      </button>
    </div>
  );
}