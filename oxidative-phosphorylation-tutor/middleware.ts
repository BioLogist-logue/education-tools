import { NextRequest, NextResponse } from "next/server";

const REALM = "BioLogist Teacher Dashboard";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/teacher-demo")) {
    return NextResponse.next();
  }

  const password = process.env.TEACHER_DEMO_PASSWORD;
  const username = process.env.TEACHER_DEMO_USER || "teacher";
  const isProduction = process.env.NODE_ENV === "production";

  if (!password) {
    if (isProduction) {
      return new NextResponse("Teacher dashboard password is not configured.", {
        status: 503,
        headers: { "Cache-Control": "no-store" }
      });
    }
    return NextResponse.next();
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = decodeBasicAuth(authorization.slice("Basic ".length));
  if (!decoded) {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(":");
  const submittedUser = decoded.slice(0, separatorIndex);
  const submittedPassword = decoded.slice(separatorIndex + 1);

  if (separatorIndex < 0 || submittedUser !== username || submittedPassword !== password) {
    return unauthorized();
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function decodeBasicAuth(encoded: string) {
  try {
    return atob(encoded);
  } catch {
    return null;
  }
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": "Basic realm=\"" + REALM + "\", charset=\"UTF-8\"",
      "Cache-Control": "no-store"
    }
  });
}

export const config = {
  matcher: ["/teacher-demo/:path*"]
};
