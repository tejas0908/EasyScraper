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
    const [error, setError] = useState<{ [key: string]: string | null }>({
        username: null,
        password: null,
        server: null
    });
    const [, setCookie] = useCookies(['token']);
    const [pendingLogin, setPendingLogin] = useState(false);

    function registerError(field: string, message: string | null) {
        setError({
            ...error,
            [field]: message
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

    function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const uname = e.target.value;
        if (uname.length >= 6 && uname.length <= 20) {
            registerError("username", null);
        } else {
            registerError("username", "Username should be between 6 and 20 characters");
        }
        setUsername(uname);
    }

    function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
        const pass = e.target.value;
        if (pass.length >= 6 && pass.length <= 500) {
            registerError("password", null);
        } else {
            registerError("password", "Password should be between 6 and 500 characters");
        }
        setPassword(pass);
    }

    async function handleLogin() {
        setPendingLogin(true);
        const data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "username": username,
                "password": password
            })
        });
        const response = await data.json();
        if (data.status != 200) {
            if (Array.isArray(response.detail)) {
                const temp = response.detail.map((x: { msg: string; }) => x.msg).join('\n');
                registerError("server", temp);
            } else {
                registerError("server", response.detail);
            }
            setPendingLogin(false);
        }
        else {
            registerError("server", null);
            setCookie('token', response.token);
            router.push("/dashboard");
        }
    }

    return (
        <div className="grid w-screen h-screen md:grid-cols-[50%,50%] grid-cols-1">
            <div className="flex-col justify-between p-12 w-full h-full text-white md:flex hidden bg-gradient-to-r from-black via-slate-400 via-70%">
                <div className="text-2xl">EasyScraper</div>
                <div className="text-xl">Scraping made easy. Scrape any website without writing code</div>
            </div>
            <div className="flex flex-col justify-center items-center space-y-2">
                <div className="text-2xl font-bold">Login to EasyScraper</div>
                <div className="text-sm pb-4">Enter your username and password below</div>

                <div className="w-64">
                    <Input type="text" id="username" value={username} onChange={handleUsernameChange} placeholder="Username" className={error.username ? 'border-red-500' : ''} />
                    <div className="text-red-500 text-xs">{error.username}</div>
                </div>

                <div className="w-64">
                    <Input type="password" id="password" value={password} onChange={handlePasswordChange} placeholder="Password" className={error.password ? 'border-red-500' : ''} />
                    <div className="text-red-500 text-xs">{error.password}</div>
                </div>
                {error.server ? (
                    <div>
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {error.server}
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (<div></div>)}
                <div className="flex space-x-6 pt-4">
                    <Link href="/signup" className={`${buttonVariants({ variant: "outline" })} hover:scale-105 transition duration-0`}>Sign Up</Link>
                    <Button className="hover:scale-105 transition duration-0" onClick={handleLogin} disabled={hasErrors() || pendingLogin || username.length == 0 || password.length == 0}>
                        {pendingLogin && <Loader2 className="animate-spin" />}
                        Login
                    </Button>
                </div>
            </div>
        </div>
    );
}