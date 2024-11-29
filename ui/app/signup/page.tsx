'use client';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react";
import { useRouter } from 'next/navigation'
import { useCookies } from 'react-cookie';

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
        <div className="grid grid-cols-[1fr,300px,1fr] h-screen grid-rows-[1fr,350px,1fr] bg-slate-50">
            <div className="bg-white rounded-sm col-start-2 row-start-2 border p-4">
                <div className="pt-4">
                    <Label htmlFor="username">Username</Label>
                    <Input type="text" id="username" value={username} onChange={handleUsernameChange} placeholder="Username" />
                </div>
                <div className="pt-4">
                    <Label htmlFor="password">Password</Label>
                    <Input type="password" id="password" value={password} onChange={handlePasswordChange} placeholder="Password" />
                </div>
                <div className="pt-4">
                    <Label htmlFor="confirmpassword">Confirm Password</Label>
                    <Input type="password" id="confirmpassword" value={confirmPassword} onChange={handleConfirmPasswordChange} placeholder="Confirm Password" />
                </div>
                <div className="pt-6 grid grid-cols-[1fr,100px,1fr]">
                    <Button className="col-start-2" onClick={handleSignup}>Signup</Button>
                </div>
                <div>
                    <span className="text-red-500">{error}</span>
                </div>
            </div>
        </div>
    );
}