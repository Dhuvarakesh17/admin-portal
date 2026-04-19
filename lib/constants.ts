export const SESSION_COOKIE = "jb_admin_session";
export const CSRF_COOKIE = "jb_admin_csrf";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export const ROLE_PERMISSIONS = {
  admin: [
    "all",
    "dashboard:read",
    "jobs:read",
    "applications:read",
    "applications:write",
  ],
} as const;

export const APP_ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  jobs: "/jobs",
  applications: "/applications",
  settings: "/settings",
};
