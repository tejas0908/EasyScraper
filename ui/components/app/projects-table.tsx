'use client';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link'
import { buttonVariants } from "@/components/ui/button"
import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectsTableProps {
    lastRender: any;
}

export function ProjectsTable({ lastRender }: ProjectsTableProps) {
    const [cookies, setCookie] = useCookies(['token']);
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);

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
    }, [lastRender]);

    return (
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead className="text-right"></TableHead>
                        <TableHead className="text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                { projects.length > 0 &&
                <TableBody>
                    {projects.map((project, index) => (
                        <TableRow key={project.id}>
                            <TableCell>{project.name}</TableCell>
                            <TableCell className="text-right">
                                <Link href={`/dashboard/projects/${project.id}/edit`} className={buttonVariants({ variant: "outline", size: "icon" })}><Pencil /></Link>
                                <Link href={`/dashboard/projects/${project.id}/edit`} className={buttonVariants({ variant: "outline", size: "icon" })}><Trash2 /></Link>
                            </TableCell>
                            
                        </TableRow>
                    ))}
                </TableBody>}
                { projects.length == 0 &&
                <TableBody>
                    <TableRow key="skeleton-1">
                        <TableCell><Skeleton className="w-full h-4 rounded-full" /></TableCell>
                    </TableRow>
                    <TableRow key="skeleton-2">
                        <TableCell><Skeleton className="w-full h-4 rounded-full" /></TableCell>
                    </TableRow>
                    <TableRow key="skeleton-3">
                        <TableCell><Skeleton className="w-full h-4 rounded-full" /></TableCell>
                    </TableRow>
                    <TableRow key="skeleton-4">
                        <TableCell><Skeleton className="w-full h-4 rounded-full" /></TableCell>
                    </TableRow>
                    <TableRow key="skeleton-5">
                        <TableCell><Skeleton className="w-full h-4 rounded-full" /></TableCell>
                    </TableRow>
                </TableBody>
                }
            </Table>
        </div>
    );
}