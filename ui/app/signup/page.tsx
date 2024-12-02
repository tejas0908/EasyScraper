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

export default function Signup() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [cookies, setCookie] = useCookies(['token']);

    function handleUsernameChange(e: any) {
        setUsername(e.target.value);
    }

    function handlePasswordChange(e: any) {
        setPassword(e.target.value);
    }

    function handleConfirmPasswordChange(e: any) {
        setConfirmPassword(e.target.value);
    }

    async function handleSignup() {
        if(confirmPassword != password){
            setError("Passwords do not match");
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
            setError(response.detail);
        }
        else {
            setError(null);
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
                { error ? (
                <div>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                </div>
                ) : (<div></div>)}
                <div className="flex space-x-6 pt-4">
                    <Link href="/login" className={buttonVariants({ variant: "outline" })}>Login</Link>
                    <Button onClick={handleSignup}>Signup</Button>
                </div>
            </div>
        </div>
    );
}