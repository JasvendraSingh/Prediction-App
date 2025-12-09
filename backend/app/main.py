from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes import router as uefa_router
from app.fifa.routes import router as fifa2026_router  

app = FastAPI(title="UEFA Predictor API")

frontend_url = os.getenv("FRONTEND_URL") or os.getenv("URL") or "http://localhost:5173"

cname = os.getenv("CODESPACE_NAME")
domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN")

origins = set()

origins.add(frontend_url.rstrip("/"))

extra = os.getenv("ALLOWED_ORIGINS")
if extra:
    for o in extra.split(","):
        if o.strip():
            origins.add(o.strip().rstrip("/"))

if cname and domain:
    origins.add(f"https://{cname}-5173.{domain}")

env = os.getenv("ENV", "production")
if env != "production":
    origins.add("http://localhost:5173")
    origins.add("http://localhost:8000")

if not origins:
    origins.add("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(fifa2026_router, prefix="/api/fifa2026")  # <-- REQUIRED
app.include_router(uefa_router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "UEFA Predictor API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
