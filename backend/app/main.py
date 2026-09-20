import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.websocket.manager import ws_manager
from backend.app.services.simulation_service import simulation_service

# API Routers
from backend.app.api.health import router as health_router
from backend.app.api.auth import router as auth_router
from backend.app.api.roads import router as roads_router
from backend.app.api.traffic import router as traffic_router
from backend.app.api.incidents import router as incidents_router
from backend.app.api.recovery import router as recovery_router
from backend.app.api.ripple import router as ripple_router
from backend.app.api.advisory import router as advisory_router
from backend.app.api.simulations import router as simulations_router
from backend.app.api.dashboard import router as dashboard_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("SAATHI_Core")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("==================================================")
    logger.info(f"STARTING {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Target City: {settings.CITY_NAME} (Command Center Active)")
    logger.info("==================================================")
    # Initialize DB tables
    try:
        init_db()
        logger.info("Database schemas and tables verified/initialized.")
    except Exception as e:
        logger.warning(f"Database auto-init note: {e}")

    yield

    logger.info("Shutting down SAATHI services...")
    simulation_service.pause()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Software-only urban traffic intelligence and decision-support command center for Hyderabad.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permissive for multi-device hackathon network access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers under /api/v1
api_prefix = "/api/v1"
app.include_router(health_router, prefix=api_prefix)
app.include_router(auth_router, prefix=api_prefix)
app.include_router(roads_router, prefix=api_prefix)
app.include_router(traffic_router, prefix=api_prefix)
app.include_router(incidents_router, prefix=api_prefix)
app.include_router(recovery_router, prefix=api_prefix)
app.include_router(ripple_router, prefix=api_prefix)
app.include_router(advisory_router, prefix=api_prefix)
app.include_router(simulations_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)

# WebSocket Real-Time Endpoint: /ws/traffic
@app.websocket("/ws/traffic")
async def websocket_traffic_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial handshake state snapshot
        await websocket.send_json({
            "type": "connection_established",
            "data": {
                "message": "Connected to SAATHI Hyderabad Traffic Stream",
                "summary": simulation_service.get_summary(),
                "active_incidents": list(simulation_service.active_incidents.values())
            }
        })
        while True:
            # Listen for client-side events or heartbeats
            data = await websocket.receive_text()
            # Echo or process client command if needed
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_prefix": api_prefix,
        "city": settings.CITY_NAME,
        "notice": "DECISION-SUPPORT INTELLIGENCE PLATFORM — SIMULATION / DATASET REPLAY MODE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
