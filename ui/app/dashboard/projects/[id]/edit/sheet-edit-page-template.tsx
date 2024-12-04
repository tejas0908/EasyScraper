import { Project, PageTemplate } from "@/app/lib/types";
import { useCookies } from 'react-cookie';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Loader2, Edit, Plus } from "lucide-react"

export function EditPageTemplateSheet({ pageTemplate, parentForceUpdate }: { pageTemplate: PageTemplate | null, parentForceUpdate: any }) {
    const [cookies, setCookie] = useCookies(['token']);
    return (
        <Sheet>
            {pageTemplate && <SheetTrigger asChild>
                <Button className="col-start-3"><Edit /> Edit Page Template</Button>
            </SheetTrigger>}
            {!pageTemplate && <SheetTrigger asChild>
                <Button className="col-start-3"><Plus />Page Template</Button>
            </SheetTrigger>}

            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Delete Project</SheetTitle>
                    <SheetDescription>
                        Are you sure you want to delete this project?
                    </SheetDescription>
                </SheetHeader>

                <SheetFooter className='pt-4'>
                    <SheetClose asChild>
                        <Button variant="destructive">Delete Project</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}