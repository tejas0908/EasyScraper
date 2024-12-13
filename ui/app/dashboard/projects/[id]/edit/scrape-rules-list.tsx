import { PageTemplate, ScrapeRule } from "@/app/lib/types";
import { useEffect, useState, useReducer } from "react";
import { EditScrapeRuleSheet } from "./sheet-edit-scrape-rule";
import { useToken } from "@/app/lib/token";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export function ScrapeRulesList({ pageTemplate }: { pageTemplate: PageTemplate }) {
    const [scrapeRules, setScrapeRules] = useState<ScrapeRule[]>([]);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const [currentPage, setCurrentPage] = useState(0);
    const [nextPage, setNextPage] = useState(false);
    const limit = 10;
    const getToken = useToken();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules?` + new URLSearchParams({ page: String(currentPage), limit: String(limit), sort_field: 'alias', sort_direction: 'asc' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setScrapeRules(data.scrape_rules);
            setNextPage(data.paging.next_page);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ignored, currentPage]);

    async function handlePageChange(page: number) {
        setCurrentPage(page);
    }

    return (
        <div className="p-4">
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
                <EditScrapeRuleSheet scrapeRule={null} pageTemplate={pageTemplate} scrapeRules={scrapeRules} parentForceUpdate={forceUpdate} />
            </div>
            <div className="grid grid-cols-5 gap-4 p-4">
                {scrapeRules && scrapeRules.map((scrapeRule,) => (
                    <div key={scrapeRule.id} className="border flex flex-row rounded-md p-2 items-center justify-between shadow hover:bg-slate-100 transition duration-300">
                        <div className="truncate">
                            {scrapeRule.alias}
                        </div>
                        <EditScrapeRuleSheet scrapeRule={scrapeRule} pageTemplate={pageTemplate} scrapeRules={scrapeRules} parentForceUpdate={forceUpdate} />
                    </div>
                ))}
            </div>
        </div>
    );
}