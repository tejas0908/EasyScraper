import { Project, SeedPage, PageTemplate } from "@/app/lib/types";
import { useState, useEffect, useReducer } from "react";
import { useToken } from "@/app/lib/token";
import { EditSeedPageSheet } from "./sheet-edit-seed-page";
import { Badge } from "@/components/ui/badge"

export function TabSeedPages({ project, pageTemplates, parentForceUpdate }: { project: Project, pageTemplates: PageTemplate[], parentForceUpdate: any }) {
    const [seedPages, setSeedPages] = useState<SeedPage[]>([]);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const getToken = useToken();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/seed_pages?` + new URLSearchParams({ page: String(0), limit: String(100), sort_field: 'id', sort_direction: 'asc' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            let tSeedPages: SeedPage[] = [];
            data.seed_pages.forEach((sp: SeedPage) => {
                pageTemplates.forEach((pt) => {
                    if (sp.page_template_id == pt.id) {
                        sp.page_template = pt;
                    }
                });
                tSeedPages.push(sp);
            });
            setSeedPages(tSeedPages);
        });
    }, [ignored]);

    return (
        <div className="p-2 space-y-4">
            <div className="flex justify-end">
                <EditSeedPageSheet seedPage={null} project={project} pageTemplates={pageTemplates} parentForceUpdate={forceUpdate} />
            </div>
            {seedPages.length > 0 && seedPages.map((seedPage, index) => (
                <div key={seedPage.id} className="border flex flex-row items-center justify-between p-2 rounded-md">
                    <div className="text-xs">
                        {seedPage.url}
                    </div>
                    <div className="flex">
                        <Badge variant="secondary">{seedPage.page_template.name}</Badge>
                        <EditSeedPageSheet seedPage={seedPage} project={project} pageTemplates={pageTemplates} parentForceUpdate={forceUpdate} />
                    </div>
                </div>
            ))}
        </div>
    );
}