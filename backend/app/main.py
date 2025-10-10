from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router

app = FastAPI(title="UEFA Predictor API")
origins = [
    "https://friendly-adventure-wrjvx564jjq42vq4v-5173.app.github.dev",
    "http://localhost:5173",
]

# CORS must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow all origins for now
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