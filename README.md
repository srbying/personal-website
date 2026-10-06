# Steven Byington Portfolio

A personal portfolio website focused on presenting my resume, experience, selected projects, and contact information clearly.

## Development

- `npm run dev` starts the Astro development server.
- `npm run build` creates the production static build.
- `npm run preview` serves the built site locally.
- `npm run dev:worker` runs the Cloudflare backend locally at `http://127.0.0.1:8787`.
- `npm run deploy:worker` publishes the backend to Cloudflare after Wrangler authentication.
- `npm run test:acceptance` checks the launch shell acceptance criteria.
- `npm run test:assets` checks the launch asset manifest and public asset paths.
- `npm run test:knowledge` checks the local approved-note sync workflow and its adapters.
- `npm run test:worker` checks Worker requests, digest scheduling, delivery, and retention.
- `npm run test:portfolio-chat` checks browser chat message limits.

## Portfolio chat

The Cloudflare backend lives in `workers/steven-assistant/`. Its chat endpoint validates bounded conversations, retrieves approved evidence, and uses Workers AI to write concise answers grounded only in relevant passages. Questions with no sufficiently relevant evidence receive the fixed insufficient-information response; negative-fit questions receive a fixed response. Conversation history is not part of the knowledge sync workflow.

The Worker sends private chat digests during the 8 a.m. `America/New_York` hour. Resend is a candidate provider behind a server-side adapter; sending requires `RESEND_API_KEY`, `RESEND_FROM`, `DIGEST_RECIPIENT`, and `RESEND_WEBHOOK_SECRET`. Its delivery webhook posts to `/webhooks/resend`; only verified `email.delivered` events retire included exchanges. Configure sender details and production secrets only after reviewing provider terms, delivery events, and free-tier eligibility. The public chat API does not expose these settings or transcript access.

## Local knowledge maintenance

Knowledge source files and sync state belong outside this repository, by default in `~/Documents/personal-website-knowledge/`. Copy `workers/steven-assistant/.dev.vars.example` to the ignored `workers/steven-assistant/.dev.vars` and fill in local runtime values. The example contains variable names and placeholders only. Set the Worker runtime variables through Cloudflare settings for production; do not put their values in tracked files or `wrangler.jsonc`.

Use `npm run knowledge:sync -- validate` to check approved notes locally and `npm run knowledge:sync -- preview` to see additions, edits, and removals without contacting Cloudflare. `sync` and `rebuild` show the same plan and proceed only after the exact text `APPLY` is entered. `verify` checks known IDs in Vectorize; `query "..."` is read-only. The approved collection and `.sync/manifest.json` stay outside the repository and Astro build.
