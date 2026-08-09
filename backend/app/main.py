from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ai_providers, auth, chat, diff_reviews, docs, files, projects, reviews

app = FastAPI(title="Strix Code Review Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(files.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
