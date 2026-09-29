# Steven Byington Portfolio

A personal portfolio website, focused on presenting my resume, experience, selected projects, and contact information clearly.

## Development

- `npm run dev` starts the Astro development server.
- `npm run build` creates the production static build.
- `npm run preview` serves the built site locally.
- `npm run dev:worker` runs the Cloudflare backend locally at `http://127.0.0.1:8787`.
- `npm run deploy:worker` publishes the backend to Cloudflare after Wrangler authentication.
- `npm run test:acceptance` checks the launch shell acceptance criteria.
- `npm run test:assets` checks the launch asset manifest and public asset paths.

The Cloudflare backend lives in `workers/steven-assistant/`. Its chat endpoint validates a bounded conversation, retrieves only the approved professional-role sentence, and returns a fixed third-person answer or a missing-information response. The homepage chat wording is a candidate and needs Steven's approval before production; this implementation does not deploy the Worker. The Worker source and configuration are separate from the Astro site build.

Before running `npm run dev:worker`, `npm run knowledge:demo`, or `npm run test:knowledge`, copy `workers/steven-assistant/.dev.vars.example` to `workers/steven-assistant/.dev.vars` and replace its placeholders with local settings. `.dev.vars` is gitignored. Set the same binding names in the Cloudflare Worker runtime environment before deployment; do not put their values in `wrangler.jsonc` or tracked files. The Worker fails closed with a service-unavailable response when required configuration is missing or invalid.
