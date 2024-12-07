import { Project, PageTemplate } from "@/app/lib/types";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useState } from "react";
import { useCookies } from 'react-cookie';
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function TabScrapeTest({ project, pageTemplates, parentForceUpdate }: { project: Project, pageTemplates: PageTemplate[], parentForceUpdate: any }) {
    const [cookies, setCookie] = useCookies(['token']);
    const [url, setUrl] = useState('');
    const [pageTemplateId, setPageTemplateId] = useState('');
    const [pendingScrape, setPendingScrape] = useState(false);
    const [scrapeTestOutput, setScrapeTestOutput] = useState<any[]>([]);

    function handleUrlChange(e: any) {
        const turl = e.target.value;
        setUrl(turl);
    }

    function handlePageTemplateChange(e: any) {
        setPageTemplateId(e);
    }

    async function handleScrapeTest() {
        setPendingScrape(true);
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_test`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cookies.token}`
            },
            body: JSON.stringify({
                "url": url,
                "page_template_id": pageTemplateId
            })
        });
        if (data.status == 200) {
            let response = await data.json();
            let temp: any[] = [];
            for (let k in response.output) {
                temp.push({
                    field: k,
                    value: response.output[k]
                });
            }
            setScrapeTestOutput(temp);
            parentForceUpdate();
            setPendingScrape(false);
            toast.success(`Scrape test done`)
        }
    }

    return (
        <div>
            <div className="w-[500px] p-2 space-y-4">
                <div className="space-y-1 flex flex-col rounded-lg border p-4">
                    <Input type="text" id="url" placeholder="URL" value={url} onChange={handleUrlChange} />
                </div>
                <div className="space-y-1 flex flex-col rounded-lg border p-4">
                    <Select value={pageTemplateId} onValueChange={handlePageTemplateChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Page Template" />
                        </SelectTrigger>
                        <SelectContent>
                            {
                                pageTemplates.map((pt, index) => (
                                    <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-start">
                    <Button className="w-28" onClick={handleScrapeTest} disabled={pendingScrape}>
                        {pendingScrape && <Loader2 className="animate-spin" />}
                        Test
                    </Button>
                </div>
            </div>
            <div className="p-2 space-y-2">
                {scrapeTestOutput.map((output) => (
                    <div key={output.field} className="border grid grid-cols-[10%,90%] rounded-md p-2">
                        <div>{output.field}</div>
                        <div className="line-clamp-5">{JSON.stringify(output.value)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}