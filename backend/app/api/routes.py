from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.scan import router as scan_router

router = APIRouter()

# Register sub-routers
router.include_router(auth_router)
router.include_router(scan_router)
