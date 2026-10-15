/**
 * Auth 域公开路由（M4）—— middleware / Chrome / AuthGate 三处消费的唯一事实源
 * 公开路由：无 Sidebar/Topbar 壳的全屏页；未登录可访问
 */
export const AUTH_ROUTES = ["/login", "/mfa", "/register"] as const;

/** 登录后默认落点 */
export const AUTH_HOME = "/dashboard";
