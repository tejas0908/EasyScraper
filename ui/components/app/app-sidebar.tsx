'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Home, LogOut, BookCopy } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useCookies } from 'react-cookie';

const items = [
  {
    title: "Projects",
    url: "/dashboard",
    icon: BookCopy,
  }
]

export function AppSidebar() {
  const router = useRouter();
  const [cookies, setCookie, removeCookie] = useCookies(['token']);

  async function handleLogout() {
    removeCookie("token");
    router.push("/login");
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>EasyScraper</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
