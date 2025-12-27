from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import os
import time
from prometheus_client import ( Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST)
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

# PROMETHEUS METRICS
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "path"],
)

@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)

    duration = time.time() - start_time

    REQUEST_COUNT.labels(
        request.method,
        request.url.path,
        response.status_code,
    ).inc()

    REQUEST_LATENCY.labels(
        request.method,
        request.url.path,
    ).observe(duration)

    return response

@app.get("/metrics")
def metrics():
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )

app.include_router(fifa2026_router, prefix="/api/fifa2026")  # REQUIRED
app.include_router(uefa_router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "UEFA Predictor API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
