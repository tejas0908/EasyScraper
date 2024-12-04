import { Project, PageTemplate } from "@/app/lib/types";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useState, useEffect } from "react";
import { useCookies } from 'react-cookie';
import { Loader2, Edit } from "lucide-react"
import { toast } from "sonner"
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

export function TabPageTemplates({ project, parentForceUpdate }: { project: Project, parentForceUpdate: any }) {
    const [cookies, setCookie] = useCookies(['token']);
    const [pageTemplates, setPageTemplates] = useState<PageTemplate[]>([]);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/page_templates?` + new URLSearchParams({ skip: String(0), limit: String(100) }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cookies.token}`
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setPageTemplates(data.page_templates);
        });
    }, []);

    return (
        <div className="p-2 space-y-4 w-[600px]">
            {pageTemplates.length > 0 &&
                <Accordion type="single" collapsible>
                    {pageTemplates.map((pageTemplate, index) => (
                        <AccordionItem key={pageTemplate.id} value={pageTemplate.id}>
                            <AccordionTrigger>
                                <div className="flex flex-row justify-between w-full">
                                    <div>{pageTemplate.name}</div>
                                    <div className="flex flex-row">
                                        <Badge variant="secondary">{pageTemplate.output_type}</Badge>
                                        <Badge variant="secondary">{pageTemplate.scraper}</Badge>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="border rounded-sm p-4 grid grid-cols-3 gap-4">
                                    <Button className="col-start-3"><Edit /> Edit Page Template</Button>
                                    <div>
                                        <Label>Name</Label>
                                        <Input type="text" disabled readOnly value={pageTemplate.name}></Input>
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
                                                <SelectItem value="XPATH_SELECTOR">Xpath Selector</SelectItem>
                                                <SelectItem value="CSS_SELECTOR">CSS Selector</SelectItem>
                                                <SelectItem value="AUTO_SCRAPER">Auto Scraper</SelectItem>
                                                <SelectItem value="AI_SCRAPER">AI Scraper</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Output Page Template</Label>
                                        <Select value={pageTemplate.output_page_template_id} disabled>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Output Page Template" />
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
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>}
        </div>
    );
}