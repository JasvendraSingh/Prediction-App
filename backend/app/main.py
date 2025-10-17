from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
import os

app = FastAPI(title="UEFA Predictor API")

# Get frontend URL from environment or use defaults
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

origins = [
    frontend_url,
    "https://friendly-adventure-wrjvx564jjq42vq4v-5173.app.github.dev",
    "http://localhost:5173",
    "http://localhost:8000",
    # Allow all Codespaces URLs
    "https://*.app.github.dev",
]

# CORS must be added BEFORE routes
# Allow all origins for Codespaces (URLs change frequently)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# API routes under /api
app.include_router(router, prefix="/api")

# Add a health check endpoint at root
@app.get("/")
def health_check():
    return {"status": "ok", "message": "UEFA Predictor API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}