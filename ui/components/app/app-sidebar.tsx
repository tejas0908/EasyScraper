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
import { SunMoon, LogOut, BookCopy } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useCookies } from 'react-cookie';
import { useEffect } from "react";

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

  async function handleToggleDarkMode() {
    let theme = localStorage.getItem('theme');
    if (theme == null) {
      if (document.documentElement.classList.value.length > 0) {
        theme = 'dark';
      } else {
        theme = 'light';
      }
    }
    let isDark = theme === 'dark';
    let toggle = !isDark;
    theme = toggle ? 'dark' : 'light';
    document.documentElement.classList.toggle(
      'dark',
      toggle
    )
    localStorage.setItem('theme', theme);
  }

  useEffect(() => {
    console.log('useEffect');
    let theme = localStorage.getItem('theme');
    if (theme == null) {
      if (document.documentElement.classList.value.length > 0) {
        theme = 'dark';
      } else {
        theme = 'light';
      }
    }
    let isDark = theme === 'dark';
    document.documentElement.classList.toggle(
      'dark',
      isDark
    )
    localStorage.setItem('theme', theme);
  }, []);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>EasyScraper</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive>
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
            <SidebarMenuButton onClick={handleToggleDarkMode}>
              <SunMoon />
              <span>Toggle Dark / Light Mode</span>
            </SidebarMenuButton>
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
