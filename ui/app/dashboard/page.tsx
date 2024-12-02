'use client';

import { ProjectsTable } from "@/components/app/projects-table";
import { ProjectsList } from "@/components/app/projects-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react";
import { useCookies } from 'react-cookie';

export default function Dashboard() {
    const [projectName, setProjectName] = useState('');
    const [lastRender, setLastRender] = useState(Date.now());
    const [cookies, setCookie] = useCookies(['token']);

    function handleProjectNameChange(e: any) {
        setProjectName(e.target.value);
    }

    async function handleCreateProject() {
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
        if (data.status == 200){
            setProjectName('');
            setLastRender(Date.now());
        }
    }

    return (
        <div className="grid grid-cols-1 p-4 gap-2">
            <div className="flex flex-row-reverse">
                <Dialog>
                    <DialogTrigger asChild><Button><Plus />Project</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Scraping Project</DialogTitle>
                            <DialogDescription>
                                Create a new scraping project. Enter the project's name
                            </DialogDescription>
                        </DialogHeader>
                        <div>
                            <div className="w-64">
                                <Input type="text" id="name" value={projectName} onChange={handleProjectNameChange} placeholder="Project Name" />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button onClick={handleCreateProject}>Save changes</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="">
                <ProjectsList lastRender={lastRender}/>
            </div>
        </div>
    );
}