from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.cv.routes import router as cv_router
from modules.factures.routes import router as factures_router
from core.conversations import router as conversations_router

app = FastAPI(title="Agent Daisy Consulting - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # ports par défaut Vite / CRA
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv_router)
app.include_router(factures_router)
app.include_router(conversations_router)

@app.get("/")
def racine():
    return {"status": "API en ligne"}
