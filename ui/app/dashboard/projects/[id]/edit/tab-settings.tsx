import { Project } from "@/app/lib/types";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useState } from "react";
import { useCookies } from 'react-cookie';
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export function TabSettings({ project, parentForceUpdate }: { project: Project, parentForceUpdate: any }) {
    const [cookies, setCookie] = useCookies(['token']);
    const [projectName, setProjectName] = useState(project.name);
    const [ignoreScrapeFailures, setIgnoreScrapeFailures] = useState(project.ignore_scrape_failures);
    const [sleepSecondsBetweenPageScrapes, setSleepSecondsBetweenPageScrapes] = useState(project.sleep_seconds_between_page_scrape);
    const [pendingUpdate, setPendingUpdate] = useState(false);

    function handleProjectNameChange(e: any) {
        const pname = e.target.value;
        setProjectName(pname);
    }

    function handleIgnoreScrapeFailuresChange(e: boolean) {
        setIgnoreScrapeFailures(e);
    }

    function handleSleepChange(e: number[]) {
        setSleepSecondsBetweenPageScrapes(e[0]);
    }

    async function handleProjectUpdate() {
        setPendingUpdate(true);
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}`, {
            method: "put",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cookies.token}`
            },
            body: JSON.stringify({
                "name": projectName,
                "ignore_scrape_failures": ignoreScrapeFailures,
                "sleep_seconds_between_page_scrape": sleepSecondsBetweenPageScrapes
            })
        });
        if (data.status == 200) {
            parentForceUpdate();
            setPendingUpdate(false);
            toast.success(`Project '${projectName}' updated`)
        }
    }

    return (
        <div className="p-2 space-y-4 w-[500px]">
            <div className="space-y-1 flex flex-col rounded-lg border p-4">
                <Label>Project Name</Label>
                <Input type="text" id="project_name" placeholder="Project Name" value={projectName} onChange={handleProjectNameChange} />
            </div>
            <div className="space-y-1 flex flex-row items-center justify-between rounded-lg border p-4">
                <Label>Ignore Scrape Failures</Label>
                <Switch checked={ignoreScrapeFailures} onCheckedChange={handleIgnoreScrapeFailuresChange} />
            </div>
            <div className="space-y-4 flex flex-col rounded-lg border p-4">
                <Label>Sleep Seconds Between Page Scrapes</Label>
                <div className="flex space-x-4">
                    <Slider className="basis-10/12" min={1} max={10} step={1} value={[sleepSecondsBetweenPageScrapes]} onValueChange={handleSleepChange} />
                    <Input className="basis-2/12" type="text" id="sleep_seconds" readOnly disabled value={sleepSecondsBetweenPageScrapes} />
                </div>
            </div>
            <div className="flex justify-start">
                <Button className="w-28" onClick={handleProjectUpdate} disabled={pendingUpdate}>
                    {pendingUpdate && <Loader2 className="animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}