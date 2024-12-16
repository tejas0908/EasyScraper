'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState, use, useReducer } from "react";
import { TabSettings } from "./tab-settings";
import { TabPageTemplates } from "./tab-page-templates";
import { TabSeedPages } from "./tab-seed-pages";
import { TabScrapeTest } from "./tab-scrape-test";
import { TabScrapeRuns } from "./tab-scrape-runs";
import { Project, PageTemplate } from "@/app/lib/types";
import { useToken } from "@/app/lib/token";
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { Book } from "lucide-react";
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
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

export default function ProjectEdit({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const getToken = useToken();
    const projectId = use(params).id;
    const [project, setProject] = useState<Project | null>(null);
    const [pageTemplates, setPageTemplates] = useState<PageTemplate[]>([]);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const router = useRouter();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}`, {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setProject(data);
        });
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}/page_templates?` + new URLSearchParams({ page: String(0), limit: String(100), sort_field: 'name', sort_direction: 'asc' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setPageTemplates(data.page_templates);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, ignored]);

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
            router.push(`/dashboard`);
        }
    }

    async function handleExportProject() {
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}/export`, {
            method: "post",
            headers: {
                "Authorization": getToken()
            }
        });
        if (data.status == 200) {
            const blob = await data.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            if (project != null) {
                a.download = `${project.name}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        }
    }

    return (
        <div>
            {project && <div className="p-2 m-2 border rounded-md flex justify-between">
                <div className="flex items-center space-x-2">
                    {project.website_favicon_url ? <Image
                        src={project.website_favicon_url}
                        width={32}
                        height={32}
                        alt=""
                    /> : <Book />}
                    <div>{project.name}</div>
                </div>
                <div className="flex space-x-2">
                    <div className="">
                        <Button onClick={handleExportProject} variant="outline">Export</Button>
                    </div>
                    <div className="">
                        <Sheet>
                            <SheetTrigger asChild><Button variant="outline" className="border-red-500">Delete</Button></SheetTrigger>
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
            </div>}
            <div className="p-2">
                {project &&
                    <Tabs defaultValue="page_templates">
                        <TabsList>
                            <TabsTrigger value="page_templates">Page Templates</TabsTrigger>
                            <TabsTrigger value="seed_pages">Seed Pages</TabsTrigger>
                            <TabsTrigger value="scrape_test">Scrape Test</TabsTrigger>
                            <TabsTrigger value="scrape_runs">Scrape Runs</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        <TabsContent value="page_templates">
                            <div>
                                <TabPageTemplates project={project} parentForceUpdate={forceUpdate} />
                            </div>
                        </TabsContent>
                        <TabsContent value="seed_pages">
                            <div>
                                <TabSeedPages project={project} pageTemplates={pageTemplates} />
                            </div>
                        </TabsContent>
                        <TabsContent value="scrape_test">
                            <div>
                                <TabScrapeTest project={project} pageTemplates={pageTemplates} parentForceUpdate={forceUpdate} />
                            </div>
                        </TabsContent>
                        <TabsContent value="scrape_runs">
                            <div>
                                <TabScrapeRuns project={project} parentForceUpdate={forceUpdate} />
                            </div>
                        </TabsContent>
                        <TabsContent value="settings">
                            <div className="">
                                <TabSettings project={project} parentForceUpdate={forceUpdate} />
                            </div>
                        </TabsContent>
                    </Tabs>}
            </div>
        </div>
    );
}