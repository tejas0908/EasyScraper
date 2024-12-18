import { Project, PageTemplate } from "@/app/lib/types";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2, Edit, Plus, CircleHelp } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"
import { DispatchWithoutAction, useState } from "react";
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useToken } from "@/app/lib/token";
import validator from "validator";

export function EditPageTemplateSheet({ pageTemplate, pageTemplates, project, parentForceUpdate }: { pageTemplate: PageTemplate | null, pageTemplates: PageTemplate[], project: Project, parentForceUpdate: DispatchWithoutAction }) {
    const [name, setName] = useState(pageTemplate ? pageTemplate.name : '');
    const id = pageTemplate ? pageTemplate.id : null;
    const [outputType, setOutputType] = useState(pageTemplate ? pageTemplate.output_type : 'LEAF');
    const [scraper, setScraper] = useState(pageTemplate ? pageTemplate.scraper : 'XPATH_SELECTOR');
    const [outputPageTemplateId, setOutputPageTemplateId] = useState(pageTemplate ? pageTemplate.output_page_template_id : '');
    const [exampleUrl, setExampleUrl] = useState(pageTemplate ? pageTemplate.example_url : '');
    const [aiPrompt, setAiPrompt] = useState(pageTemplate ? (pageTemplate.ai_prompt ? pageTemplate.ai_prompt : '') : '');
    const [aiInput, setAiInput] = useState(pageTemplate ? pageTemplate.ai_input : 'TEXT');
    const [pendingSave, setPendingSave] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<{ [key: string]: string | null }>({
        name: null,
        exampleUrl: null,
        outputPageTemplate: null,
        aiPrompt: null,
        aiInput: null,
        server: null
    });
    const getToken = useToken();

    function registerError(field: string, message: string | null) {
        setError({
            ...error,
            [field]: message
        });
    }

    function handleNameOnChange(e: React.ChangeEvent<HTMLInputElement>) {
        const tname = e.target.value;
        if (tname.length >= 3 && tname.length <= 100) {
            registerError("name", null);
        } else {
            registerError("name", "Name should be between 3 and 100 characters");
        }
        setName(tname);
    }

    function handleExampleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (validator.isURL(e.target.value)) {
            registerError("exampleUrl", null);
        } else {
            registerError("exampleUrl", "Invalid Url");
        }
        setExampleUrl(e.target.value);
    }

    function handleAIPromptChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setAiPrompt(e.target.value);
    }

    function handleAIInputChange(e: string) {
        setAiInput(e);
    }

    function handleOutputTypeChange(e: string) {
        setOutputType(e);
    }

    function handleScraperChange(e: string) {
        setScraper(e);
    }

    function handleOutputPageChange(e: string) {
        if (e != null) {
            registerError("outputPageTemplate", null);
        } else {
            registerError("outputPageTemplate", "Output Page Template is mandatory if Output Type is Page Source");
        }
        setOutputPageTemplateId(e);
    }

    async function handleSavePageTemplate() {
        setPendingSave(true);
        let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/page_templates`
        let method = "post"
        if (id != null) {
            url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/page_templates/${id}`
            method = "put"
        }
        const body: Record<string, string> = {
            "name": name,
            "output_type": outputType,
            "scraper": scraper
        }
        if (name.length < 3 || name.length > 100) {
            registerError("name", "Name should be between 3 and 100 characters");
            setPendingSave(false);
            return;
        }
        if (outputType == "PAGE_SOURCE") {
            if (outputPageTemplateId != null && outputPageTemplateId.length > 0) {
                registerError("outputPageTemplate", null);
            } else {
                registerError("outputPageTemplate", "Output Page Template is mandatory if Output Type is Page Source");
                setPendingSave(false);
                return;
            }
            body["output_page_template_id"] = outputPageTemplateId
        }
        if (scraper == "AUTO_SCRAPER") {
            body["example_url"] = exampleUrl
        }
        if (scraper == "AI_SCRAPER") {
            body["ai_input"] = aiInput
            body["ai_prompt"] = aiPrompt
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
            toast.success(`Page template '${name}' saved`)
        }
    }

    async function handleDeletePageTemplate() {
        setPendingDelete(true);
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/page_templates/${id}`, {
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
            toast.success(`Page template '${name}' deleted`)
        }
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

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {pageTemplate && <SheetTrigger asChild>
                <div className="col-start-3 flex justify-end">
                    <Button><Edit /> Edit Page Template</Button>
                </div>
            </SheetTrigger>}
            {!pageTemplate && <SheetTrigger asChild>
                <Button className="col-start-3"><Plus />Page Template</Button>
            </SheetTrigger>}

            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Page Template</SheetTitle>
                </SheetHeader>
                <div className="p-2 space-y-2">
                    <div>
                        <Label>Name</Label>
                        <Input type="text" value={name} onChange={handleNameOnChange} className={error.name ? 'border-red-500' : ''}></Input>
                        <div className="text-red-500 text-xs">{error.name}</div>
                    </div>
                    <div>
                        <Label>Output Type</Label>
                        <Select value={outputType} onValueChange={handleOutputTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Output Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PAGE_SOURCE">Page Source</SelectItem>
                                <SelectItem value="LEAF">Leaf</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="p-2 flex items-center space-x-2 border rounded-lg bg-slate-100 dark:bg-slate-500 mt-2">
                            <CircleHelp className="h-4" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-700 dark:text-white"><b>Page Source</b> = scraping this page results in urls of further pages to be scraped</span>
                                <span className="text-xs text-slate-700 dark:text-white"><b>Leaf</b> = scraping this page results in actual data</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label>Scraper</Label>
                        <Select value={scraper} onValueChange={handleScraperChange}>
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
                        <div className="p-2 flex items-center space-x-2 border rounded-lg bg-slate-100 dark:bg-slate-500 mt-2">
                            <CircleHelp className="h-4" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-700 dark:text-white"><b>Xpath Selector</b> = use xpaths to scrape</span>
                                <span className="text-xs text-slate-700 dark:text-white"><b>CSS Selector</b> = use css selectors to scrape</span>
                                <span className="text-xs text-slate-700 dark:text-white"><b>AI Scraper</b> = LLMs are used to scrape </span>
                            </div>
                        </div>
                    </div>
                    {scraper == 'AUTO_SCRAPER' && <div>
                        <Label>Example URL</Label>
                        <Input type="text" value={exampleUrl} onChange={handleExampleUrlChange} className={error.exampleUrl ? 'border-red-500' : ''}></Input>
                        <div className="text-red-500 text-xs">{error.exampleUrl}</div>
                        <div className="p-2 flex items-center space-x-2 border rounded-lg bg-slate-100 dark:bg-slate-500 mt-2">
                            <CircleHelp className="h-4" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-700 dark:text-white">An example url of this page template</span>
                            </div>
                        </div>
                    </div>}
                    {scraper == 'AI_SCRAPER' && <div>
                        <Label>AI Prompt</Label>
                        <Textarea value={aiPrompt} onChange={handleAIPromptChange}></Textarea>
                        <div className="p-2 flex items-center space-x-2 border rounded-lg bg-slate-100 dark:bg-slate-500 mt-2">
                            <CircleHelp className="h-4" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-700 dark:text-white">The system prompt which will be sent to the LLM while scraping the page</span>
                            </div>
                        </div>
                    </div>}
                    {scraper == 'AI_SCRAPER' && <div>
                        <Label>AI Input</Label>
                        <Select value={aiInput} onValueChange={handleAIInputChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="AI Input" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HTML">Html</SelectItem>
                                <SelectItem value="TEXT">Text</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="p-2 flex items-center space-x-2 border rounded-lg bg-slate-100 dark:bg-slate-500 mt-2">
                            <CircleHelp className="h-4" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-700 dark:text-white"><b>Html</b> = The full html will be sent to the LLM (costly)</span>
                                <span className="text-xs text-slate-700 dark:text-white"><b>Text</b> = Only the text content of the page is sent to the LLM (cheaper)</span>
                            </div>
                        </div>
                    </div>}
                    {outputType == 'PAGE_SOURCE' && <div>
                        <Label>Output Page Template</Label>
                        <Select value={outputPageTemplateId} onValueChange={handleOutputPageChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Output Page Template" />
                            </SelectTrigger>
                            <SelectContent className={error.outputPageTemplate ? 'border-red-500' : ''}>
                                {
                                    pageTemplates.map((pt,) => (
                                        <SelectItem key={pt.id} value={pt.id} disabled={pageTemplate != null && pt.id == pageTemplate.id}>{pt.name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                        <div className="text-red-500 text-xs">{error.outputPageTemplate}</div>
                        <div className="p-2 flex items-center space-x-2 border rounded-lg bg-slate-100 dark:bg-slate-500 mt-2">
                            <CircleHelp className="h-4" />
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-700 dark:text-white">Which page template is produced by scraping this page?</span>
                            </div>
                        </div>
                    </div>}
                </div>

                <SheetFooter className='pt-4 px-2'>
                    <Button onClick={handleSavePageTemplate} disabled={pendingSave || hasErrors() || name.length == 0}>
                        {pendingSave && <Loader2 className="animate-spin" />}
                        Save
                    </Button>
                    <Button variant="destructive" onClick={handleDeletePageTemplate} disabled={pendingDelete || id == null}>
                        {pendingDelete && <Loader2 className="animate-spin" />}
                        Delete
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}