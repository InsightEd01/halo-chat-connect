import React from "react";
import NavBar from "@/components/NavBar";

const StatusComingSoon: React.FC = () => {
  return (
    <div className="container max-w-md mx-auto p-4 pb-20">
      {/* Keep existing bottom NavBar so navigation stays consistent */}
      <NavBar />

      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h1 className="text-2xl font-semibold mb-2">Status</h1>
        <p className="text-gray-500">Feature coming soon 🚧</p>
      </div>
    </div>
  );
};

export default StatusComingSoon;
