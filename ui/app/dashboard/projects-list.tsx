'use client';

import { Ellipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link'
import { useState, useEffect, useReducer } from 'react';
import { useToken } from "@/app/lib/token";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from 'sonner';
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Loader2, Book } from "lucide-react";
import validator from "validator";
import Image from 'next/image'
import { Project } from '../lib/types';

export function ProjectsList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [nextPage, setNextPage] = useState(false);
    const limit = 10;
    const [fetchPending, setFetchPending] = useState(false);
    const getToken = useToken();
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const [projectName, setProjectName] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [pendingCreateProject, setPendingCreateProject] = useState(false);
    const router = useRouter();
    const [error, setError] = useState<{ [key: string]: string | null }>({
        projectName: null,
        websiteUrl: null,
        server: null
    });

    function registerError(field: string, message: string | null) {
        setError({
            ...error,
            [field]: message
        });
    }

    function hasErrors() {
        let hasError = false;
        for (const k in error) {
            if (error[k] != null) {
                hasError = true;
            }
        }
        return hasError;
    }

    useEffect(() => {
        setProjects([]);
        setFetchPending(true);
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects?` + new URLSearchParams({ page: String(currentPage), limit: String(limit), sort_field: 'name', sort_direction: 'asc' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            } as HeadersInit
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setProjects(data.projects);
            setNextPage(data.paging.next_page);
            setFetchPending(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, ignored]);

    async function handleDeleteProject(projectId: string) {
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}`, {
            method: "delete",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            } as HeadersInit
        });
        if (data.status == 200) {
            toast.success(`Project deleted`);
            forceUpdate();
        }
    }

    async function handlePageChange(page: number) {
        setCurrentPage(page);
    }

    function handleProjectNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const pname = e.target.value;
        if (pname.length >= 3 && pname.length <= 100) {
            registerError("projectName", null);
        } else {
            registerError("projectName", "Project name should be between 3 and 100 characters");
        }
        setProjectName(pname);
    }

    function handleWebsiteUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
        const turl = e.target.value;
        if (turl.length > 0) {
            if (validator.isURL(turl)) {
                registerError("websiteUrl", null);
            } else {
                registerError("websiteUrl", "Invalid Url");
            }

        } else {
            registerError("websiteUrl", "URL is mandatory");
        }
        setWebsiteUrl(turl);
    }

    async function handleCreateProject() {
        setPendingCreateProject(true);
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            } as HeadersInit,
            body: JSON.stringify({
                "name": projectName,
                "website_url": websiteUrl
            })
        });
        if (data.status == 200) {
            const response = await data.json();
            toast.success(`Project '${projectName}' created`);
            setProjectName('');
            setWebsiteUrl('');
            router.push(`/dashboard/projects/${response.id}/edit`);
        }
    }

    return (
        <div className='space-y-2'>
            <div className='flex space-x-2 items-center'>
                <Pagination className='justify-end'>
                    <PaginationContent className='border rounded-md'>
                        <PaginationItem>
                            <PaginationPrevious className={currentPage <= 0 ? "pointer-events-none opacity-50" : "cursor-pointer"} onClick={() => handlePageChange(currentPage - 1)} />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink className="cursor-pointer">{currentPage + 1}</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext className={!nextPage ? "pointer-events-none opacity-50" : "cursor-pointer"} onClick={() => handlePageChange(currentPage + 1)} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
                <Sheet>
                    <SheetTrigger asChild><Button><Plus />Project</Button></SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>New Scraping Project</SheetTitle>
                            <SheetDescription>
                                Enter the project&apos;s name
                            </SheetDescription>
                        </SheetHeader>
                        <div className="pt-4 space-y-2">
                            <div>
                                <Input type="text" id="name" value={projectName} onChange={handleProjectNameChange} placeholder="Project Name" className={error.projectName ? 'border-red-500' : ''} />
                                <div className="text-red-500 text-xs">{error.projectName}</div>
                            </div>
                            <div>
                                <Input type="text" id="name" value={websiteUrl} onChange={handleWebsiteUrlChange} placeholder="Website Url" className={error.websiteUrl ? 'border-red-500' : ''} />
                                <div className="text-red-500 text-xs">{error.websiteUrl}</div>
                            </div>
                        </div>
                        <SheetFooter className="pt-4">
                            <Button onClick={handleCreateProject} disabled={pendingCreateProject || hasErrors() || projectName.length == 0 || websiteUrl.length == 0}>
                                {pendingCreateProject && <Loader2 className="animate-spin" />}
                                Save changes
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>
            <div className='grid lg:grid-cols-3 xl:grid-cols-5 grid-cols-1 gap-2'>
                {projects.length > 0 && projects.map((project,) => (
                    <div key={project.id} className='rounded-sm border shadow-sm grid grid-cols-1 h-18 p-4'>
                        <div className='grid grid-cols-[20%,60%,20%] items-center'>

                            {project.website_favicon_url ? <Image
                                src={project.website_favicon_url}
                                width={32}
                                height={32}
                                alt=""
                            /> : <Book />}
                            <Link className="hover:underline truncate" href={`/dashboard/projects/${project.id}/edit`}>{project.name}</Link>
                            <Sheet>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><Ellipsis /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <SheetTrigger asChild><DropdownMenuItem className='text-red-700'>Delete</DropdownMenuItem></SheetTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Delete Project</SheetTitle>
                                        <SheetDescription>
                                            Are you sure you want to delete this project?
                                        </SheetDescription>
                                    </SheetHeader>

                                    <SheetFooter className='pt-4'>
                                        <SheetClose asChild>
                                            <Button onClick={() => handleDeleteProject(project.id)} variant="destructive">Delete Project</Button>
                                        </SheetClose>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                ))}
                {fetchPending && Array(10).fill(0).map((_, i) => (
                    <div key={i} className='rounded-sm border shadow-sm grid grid-cols-1 h-[60px] p-4'>
                        <div className='grid grid-cols-[20%,80%] items-center'>
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-40" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}