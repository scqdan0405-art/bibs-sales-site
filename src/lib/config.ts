export type AppConfig = {
  env: string;
  baseUrl: string;
  port: number;
  sessionSecret: string;
  adminEmail: string;
  adminPassword: string;
  mailFrom: string;
  mailAdminTo: string;
  uploadDir: string;
  uploadRetentionDays: number;
  logRetentionDays: number;
  analyticsId: string;
};

export function getConfig(): AppConfig {
  return {
    env: process.env.APP_ENV ?? "development",
    baseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
    port: Number(process.env.APP_PORT ?? "3000"),
    sessionSecret: process.env.SESSION_SECRET ?? "development-session-secret-change-before-production",
    adminEmail: process.env.ADMIN_EMAIL ?? "admin@example.invalid",
    adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeThisPassword123",
    mailFrom: process.env.MAIL_FROM ?? "no-reply@example.invalid",
    mailAdminTo: process.env.MAIL_ADMIN_TO ?? "admin@example.invalid",
    uploadDir: process.env.UPLOAD_DIR ?? "./data/uploads",
    uploadRetentionDays: Number(process.env.UPLOAD_RETENTION_DAYS ?? "90"),
    logRetentionDays: Number(process.env.LOG_RETENTION_DAYS ?? "90"),
    analyticsId: process.env.ANALYTICS_ID ?? ""
  };
}
