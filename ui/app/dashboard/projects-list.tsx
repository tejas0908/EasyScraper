"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect, useReducer } from "react";
import { useToken } from "@/app/lib/token";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { Loader2, Book } from "lucide-react";
import validator from "validator";
import Image from "next/image";
import { Project } from "../lib/types";
import EmptyProjects from "../../public/undraw_blank-canvas_a6x5.svg";

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(false);
  const limit = 10;
  const [fetchPending, setFetchPending] = useState(true);
  const getToken = useToken();
  const [projectName, setProjectName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [projectFileBlob, setProjectFileBlob] = useState<Blob>();
  const [projectFile, setProjectFile] = useState<File>();
  const [pendingCreateProject, setPendingCreateProject] = useState(false);
  const [pendingImportProject, setPendingImportProject] = useState(false);
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const router = useRouter();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [error, setError] = useState<{ [key: string]: string | null }>({
    projectName: null,
    websiteUrl: null,
    server: null,
  });

  function registerError(field: string, message: string | null) {
    setError({
      ...error,
      [field]: message,
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

  useEffect(() => {
    setProjects([]);
    setFetchPending(true);
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects?` +
        new URLSearchParams({
          page: String(currentPage),
          limit: String(limit),
          sort_field: "name",
          sort_direction: "asc",
        }).toString(),
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        } as HeadersInit,
      },
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setProjects(data.projects);
        setNextPage(data.paging.next_page);
        setFetchPending(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, ignored]);

  async function handlePageChange(page: number) {
    setCurrentPage(page);
  }

  function handleProjectNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pname = e.target.value;
    if (pname.length >= 3 && pname.length <= 100) {
      registerError("projectName", null);
    } else {
      registerError(
        "projectName",
        "Project name should be between 3 and 100 characters",
      );
    }
    setProjectName(pname);
  }

  function handleWebsiteUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const turl = e.target.value;
    if (turl.length > 0) {
      if (validator.isURL(turl)) {
        registerError("websiteUrl", null);
      } else {
        registerError("websiteUrl", "Invalid Url");
      }
    } else {
      registerError("websiteUrl", "URL is mandatory");
    }
    setWebsiteUrl(turl);
  }

  function handleProjectFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files != null) {
      setProjectFile(e.target.files[0]);
      setProjectFileBlob(e.target.files[0]);
    }
  }

  async function handleCreateProject() {
    setPendingCreateProject(true);
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        } as HeadersInit,
        body: JSON.stringify({
          name: projectName,
          website_url: websiteUrl,
        }),
      },
    );
    if (data.status == 200) {
      const response = await data.json();
      toast.success(`Project '${projectName}' created`);
      setProjectName("");
      setWebsiteUrl("");
      router.push(`/dashboard/projects/${response.id}/edit`);
    }
  }

  async function handleImportProject() {
    setPendingImportProject(true);
    const body = new FormData();
    if (projectFileBlob != null && projectFile != null) {
      console.log(projectFileBlob);
      body.append("file", projectFileBlob, projectFile.name);
    }
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/project-import`,
      {
        method: "post",
        headers: {
          Authorization: getToken(),
        } as HeadersInit,
        body: body,
      },
    );
    if (data.status == 200) {
      await data.json();
      toast.success(`Project imported successfully`);
      setPendingImportProject(false);
      forceUpdate();
      setImportSheetOpen(false);
    }
  }

  function openImportSheet() {
    setImportSheetOpen(true);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Pagination className="justify-end">
          <PaginationContent className="rounded-md border">
            <PaginationItem>
              <PaginationPrevious
                className={
                  currentPage <= 0
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                onClick={() => handlePageChange(currentPage - 1)}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink className="cursor-pointer">
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                className={
                  !nextPage
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
                onClick={() => handlePageChange(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <Plus />
              Project
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>New Scraping Project</SheetTitle>
              <SheetDescription>
                Enter the project&apos;s name and website URL
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-2 pt-4">
              <div>
                <Input
                  type="text"
                  id="name"
                  value={projectName}
                  onChange={handleProjectNameChange}
                  placeholder="Project Name"
                  className={error.projectName ? "border-red-500" : ""}
                />
                <div className="text-xs text-red-500">{error.projectName}</div>
              </div>
              <div>
                <Input
                  type="text"
                  id="name"
                  value={websiteUrl}
                  onChange={handleWebsiteUrlChange}
                  placeholder="Website Url"
                  className={error.websiteUrl ? "border-red-500" : ""}
                />
                <div className="text-xs text-red-500">{error.websiteUrl}</div>
              </div>
            </div>
            <SheetFooter className="pt-4">
              <Button
                onClick={handleCreateProject}
                disabled={
                  pendingCreateProject ||
                  hasErrors() ||
                  projectName.length == 0 ||
                  websiteUrl.length == 0
                }
              >
                {pendingCreateProject && <Loader2 className="animate-spin" />}
                Save changes
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet open={importSheetOpen} onOpenChange={setImportSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openImportSheet} variant="outline">
              <Upload />
              Import
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Import Scraping Project</SheetTitle>
              <SheetDescription>
                Upload a previously exported project file
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 h-10">
              <Input
                className="py-2"
                type="file"
                id="project_file"
                onChange={handleProjectFileChange}
              />
            </div>
            <SheetFooter className="pt-4">
              <Button
                onClick={handleImportProject}
                disabled={pendingImportProject || projectFile == null}
              >
                {pendingImportProject && <Loader2 className="animate-spin" />}
                Import
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3 xl:grid-cols-5">
        {projects.length > 0 &&
          projects.map((project) => (
            <div
              key={project.id}
              className="h-18 grid grid-cols-1 rounded-sm border p-4 shadow-sm"
            >
              <div className="grid grid-cols-[20%,60%,20%] items-center">
                {project.website_favicon_url ? (
                  <Image
                    src={project.website_favicon_url}
                    width={32}
                    height={32}
                    alt=""
                  />
                ) : (
                  <Book />
                )}
                <Link
                  className="truncate hover:underline"
                  href={`/dashboard/projects/${project.id}/edit`}
                >
                  {project.name}
                </Link>
              </div>
            </div>
          ))}
        {fetchPending &&
          Array(10)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="grid h-[60px] grid-cols-1 rounded-sm border p-4 shadow-sm"
              >
                <div className="grid grid-cols-[20%,80%] items-center">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-40" />
                </div>
              </div>
            ))}
      </div>
      {projects.length == 0 && !fetchPending && (
        <div className="grid grid-cols-3 grid-rows-[20%,50%,30%]">
          <div className="col-start-2 row-start-2 space-y-2">
            <Image src={EmptyProjects} alt="" className="" />
            <div className="text-center text-lg font-bold">No Projects Yet</div>
            <div className="text-center text-sm">
              Start by creating a new project
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
