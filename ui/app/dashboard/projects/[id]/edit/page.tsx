'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useEffect, useState, use, useReducer } from "react";
import { useCookies } from 'react-cookie';
import { TabSettings } from "./tab-settings";
import { TabPageTemplates } from "./tab-page-templates";
import { Project } from "@/app/lib/types";

export default function ProjectEdit({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter();
    const [cookies, setCookie] = useCookies(['token']);
    const projectId = use(params).id;
    const [project, setProject] = useState<Project | null>(null);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${projectId}`, {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cookies.token}`
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setProject(data);
        });
    }, [ignored]);

    return (
        <div>
            <div className="p-2">
                {project && <Card>
                    <CardHeader>
                        <CardTitle>{project.name}</CardTitle>
                    </CardHeader>
                </Card>}
            </div>
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
                        <TabsContent value="seed_pages">Change your password here.</TabsContent>
                        <TabsContent value="scrape_test">Change your password here.</TabsContent>
                        <TabsContent value="scrape_runs">Change your password here.</TabsContent>
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