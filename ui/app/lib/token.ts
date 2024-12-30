"use client";

import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

export function useToken() {
  const router = useRouter();

  const getToken = () => {
    const cookieToken = Cookies.get("token") || "";
    let invalidToken = false;
    if (cookieToken.length == 0) {
      invalidToken = true;
    }
    if (!invalidToken) {
      const decoded = jwtDecode(cookieToken);
      const exp = decoded.exp;
      if (exp && Date.now() > exp * 1000) {
        invalidToken = true;
      }
    }
    if (invalidToken) {
      Cookies.remove("token");
      router.push(`/login`);
    }
    return `Bearer ${cookieToken}`;
  };
  return getToken;
}
