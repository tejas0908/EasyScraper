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
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<{ [key: string]: string | null }>({
        fullName: null,
        username: null,
        password: null,
        confirmPassword: null,
        server: null
    });
    const [cookies, setCookie] = useCookies(['token']);
    const [pendingSignup, setPendingSignup] = useState(false);

    function registerError(field: string, message: string | null) {
        setError({
            ...error,
            [field]: message
        });
    }

    function hasErrors() {
        let hasError = false;
        for (let k in error) {
            if (error[k] != null) {
                hasError = true;
            }
        }
        return hasError;
    }

    function handleFullNameChange(e: any) {
        const fname = e.target.value;
        if (fname.length >= 3 && fname.length <= 500) {
            registerError("fullName", null);
        } else {
            registerError("fullName", "Fullname should be between 3 and 500 characters");
        }
        setFullName(fname);
    }

    function handleUsernameChange(e: any) {
        const uname = e.target.value;
        if (uname.length >= 6 && uname.length <= 20) {
            registerError("username", null);
        } else {
            registerError("username", "Username should be between 6 and 20 characters");
        }
        setUsername(uname);
    }

    function handlePasswordChange(e: any) {
        const pass = e.target.value;
        if (pass.length >= 6 && pass.length <= 500) {
            registerError("password", null);
        } else {
            registerError("password", "Password should be between 6 and 500 characters");
        }
        setPassword(pass);
    }

    function handleConfirmPasswordChange(e: any) {
        const pass = e.target.value;
        if (pass.length >= 6 && pass.length <= 500) {
            if (pass != password) {
                registerError("confirmPassword", "Passwords do not match");
            } else {
                registerError("confirmPassword", null);
            }
        } else {
            registerError("confirmPassword", "Password should be between 6 and 500 characters");
        }
        setConfirmPassword(pass);
    }

    async function handleSignup() {
        setPendingSignup(true);
        let data = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/signup`, {
            method: "post",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "full_name": fullName,
                "username": username,
                "password": password
            })
        });
        let response = await data.json();
        if (data.status != 200) {
            if (Array.isArray(response.detail)) {
                const temp = response.detail.map((x: { msg: string; }) => x.msg).join('\n');
                registerError("server", temp);
            } else {
                registerError("server", response.detail);
            }
            setPendingSignup(false);
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
                <div className="text-2xl font-bold">Create an account</div>
                <div className="text-sm pb-4">Enter your details below</div>

                <div className="w-64">
                    <Input type="text" id="full_name" value={fullName} onChange={handleFullNameChange} placeholder="Full Name" className={error.fullName ? 'border-red-500' : ''} />
                    <div className="text-red-500 text-xs">{error.fullName}</div>
                </div>
                <div className="w-64">
                    <Input type="text" id="username" value={username} onChange={handleUsernameChange} placeholder="Username" className={error.username ? 'border-red-500' : ''} />
                    <div className="text-red-500 text-xs">{error.username}</div>
                </div>

                <div className="w-64">
                    <Input type="password" id="password" value={password} onChange={handlePasswordChange} placeholder="Password" className={error.password ? 'border-red-500' : ''} />
                    <div className="text-red-500 text-xs">{error.password}</div>
                </div>

                <div className="w-64">
                    <Input type="password" id="confirmpassword" value={confirmPassword} onChange={handleConfirmPasswordChange} placeholder="Confirm Password" className={error.confirmPassword ? 'border-red-500' : ''} />
                    <div className="text-red-500 text-xs">{error.confirmPassword}</div>
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
                    <Link href="/login" className={`${buttonVariants({ variant: "outline" })} hover:scale-105 transition duration-0`}>Login</Link>
                    <Button className="hover:scale-105 transition duration-0" onClick={handleSignup} disabled={hasErrors() || pendingSignup || fullName.length == 0 || username.length == 0 || password.length == 0 || confirmPassword.length == 0}>
                        {pendingSignup && <Loader2 className="animate-spin" />}
                        Sign Up
                    </Button>
                </div>
            </div>
        </div>
    );
}