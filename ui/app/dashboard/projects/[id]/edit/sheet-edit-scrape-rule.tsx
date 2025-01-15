import { PageTemplate, ScrapeRule } from "@/app/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Plus, CircleHelp, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DispatchWithoutAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { useToken } from "@/app/lib/token";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch"

export function EditScrapeRuleSheet({
  scrapeRule,
  pageTemplate,
  scrapeRules,
  parentForceUpdate
}: {
  scrapeRule: ScrapeRule | null;
  pageTemplate: PageTemplate;
  scrapeRules: ScrapeRule[];
  parentForceUpdate: DispatchWithoutAction;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<{ [key: string]: string | null }>({
    alias: null,
    description: null,
    server: null,
  });
  const [pendingSave, setPendingSave] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [pendingGenerateValue, setPendingGenerateValue] = useState(false);
  const id = scrapeRule ? scrapeRule.id : null;
  const [alias, setAlias] = useState(scrapeRule ? scrapeRule.alias : "");
  const [description, setDescription] = useState(
    scrapeRule ? scrapeRule.description : "",
  );
  const [type, setType] = useState(scrapeRule ? scrapeRule.type : "SINGLE");
  const [value, setValue] = useState(scrapeRule ? scrapeRule.value : "");
  const [downloadAsImage, setDownloadAsImage] = useState(scrapeRule ? scrapeRule.download_as_image : false);
  const [aiAlias, setAiAlias] = useState(scrapeRule ? scrapeRule.alias : "");
  const [aiDescription, setAiDescription] = useState(
    scrapeRule ? scrapeRule.description : "",
  );
  const [generatedValue, setGeneratedValue] = useState("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const getToken = useToken();

  useEffect(() => {
    if (id == null && open == true){
      setAlias("");
      setDescription("");
      setType("SINGLE");
      setValue("");
      setAiAlias("");
      setAiDescription("");
      setGeneratedValue("");
    }
    if (pageTemplate.output_type == "PAGE_SOURCE") {
      setAlias("urls");
      setType("MULTI");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  function handleAliasChange(e: React.ChangeEvent<HTMLInputElement>) {
    const talias = e.target.value;
    if (talias.length >= 3 && talias.length <= 100) {
      registerError("alias", null);
    } else {
      registerError("alias", "Alias should be between 3 and 100 characters");
    }
    setAlias(talias);
    setAiAlias(talias);
  }

  function handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const tdesc = e.target.value;
    if (tdesc.length >= 3 && tdesc.length <= 500) {
      registerError("description", null);
    } else {
      registerError(
        "description",
        "Description should be between 3 and 500 characters",
      );
    }
    setDescription(tdesc);
    setAiDescription(tdesc);
  }

  function handleAIAliasChange(e: React.ChangeEvent<HTMLInputElement>) {
    const talias = e.target.value;
    setAiAlias(talias);
  }

  function handleAIDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const tdesc = e.target.value;
    setAiDescription(tdesc);
  }

  function handleTypeChange(e: string) {
    setType(e);
  }

  function endsWithTextFunction(str: string) {
    const regex = /\/text\(\)$/;
    return regex.test(str);
  }

  function endsWithAtSomeValue(str: string) {
    const regex = /\/@[\w\-]+$/;
    return regex.test(str);
  }

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const tvalue = e.target.value;
    if (tvalue.length >= 3 && tvalue.length <= 1000) {
      if (pageTemplate.scraper == "XPATH_SELECTOR"){
        if (endsWithTextFunction(tvalue) || endsWithAtSomeValue(tvalue)){
          registerError("value", null);
        }else{
          registerError("value", "xpath should end with /text() or @<attr>");
        }
      }else{
        registerError("value", null);
      }
    } else {
      registerError("value", "Value should be less than 1000 characters");
    }
    setValue(tvalue);
  }

  function handleDownloadAsImageChange(e: boolean){
    setDownloadAsImage(e);
  }

  async function handleSaveScrapeRule() {
    setPendingSave(true);
    let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules`;
    let method = "post";
    if (id != null) {
      url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules/${id}`;
      method = "put";
    }
    const body: Record<string, string | boolean> = {
      alias: alias,
      description: description,
      type: type,
      value: value,
      download_as_image: downloadAsImage
    };
    if (alias.length < 3 || alias.length > 100) {
      registerError("alias", "Alias should be between 3 and 100 characters");
      setPendingSave(false);
      return;
    }
    const data = await fetch(url, {
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
      toast.success(`Scrape Rule '${alias}' saved`);
    }
  }

  async function handleDeleteScrapeRule() {
    setPendingDelete(true);
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules/${id}`,
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
      toast.success(`Scrape Rule '${alias}' deleted`);
    }
  }

  async function handleGenerateValue() {
    setPendingGenerateValue(true);
    setGeneratedValue("");
    const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/projects/${pageTemplate.project_id}/page_templates/${pageTemplate.id}/scrape_rules_generate_value`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: getToken(),
      },
      body: JSON.stringify({
        url: pageTemplate.example_url,
        alias: aiAlias,
        description: aiDescription,
        value_type: pageTemplate.scraper
      }),
    });
    if (data.status == 200) {
      setPendingGenerateValue(false);
      const response = await data.json();
      setGeneratedValue(response.value);
    }
  }

  async function handleAcceptValue() {
    setValue(generatedValue);
    setGenerateOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {scrapeRule && (
        <SheetTrigger asChild>
          <div className="col-start-3 flex justify-end">
            <Button variant="outline" size="icon">
              <Edit />
            </Button>
          </div>
        </SheetTrigger>
      )}
      {!scrapeRule && (
        <SheetTrigger asChild>
          <Button
            disabled={
              pageTemplate.output_type == "PAGE_SOURCE" &&
              scrapeRules.length > 0
            }
            className="col-start-3"
          >
            <Plus />
            Scrape Rule
          </Button>
        </SheetTrigger>
      )}

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Scrape Rule</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 p-2">
          <div>
            <Label>Alias</Label>
            <Input
              disabled={pageTemplate.output_type == "PAGE_SOURCE"}
              type="text"
              value={alias}
              onChange={handleAliasChange}
              className={error.alias ? "border-red-500" : ""}
            ></Input>
            <div className="text-xs text-red-500">{error.alias}</div>
            <div className="mt-2 flex items-center space-x-2 rounded-lg border bg-slate-100 p-2 dark:bg-slate-500">
              <CircleHelp className="h-4" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-white">
                  Name of the field to scrape. Will be the column name in the
                  output files. Also used by LLM during scraping
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-2">
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={handleDescriptionChange}
              className={error.description ? "border-red-500" : ""}
            ></Textarea>
            <div className="text-xs text-red-500">{error.description}</div>
            <div className="mt-2 flex items-center space-x-2 rounded-lg border bg-slate-100 p-2 dark:bg-slate-500">
              <CircleHelp className="h-4" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-white">
                  Description of the field to scrape. Will help while generating
                  Xpaths or CSS selectors using AI
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 p-2">
          <div>
            <Label>Type</Label>
            <Select
              disabled={pageTemplate.output_type == "PAGE_SOURCE"}
              value={type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE">Single</SelectItem>
                <SelectItem value="MULTI">Multi</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-red-500">{error.type}</div>
            <div className="mt-2 flex items-center space-x-2 rounded-lg border bg-slate-100 p-2 dark:bg-slate-500">
              <CircleHelp className="h-4" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-white">
                  <b>Single</b> = The value which is scraped is a single value
                </span>
                <span className="text-xs text-slate-700 dark:text-white">
                  <b>Multi</b> = The value which is scraped is a list of values
                </span>
              </div>
            </div>
          </div>
        </div>
        {pageTemplate.scraper != "AI_SCRAPER" && (
          <div className="space-y-2 p-2">
            <div>
              <Label>Value</Label>
              <div className="flex space-x-1">
                <Input
                  type="text"
                  value={value}
                  onChange={handleValueChange}
                  className={error.value ? "border-red-500" : ""}
                />
                {pageTemplate.scraper == "XPATH_SELECTOR" && (
                  <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="border">
                      <Sparkles className="h-2 w-2 text-purple-600" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Value</DialogTitle>
                      <DialogDescription>
                        Generate an Xpath or CSS selector using AI
                      </DialogDescription>
                      <div className="space-y-2">
                        <div>
                          <Label>Alias</Label>
                          <Input
                            type="text"
                            value={aiAlias}
                            onChange={handleAIAliasChange}
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={aiDescription}
                            onChange={handleAIDescriptionChange}
                          />
                        </div>
                        <div>
                          <Label>Value</Label>
                          <Textarea
                            value={generatedValue}
                            disabled={generatedValue.length == 0}
                            className={generatedValue.length == 0 ? "bg-slate-100": "bg-purple-200"}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleGenerateValue}
                            disabled={
                              pendingGenerateValue ||
                              aiAlias.length == 0 ||
                              aiDescription.length == 0
                            }
                          >
                            {pendingGenerateValue && (
                              <Loader2 className="animate-spin" />
                            )}
                            Generate
                          </Button>
                          <Button
                            onClick={handleAcceptValue}
                            disabled={generatedValue.length == 0}
                            variant="outline"
                            className="border-green-500"
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="text-xs text-red-500">{error.value}</div>
            </div>
            <div className="mt-2 flex items-center space-x-2 rounded-lg border bg-slate-100 p-2 dark:bg-slate-500">
              <CircleHelp className="h-4" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-white">
                  This is either the xpath or the css selector
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 p-2">
          <div>
            <div className="flex flex-col space-y-2">
              <Label>Download as Image?</Label>
              <Switch checked={downloadAsImage} onCheckedChange={handleDownloadAsImageChange}/>
            </div>
            <div className="text-xs text-red-500">{error.type}</div>
            <div className="mt-2 flex items-center space-x-2 rounded-lg border bg-slate-100 p-2 dark:bg-slate-500">
              <CircleHelp className="h-4" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-white">
                  Consider the scraped value as an image url and download during scraping
                </span>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="px-2 pt-4">
          <Button
            onClick={handleSaveScrapeRule}
            disabled={pendingSave || hasErrors() || alias.length == 0}
          >
            {pendingSave && <Loader2 className="animate-spin" />}
            Save
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteScrapeRule}
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
