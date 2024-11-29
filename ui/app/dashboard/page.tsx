'use client';
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { useCookies } from 'react-cookie';

export default function Dashboard() {
    const router = useRouter();
    const [cookies, setCookie, removeCookie] = useCookies(['token']);

    async function handleLogout() {
        removeCookie("token");
        router.push("/login");
    }

    return (
        <div>
            <div>Dashboard Page</div>
            <div>
                <Button onClick={handleLogout}>Logout</Button>
            </div>
        </div>
    );
}