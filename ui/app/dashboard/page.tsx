'use client';

import { ProjectsList } from "@/app/dashboard/projects-list";

export default function Dashboard() {

    return (
        <div className="grid grid-cols-1 p-4 gap-2 grid-rows-[40px,1fr]">
            <ProjectsList />
        </div>
    );
}