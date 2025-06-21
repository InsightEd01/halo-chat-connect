import React, { useState } from "react";
import StatusFeed from "../components/StatusFeed";
import NavBar from "@/components/NavBar";

const StatusPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<"friends" | "public">("friends");
  // TODO: Get user from context or props
  const user = { id: "demo-user" };
  return (
    <div className="container max-w-md mx-auto p-0 pb-20 bg-white">
      <StatusFeed user={user} viewMode={viewMode} setViewMode={setViewMode} />
      <NavBar />
    </div>
  );
};

export default StatusPage;
