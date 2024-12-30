"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import GithubLogoWhite from "../../public/github-mark-white.svg";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ [key: string]: string | null }>({
    username: null,
    password: null,
    server: null,
  });
  const [, setCookie] = useCookies(["token"]);
  const [pendingLogin, setPendingLogin] = useState(false);
  const [pendingGithubLogin, setPendingGithubLogin] = useState(false);

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

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const uname = e.target.value;
    if (uname.length >= 6 && uname.length <= 20) {
      registerError("username", null);
    } else {
      registerError(
        "username",
        "Username should be between 6 and 20 characters",
      );
    }
    setUsername(uname);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const pass = e.target.value;
    if (pass.length >= 6 && pass.length <= 500) {
      registerError("password", null);
    } else {
      registerError(
        "password",
        "Password should be between 6 and 500 characters",
      );
    }
    setPassword(pass);
  }

  async function handleLogin() {
    setPendingLogin(true);
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      },
    );
    const response = await data.json();
    if (data.status != 200) {
      if (Array.isArray(response.detail)) {
        const temp = response.detail
          .map((x: { msg: string }) => x.msg)
          .join("\n");
        registerError("server", temp);
      } else {
        registerError("server", response.detail);
      }
      setPendingLogin(false);
    } else {
      registerError("server", null);
      setCookie("token", response.token, { path: "/" });
      router.push("/dashboard");
    }
  }

  async function handleGithubLogin() {
    setPendingGithubLogin(true);
    const scope = "user:email";
    redirect(
      `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=${scope}`,
    );
  }

  return (
    <div className="grid h-screen w-screen grid-cols-1 md:grid-cols-[50%,50%]">
      <div className="hidden h-full w-full flex-col justify-between bg-gradient-to-r from-black via-slate-400 via-70% p-12 text-white md:flex">
        <div className="text-2xl">EasyScraper</div>
        <div className="text-xl">
          Scraping made easy. Scrape any website without writing code
        </div>
      </div>
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="text-2xl font-bold">Login to EasyScraper</div>
        <div className="pb-4 text-sm">
          Enter your username and password below
        </div>

        <div className="w-64">
          <Input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Username"
            className={error.username ? "border-red-500" : ""}
          />
          <div className="text-xs text-red-500">{error.username}</div>
        </div>

        <div className="w-64">
          <Input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Password"
            className={error.password ? "border-red-500" : ""}
          />
          <div className="text-xs text-red-500">{error.password}</div>
        </div>
        {error.server ? (
          <div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error.server}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <div></div>
        )}
        <div className="flex space-x-6 pt-4">
          <Link
            href="/signup"
            className={`${buttonVariants({
              variant: "outline",
            })} transition duration-0 hover:scale-105`}
          >
            Sign Up
          </Link>
          <Button
            className="transition duration-0 hover:scale-105"
            onClick={handleLogin}
            disabled={
              hasErrors() ||
              pendingLogin ||
              username.length == 0 ||
              password.length == 0
            }
          >
            {pendingLogin && <Loader2 className="animate-spin" />}
            Login
          </Button>
        </div>
        <div className="pt-2">
          <Button onClick={handleGithubLogin} disabled={pendingGithubLogin}>
            <Image
              src={GithubLogoWhite}
              alt=""
              className="h-5 w-5 text-white"
            />
            Login with Github
            {pendingGithubLogin && <Loader2 className="animate-spin" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
