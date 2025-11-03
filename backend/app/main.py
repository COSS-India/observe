from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.auth import router as auth_router
from app.api.v1.teams import router as teams_router

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="API with Authentication",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/v1", tags=["Authentication"])
app.include_router(teams_router, prefix="/v1", tags=["Teams"])


@app.get("/")
async def root():
    """Root endpoint with version and deployment info"""
    return {
        "version": "1.0.0",
        "deployment": "2025-10-09-password-fix",
        "status": "active",
        "password_fix": "8-char-passwords-implemented",
        "docs": "/docs",
        "message": "API -running with updated password generation logic "
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
