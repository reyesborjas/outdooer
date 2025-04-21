from fastapi import APIRouter
from .routes import router as expeditions_router

router = APIRouter()
router.include_router(expeditions_router)
