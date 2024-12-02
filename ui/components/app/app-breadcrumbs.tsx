'use client';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList
} from "@/components/ui/breadcrumb"

export function AppBreadcrumbs() {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                        Dashboard
                    </BreadcrumbLink>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
}
