'use client';

import { Pencil, Trash2, Ellipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link'
import { buttonVariants } from "@/components/ui/button"
import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import { Book } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface ProjectsTableProps {
    lastRender: any;
}

export function ProjectsList({ lastRender }: ProjectsTableProps) {
    const [cookies, setCookie] = useCookies(['token']);
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
    const [localLastRender, setLocalLastRender] = useState(Date.now());

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects?` + new URLSearchParams({ skip: '0', limit: '10' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cookies.token}`
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setProjects(data.projects);
        });
    }, [lastRender, localLastRender]);

    async function handleDeleteProject(projectId: string) {
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}`, {
            method: "delete",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cookies.token}`
            }
        });
        if (data.status == 200) {
            setLocalLastRender(Date.now());
        }
    }

    return (
        <div className='grid lg:grid-cols-3 xl:grid-cols-5 grid-cols-1 gap-2'>
            {projects.map((project, index) => (
                <div key={project.id} className='rounded-sm border shadow-sm grid grid-cols-1 h-[60px] p-4'>
                    <div className='grid grid-cols-[20%,60%,20%]'>
                        <Book />
                        <Link className="hover:underline truncate" href={`/dashboard/projects/${project.id}/edit`}>{project.name}</Link>
                        <Dialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><Ellipsis /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DialogTrigger asChild><DropdownMenuItem className='text-red-700'>Delete</DropdownMenuItem></DialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Project</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this project?
                                    </DialogDescription>
                                </DialogHeader>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button onClick={() => handleDeleteProject(project.id)} variant="destructive">Delete Project</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            ))}
        </div>
    );
}