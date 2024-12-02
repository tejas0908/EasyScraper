'use client';

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react";
import { useRouter } from 'next/navigation'
import { useCookies } from 'react-cookie';
import { buttonVariants } from "@/components/ui/button"
import Link from 'next/link'
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Loader2 } from "lucide-react"

export default function Login() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<{
        username: string|null;
        password: string|null;
        server: string|null;
    }>({
        username: null,
        password: null,
        server: null
    });
    const [cookies, setCookie] = useCookies(['token']);
    const [pendingLogin, setPendingLogin] = useState(false);

    function handleUsernameChange(e: any) {
        const uname = e.target.value;
        if(uname.length >=6 && uname.length <=20){
            setError({
                ...error,
                username: null
            });
        }else{
            setError({
                ...error,
                username: "Username should be between 6 and 20 characters"
            });
        }
        setUsername(uname);
    }

    function handlePasswordChange(e: any) {
        const pass = e.target.value;
        if(pass.length >=6 && pass.length <=500){
            setError({
                ...error,
                password: null
            });
        }else{
            setError({
                ...error,
                password: "Password should be between 6 and 500 characters"
            });
        }
        setPassword(pass);
    }

    async function handleLogin() {
        setPendingLogin(true);
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": username,
                "password": password
            })
        });
        let response = await data.json();
        if (data.status != 200) {
            if(Array.isArray(response.detail)){
                const temp = response.detail.map((x: { msg: string; }) => x.msg).join('\n');
                setError({
                    ...error,
                    server: temp
                });
            }else{
                setError({
                    ...error,
                    server: response.detail
                });
            }
            setPendingLogin(false);
        }
        else {
            setError({
                ...error,
                server: null
            });
            setCookie('token', response.token);
            router.push("/dashboard");
        }
    }

    return (
        <div className="grid w-screen h-screen grid-cols-[50%,50%]">
            <div className="">
                <div className="flex flex-col justify-between p-12 w-full h-full bg-login-page text-white bg-center bg-cover">
                    <div className="text-2xl">EasyScraper</div>
                    <div className="text-xl">Scraping made easy. Scrape any website without writing code</div>
                </div>
            </div>
            <div className="flex flex-col justify-center items-center space-y-2">
                <div className="text-2xl font-bold">Login to EasyScraper</div>
                <div className="text-sm pb-4">Enter your username and password below</div>

                <div className="w-64">
                    <Input type="text" id="username" value={username} onChange={handleUsernameChange} placeholder="Username" />
                </div>

                <div className="w-64">
                    <Input type="password" id="password" value={password} onChange={handlePasswordChange} placeholder="Password" />
                </div>
                { error.username || error.password || error.server ? (
                <div>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error.username}
                        </AlertDescription>
                        <AlertDescription>
                            {error.password}
                        </AlertDescription>
                        <AlertDescription>
                            {error.server}
                        </AlertDescription>
                    </Alert>
                </div>
                ) : (<div></div>)}
                <div className="flex space-x-6 pt-4">
                    <Link href="/signup" className={buttonVariants({ variant: "outline" })}>Sign Up</Link>
                    <Button onClick={handleLogin} disabled={error.username != null || error.password != null}>
                        {pendingLogin && <Loader2 className="animate-spin"/>}
                        Login
                    </Button>
                </div>
            </div>
        </div>
    );
}