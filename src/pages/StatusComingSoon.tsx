import React from "react";
import NavBar from "@/components/NavBar";

const StatusComingSoon: React.FC = () => {
  return (
    <div className="container max-w-md mx-auto p-4 pb-20">
      {/* Keep existing bottom NavBar so navigation stays consistent */}
      <NavBar />
    </div>
  );
};

export default StatusComingSoon;
