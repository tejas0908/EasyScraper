import { Project, PageTemplate, ScrapeRun } from "@/app/lib/types";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useState, useEffect, useReducer } from "react";
import { useToken } from "@/app/lib/token";
import { Dot, Loader, Play, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import moment from 'moment'
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
import { Progress } from "@/components/ui/progress"


export function TabScrapeRuns({ project, parentForceUpdate }: { project: Project, parentForceUpdate: any }) {
    const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>([]);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const [pendingTrigger, setPendingTrigger] = useState(false);
    const [pendingRefresh, setPendingRefresh] = useState(false);
    const timezoneOffset = (new Date()).getTimezoneOffset();
    const getToken = useToken();

    function refreshScrapeRuns() {
        setPendingRefresh(true);
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_runs?` + new URLSearchParams({ skip: String(0), limit: String(5) }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            data.scrape_runs.forEach((sr: ScrapeRun) => {
                let dt1 = moment(Date.parse(sr.started_on)).add(-timezoneOffset, 'm').format();
                sr.started_on = dt1;

                if (sr.ended_on != null) {
                    let dt2 = moment(Date.parse(sr.ended_on)).add(-timezoneOffset, 'm').format();
                    sr.ended_on = dt2;
                }

                let t2 = new Date(Date.now()).getTime();
                if (sr.ended_on != null) {
                    t2 = new Date(sr.ended_on).getTime();
                }
                let t1 = new Date(sr.started_on).getTime();
                sr.run_time = (t2 - t1) / 1000;
                if (["LEAF_SCRAPING", "OUTPUT", "COMPLETED"].includes(sr.stage)) {
                    sr.progress = ((sr.total_failed_scraped_pages + sr.total_successful_scraped_pages) / sr.total_discovered_pages) * 100;
                    sr.progress = Math.round(sr.progress * 100) / 100;
                } else {
                    sr.progress = 0;
                }

            });
            setScrapeRuns(data.scrape_runs);
            setPendingRefresh(false);
        });
    }

    useEffect(() => {
        refreshScrapeRuns();
        const interval = setInterval(() => {
            refreshScrapeRuns();
        }, 10000);
        return () => clearInterval(interval);
    }, [ignored]);

    async function triggerScrape() {
        setPendingTrigger(true);
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_runs`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        });
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
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);

        var hDisplay = h > 0 ? h + "h " : "";
        var mDisplay = m > 0 ? m + "m " : "";
        var sDisplay = s >= 0 ? s + "s" : "";
        return hDisplay + mDisplay + sDisplay;
    }

    async function downloadOutputFile(scrapeRunId: string, outputFileId: string, format: string) {
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_runs/${scrapeRunId}/outputs/${outputFileId}/download`, {
            method: "get",
            headers: {
                "Authorization": getToken()
            }
        });
        if (data.status == 200) {
            let blob = await data.blob();
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
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
                return ""
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
        <div className="p-2 space-y-4">
            <div className="flex justify-end space-x-2">
                <Button onClick={triggerScrape}>
                    <Play className="dark:fill-black" />
                    Trigger Scrape
                </Button>
                <Button variant="outline" size="icon" onClick={refreshScrapeRunsClick}>
                    <RefreshCw className={pendingRefresh ? "animate-spin" : ""} />
                </Button>
            </div>
            {scrapeRuns.length > 0 &&
                <Accordion type="single" collapsible>
                    {scrapeRuns.map((scrapeRun, index) => (
                        <AccordionItem key={scrapeRun.id} value={scrapeRun.id} className="border rounded-md my-2 px-2">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="w-full space-y-2">
                                    <div>
                                        <div className="underline">Started on {moment(scrapeRun.started_on).format('MMMM Do, h:mm a')}</div>
                                    </div>
                                    <div className="flex flex-row space-x-2">
                                        <Badge className="bg-blue-200 dark:text-black dark:bg-blue-400" variant="secondary">{secondsToHms(scrapeRun.run_time)}</Badge>
                                        <Badge className={getStatusColor(scrapeRun.status)} variant="secondary">{getStatusMessage(scrapeRun.status)}{scrapeRun.status == 'STARTED' && <Loader className="animate-spin h-3" />}</Badge>
                                    </div>
                                    <div className="flex flex-row space-x-2 items-center">
                                        <Progress className="w-16" value={scrapeRun.progress} />
                                        <div>{scrapeRun.progress}%</div>
                                        <div>{getStageMessage(scrapeRun.stage)}</div>
                                    </div>

                                </div>

                            </AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <div className="p-4">
                                    <div className="flex flex-row space-x-2">
                                        <div className="flex flex-col border rounded-lg p-2 w-[150px]">
                                            <div className="font-bold border-b">Pages</div>
                                            <div className="grid grid-cols-[10px,1fr,10px] items-center p-1">
                                                <div className="bg-blue-200 dark:bg-blue-400 h-3 w-full rounded-sm"></div>
                                                <div className="pl-2">Discovered</div>
                                                <div className="">{scrapeRun.total_discovered_pages}</div>
                                            </div>
                                            <div className="grid grid-cols-[10px,1fr,10px] items-center p-1">
                                                <div className="bg-green-200 dark:bg-green-400 h-3 w-full rounded-sm"></div>
                                                <div className="pl-2">Success</div>
                                                <div className="">{scrapeRun.total_successful_scraped_pages}</div>
                                            </div>
                                            <div className="grid grid-cols-[10px,1fr,10px] items-center p-1">
                                                <div className="bg-red-200 dark:bg-red-400 h-3 w-full rounded-sm"></div>
                                                <div className="pl-2">Failed</div>
                                                <div className="">{scrapeRun.total_failed_scraped_pages}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col border rounded-lg p-2 w-[300px]">
                                            <div className="font-bold border-b">Output</div>
                                            <div className="flex flex-col space-y-2 p-2">
                                                {scrapeRun.outputs.map((output, index) => (
                                                    <div onClick={() => downloadOutputFile(scrapeRun.id, output.id, output.format)} key={output.id} className="underline cursor-pointer">Download {output.format} file</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>}
        </div>
    );
}