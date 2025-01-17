import { Project, PageTemplate, SeedPage } from "@/app/lib/types";
import { useToken } from "@/app/lib/token";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Plus, CircleHelp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DispatchWithoutAction, useState } from "react";
import validator from "validator";
import { toast } from "sonner";

export function EditSeedPageSheet({
  seedPage,
  project,
  pageTemplates,
  parentForceUpdate,
}: {
  seedPage: SeedPage | null;
  project: Project;
  pageTemplates: PageTemplate[];
  parentForceUpdate: DispatchWithoutAction;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ [key: string]: string | null }>({
    url: null,
    pageTemplate: null,
    server: null,
  });
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const id = seedPage ? seedPage.id : null;
  const [url, setUrl] = useState(seedPage ? seedPage.url : "");
  const [pageTemplateId, setPageTemplateId] = useState(
    seedPage ? seedPage.page_template_id : "",
  );
  const getToken = useToken();

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

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const turl = e.target.value;
    if (turl.length > 0) {
      if (validator.isURL(turl)) {
        registerError("url", null);
      } else {
        registerError("url", "Invalid Url");
      }
    } else {
      registerError("url", "URL is mandatory");
    }
    setUrl(turl);
  }

  function handlePageTemplateChange(e: string) {
    setPageTemplateId(e);
  }

  async function handleSaveSeedPage() {
    setPendingSave(true);
    let turl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/seed_pages`;
    let method = "post";
    if (id != null) {
      turl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/seed_pages/${id}`;
      method = "put";
    }
    const body: Record<string, string> = {
      url: url,
      page_template_id: pageTemplateId,
    };
    const data = await fetch(turl, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken(),
      },
      body: JSON.stringify(body),
    });
    if (data.status == 200) {
      parentForceUpdate();
      setPendingSave(false);
      setOpen(false);
      toast.success(`Seed Page saved`);
    }
  }

  async function handleDeleteSeedPage() {
    setPendingDelete(true);
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${project.id}/seed_pages/${id}`,
      {
        method: "delete",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      },
    );
    if (data.status == 200) {
      parentForceUpdate();
      setPendingDelete(false);
      setOpen(false);
      toast.success(`Seed Page deleted`);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {seedPage && (
        <SheetTrigger asChild>
          <div className="col-start-3 flex justify-end">
            <Button variant="outline" size="icon">
              <Edit />
            </Button>
          </div>
        </SheetTrigger>
      )}
      {!seedPage && (
        <SheetTrigger asChild>
          <Button className="col-start-3">
            <Plus />
            Seed Page
          </Button>
        </SheetTrigger>
      )}

      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Seed Page</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 p-2">
          <div>
            <Label>Url</Label>
            <Input
              type="text"
              value={url}
              onChange={handleUrlChange}
              className={error.url ? "border-red-500" : ""}
            ></Input>
            <div className="text-xs text-red-500">{error.url}</div>
            <div className="mt-2 flex items-center space-x-2 rounded-lg border bg-slate-100 p-2 dark:bg-slate-500">
              <CircleHelp className="h-4" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-white">
                  URL of the page used to start the scraping
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-2">
          <div>
            <Label>Page Template</Label>
            <Select
              value={pageTemplateId}
              onValueChange={handlePageTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Page Template" />
              </SelectTrigger>
              <SelectContent>
                {pageTemplates.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>
                    {pt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-red-500">{error.pageTemplate}</div>
            <div className="mt-2 flex items-center space-x-2 rounded-lg border bg-slate-100 p-2 dark:bg-slate-500">
              <CircleHelp className="h-4" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-white">
                  Page template of the above URL
                </span>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="px-2 pt-4">
          <Button
            onClick={handleSaveSeedPage}
            disabled={
              pendingSave ||
              hasErrors() ||
              pageTemplateId.length == 0 ||
              url.length == 0
            }
          >
            {pendingSave && <Loader2 className="animate-spin" />}
            Save
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteSeedPage}
            disabled={pendingDelete || id == null}
          >
            {pendingDelete && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
