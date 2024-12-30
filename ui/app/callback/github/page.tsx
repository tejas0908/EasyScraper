"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Loading from "../../../public/undraw_loading_65y2.svg";
import Image from "next/image";

export default function GithubCallback() {
  const searchParams = useSearchParams();
  const [, setCookie] = useCookies(["token"]);
  const router = useRouter();
  const code = searchParams.get("code");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/login/github`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: code,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setCookie("token", data.token, { path: "/" });
        router.push("/dashboard");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  return (
    <div className="grid h-screen w-screen grid-cols-[1fr,1fr,1fr] grid-rows-[1fr,1fr,1fr]">
      <Image
        src={Loading}
        alt=""
        className="col-start-2 row-start-2 animate-pulse"
      />
    </div>
  );
}
