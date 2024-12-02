import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { AppBreadcrumbs } from "@/components/app/app-breadcrumbs"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AppBreadcrumbs/>
        </header>
        <main>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
