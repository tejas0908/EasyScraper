import { Project, ScrapeRun } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { useState, useEffect, DispatchWithoutAction } from "react";
import { useToken } from "@/app/lib/token";
import { Loader, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import moment from "moment";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Progress } from "@/components/ui/progress";
import EmptyScrapeRuns from "../../../../../public/undraw_runner-start_585j.svg";
import Image from "next/image";

export function TabScrapeRuns({
  project,
  parentForceUpdate,
}: {
  project: Project;
  parentForceUpdate: DispatchWithoutAction;
}) {
  const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(false);
  const limit = 10;
  const [pendingTrigger, setPendingTrigger] = useState(false);
  const [pendingRefresh, setPendingRefresh] = useState(true);
  const timezoneOffset = new Date().getTimezoneOffset();
  const getToken = useToken();

  function refreshScrapeRuns() {
    setPendingRefresh(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_runs?` +
        new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
          sort_field: "started_on",
          sort_direction: "desc",
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
        data.scrape_runs.forEach((sr: ScrapeRun) => {
          const dt1 = moment(Date.parse(sr.started_on))
            .add(-timezoneOffset, "m")
            .format();
          sr.started_on = dt1;

          if (sr.ended_on != null) {
            const dt2 = moment(Date.parse(sr.ended_on))
              .add(-timezoneOffset, "m")
              .format();
            sr.ended_on = dt2;
          }

          let t2 = new Date(Date.now()).getTime();
          if (sr.ended_on != null) {
            t2 = new Date(sr.ended_on).getTime();
          }
          const t1 = new Date(sr.started_on).getTime();
          sr.run_time = (t2 - t1) / 1000;
          if (["LEAF_SCRAPING", "OUTPUT", "COMPLETED"].includes(sr.stage)) {
            sr.progress =
              ((sr.total_failed_scraped_pages +
                sr.total_successful_scraped_pages) /
                sr.total_discovered_pages) *
              100;
            sr.progress = Math.round(sr.progress * 100) / 100;
          } else {
            sr.progress = 0;
          }
        });
        setScrapeRuns(data.scrape_runs);
        setNextPage(data.paging.next_page);
        setPendingRefresh(false);
      });
  }

  useEffect(() => {
    refreshScrapeRuns();
    const interval = setInterval(() => {
      refreshScrapeRuns();
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  async function handlePageChange(page: number) {
    setCurrentPage(page);
  }

  async function triggerScrape() {
    setPendingTrigger(true);
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_runs`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      },
    );
    if (data.status == 200) {
      parentForceUpdate();
      setPendingTrigger(false);
      toast.success(`Scrape Started`);
      refreshScrapeRuns();
    }
  }

  async function refreshScrapeRunsClick() {
    refreshScrapeRuns();
  }

  function secondsToHms(d: number) {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);

    const hDisplay = h > 0 ? h + "h " : "";
    const mDisplay = m > 0 ? m + "m " : "";
    const sDisplay = s >= 0 ? s + "s" : "";
    return hDisplay + mDisplay + sDisplay;
  }

  async function downloadOutputFile(
    scrapeRunId: string,
    outputFileId: string,
    format: string,
  ) {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_runs/${scrapeRunId}/outputs/${outputFileId}/download`,
      {
        method: "get",
        headers: {
          Authorization: getToken(),
        },
      },
    );
    if (data.status == 200) {
      const blob = await data.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scrapeRunId}_${outputFileId}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function getStageMessage(stage: string) {
    switch (stage) {
      case "CREATED":
        return "Allocating Resources";
      case "STARTED":
        return "Started Scraping";
      case "PAGE_GENERATION":
        return "Discovering Pages";
      case "LEAF_SCRAPING":
        return "Scraping Leaf Pages";
      case "OUTPUT":
        return "Generating Output Files";
      case "COMPLETED":
        return "";
    }
  }

  function getStatusMessage(status: string) {
    switch (status) {
      case "STARTED":
        return "Running";
      case "COMPLETED":
        return "Completed";
      case "FAILED":
        return "Failed";
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "STARTED":
        return "bg-blue-200 dark:text-black dark:bg-blue-400";
      case "COMPLETED":
        return "bg-green-200 dark:text-black dark:bg-green-400";
      case "FAILED":
        return "bg-red-200 dark:text-black dark:bg-red-400";
    }
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
        <Button onClick={triggerScrape} disabled={pendingTrigger}>
          <Play className="dark:fill-black" />
          Trigger Scrape
        </Button>
        <Button variant="outline" size="icon" onClick={refreshScrapeRunsClick}>
          <RefreshCw className={pendingRefresh ? "animate-spin" : ""} />
        </Button>
      </div>
      {scrapeRuns.length > 0 && (
        <Accordion type="single" collapsible>
          {scrapeRuns.map((scrapeRun) => (
            <AccordionItem
              key={scrapeRun.id}
              value={scrapeRun.id}
              className="my-2 rounded-md border px-2"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="w-full space-y-2">
                  <div>
                    <div className="underline">
                      Started on{" "}
                      {moment(scrapeRun.started_on).format("MMMM Do, h:mm a")}
                    </div>
                  </div>
                  <div className="flex flex-row space-x-2">
                    <Badge
                      className="bg-blue-200 dark:bg-blue-400 dark:text-black"
                      variant="secondary"
                    >
                      {secondsToHms(scrapeRun.run_time)}
                    </Badge>
                    <Badge
                      className={getStatusColor(scrapeRun.status)}
                      variant="secondary"
                    >
                      {getStatusMessage(scrapeRun.status)}
                      {scrapeRun.status == "STARTED" && (
                        <Loader className="h-3 animate-spin" />
                      )}
                    </Badge>
                  </div>
                  <div className="flex flex-row items-center space-x-2">
                    <Progress className="w-16" value={scrapeRun.progress} />
                    <div>{scrapeRun.progress}%</div>
                    <div>{getStageMessage(scrapeRun.stage)}</div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                <div className="p-4">
                  <div className="flex flex-row space-x-2">
                    <div className="flex w-[150px] flex-col rounded-lg border p-2">
                      <div className="border-b font-bold">Pages</div>
                      <div className="grid grid-cols-[10px,1fr,20px] items-center p-2">
                        <div className="h-3 w-full rounded-sm bg-blue-200 dark:bg-blue-400"></div>
                        <div className="pl-2">Discovered</div>
                        <div className="">
                          {scrapeRun.total_discovered_pages}
                        </div>
                      </div>
                      <div className="grid grid-cols-[10px,1fr,20px] items-center p-2">
                        <div className="h-3 w-full rounded-sm bg-green-200 dark:bg-green-400"></div>
                        <div className="pl-2">Success</div>
                        <div className="">
                          {scrapeRun.total_successful_scraped_pages}
                        </div>
                      </div>
                      <div className="grid grid-cols-[10px,1fr,20px] items-center p-2">
                        <div className="h-3 w-full rounded-sm bg-red-200 dark:bg-red-400"></div>
                        <div className="pl-2">Failed</div>
                        <div className="">
                          {scrapeRun.total_failed_scraped_pages}
                        </div>
                      </div>
                    </div>
                    <div className="flex w-[300px] flex-col rounded-lg border p-2">
                      <div className="border-b font-bold">Output</div>
                      <div className="flex flex-col space-y-2 p-2">
                        {scrapeRun.outputs.map((output) => (
                          <div
                            onClick={() =>
                              downloadOutputFile(
                                scrapeRun.id,
                                output.id,
                                output.format,
                              )
                            }
                            key={output.id}
                            className="cursor-pointer underline"
                          >
                            Download {output.format} file
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {scrapeRuns.length == 0 && !pendingRefresh && (
        <div className="grid grid-cols-3 grid-rows-[30%,50%,20%]">
          <div className="col-start-2 row-start-2 space-y-2">
            <Image src={EmptyScrapeRuns} alt="" className="" />
            <div className="text-center text-lg font-bold">
              No Scrape Runs Yet
            </div>
            <div className="text-center text-sm">
              Start by triggering a new scrape run
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
