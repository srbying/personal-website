# Portfolio chatbot

This private document records confirmed decisions and implementation progress for Steven's portfolio chatbot. Cloudflare is the chosen backend direction; email provider setup and production release steps remain pending.

## Confirmed direction

- Make the Portfolio Chatbot the main focus of the homepage, integrated with the site's existing visual theme.
- Clearly identify it as a chatbot Steven created to answer questions about his personal and professional background.
- Use an assistant voice that refers to Steven in the third person, rather than speaking as Steven.
- Prepare source material from Steven's resume, projects, interview stories, and answers to a personal and professional questionnaire.
- Create a separate collection of Public Knowledge Notes from those materials, preserving useful detail and removing private or confidential information. Steven reviews and approves the notes for public use before they enter the chatbot's searchable knowledge; do not directly index the original documents.
- Treat everything in Public Knowledge Notes as potentially visible to visitors. Sharing an original document for preparation does not approve its contents for public use.
- Pursue a custom retrieval-augmented generation system using chunked source material and free vector storage.
- Treat $0 ongoing cost as a hard constraint across the chatbot system, including answer generation; do not automatically upgrade to paid services.
- Allow AI answers to pause when free capacity is exhausted. Provide Prepared FAQs, the Resume PDF, and Contact Paths until service returns.

## Knowledge maintenance

- Use readable Markdown source files and a local sync script that chunks approved text, creates embeddings, and writes text, vectors, and metadata to the hosted vector database.
- Steven will author, review, and sync knowledge from this Mac only. The initial workflow does not need editing or sync access from other devices; the deployed chatbot uses hosted services independently of this Mac.
- Keep the knowledge files off GitHub, including source documents, drafts, approved Markdown, and generated content exports. The earlier proposal to store knowledge inside the website repository is superseded.
- Keep actual source material outside the website repository. The local root is `/Users/stevenbyington/Documents/personal-website-knowledge/`, with separate `originals`, `drafts`, `approved`, and `.sync` folders; only approved material is eligible for indexing.
- Application code and generic, empty templates may be versioned; real knowledge content must not be embedded in tests, examples, build assets, or deployment artifacts. Run ingestion locally against the hosted database rather than publishing source files through GitHub or a build pipeline.
- Add repository exclusions for private setup/planning notes, accidental knowledge copies, local sync artifacts, and credentials. Verify that covered files are untracked; ignore rules alone do not remove previously tracked files.
- Provide a clear personal maintenance guide covering setup, note format, approval, adding and editing notes, previewing changes, syncing, removing stale content, verifying answers, troubleshooting, and backups. Exact commands must be implemented and tested before they are presented as usable instructions or the site is released.
- The draft guide lives at `docs/private/chatbot-knowledge-guide.md` and is excluded from Git. Public-answer approval and keeping original files off GitHub are separate requirements: approved text still reaches the vector database and the answer-generation service.

## Homepage access

- Prioritize the easiest path to the chat input: visible and usable on arrival on both desktop and mobile, without a separate launcher, introductory screen, or start-chat step.
- Keep Steven's identity and the chatbot disclosure compact so they do not push the chat input below the initial view.
- Offer three clickable Starter Questions alongside the open input so visitors can start without typing. Keep their subjects clear; replace the vague "What has Steven built?" prompt with a question about technologies he has worked with or a named project.
- Treat chat as the homepage's primary interaction, with direct access to resume and contact information still available.
- Keep Recent Experience and How I Lead below the chat. Steven confirmed the chat should be the homepage's main focus.

### Draft starter wording

- What is Steven's current professional role?
- Which technologies has Steven worked with?
- What has Steven shared about his interests outside work?

These are visitor prompts, distinct from the questionnaire Steven will answer to prepare Public Knowledge Notes. A technology question should lead to a concise overview of documented technical experience, with relevant examples where available.

## Answer boundaries

- Keep answers conversational without a Sources section, visible citations, or supporting source excerpts. This presentation choice does not relax the requirement to ground claims in approved Public Knowledge Notes.
- Present Steven positively and highlight strengths supported by the supplied materials.
- Offer interpretations of why Steven could be a good fit when supporting evidence exists, distinguishing those interpretations from established facts.
- Do not produce arguments or verdicts that Steven is a bad fit.
- Never invent facts, qualifications, experience, opinions, or commitments to make Steven look better.
- Acknowledge missing evidence explicitly. Missing information does not establish either that Steven has a qualification or that he lacks it.
- Answer questions about mistakes, setbacks, and growth only from true Interview Stories Steven has shared and approved for public use. Describe events, changes, lessons, and outcomes only where supplied; do not invent a story or a positive ending, or draw broader negative conclusions about Steven.

## Conversation review

- Temporarily save visitor questions and the assistant's corresponding answers as private Conversation History for Steven to review.
- Preserve the relationship between exchanges in a conversation so follow-up questions and answers can be understood in context.
- Keep Conversation History separate from Public Knowledge Notes. Visitor submissions and generated answers do not automatically become approved facts about Steven or enter the chatbot's retrieval knowledge.
- Send a Daily Chat Digest to Steven only when there are chats to report, including the actual questions and answers grouped by conversation. Delete the website's corresponding transcript records afterward rather than retaining a long-term website archive.
- Target delivery between 8 and 9 a.m. Eastern each day, using America/New_York so the intended local window accounts for daylight-saving changes. Provider scheduling must be checked against this window during setup.
- Send the digest to steven@stevenbyington.me, confirmed by Steven as the recipient.
- Deletion from website storage does not delete the email in Steven's inbox or override provider retention policies.
- Cloudflare D1 and Cron are the planned transcript/digest services. Resend Free is the email candidate; account setup and sender verification are still pending.

The current chat prototype keeps its conversation only in the open browser page and sends recent turns to the Worker for context. It does not yet save conversation records, send email, or enforce the agreed deletion lifecycle. Provider request-retention terms still need review before production.

### Delivery and retention

- For successful email delivery, delete transcripts after the provider confirms delivery to the receiving mail server, rather than merely accepting a send request. This is delivery confirmation, not evidence that Steven read the email; the seven-day expiry below also applies when delivery fails.
- Delivery-triggered deletion covers only the exchanges included in that digest; new messages and unrelated pending records remain eligible for the next digest until their own retention limit expires.
- Keep a stable digest identity and minimal delivery status so retries and duplicate delivery notifications do not resend delivered digests or remove newer exchanges. Provider idempotency alone may expire before the next daily retry.
- Retry undelivered chats within a maximum seven-day retention period, then delete them even if delivery has not succeeded. Steven accepts the possibility of losing those chats during a prolonged delivery failure.
- Measure retention from when each exchange is stored; retries and later messages in the same conversation do not extend an older exchange's expiry.

### Verified service candidates — September 28, 2026

These are feasibility findings, not proof of production configuration. Cloudflare Vectorize and Workers AI are selected for the first implementation; D1 and Cron are planned for the digest, and Resend remains the email candidate.

- The local `.vercel/project.json` links this repository to the Vercel project `personal-website`; the site uses static Astro output. Keeping the existing frontend host is the current recommendation.
- [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/platform/pricing/) lists a Workers Free allowance of 30 million queried dimensions per month and 5 million stored dimensions. Its [current introduction](https://developers.cloudflare.com/vectorize/get-started/intro/) explicitly supports Workers Free; older generic Workers documentation still contains a conflicting paid-only statement, so verify availability in the actual free account before committing to the provider.
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/platform/pricing/) provides 10,000 neurons per day on Free, with requests failing after the free limit rather than allowing paid overages without upgrading. Some models require payment; choose and evaluate only models available on Free, including the embedding model.
- [Cloudflare D1](https://developers.cloudflare.com/d1/platform/pricing/) has a free tier with read, write, and storage caps; exceeding free limits returns errors. It is a candidate for temporary transcripts and digest delivery bookkeeping, separate from the approved retrieval corpus.
- [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/) can schedule backend work. Scheduling uses UTC, so digest logic must preserve the agreed America/New_York delivery window across daylight-saving changes.
- [Qdrant Cloud Free](https://qdrant.tech/documentation/cloud/create-cluster/) suspends after one week without use and can be deleted after four weeks of inactivity unless reactivated. This is a drawback for a quiet portfolio; keeping local source notes allows reconstruction but does not eliminate recovery work.
- [Resend Free](https://resend.com/docs/knowledge-base/account-quotas-and-limits) allows 100 transactional emails per day and 3,000 per month, enough in sending volume for one daily digest. Use the free plan without paid upgrades or overages; production sender setup still needs verification.
- [Resend delivery events](https://resend.com/docs/webhooks/event-types) distinguish an accepted send request from delivery to the recipient's mail server. [Idempotency keys](https://resend.com/docs/api-reference/emails/send-email) expire after 24 hours.
- [Resend pricing](https://resend.com/pricing) lists 30-day data retention on Free, so website deletion must not be represented as deletion of all provider copies.
- [Vercel Hobby cron](https://vercel.com/docs/cron-jobs/usage-and-pricing) supports daily execution with timing within the scheduled hour; function usage limits still apply. The current static Astro site would need a server-side function or a separate backend for this work.

### Backend direction: Cloudflare

Steven confirmed readiness at Workers & Pages after account signup and wants to learn Cloudflare through this project. Use Cloudflare as the backend direction while keeping the static Astro frontend on its linked Vercel project. The proposed services are Workers Free, Vectorize for retrieval, Workers AI for embeddings and answers, D1 for temporary chat records and delivery state, and Cron Triggers for the digest; Resend Free remains the email-delivery recommendation.

Before production release, verify access without paid upgrades, evaluate the free answer model against Steven's answer boundaries, measure quota usage, and test the Mac-to-database sync. Steven created the first Worker, `steven-assistant`; its public endpoint still returns the sample JSON until the local changes are deliberately deployed. Wrangler 4.143.0 is installed and authenticated. The local Worker now contains a grounded-answer prototype using the existing Vectorize index, an evidence-constrained Workers AI prompt, a fixed missing-evidence response, a negative-fit redirect, origin checks, and a 20-request-per-minute Cloudflare limiter. The homepage now puts an integrated chat before Recent Experience and How I Lead. These new code paths have not yet been run or deployed. Browser-only chat memory, D1 transcript retention, digest email, full knowledge sync, model evaluation, quota review, and production release remain pending. The account plan has not been independently inspected. Dependency audit findings are recorded in the setup guide for review before release.

### Learning approach

Explain each service's purpose in this application, introduce it with a small working milestone, and show Steven how to inspect its result. Start with the account and a simple Worker, then introduce local development and deployment, embeddings and vector search, grounded answers, temporary chat storage, email delivery, and the homepage integration. Capture the actual commands and checks in private guides as each milestone is completed.

The Cloudflare walkthrough lives at `docs/private/cloudflare-setup-guide.md`. The initial backend is `https://steven-assistant.steven-168.workers.dev/`; domain onboarding is not required for that route. The first response and subsequent JSON response were verified on September 28, 2026 (America/New_York). The local Worker is available at `http://127.0.0.1:8787/` while `npm run dev:worker` runs; the Astro site uses `http://127.0.0.1:4321/` while `npm run dev` runs. The single-note embedding and retrieval milestone is complete. The local grounded-answer and homepage-chat slice is implemented but awaits manual end-to-end review; it has not been deployed. A private authoring questionnaire is available at `docs/private/chatbot-questionnaire.md`; questions and unanswered prompts are not knowledge facts.

## Guidance scope

Steven approved the first knowledge fact in response to the explicit review question: "Steven Byington is a software engineering manager." The Markdown source now exists outside the repository at `/Users/stevenbyington/Documents/personal-website-knowledge/approved/professional-role.md`. The first retrieval milestone succeeded using this one sentence as one chunk, `@cf/baai/bge-base-en-v1.5` embeddings, and the `steven-knowledge` 768-dimensional cosine index. The upload was accepted before it became searchable; a later query for "What does Steven do professionally?" returned the exact approved sentence with similarity score `0.6565187`. The one-note demo supports preview, index, and query; full synchronization remains unimplemented. Local answer generation now queries the index and applies the approved evidence rules, but that behavior has not been manually evaluated. This is the first note's approval only; other questionnaire answers and source documents still require review before indexing.

Work through content preparation, service setup, implementation, verification, and production release with Steven, resolving product decisions one at a time before dependent implementation work.
