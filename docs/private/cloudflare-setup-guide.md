# Learning Cloudflare through the portfolio chatbot

Status: the public Worker and local development loop are verified. The external knowledge folder exists, and the first approved sentence has been embedded with Workers AI, uploaded to the `steven-knowledge` Vectorize index, and retrieved by a related question. A local Worker answer prototype and a homepage chat UI are now implemented, but have not yet been manually exercised or deployed. The public Worker still returns sample JSON; its production behavior is unchanged. Full knowledge sync, transcript storage, email, model-boundary evaluation, and production release remain pending. No paid plan was enabled, and the account plan has not been independently inspected.

The budget is $0. Use Workers Free and models available on that plan. Any limit that prevents a step should be resolved within the free plan or by revisiting the design, rather than enabling a paid service.

## What each piece does

| Piece | Role in this project | What you will learn |
| --- | --- | --- |
| Workers | Receives chat requests and coordinates retrieval and answers | Request handlers, configuration, secrets, and deployment |
| Workers AI | Generates text embeddings and assistant answers | Embedding inputs, model calls, prompts, and usage limits |
| Vectorize | Finds approved information relevant to a visitor's question | Vector indexes, similarity search, and updating stored vectors |
| D1 | Stores temporary conversations and digest delivery state | Database tables, queries, and deletion policies |
| Cron Triggers | Starts scheduled digest and cleanup work | Scheduled handlers, time zones, and retries |
| Wrangler | Connects development on this Mac to Cloudflare | Local development, authentication, deployment, and inspection |
| Resend | Delivers the digest email | Email configuration and delivery confirmation; this is separate from Cloudflare |

Your existing Astro site stays on Vercel. Its chat interface will call the Cloudflare backend. The backend can initially use Cloudflare's provided workers.dev address without onboarding your website domain to Cloudflare. See [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

## Step 1: Create the free account

1. Open [Cloudflare's Workers signup](https://dash.cloudflare.com/sign-up/workers-and-pages).
2. Create your account using an email address you can access.
3. Complete Cloudflare's email verification.
4. Open Workers & Pages in the dashboard. Stay on the Free plan.

This milestone is complete when you can open Workers & Pages in your own verified account. You do not need to create application resources during this step.

Official references: [Create an account](https://developers.cloudflare.com/fundamentals/account/create-account/) and [Workers dashboard setup](https://developers.cloudflare.com/workers/get-started/dashboard/).

## Step 2: Deploy the first simple Worker

Steven completed this milestone and supplied the deployed URL. Cloudflare's [D1 getting-started guide](https://developers.cloudflare.com/d1/get-started/) documents this basic Worker creation flow that does not require connecting GitHub:

1. In Workers & Pages, select **Create application**.
2. Select **Start with Hello World!**, then **Get started** if shown.
3. Name the Worker `steven-assistant`.
4. Keep the starter code and select **Deploy** on the Free plan.
5. Open the provided `workers.dev` address and check for the starter response.

If the dashboard presents different options, record the visible choices before proceeding. Do not connect a repository just to complete this milestone. The goal is to see a request reach code running on Cloudflare and receive its response. The AI and retrieval system will be added in later steps.

Verified endpoint: [steven-assistant.steven-168.workers.dev](https://steven-assistant.steven-168.workers.dev/). The first verified response was `Hello Steven!`. Steven then used `Response.json()` and deployed an update; a subsequent HTTP GET confirmed status 200, `application/json`, and a sample object with nested fields and an array. The sample John Smith data is demonstration data, not approved knowledge about Steven. These checks verify the deployed response, not the exact source code or billing configuration.

### What happens when the address opens

1. The browser sends an HTTP request to the Worker URL.
2. Cloudflare routes that request to the deployed `steven-assistant` Worker.
3. The Worker's `fetch` handler executes on Cloudflare and returns a `Response`.
4. The browser displays the response body: initially `Hello Steven!`, and now a JSON object serialized as text.

The source runs on Cloudflare, so this endpoint remains available when this Mac is off. The browser receives the response rather than executing the Worker source. A deployment publishes a version of the code; each incoming request invokes its handler. Future code edits need another deployment to change the public response.

The chat prototype now sends a question to the Worker. The Worker embeds it, retrieves approved notes, asks the answer model to respond only from those notes, and returns a structured answer or a fixed missing-evidence response. This local path has not yet been manually exercised. The Worker does not store visitor transcripts; D1 storage and the agreed daily digest are still pending.

Reference: [Workers fetch handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/).

### What Response.json changes

`Response.json(data)` serializes a JavaScript value into JSON and sets the response's content type to `application/json`. The website can parse that response into an object and use individual fields when rendering a chat answer. This does not add AI, retrieval, or storage; those are separate backend behaviors still to implement.

Reference: [Return JSON](https://developers.cloudflare.com/workers/examples/return-json/).

## Step 3: Connect development on this Mac

Completed in `/Users/stevenbyington/Documents/personal-website`:

```sh
npm install --save-dev --save-exact wrangler@latest
npx wrangler --version
```

Installed and verified version: `4.143.0`, pinned in `package.json` and the lockfile. The version check succeeded. Codex's sandbox blocked Wrangler's default log directory; a second check used `WRANGLER_LOG_PATH=/tmp/steven-assistant-wrangler.log` to keep its logs in a writable location. This is a tooling sandbox restriction, not a Worker failure. Wrangler state (`.wrangler/`) and local secrets (`.dev.vars` variants) are ignored by Git.

Steven completed this step in Terminal on this Mac:

```sh
cd /Users/stevenbyington/Documents/personal-website
npx wrangler login
```

This opens Cloudflare's browser authorization flow so Wrangler can manage resources in the account. Do not paste tokens into this guide or chat. Authentication was verified with `npx wrangler whoami`; it confirmed Steven's Cloudflare account. The credential file lives in Wrangler's user preferences directory outside the repository.

### Import the existing Worker

Completed once from the repository root:

```sh
mkdir -p workers
cd workers
npx wrangler init --from-dash steven-assistant --no-delegate-c3
cd ..
```

The `--no-delegate-c3` flag was checked against the installed Wrangler 4.143.0 implementation. It downloads source and configuration directly, using the already-installed project tooling. It is an internal flag, so verify support before using it with a different Wrangler version. This command is a one-time import, not an ongoing synchronization command. Do not rerun it over local edits.

Files:

- `workers/steven-assistant/src/worker.js`: the request handler imported from the dashboard. Formatting and starter command comments were cleaned up without changing its JSON response.
- `workers/steven-assistant/wrangler.jsonc`: the imported Cloudflare configuration, with a local schema reference added for editor assistance. `name` selects the Worker, `main` selects its entry file, and `compatibility_date` selects runtime compatibility behavior.

Continue editing the local source after this import. Later dashboard edits will not automatically update this file.

### Run and inspect locally

From the repository root:

```sh
npm run dev:worker
```

Open `http://127.0.0.1:8787/health` to see the local service status. Keep the command running while developing, save code edits, and refresh the browser to inspect the response. Use Ctrl+C to stop the process. The local endpoint needs this Mac and the development process running; the public endpoint runs independently on Cloudflare.

For the local homepage, open a second terminal at the repository root and run:

```sh
npm run dev
```

Open `http://127.0.0.1:4321/`. Astro's development configuration points the chat at `http://127.0.0.1:8787/api/chat`; the Worker allows this local site origin. Run both commands at once for an interactive local preview. The first message does not require a launcher, and Recent Experience and How I Lead remain below the chat.

The API expects a JSON POST body with an alternating `messages` array, for example:

```json
{
  "messages": [
    { "role": "user", "content": "What is Steven's current professional role?" }
  ]
}
```

The Worker embeds the visitor's current question, searches the `steven-knowledge` index, and sends retrieved passage text plus a short conversation context to `@cf/google/gemma-4-26b-a4b-it`. It asks for JSON and accepts only an `answered` or `insufficient` result with a non-empty answer. Questions the model marks insufficient receive the same fixed missing-evidence sentence. Questions explicitly asking why Steven is a poor fit are redirected without a model call. The answer prompt requires third-person reference and prohibits unsupported facts and negative-fit judgments; this is an instruction to a generative model, not a formal proof that every answer is correct. Evaluate difficult and misleading questions before production.

The request is limited to eight alternating messages, a 1,000-character limit per message, and a 6,000-character conversation. The Cloudflare rate-limit binding is configured for 20 requests per minute per `cf-connecting-ip` in each Cloudflare location. It is a coarse, eventually consistent limiter, not an exact global cap. The Worker uses the IP only as the limiter key and does not save it to the transcript system. CORS allows the production site origin and the two local Astro origins. CORS alone does not block direct non-browser API calls, so the rate limit and Workers AI free quota remain relevant safeguards.

The browser keeps the current conversation in page memory and sends the recent turns with each request so follow-up questions have context. This Worker has no D1 transcript persistence, no daily email, and no retry/deletion workflow yet. Cloudflare AI/provider request-retention terms also need review before release. Do not present this local prototype as the completed conversation-history feature.

When beginning the manual review, check the role question, a technology question, an interest question, a positive-fit question, and a poor-fit question. Also try a visitor message that asserts an unsupported credential and one that asks the chatbot to ignore its rules. Compare every answer with the sole approved note; all details beyond Steven's professional role should remain unsupported until Steven approves more notes. The system prompt is an instruction to the model and must be challenged with these cases before the feature is considered for release.

Verification completed: local and live HTTP responses both returned status 200 and `application/json`, and their parsed JSON objects matched exactly. This comparison does not establish that the placeholder data is true information about Steven.

The development server started by Codex is currently running for this walkthrough. If it is still using port 8787, reuse it or stop it before starting a second instance on that port.

### Check and publish a change

This command was run successfully and bundled the Worker without publishing:

```sh
npm run deploy:worker -- --dry-run
```

When a local change is ready to publish, the command is:

```sh
npm run deploy:worker
```

An actual deployment from this Mac has not yet been observed by Codex. Steven subsequently changed the sample street address from `5th Avenue, 101` to `6th Avenue, 101`; both the local and public endpoints were checked and their full parsed JSON matched. Since the edit was already public, Codex did not issue a redundant deployment. The method used to publish it is unknown. Saving a local file or running the dry run does not itself update the public Worker.

The small-edit exercise is complete: the changed value is visible at both URLs. Steven then approved the first knowledge note: "Steven Byington is a software engineering manager." Its source was created outside the repository, embedded, uploaded, and successfully retrieved using a related question. See Step 4 below.

References: [Install Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and [Wrangler authentication commands](https://developers.cloudflare.com/workers/wrangler/commands/general/).

Dependency follow-up: the install's `npm audit` reported 12 affected packages (1 low, 4 moderate, 6 high, 1 critical). Existing site dependencies include the critical Astro finding; applicability to the static site needs review before release. The new Wrangler chain includes a moderate advisory in Miniflare's exact `undici@7.29.0` dependency (patched upstream in `7.29.1`). No broad audit fix, dependency override, or framework upgrade was applied during this learning step. Review these findings during implementation before running production workflows; a successful version check does not resolve them.

## Step 4: One approved note in Vectorize

Completed resource creation:

```sh
npx wrangler vectorize create steven-knowledge --dimensions=768 --metric=cosine --description='Approved portfolio knowledge' --update-config=false --json
```

Do not run the creation command again for this existing index. The successful response confirmed 768 dimensions and cosine similarity. `wrangler.jsonc` now declares remote `AI` and `KNOWLEDGE` bindings for local tools plus the `CHAT_LIMITER` binding. These configuration changes have not been deployed to the public Worker; the standalone demo uses Wrangler's authenticated remote bindings.

The demo at `workers/steven-assistant/knowledge-demo.mjs` reads the approved Markdown from the external directory. It uses `getPlatformProxy` with `persist: false`, generates an embedding through Workers AI, and upserts it through Vectorize. Its API calls run against hosted resources and consume their allowances.

`npm run test:knowledge` passed five checks for draft rejection, malformed approval metadata, oversized notes, source files inside the repository, stable IDs for updates, and invalid embedding dimensions/values. Preview produced exactly one approved chunk. Upload was accepted; initial polling timed out, then a later semantic query successfully retrieved the sentence. The returned score was `0.6565187` for "What does Steven do professionally?".

See the [knowledge maintenance guide](./chatbot-knowledge-guide.md) for the three exercised demo commands and their limitations. No chatbot answer has yet been manually evaluated against the prototype.

An optional `wrangler vectorize info` read was not executed because Codex's automatic approval review hit its usage limit. That was a review-service failure, not an unsafe-action determination. The separately authorized semantic query succeeded and established that retrieval works; no attempt was made to bypass the failed review.

### Worker versus AI provider

Workers runs application backend code. Workers AI supplies embedding and generation models. The OpenAI API is another possible model provider that a Worker could call. Choosing Workers does not require choosing Workers AI.

For this project the backend coordinates approved-source retrieval, answer instructions, request limits, temporary transcripts, and the email workflow. These are application responsibilities, not benefits automatically guaranteed by the hosting platform. Another secure backend could implement the same responsibilities. Ordinary OpenAI API credentials must stay on the server, and OpenAI model usage is billed; Workers AI's free allowance better fits the current $0 budget. Keep the model-provider decision separate from the backend-hosting decision.

References: [OpenAI API authentication](https://developers.openai.com/api/reference/overview), [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), and [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

## Learning milestones after signup

1. **A simple Worker:** send a request and get a small known response. Understand the difference between the frontend and the backend.
2. **Development from this Mac:** authenticate the local tooling, run the Worker locally, and deploy an update. Record the exact working commands.
3. **One approved note:** turn a small approved piece of text into an embedding, store it, and retrieve it with a related question.
4. **A grounded answer:** prototype combines retrieved text with the visitor's question; manual and adversarial answer evaluation remains pending.
5. **Knowledge maintenance:** read approved Markdown from the external local folder, preview changes, sync additions and edits, and remove stale chunks.
6. **Conversation records:** temporarily store questions and answers together, inspect a sample record, and verify expiry.
7. **Daily email:** send actual question-and-answer transcripts to steven@stevenbyington.me in the 8–9 a.m. Eastern window, only when there are chats. Verify delivery before deleting the associated records, and enforce the seven-day maximum for undelivered chats.
8. **Homepage integration:** the themed chat interface is in the local homepage and connects to the local Worker. Check desktop and mobile access and run the evidence-boundary review before publishing.
9. **Release verification:** evaluate representative questions, misleading visitor claims, attempts to invent qualifications, quota fallback, daily delivery, deletion, and local content updates before publishing.

These are milestones, not completed setup instructions. Exact commands and resource identifiers will be recorded after implementation and verification rather than guessed in advance.

## Where knowledge files belong

Use the separate local source folder described in [the knowledge maintenance guide](./chatbot-knowledge-guide.md). Keep source documents and approved Markdown off GitHub. Only approved content is sent to the hosted retrieval system; publishing code must not publish knowledge files.

## Free-plan checks before release

- Confirm Vectorize is usable on the actual Workers Free account. Its current product documentation supports Free, despite an older conflicting statement in generic Workers pricing documentation.
- Choose an embedding model and answer model that are available without a paid billing method.
- Measure normal request usage and apply bounded inputs and output lengths.
- Verify the agreed fallback when a provider rejects requests or an allowance is exhausted.
- Account for hosted AI usage during local development; test calls can consume the same free allowance used by the deployed application.

References: [Vectorize pricing](https://developers.cloudflare.com/vectorize/platform/pricing/), [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).
