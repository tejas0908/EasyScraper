import { Project, PageTemplate } from "@/app/lib/types";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useState, useEffect, useReducer } from "react";
import { useToken } from "@/app/lib/token";
import { Loader2, Edit } from "lucide-react"
import { toast } from "sonner"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { EditPageTemplateSheet } from "./sheet-edit-page-template";
import { ScrapeRulesList } from "./scrape-rules-list";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

export function TabPageTemplates({ project, parentForceUpdate }: { project: Project, parentForceUpdate: any }) {
    const [pageTemplates, setPageTemplates] = useState<PageTemplate[]>([]);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const [currentPage, setCurrentPage] = useState(0);
    const [nextPage, setNextPage] = useState(false);
    const limit = 10;
    const getToken = useToken();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/page_templates?` + new URLSearchParams({ page: String(currentPage), limit: String(limit), sort_field: 'name', sort_direction: 'asc' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setPageTemplates(data.page_templates);
            setNextPage(data.paging.next_page);
            parentForceUpdate();
        });
    }, [ignored, currentPage]);

    async function handlePageChange(page: number) {
        setCurrentPage(page);
    }

    return (
        <div className="p-2 space-y-4">
            <div className="flex space-x-2 justify-end">
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
                <EditPageTemplateSheet pageTemplate={null} pageTemplates={pageTemplates} project={project} parentForceUpdate={forceUpdate} />
            </div>
            {pageTemplates.length > 0 &&
                <Accordion type="single" collapsible>
                    {pageTemplates.map((pageTemplate, index) => (
                        <AccordionItem key={pageTemplate.id} value={pageTemplate.id} className="border rounded-md my-2 px-2">
                            <AccordionTrigger>
                                <div className="flex flex-row justify-between w-full">
                                    <div>{pageTemplate.name}</div>
                                    <div className="flex flex-row space-x-2">
                                        <Badge variant="secondary">{pageTemplate.output_type}</Badge>
                                        <Badge variant="secondary">{pageTemplate.scraper}</Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <div className="border rounded-sm p-4 grid grid-cols-3 gap-4">
                                    <EditPageTemplateSheet pageTemplate={pageTemplate} pageTemplates={pageTemplates} project={project} parentForceUpdate={forceUpdate} />
                                    <div>
                                        <Label>Name</Label>
                                        <Input type="text" disabled readOnly value={pageTemplate.name}></Input>
                                    </div>
                                    <div>
                                        <Label>Output Type</Label>
                                        <Select value={pageTemplate.output_type} disabled>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Output Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PAGE_SOURCE">Page Source</SelectItem>
                                                <SelectItem value="LEAF">Leaf</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Scraper</Label>
                                        <Select value={pageTemplate.scraper} disabled>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Scraper" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="XPATH_SELECTOR">Xpath Selector</SelectItem>
                                                <SelectItem value="CSS_SELECTOR">CSS Selector</SelectItem>
                                                <SelectItem value="AUTO_SCRAPER">Auto Scraper</SelectItem>
                                                <SelectItem value="AI_SCRAPER">AI Scraper</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {pageTemplate.output_page_template_id && <div>
                                        <Label>Output Page Template</Label>
                                        <Select value={pageTemplate.output_page_template_id} disabled>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Output Page Template" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {
                                                    pageTemplates.map((pt, index) => (
                                                        <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>}
                                </div>
                                <div className="border">
                                    <ScrapeRulesList pageTemplate={pageTemplate} parentForceUpdate={forceUpdate} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>}
        </div>
    );
}