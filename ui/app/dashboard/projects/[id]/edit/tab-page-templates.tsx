import { Project, PageTemplate } from "@/app/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useReducer, DispatchWithoutAction } from "react";
import { useToken } from "@/app/lib/token";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditPageTemplateSheet } from "./sheet-edit-page-template";
import { ScrapeRulesList } from "./scrape-rules-list";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import EmptyPageTemplates from "../../../../../public/undraw_void_wez2.svg";
import Image from "next/image";

export function TabPageTemplates({
  project,
  parentForceUpdate,
}: {
  project: Project;
  parentForceUpdate: DispatchWithoutAction;
}) {
  const [pageTemplates, setPageTemplates] = useState<PageTemplate[]>([]);
  const [fetchPending, setFetchPending] = useState(true);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(false);
  const limit = 10;
  const getToken = useToken();

  useEffect(() => {
    setFetchPending(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/page_templates?` +
        new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
          sort_field: "name",
          sort_direction: "asc",
        }).toString(),
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      },
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setPageTemplates(data.page_templates);
        setNextPage(data.paging.next_page);
        setFetchPending(false);
        parentForceUpdate();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ignored, currentPage]);

  async function handlePageChange(page: number) {
    setCurrentPage(page);
  }

  return (
    <div className="space-y-4 p-2">
      <div className="flex justify-end space-x-2">
        {(currentPage > 0 || (currentPage == 0 && nextPage == true)) && (
          <Pagination className="justify-end">
            <PaginationContent className="rounded-md border">
              <PaginationItem>
                <PaginationPrevious
                  className={
                    currentPage <= 0
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  onClick={() => handlePageChange(currentPage - 1)}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink className="cursor-pointer">
                  {currentPage + 1}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className={
                    !nextPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                  onClick={() => handlePageChange(currentPage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        <EditPageTemplateSheet
          pageTemplate={null}
          pageTemplates={pageTemplates}
          project={project}
          parentForceUpdate={forceUpdate}
        />
      </div>
      {pageTemplates.length > 0 && (
        <Accordion type="single" collapsible>
          {pageTemplates.map((pageTemplate) => (
            <AccordionItem
              key={pageTemplate.id}
              value={pageTemplate.id}
              className="my-2 rounded-md border px-2"
            >
              <AccordionTrigger>
                <div className="flex w-full flex-row justify-between">
                  <div>{pageTemplate.name}</div>
                  <div className="flex flex-row space-x-2">
                    <Badge variant="secondary">
                      {pageTemplate.output_type}
                    </Badge>
                    <Badge variant="secondary">{pageTemplate.scraper}</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="grid grid-cols-3 gap-4 rounded-sm border p-4">
                  <EditPageTemplateSheet
                    pageTemplate={pageTemplate}
                    pageTemplates={pageTemplates}
                    project={project}
                    parentForceUpdate={forceUpdate}
                  />
                  <div>
                    <Label>Name</Label>
                    <Input
                      type="text"
                      disabled
                      readOnly
                      value={pageTemplate.name}
                    ></Input>
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
                        <SelectItem value="XPATH_SELECTOR">
                          Xpath Selector
                        </SelectItem>
                        <SelectItem value="AI_SCRAPER">AI Scraper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {pageTemplate.output_page_template_id && (
                    <div>
                      <Label>Output Page Template</Label>
                      <Select
                        value={pageTemplate.output_page_template_id}
                        disabled
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Output Page Template" />
                        </SelectTrigger>
                        <SelectContent>
                          {pageTemplates.map((pt) => (
                            <SelectItem key={pt.id} value={pt.id}>
                              {pt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="border">
                  <ScrapeRulesList pageTemplate={pageTemplate} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {pageTemplates.length == 0 && !fetchPending && (
        <div className="grid grid-cols-3 grid-rows-[20%,50%,30%]">
          <div className="col-start-2 row-start-2 space-y-2">
            <Image src={EmptyPageTemplates} alt="" className="" />
            <div className="text-center text-lg font-bold">
              No Page Templates Yet
            </div>
            <div className="text-center text-sm">
              Start by creating a new page template
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
