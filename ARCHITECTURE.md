# Architecture
## Frontend Architecture

**Stack**: Next.js + TypeScript + Tailwind CSS + React Query + Zod.
**Structure**:
```
frontend/src/
  app/                  route pages (App Router — one folder per route)
    login/ register/
    projects/           dashboard, [projectId] detail, reviews, chat, diff, docs
    settings/           AI provider config
  components/           reusable UI (Button, Field, FileTree, SeverityBadge, ...)
  hooks/                one hook file per domain, wrapping React Query
  lib/                  api client, Zod schemas, shared types, file-tree builder
  providers/            React Query provider
```
## Backend Architecture
**Stack**: FastAPI + Motor (async MongoDB driver) + Pydantic + `python-jose` (JWT) + `bcrypt`.
**Structure**:
```
backend/app/
  main.py               FastAPI app, router registration, CORS
  config.py             env-based settings (pydantic-settings)
  database.py           Motor client + collection handles
  core/
    security.py         password hashing, JWT create/decode
    deps.py              get_current_user dependency (protects routes)
    encryption.py        Fernet encryption for stored AI provider API keys
  models/                Pydantic request/response/DB models, one file per domain
  routers/                one router per resource (auth, projects, files, reviews,
                          ai_providers, chat, diff_reviews, docs)
  services/               business logic that isn't just CRUD:
                          file_storage.py   safe disk writes, zip extraction, text/binary detection
                          ai_client.py       builds the AI client, prompts, parses responses
                          context_retrieval.py  keyword scoring for chat context
                          project_access.py  shared "does this user own this project" check
```
## Database Design
MongoDB, one collection per resource, all keyed by application-generated UUID strings (not Mongo `ObjectId`) to keep the API and frontend simple:
| Collection | Key fields |
|---|---|
| `users` | `id`, `name`, `email`, `password_hash`, `created_at` |
| `projects` | `id`, `name`, `description`, `owner_id`, `created_at` |
| `files` | `id`, `project_id`, `path`, `size`, `disk_path`, `created_at` |
| `ai_providers` | `id`, `user_id` (unique), `label`, `base_url`, `api_key_encrypted`, `model_name` |
| `reviews` | `id`, `project_id`, `user_id`, `review_type`, `reviewed_paths[]`, `summary`, `issues[]`, `recommendations[]`, `created_at` |
| `diff_reviews` | `id`, `project_id`, `file_path_a`, `file_path_b`, `diff_text`, `summary`, `issues[]`, `recommendations[]` |
| `generated_docs` | `id`, `project_id`, `doc_type`, `content`, `created_at` |
| `chat_sessions` | `id`, `project_id`, `user_id`, `title`, `created_at` |
| `messages` | `id`, `session_id`, `role`, `content`, `referenced_paths[]`, `created_at` |

## AI Integration Flow
1. The signed-in user configures a provider once (Settings page): label, base URL, API key, model name. Nothing is hardcoded — the same code path works for OpenAI, LM Studio, Ollama, or any other OpenAI-compatible server.
2. On save, the API key is encrypted (Fernet) before it's written to MongoDB; every read masks it (`sk-***...1234`) except the one moment it's decrypted server-side to make a request.
3. For a **review**, the backend reads the selected file(s) off disk, builds a system prompt scoped to the chosen template (Security / Performance / Quality), and calls `AsyncOpenAI(base_url=..., api_key=...).chat.completions.create(...)`. The model is instructed to return one JSON object (summary, issues with severity, recommendations); the backend parses and validates that shape before storing it.
4. For **chat**, a simple keyword-overlap scorer (`context_retrieval.py`) ranks all project files against the question and picks the top 5 as context — no vector DB, per the assessment's "simple context retrieval is acceptable." Message history for the session is replayed into the prompt so the model has conversational context too.
5. For **diff review**, `difflib.unified_diff` produces the diff text locally (no AI needed for that part); the diff is then sent to the model for a risk/quality assessment using the same structured-JSON pattern as reviews.
6. For **doc generation**, all project files are concatenated (truncated per file) into one prompt with a doc-type-specific system prompt (README / Setup / API docs), and the raw markdown response is stored and shown as-is.

All AI calls are wrapped in try/except; a failed or unreachable provider returns a 502 with the underlying error message rather than a silent failure.