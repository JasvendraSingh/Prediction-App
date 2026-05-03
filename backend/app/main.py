from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.fifa.routes import router as fifa2026_router

app = FastAPI(title="FIFA World Cup 2026 Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8000",
        "https://*.app.github.dev",
    ],
    allow_origin_regex=r"https://.*\.app\.github\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fifa2026_router, prefix="/api/fifa2026")


@app.get("/")
def health_check():
    return {"status": "ok", "message": "FIFA World Cup 2026 Predictor API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
