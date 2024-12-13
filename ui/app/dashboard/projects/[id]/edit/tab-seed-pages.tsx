import { Project, SeedPage, PageTemplate } from "@/app/lib/types";
import { useState, useEffect, useReducer } from "react";
import { useToken } from "@/app/lib/token";
import { EditSeedPageSheet } from "./sheet-edit-seed-page";
import { Badge } from "@/components/ui/badge"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export function TabSeedPages({ project, pageTemplates }: { project: Project, pageTemplates: PageTemplate[] }) {
    const [seedPages, setSeedPages] = useState<SeedPage[]>([]);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const [currentPage, setCurrentPage] = useState(0);
    const [nextPage, setNextPage] = useState(false);
    const limit = 10;
    const getToken = useToken();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/seed_pages?` + new URLSearchParams({ page: String(currentPage), limit: String(limit), sort_field: 'id', sort_direction: 'asc' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            const tSeedPages: SeedPage[] = [];
            data.seed_pages.forEach((sp: SeedPage) => {
                pageTemplates.forEach((pt) => {
                    if (sp.page_template_id == pt.id) {
                        sp.page_template = pt;
                    }
                });
                tSeedPages.push(sp);
            });
            setSeedPages(tSeedPages);
            setNextPage(data.paging.next_page);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ignored, currentPage]);

    async function handlePageChange(page: number) {
        setCurrentPage(page);
    }

    return (
        <div className="p-2 space-y-4">
            <div className="flex justify-end space-x-2">
                {((currentPage > 0) || (currentPage == 0 && nextPage == true)) && <Pagination className="justify-end">
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
                </Pagination>}
                <EditSeedPageSheet seedPage={null} project={project} pageTemplates={pageTemplates} parentForceUpdate={forceUpdate} />
            </div>
            {seedPages.length > 0 && seedPages.map((seedPage,) => (
                <div key={seedPage.id} className="border flex flex-row items-center justify-between p-2 rounded-md">
                    <div className="text-xs">
                        {seedPage.url}
                    </div>
                    <div className="flex space-x-2">
                        <Badge variant="secondary">{seedPage.page_template.name}</Badge>
                        <EditSeedPageSheet seedPage={seedPage} project={project} pageTemplates={pageTemplates} parentForceUpdate={forceUpdate} />
                    </div>
                </div>
            ))}
        </div>
    );
}