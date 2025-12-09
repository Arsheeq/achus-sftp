

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import os

from backend.routes import auth, users, roles, files
from backend.database.db import init_db, SessionLocal
from backend.database.seeds import ensure_seed_data

app = FastAPI(title="EnlitEDU SFTP API", version="1.0.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers FIRST - before any other routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(files.router)

@app.on_event("startup")
async def startup_event():
    # Create database tables
    init_db()
    print("✓ Database tables initialized")
    
    # Seed initial data (roles and admin user)
    db = SessionLocal()
    try:
        ensure_seed_data(db)
    finally:
        db.close()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "EnlitEDU SFTP"}

# Static file serving - mount assets directory
if os.path.exists("dist/public"):
    app.mount("/assets", StaticFiles(directory="dist/public/assets"), name="assets")

# Exception handlers for serving SPA on 404s (but not for API routes)
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, exc):
    from fastapi.responses import JSONResponse
    
    # Always return JSON for API routes
    if request.url.path.startswith("/api"):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    
    # For non-API routes with 404, serve the SPA
    if exc.status_code == 404 and os.path.exists("dist/public/index.html"):
        return FileResponse("dist/public/index.html")
    
    # Otherwise, return JSON error
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Always return JSON for validation errors
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# Serve index.html for the root path
@app.get("/")
async def serve_root():
    if os.path.exists("dist/public/index.html"):
        return FileResponse("dist/public/index.html")
    return {"message": "Frontend not built"}
