"use client";

import { SandboxConnector } from "@/lib/connectors";
import { useState } from "react";

export default function SandboxPage() {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Sandbox Mode</h1>
      <p className="mb-4">Sandbox connector ready for local simulation.</p>
      <div className="bg-gray-100 p-4 rounded">
        <p>No external dependencies required – AI responses are mocked.</p>
        <p className="mt-2">Visit the main dashboard to connect real Fansly accounts.</p>
      </div>
    </div>
  );
}