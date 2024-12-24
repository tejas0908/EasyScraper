"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";

export function Header() {
  const [dark, setDark] = useState(false);
  const token = Cookies.get("token");
  const [fullName, setFullName] = useState("");
  const [, , removeCookie] = useCookies(["token"]);
  const router = useRouter();

  async function handleToggleDarkMode() {
    let theme = localStorage.getItem("theme");
    if (theme == null) {
      if (document.documentElement.classList.value.length > 0) {
        theme = "dark";
      } else {
        theme = "light";
      }
    }
    const isDark = theme === "dark";
    const toggle = !isDark;
    theme = toggle ? "dark" : "light";
    document.documentElement.classList.toggle("dark", toggle);
    localStorage.setItem("theme", theme);
    setDark(toggle);
  }

  async function handleLogout() {
    removeCookie("token", { path: "/" });
    router.push("/login");
  }

  useEffect(() => {
    let theme = localStorage.getItem("theme");
    if (theme == null) {
      if (document.documentElement.classList.value.length > 0) {
        theme = "dark";
      } else {
        theme = "light";
      }
    }
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
    setDark(isDark);
    interface MyToken {
      full_name: string;
    }
    if (token != null) {
      const decoded = jwtDecode<MyToken>(token);
      setFullName(decoded.full_name);
    }
  }, [token]);

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4 justify-end">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={handleToggleDarkMode}
      >
        {dark ? <Moon /> : <Sun />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="rounded-full">
            <User />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
            <LogOut />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
