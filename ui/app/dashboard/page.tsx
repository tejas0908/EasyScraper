'use client';

import { ProjectsList } from "@/components/app/projects-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { useCookies } from 'react-cookie';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from "@/components/ui/sheet"
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function Dashboard() {
    const [projectName, setProjectName] = useState('');
    const [lastRender, setLastRender] = useState(Date.now());
    const [cookies, setCookie] = useCookies(['token']);
    const router = useRouter();
    const [pendingCreateProject, setPendingCreateProject] = useState(false);

    function handleProjectNameChange(e: any) {
        setProjectName(e.target.value);
    }

    async function handleCreateProject() {
        setPendingCreateProject(true);
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cookies.token}`
            },
            body: JSON.stringify({
                "name": projectName
            })
        });
        if (data.status == 200) {
            let response = await data.json();
            toast.success(`Project '${projectName}' created`);
            setProjectName('');
            router.push(`/dashboard/projects/${response.id}/edit`);
        }
    }

    return (
        <div className="grid grid-cols-1 p-4 gap-2 grid-rows-[40px,1fr]">
            <div className="flex flex-row-reverse">
                <Sheet>
                    <SheetTrigger asChild><Button><Plus />Project</Button></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>New Scraping Project</SheetTitle>
                            <SheetDescription>
                                Enter the project's name
                            </SheetDescription>
                        </SheetHeader>
                        <div className="pt-4">
                            <div>
                                <Input type="text" id="name" value={projectName} onChange={handleProjectNameChange} placeholder="Project Name" />
                            </div>
                        </div>
                        <SheetFooter className="pt-4">
                            <Button onClick={handleCreateProject} disabled={pendingCreateProject}>
                                {pendingCreateProject && <Loader2 className="animate-spin" />}
                                Save changes
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
            <div className="">
                <ProjectsList lastRender={lastRender} />
            </div>
        </div>
    );
}