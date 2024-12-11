'use client';

import { Ellipsis } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link'
import { useState, useEffect } from 'react';
import { useToken } from "@/app/lib/token";
import { Book } from 'lucide-react';
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

interface ProjectsTableProps {
    lastRender: any;
}

export function ProjectsList({ lastRender }: ProjectsTableProps) {
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
    const [localLastRender, setLocalLastRender] = useState(Date.now());
    const [currentPage, setCurrentPage] = useState(0);
    const limit = 10;
    const [fetchPending, setFetchPending] = useState(false);
    const getToken = useToken();

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
            setFetchPending(false);
        });
    }, [lastRender, localLastRender]);

    async function handleDeleteProject(projectId: string) {
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}`, {
            method: "delete",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            } as HeadersInit
        });
        if (data.status == 200) {
            toast.success(`Project deleted`);
            setLocalLastRender(Date.now());
        }
    }

    async function handlePageChange(page: number) {
        setCurrentPage(page);
        setLocalLastRender(Date.now());
    }

    return (
        <div className='space-y-2'>
            <div className='flex'>
                <Pagination className='justify-end'>
                    <PaginationContent className='border rounded-md'>
                        <PaginationItem>
                            <PaginationPrevious className={currentPage <= 0 ? "pointer-events-none opacity-50" : "cursor-pointer"} onClick={() => handlePageChange(currentPage - 1)} />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink className="cursor-pointer">{currentPage + 1}</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext className="cursor-pointer" onClick={() => handlePageChange(currentPage + 1)} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
            <div className='grid lg:grid-cols-3 xl:grid-cols-5 grid-cols-1 gap-2'>
                {projects.length > 0 && projects.map((project, index) => (
                    <div key={project.id} className='rounded-sm border shadow-sm grid grid-cols-1 h-[60px] p-4'>
                        <div className='grid grid-cols-[20%,60%,20%] items-center'>
                            <Book />
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