"use client";

import { ProjectsList } from "@/app/dashboard/projects-list";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 grid-rows-[40px,1fr] gap-2 p-4">
      <ProjectsList />
    </div>
  );
}
