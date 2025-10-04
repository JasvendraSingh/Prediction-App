from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

app = FastAPI(title="UEFA Predictor API")

# CORS must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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