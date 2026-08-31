declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    SOCLAAS_API_KEY: string;
    SOCLAAS_MODEL?: string;
    SOCLAAS_BASE_URL?: string;
  }
}
