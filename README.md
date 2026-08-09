# AI-Powered Code Review Assistant
A full-stack application where developers upload source code and get structured, AI-generated code reviews — security, performance, and code quality — plus a chat interface to ask questions about their own codebase.

## Features
- **Auth**: register, login, logout, JWT access + refresh tokens, protected routes
- **Projects**: create, list, delete
- **Code upload**: `.zip` (preserves folder structure) or drag & drop individual files
- **Code explorer**: folder-tree view with file preview
- **AI review engine**: review a single file, multiple files, or the whole project
- **Review templates**: Security, Performance, Code Quality — each with its own focus areas
- **Review history**: search and filter past reviews
- **AI chat with code**: ask questions about the uploaded codebase, with simple keyword-based context retrieval
- **Bonus — Diff Review**: compare two files and get an AI risk assessment of the change
- **Bonus — Documentation Generator**: generate a README, Setup Guide, or API docs from the project's source
- **Configurable AI provider**: OpenAI, LM Studio, Ollama, or any OpenAI-compatible endpoint — base URL, API key, and model are all set at runtime, never hardcoded

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, React Query, Zod |
| Backend | FastAPI, Motor (async MongoDB driver), Pydantic |
| Database | MongoDB |
| Auth | JWT (access + refresh) |
| AI | Any OpenAI-compatible endpoint via the `openai` SDK |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design and [AI_USAGE.md](./AI_USAGE.md) for how AI tools were used to build this.

## Setup: 
### Backend

```bash
cd backend
cp .env.example .env
uv venv --python 3.12
export VIRTUAL_ENV="./.venv"
source .venv/Scripts/activate
uv pip install -r requirements.txt
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload
```
## Second Time Onwards:
```bash
cd backend
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.
### Frontend
```bash
cd frontend
pn install
cp .env.local.example .env.local
pn dev
```
The app runs at `http://localhost:3000`.

### First-time use
1. Register an account, then log in.
2. Go to **AI provider** (top of the projects page) and configure a base URL, API key, and model — presets are provided for OpenAI, LM Studio, and Ollama, but any OpenAI-compatible endpoint works.
3. Create a project and upload a `.zip` or drag files in.
4. Run a review, chat with the code, generate docs, or compare two files.

## Environment Variables
### Backend (`backend/.env`)
- `MONGO_URI`: Database Connection String
- `MONGO_DB_NAME`: Database Name
- `JWT_SECRET`: Secret For the Jwt Signed  
- `JWT_ALGORITHM`: Jwt Algorithm By default hs256 is used worldwise. 
- `ACCESS_TOKEN_MINUTES`: How Much Frequencye the Access token should be there
- `REFRESH_TOKEN_DAYS`: Total Day For REfresh
- `UPLOAD_DIR`: Upload Where to Stored on teh DisK:

### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL`: Backend url API

## Database Setup
No manual schema setup is needed — MongoDB collections are created automatically on first write. Just point `MONGO_URI` at a running instance (local `mongod`, Docker, or MongoDB Atlas).
Collections: `users`, `projects`, `files`, `reviews`, `diff_reviews`, `generated_docs`, `ai_providers`, `chat_sessions`, `messages`. See [ARCHITECTURE.md](./ARCHITECTURE.md#database-design) for field-level detail.

## Architecture Overview
- **Frontend** is a Next.js App Router app. Server state (projects, files, reviews, chat) is managed with React Query; forms are validated with Zod before hitting the API.
- **Backend** is FastAPI with async MongoDB access via Motor. Every request body is validated with Pydantic models. JWT auth guards all project/file/review/chat routes.
- **AI integration** goes through a single `AsyncOpenAI`-compatible client built dynamically from the signed-in user's stored provider config — so switching between OpenAI, LM Studio, or Ollama is a settings change, not a code change.

Full details: [ARCHITECTURE.md](./ARCHITECTURE.md).
