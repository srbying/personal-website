/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA4_MEASUREMENT_ID?: string;
  readonly PUBLIC_MICROSOFT_CLARITY_PROJECT_ID?: string;
  readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
