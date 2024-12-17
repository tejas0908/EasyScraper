import { Project } from "@/app/lib/types";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label";
import { DispatchWithoutAction, useState } from "react";
import { useToken } from "@/app/lib/token";
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import validator from "validator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function TabSettings({ project, parentForceUpdate }: { project: Project, parentForceUpdate: DispatchWithoutAction }) {
    const [projectName, setProjectName] = useState(project.name);
    const [websiteUrl, setWebsiteUrl] = useState(project.website_url || '');
    const [rateCount, setRateCount] = useState(project.rate_count.toString());
    const [rateTimeUnit, setRateTimeUnit] = useState(project.rate_time_unit);
    const [pendingUpdate, setPendingUpdate] = useState(false);
    const getToken = useToken();
    const [error, setError] = useState<{ [key: string]: string | null }>({
        projectName: null,
        rateCount: null,
        rateTimeUnit: null,
        websiteUrl: null,
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

    function handleProjectNameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const pname = e.target.value;
        if (pname.length >= 3 && pname.length <= 100) {
            registerError("projectName", null);
        } else {
            registerError("projectName", "Project Name should be between 3 and 100 characters")
        }
        setProjectName(pname);
    }

    function handleWebsiteUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
        const url = e.target.value;
        if (url.length > 0) {
            if (validator.isURL(url)) {
                registerError("websiteUrl", null);
            } else {
                registerError("websiteUrl", "Invalid URL");
            }
        } else {
            registerError("websiteUrl", "URL is mandatory")
        }
        setWebsiteUrl(url);
    }

    function handleRateCountChange(e: React.ChangeEvent<HTMLInputElement>) {
        const rc = e.target.value;
        if (validator.isInt(rc) && parseInt(rc) > 0) {
            registerError("rateCount", null);
        } else {
            registerError("rateCount", "Rate count should be a number > 0")
        }
        setRateCount(rc);
    }

    function handleRateTimeUnitChange(e: string) {
        setRateTimeUnit(e);
    }

    async function handleProjectUpdate() {
        setPendingUpdate(true);
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}`, {
            method: "put",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            },
            body: JSON.stringify({
                "name": projectName,
                "website_url": websiteUrl,
                "rate_count": parseInt(rateCount),
                "rate_time_unit": rateTimeUnit
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
                <Input type="text" id="project_name" placeholder="Project Name" value={projectName} onChange={handleProjectNameChange} className={error.projectName ? 'border-red-500' : ''} />
                <div className="text-red-500 text-xs">{error.projectName}</div>
            </div>
            <div className="space-y-1 flex flex-col rounded-lg border p-4">
                <Label>Website Url</Label>
                <Input type="text" id="website_url" placeholder="Website Url" value={websiteUrl} onChange={handleWebsiteUrlChange} className={error.websiteUrl ? 'border-red-500' : ''} />
                <div className="text-red-500 text-xs">{error.websiteUrl}</div>
            </div>
            <div className="space-y-4 flex flex-col rounded-lg border p-4">
                <Label>Rate Limit</Label>
                <div className="flex space-x-4 items-center justify-start">
                    <div className="basis-1/3">
                        <Input value={rateCount} onChange={handleRateCountChange} type="text" className={error.rateCount ? 'border-red-500' : ''} />
                    </div>
                    <span className="text-sm basis-1/3">requests per</span>
                    <Select value={rateTimeUnit} onValueChange={handleRateTimeUnitChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Time Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="SECOND">second</SelectItem>
                            <SelectItem value="MINUTE">minute</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex justify-start">
                <Button className="w-28" onClick={handleProjectUpdate} disabled={pendingUpdate || hasErrors() || websiteUrl.length == 0}>
                    {pendingUpdate && <Loader2 className="animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}