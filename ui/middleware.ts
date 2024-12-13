import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from "jwt-decode";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    let decoded = null;
    let validToken = false;
    if (token) {
        decoded = jwtDecode(token);
        const exp = decoded.exp;
        if (exp && Date.now() < exp * 1000) {
            validToken = true;
        }
    }

    if (request.nextUrl.pathname.startsWith('/login') && validToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (request.nextUrl.pathname.startsWith('/signup') && validToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (!validToken && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (request.nextUrl.pathname == '/'){
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

}
