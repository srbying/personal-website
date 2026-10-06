# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the existing portfolio, not confirmed by the user: hiring teams and engineering leaders evaluating Steven for software engineering leadership roles. Whether this is the primary audience remains open.

## Product Purpose

The site presents Steven Byington's resume, work history, selected projects, leadership approach, and public contact paths. It also offers a portfolio chat that answers from approved evidence and says when it lacks enough information. The intended visitor outcome is unconfirmed; the current calls to action point to the resume, experience, projects, and contact pages.

## Positioning

The existing site presents Steven as a product-minded Software Engineering Manager with full-stack depth and a Marine Corps leadership foundation. This positioning is taken from current site copy and has not been confirmed as the intended lead story. No distinct product mechanism or comparative claim has been confirmed.

## Capabilities and Constraints

- Astro web portfolio with home, projects, project case studies, experience, resume, contact, and not-found routes.
- Resume page and downloadable PDF; public email, LinkedIn, and GitHub links.
- Portfolio chat backed by a separate Cloudflare Worker. Its answer policy and service are outside the visual redesign scope.
- Preserve factual career history, project explanations, screenshots, current navigation destinations, analytics hooks, and working interactions unless the user later directs otherwise.
- Existing evidence is limited to the material in the portfolio; do not add testimonials, outcomes, or claims not supported by it.

## Evidence on Hand

- Resume and experience details in `src/data/resume.ts` and `src/data/experience.ts`.
- Aeris and SoilOS case studies in `src/content/projects/`, with product screenshots in `public/assets/projects/`.
- Downloadable resume at `public/resume/steven-byington-resume.pdf`.
- Current site copy and contact links in `src/data/`.
- No third-party testimonials or press evidence are present in the repository.

## Product Principles

These principles are provisional readings of the current implementation, not user-confirmed preferences:

1. Keep professional claims tied to evidence already on the site.
2. Make the resume, work history, projects, and contact paths easy to reach.
3. Keep the portfolio chat grounded in approved information and transparent about gaps.

## Open Decisions

- Primary audience and the visitor outcome the site should optimize for.
- The professional story Steven wants to lead with.
- Whether the current positioning is the intended long-term position.
