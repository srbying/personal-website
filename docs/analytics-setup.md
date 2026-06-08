# Free Analytics And Search Setup

This site uses only free tools for analytics and search readiness:

- Google Search Console
- Google Analytics 4
- Microsoft Clarity

No analytics IDs are hardcoded in source. Scripts render only in production builds when the matching environment variable exists.

## Environment Variables

Set these locally and in production hosting:

```sh
PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_MICROSOFT_CLARITY_PROJECT_ID=your_clarity_project_id
PUBLIC_GOOGLE_SITE_VERIFICATION=your_google_html_meta_token
```

For local checks, create a local env file ignored by git, or export the variables before running `npm run build`. In production hosting, add the same names in the host's environment variable settings, then redeploy.

## Google Analytics 4

1. Open Google Analytics.
2. Create or select an account.
3. Create a GA4 property for `stevenbyington.me`.
4. Add a Web data stream for the site.
5. Copy the Measurement ID that starts with `G-`.
6. Set it as `PUBLIC_GA4_MEASUREMENT_ID`.

Tracked GA4 events:

| Event | When it fires |
| --- | --- |
| `resume_view` | Resume page loads once |
| `resume_download` | Resume PDF links are clicked |
| `contact_click` | Contact page links are clicked |
| `email_click` | Email links are clicked |
| `linkedin_click` | LinkedIn links are clicked |
| `github_click` | GitHub links are clicked |
| `impact_click` | Experience / Selected Impact links are clicked |
| `project_click` | Aeris or SoilOS project links are clicked |

Events send only simple parameters such as `location` and `target`. Do not add email addresses, names, message text, or other sensitive values as GA4 event parameters.

## Microsoft Clarity

1. Open Microsoft Clarity.
2. Create a project for `stevenbyington.me`.
3. Copy the project ID from the install snippet or project settings.
4. Set it as `PUBLIC_MICROSOFT_CLARITY_PROJECT_ID`.

Clarity is not added to development builds.

## Google Search Console

Preferred verification method: DNS TXT.

1. Open Google Search Console.
2. Add a Domain property for `stevenbyington.me`.
3. Copy the DNS TXT record Google provides.
4. Add the DNS TXT record at the domain DNS provider.
5. Return to Search Console and verify after DNS propagation.

HTML meta fallback:

1. Add a URL-prefix property if DNS verification is not available.
2. Choose the HTML meta verification method.
3. Copy only the token from the meta tag's `content` value.
4. Set it as `PUBLIC_GOOGLE_SITE_VERIFICATION`.
5. Redeploy, then verify in Search Console.

## Sitemap

The site generates `sitemap.xml` and `robots.txt`.

After deployment:

1. Open Google Search Console.
2. Select the verified property.
3. Go to Sitemaps.
4. Submit `https://stevenbyington.me/sitemap.xml`.

Important public pages are indexable: home, experience, projects, Aeris, SoilOS, resume, contact, and the resume PDF. The 404 page remains noindex.

## Testing

Local production build without env vars:

```sh
npm run build
npm run test:analytics
```

The built HTML should not contain GA4, Clarity, or Google Search Console verification markup when env vars are absent.

Local production build with placeholder env vars:

```sh
PUBLIC_GA4_MEASUREMENT_ID=G-TEST123456 \
PUBLIC_MICROSOFT_CLARITY_PROJECT_ID=claritytest \
PUBLIC_GOOGLE_SITE_VERIFICATION=google-test-token \
npm run build

PUBLIC_GA4_MEASUREMENT_ID=G-TEST123456 \
PUBLIC_MICROSOFT_CLARITY_PROJECT_ID=claritytest \
PUBLIC_GOOGLE_SITE_VERIFICATION=google-test-token \
npm run test:analytics
```

After deployment, verify:

- GA4 Realtime shows page views and conversion clicks.
- GA4 DebugView shows the custom events when using a debug browser setup.
- Clarity starts receiving visits after production traffic.
- Search Console verifies the property and accepts `sitemap.xml`.
