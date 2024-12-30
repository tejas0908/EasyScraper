import { Project, SeedPage, PageTemplate } from "@/app/lib/types";
import { useState, useEffect, useReducer } from "react";
import { useToken } from "@/app/lib/token";
import { EditSeedPageSheet } from "./sheet-edit-seed-page";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import EmptySeedPages from "../../../../../public/undraw_add-notes_9xls.svg";
import Image from "next/image";

export function TabSeedPages({
  project,
  pageTemplates,
}: {
  project: Project;
  pageTemplates: PageTemplate[];
}) {
  const [seedPages, setSeedPages] = useState<SeedPage[]>([]);
  const [fetchPending, setFetchPending] = useState(true);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(false);
  const limit = 10;
  const getToken = useToken();

  useEffect(() => {
    setFetchPending(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/seed_pages?` +
        new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
          sort_field: "id",
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
        setFetchPending(false);
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
        <EditSeedPageSheet
          seedPage={null}
          project={project}
          pageTemplates={pageTemplates}
          parentForceUpdate={forceUpdate}
        />
      </div>
      {seedPages.length > 0 &&
        seedPages.map((seedPage) => (
          <div
            key={seedPage.id}
            className="flex flex-row items-center justify-between rounded-md border p-2"
          >
            <div className="text-xs">{seedPage.url}</div>
            <div className="flex space-x-2">
              <Badge variant="secondary">{seedPage.page_template.name}</Badge>
              <EditSeedPageSheet
                seedPage={seedPage}
                project={project}
                pageTemplates={pageTemplates}
                parentForceUpdate={forceUpdate}
              />
            </div>
          </div>
        ))}
      {seedPages.length == 0 && !fetchPending && (
        <div className="grid grid-cols-3 grid-rows-[20%,50%,30%]">
          <div className="col-start-2 row-start-2 space-y-2">
            <Image src={EmptySeedPages} alt="" className="" />
            <div className="text-center text-lg font-bold">
              No Seed Pages Yet
            </div>
            <div className="text-center text-sm">
              Start by creating a new seed page
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
