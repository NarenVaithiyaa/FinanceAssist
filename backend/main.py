from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import transactions, accounts, budgets, goals, emis, ai, profile
from config import settings

app = FastAPI(
    title="FinanceAssist Backend",
    description="Minimal FastAPI foundation layer"
)

# Configure CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(transactions.router, prefix="/api/transactions")
app.include_router(accounts.router, prefix="/api/accounts")
app.include_router(budgets.router, prefix="/api/budgets")
app.include_router(goals.router, prefix="/api/goals")
app.include_router(emis.router, prefix="/api/emis")
app.include_router(ai.router, prefix="/api/ai")
app.include_router(profile.router, prefix="/api/profile")

@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.APP_ENV}
