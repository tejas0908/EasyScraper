import { PageTemplate, ScrapeRule } from "@/app/lib/types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2, Edit, Plus } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"
import { DispatchWithoutAction, useEffect, useState } from "react";
import { toast } from "sonner"
import { useToken } from "@/app/lib/token";

export function EditScrapeRuleSheet({ scrapeRule, pageTemplate, scrapeRules, parentForceUpdate }: { scrapeRule: ScrapeRule | null, pageTemplate: PageTemplate, scrapeRules: ScrapeRule[], parentForceUpdate: DispatchWithoutAction }) {
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<{ [key: string]: string | null }>({
        alias: null,
        server: null
    });
    const [pendingSave, setPendingSave] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(false);
    const id = scrapeRule ? scrapeRule.id : null;
    const [alias, setAlias] = useState(scrapeRule ? scrapeRule.alias : '');
    const [type, setType] = useState(scrapeRule ? scrapeRule.type : 'SINGLE');
    const [value, setValue] = useState(scrapeRule ? scrapeRule.value : '');
    const [href, setHref] = useState(scrapeRule ? String(scrapeRule.href) : 'false');
    const getToken = useToken();

    useEffect(() => {
        if (pageTemplate.output_type == "PAGE_SOURCE") {
            setAlias("urls");
            setType("MULTI");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    function handleAliasChange(e: React.ChangeEvent<HTMLInputElement>) {
        const talias = e.target.value;
        if (talias.length >= 3 && talias.length <= 100) {
            registerError("alias", null);
        } else {
            registerError("alias", "Alias should be between 3 and 100 characters");
        }
        setAlias(talias);
    }

    function handleTypeChange(e: string) {
        setType(e);
    }

    function handleHrefChange(e: string) {
        setHref(e);
    }

    function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
        const tvalue = e.target.value;
        if (tvalue.length >= 3 && tvalue.length <= 100) {
            registerError("value", null);
        } else {
            registerError("value", "Value should be less than 1000 characters");
        }
        setValue(tvalue);
    }

    async function handleSaveScrapeRule() {
        setPendingSave(true);
        let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules`
        let method = "post"
        if (id != null) {
            url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules/${id}`
            method = "put"
        }
        const body: Record<string, string | boolean> = {
            "alias": alias,
            "type": type,
            "value": value,
            "href": (href == 'true')
        }
        if (alias.length < 3 || alias.length > 100) {
            registerError("alias", "Alias should be between 3 and 100 characters");
            setPendingSave(false);
            return;
        }
        const data = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            },
            body: JSON.stringify(body)
        });
        if (data.status == 200) {
            parentForceUpdate();
            setPendingSave(false);
            setOpen(false);
            toast.success(`Scrape Rule '${alias}' saved`)
        }
    }

    async function handleDeleteScrapeRule() {
        setPendingDelete(true);
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules/${id}`, {
            method: "delete",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        });
        if (data.status == 200) {
            parentForceUpdate();
            setPendingDelete(false);
            setOpen(false);
            toast.success(`Scrape Rule '${alias}' deleted`)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {scrapeRule && <SheetTrigger asChild>
                <div className="col-start-3 flex justify-end">
                    <Button variant="outline" size="icon"><Edit /></Button>
                </div>
            </SheetTrigger>}
            {!scrapeRule && <SheetTrigger asChild>
                <Button disabled={pageTemplate.output_type == "PAGE_SOURCE" && scrapeRules.length > 0} className="col-start-3"><Plus />Scrape Rule</Button>
            </SheetTrigger>}

            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Scrape Rule</SheetTitle>
                </SheetHeader>
                <div className="p-2 space-y-2">
                    <div>
                        <Label>Alias</Label>
                        <Input disabled={pageTemplate.output_type == "PAGE_SOURCE"} type="text" value={alias} onChange={handleAliasChange} className={error.alias ? 'border-red-500' : ''}></Input>
                        <div className="text-red-500 text-xs">{error.alias}</div>
                    </div>
                </div>
                <div className="p-2 space-y-2">
                    <div>
                        <Label>Type</Label>
                        <Select disabled={pageTemplate.output_type == "PAGE_SOURCE"} value={type} onValueChange={handleTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SINGLE">Single</SelectItem>
                                <SelectItem value="MULTI">Multi</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-red-500 text-xs">{error.type}</div>
                    </div>
                </div>
                {pageTemplate.scraper != "AI_SCRAPER" && <div className="p-2 space-y-2">
                    <div>
                        <Label>Value</Label>
                        <Input type="text" value={value} onChange={handleValueChange} className={error.value ? 'border-red-500' : ''}></Input>
                        <div className="text-red-500 text-xs">{error.value}</div>
                    </div>
                </div>}
                {pageTemplate.scraper != "AI_SCRAPER" && <div className="p-2 space-y-2">
                    <div>
                        <Label>Href</Label>
                        <Select value={href} onValueChange={handleHrefChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Href" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="text-red-500 text-xs">{error.href}</div>
                    </div>
                </div>}

                <SheetFooter className='pt-4 px-2'>
                    <Button onClick={handleSaveScrapeRule} disabled={pendingSave || hasErrors()}>
                        {pendingSave && <Loader2 className="animate-spin" />}
                        Save
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteScrapeRule} disabled={pendingDelete || id == null}>
                        {pendingDelete && <Loader2 className="animate-spin" />}
                        Delete
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}