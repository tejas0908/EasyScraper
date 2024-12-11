import { PageTemplate, ScrapeRule } from "@/app/lib/types";
import { useEffect, useState, useReducer } from "react";
import { EditScrapeRuleSheet } from "./sheet-edit-scrape-rule";
import { useToken } from "@/app/lib/token";

export function ScrapeRulesList({ pageTemplate, parentForceUpdate }: { pageTemplate: PageTemplate, parentForceUpdate: any }) {
    const [scrapeRules, setScrapeRules] = useState<ScrapeRule[]>([]);
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0);
    const getToken = useToken();

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules?` + new URLSearchParams({ page: String(0), limit: String(100), sort_field: 'alias', sort_direction: 'asc' }).toString(), {
            method: "get",
            headers: {
                "Content-Type": "application/json",
                "Authorization": getToken()
            }
        }).then((res) => {
            return res.json();
        }).then((data) => {
            setScrapeRules(data.scrape_rules);
        });
    }, [ignored]);

    return (
        <div className="p-4">
            <div className="flex justify-end">
                <EditScrapeRuleSheet scrapeRule={null} pageTemplate={pageTemplate} scrapeRules={scrapeRules} parentForceUpdate={forceUpdate} />
            </div>
            <div className="grid grid-cols-5 gap-4 p-4">
                {scrapeRules && scrapeRules.map((scrapeRule, index) => (
                    <div key={scrapeRule.id} className="border flex flex-row rounded-md p-2 items-center justify-between shadow hover:bg-slate-100 transition duration-300">
                        <div className="truncate">
                            {scrapeRule.alias}
                        </div>
                        <EditScrapeRuleSheet scrapeRule={scrapeRule} pageTemplate={pageTemplate} scrapeRules={scrapeRules} parentForceUpdate={forceUpdate} />
                    </div>
                ))}
            </div>
        </div>
    );
}