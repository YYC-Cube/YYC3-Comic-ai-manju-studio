import { NextResponse, type NextRequest } from "next/server";

/**
 * 边缘门禁（M4 · B5 落地）+ 安全响应头
 * - 受控路由无 yyc3_session cookie → 307 /login?next=<path>（存在性检查；真伪由 AuthGate 经 manju api 校验）
 * - 已携带 cookie 访问 Auth 页 → 307 /dashboard
 * - 密钥零入库红线保持：本层不验签，校验动作在 manju api（外呼 0379-world 网关）
 * 路由单一事实源：lib/auth-routes.ts（Edge bundle 不可跨层 import，此处保持同步镜像）
 */

const AUTH_ROUTES = ["/login", "/mfa", "/register"];
const AUTH_HOME = "/dashboard";
const SESSION_COOKIE = "yyc3_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isAuthRoute && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = AUTH_HOME;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  // 跳过内置资源与静态目录（图标/演示图不做门禁，避免静态请求被 307）
  matcher: ["/((?!_next/static|_next/image|favicon.ico|yyc3-icons|demo).*)"],
};
