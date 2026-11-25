# Website audit and positioning evidence

Reviewed 24 October 2026. Baseline website revision: `d87692a`. Audit/research preceded implementation and user approval. The live site was read and inspected in Chrome. No production enquiry or paid model call was made.

## Baseline and reuse

The baseline was a single page for ERP, software, automation, data and integration. It already had strong typography, product screenshots, reduced-motion/static scene fallbacks and a functioning intake architecture. Its positioning and information architecture did not explain the proposed AI engineering business in sufficient depth.

Reusable foundations: static HTML/CSS, strict browser TypeScript, esbuild, pnpm, the `element` DOM helper, Three.js lifecycle/geometry, original media, Worker validation, D1 saves, consent, rate limits, idempotent submission handling, Resend delivery retries and mocked tests. Twelve baseline tests, lint, type checks and build passed.

Live asset hashes matched the source build. Cloudflare served CSP, nosniff, referrer and permissions policies. The prior README's GitHub Pages branch-root narrative was stale; its warnings were not treated as current-domain evidence.

## Company claim boundaries

| Project | Evidence inspected | What it supports |
| --- | --- | --- |
| Rigel | `../rigel-inventory/AI.md`, AI roadmap, assistant function/semantic/query/guard paths | An implemented ERP integration with existing Postgres/Supabase, commercial API calls, scoped reads, read/propose boundaries, human saves, audit/evaluation. Broader tool registry/orchestration are roadmap work. |
| FloorMind standalone | `../FloorMind/config.py`, `modules/llm.py`, document/alert/waste modules, architecture audit | An Ollama implementation and hosted alternative; manufacturing queries, search, analysis, alerts and audit tooling. Documented hardening issues constrain production claims. |
| FloorMind active monorepo | `../governed-agent-stack/apps/floormind/config.py`, LLM client, API routes, waste estimator | OpenAI-compatible integration defaulting to an external endpoint, with configurable base URL. Do not label this default path local/private. Waste estimation is based on historical averages, not verified trained forecasting. |
| Elenchus | `../elenchus/README.md`, `docs/COMMERCIAL_READINESS.md`, workflow architecture | Survey authoring/conducting, structured validated responses, results, checked summaries, exports and private-workspace/pilot controls. Identity, deployment, retention and restore verification remain release requirements. |

No fine-tuning, survey-trained foundation model, customer outcome, certification, customer count or production-capacity claim was verified. Implementation evidence is not proof of a deployed revision. Industry examples are labelled illustrative. Specialist training, advanced retrieval and large-scale serving are proposed or assessed engagements, not completed delivery claims.

Read-only external availability checks: Rigel and FloorMind returned HTTP 200. The old Elenchus pilot endpoint returned HTTP 500. The Elenchus project now offers a walkthrough enquiry; its historical endpoint is `https://elenchus-pilot-cnvj7hgoxq-nw.a.run.app` for internal follow-up, not a promoted destination.

## Competitive research

These sources informed structure and messaging, never claims that Kapkoti owns comparable infrastructure or partnerships.

| Official source | Observed pattern | Use in this site |
| --- | --- | --- |
| https://www.turing.com/enterprise-ai | Engineering delivery alongside enterprise agent operations | Explicit lifecycle and responsibilities |
| https://huggingface.co/enterprise | Models/data, inference options and enterprise controls | Technology choice and access explanations |
| https://www.together.ai/ | Compute, inference and model customization separated | External infrastructure vs integration ownership |
| https://fireworks.ai/ | Open-model inference, orchestration and training | Different techniques with distinct jobs |
| https://www.baseten.co/ | Focused production-serving story | Operating concerns and engineer-led contact |
| https://replicate.com/ | Clear API proposition and concrete examples | Understandable inputs, outputs and interfaces |
| https://www.sarvam.ai/ | Language, document and sovereignty context | Requirements-led language/deployment choices |
| https://yellow.ai/ | Named business workflows and integrations | Workflow outcomes and approval boundaries |
| https://fractal.ai/ | Industry/business-function framing and AI foundations | Industry context and conventional analytics |
| https://www.leewayhertz.com/ | Consulting, data, model and deployment catalogue | Service coverage with restrained navigation |

The resulting focus is practical AI engineering for businesses with existing systems, constrained budgets and operational requirements. It is a proposed positioning, not a claim of exclusive market coverage.

## Plain-language positioning revision, 25 October 2026

The user found the first expanded presentation too complex. The main visitor path now begins with everyday work: paperwork, finding answers, connecting tools and understanding figures. Three introductory steps explain how to start. The verified project examples remain clearly labelled; no customer result or superiority claim was added. All engineering detail is now collected under one Services tab. This is a clarity and navigation decision, not evidence of a measured competitive advantage. Understanding and conversion still need testing with real prospective customers.

## Service navigation reference

The user supplied [ATS Global’s custom AI page](https://atsglobal.in/services/custom-ai). The page uses named capability tabs and separate deeper guides. This informed a grouped service hierarchy and individual definitions, not copied branding, outcomes, timelines or customer claims. Kapkoti’s Services page groups its own nine capabilities into Plan & prepare, Build & connect and Deploy & improve, with illustrative examples and explicit availability boundaries.

## Implementation result

The site now has eight primary pages, three project details, privacy and a 404 page. Business pages explain four everyday needs and three introductory steps. The Services page retains all nine service categories, eight delivery stages and eight architecture layers. Shared templates, escaped content and a route registry replace manual duplication. Contact starts directly with a brief while retaining the assistant. Current technical verification belongs in `QA_REPORT.md`.
