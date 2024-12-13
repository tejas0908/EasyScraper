import { Project, PageTemplate } from "@/app/lib/types";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import validator from "validator";
import { DispatchWithoutAction, useState } from "react";
import { useToken } from "@/app/lib/token";
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function TabScrapeTest({ project, pageTemplates, parentForceUpdate }: { project: Project, pageTemplates: PageTemplate[], parentForceUpdate: DispatchWithoutAction }) {
    const [url, setUrl] = useState('');
    const [pageTemplateId, setPageTemplateId] = useState('');
    const [pendingScrape, setPendingScrape] = useState(false);
    const [scrapeTestOutput, setScrapeTestOutput] = useState<{ field: string; value: string }[]>([]);
    const getToken = useToken();
    const [error, setError] = useState<{ [key: string]: string | null }>({
        url: null,
        pageTemplate: null,
        server: null
    });

    function registerError(field: string, message: string | null) {
        setError({
            ...error,
            [field]: message
        });
    }

    function hasErrors() {
        let hasError = false;
        for (const k in error) {
            if (error[k] != null) {
                hasError = true;
            }
        }
        return hasError;
    }

    function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
        const turl = e.target.value;
        if (turl.length > 0) {
            if (validator.isURL(turl)) {
                registerError("url", null);
            } else {
                registerError("url", "Invalid Url");
            }

        } else {
            registerError("url", "Url is mandatory");
        }
        setUrl(turl);
    }

    function handlePageTemplateChange(e: string) {
        if (e == null || e.length == 0) {
            registerError("pageTemplate", "Page template is mandatory");
        } else {
            registerError("pageTemplate", null);
        }
        setPageTemplateId(e);
    }

    async function handleScrapeTest() {
        setPendingScrape(true);
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/scrape_test`, {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            },
            body: JSON.stringify({
                "url": url,
                "page_template_id": pageTemplateId
            })
        });
        if (data.status == 200) {
            const response = await data.json();
            const temp: { field: string; value: string; }[] = [];
            for (const k in response.output) {
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
                    <Input type="text" id="url" placeholder="URL" value={url} onChange={handleUrlChange} className={error.url ? 'border-red-500' : ''} />
                    <div className="text-red-500 text-xs">{error.url}</div>
                </div>
                <div className="space-y-1 flex flex-col rounded-lg border p-4">
                    <Select value={pageTemplateId} onValueChange={handlePageTemplateChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Page Template" />
                        </SelectTrigger>
                        <SelectContent className={error.pageTemplate ? 'border-red-500' : ''}>
                            {
                                pageTemplates.map((pt,) => (
                                    <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                    <div className="text-red-500 text-xs">{error.pageTemplate}</div>
                </div>
                <div className="flex justify-start">
                    <Button className="w-28" onClick={handleScrapeTest} disabled={pendingScrape || hasErrors() || pageTemplateId.length == 0 || url.length == 0}>
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