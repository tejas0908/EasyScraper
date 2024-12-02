'use client';

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react";
import { useRouter } from 'next/navigation'
import { useCookies } from 'react-cookie';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from 'next/link'
import { buttonVariants } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function Signup() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<{
        username: string | null;
        password: string | null;
        confirmPassword: string | null;
        server: string | null;
    }>({
        username: null,
        password: null,
        confirmPassword: null,
        server: null
    });
    const [cookies, setCookie] = useCookies(['token']);
    const [pendingSignup, setPendingSignup] = useState(false);

    function handleUsernameChange(e: any) {
        const uname = e.target.value;
        if (uname.length >= 6 && uname.length <= 20) {
            setError({
                ...error,
                username: null
            });
        } else {
            setError({
                ...error,
                username: "Username should be between 6 and 20 characters"
            });
        }
        setUsername(uname);
    }

    function handlePasswordChange(e: any) {
        const pass = e.target.value;
        if (pass.length >= 6 && pass.length <= 500) {
            setError({
                ...error,
                password: null
            });
        } else {
            setError({
                ...error,
                password: "Password should be between 6 and 500 characters"
            });
        }
        setPassword(pass);
    }

    function handleConfirmPasswordChange(e: any) {
        const pass = e.target.value;
        if (pass.length >= 6 && pass.length <= 500) {
            setError({
                ...error,
                confirmPassword: null
            });
        } else {
            setError({
                ...error,
                confirmPassword: "Password should be between 6 and 500 characters"
            });
        }
        setConfirmPassword(pass);
    }

    async function handleSignup() {
        setPendingSignup(true);
        if (confirmPassword != password) {
            setError({
                ...error,
                confirmPassword: "Passwords do not match"
            });
            return;
        }
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signup`, {
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
            if (Array.isArray(response.detail)) {
                const temp = response.detail.map((x: { msg: string; }) => x.msg).join('\n');
                setError({
                    ...error,
                    server: temp
                });
            } else {
                setError({
                    ...error,
                    server: response.detail
                });
            }
            setPendingSignup(false);
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
        <div className="grid w-screen h-screen md:grid-cols-[50%,50%] grid-cols-1">
            <div className="flex-col justify-between p-12 w-full h-full bg-login-page text-white bg-center bg-cover md:flex hidden">
                <div className="text-2xl">EasyScraper</div>
                <div className="text-xl">Scraping made easy. Scrape any website without writing code</div>
            </div>
            <div className="flex flex-col justify-center items-center space-y-2">
                <div className="text-2xl font-bold">Create an account</div>
                <div className="text-sm pb-4">Enter your username and password below</div>

                <div className="w-64">
                    <Input type="text" id="username" value={username} onChange={handleUsernameChange} placeholder="Username" />
                </div>

                <div className="w-64">
                    <Input type="password" id="password" value={password} onChange={handlePasswordChange} placeholder="Password" />
                </div>

                <div className="w-64">
                    <Input type="password" id="confirmpassword" value={confirmPassword} onChange={handleConfirmPasswordChange} placeholder="Confirm Password" />
                </div>
                {error.username || error.password || error.server ? (
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
                    <Link href="/login" className={buttonVariants({ variant: "outline" })}>Login</Link>
                    <Button onClick={handleSignup} disabled={error.username != null || error.password != null || pendingSignup}>
                        {pendingSignup && <Loader2 className="animate-spin" />}
                        Sign Up
                    </Button>
                </div>
            </div>
        </div>
    );
}