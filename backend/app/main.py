from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ai_providers, auth, chat, diff_reviews,  files, projects, reviews

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
app.include_router(ai_providers.router)
app.include_router(reviews.router)
app.include_router(chat.router)
app.include_router(diff_reviews.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
