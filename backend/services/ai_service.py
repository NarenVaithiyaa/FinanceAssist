import json
import requests
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from typing import Dict, Any

from models import Transaction, AccountBalance, ExpenseLimit, SavingsGoal, EMI
from schemas import AICoachRequest, AICoachResponse
from auth import AuthenticatedUser
from config import settings

SYSTEM_INSTRUCTIONS = """You are PennyWise AI Finance Coach.
Use only the user's provided financial snapshot.
Be practical, specific, concise, and kind.
Never invent balances, transactions, goals, budgets, EMIs, income, or expenses.
If data is missing, say what is missing and suggest the next useful action.
Do not provide guaranteed investment returns, legal advice, or tax advice.
Use Indian Rupees when discussing money."""

def get_financial_advice(db: Session, current_user: AuthenticatedUser, question: str) -> AICoachResponse:
    """
    Securely gathers the user's financial snapshot and calls the Gemini AI API.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service is not configured on the server."
        )
        
    try:
        # 1. Aggregate Account Balances
        balance_stmt = select(AccountBalance).where(AccountBalance.user_id == current_user.id)
        balance = db.execute(balance_stmt).scalars().first()
        balance_data = {
            "bank": float(balance.bank) if balance and balance.bank else 0,
            "wallet": float(balance.wallet) if balance and balance.wallet else 0
        }
        
        # 2. Aggregate Recent Transactions & Totals (limit to last 30 to save tokens)
        tx_stmt = select(Transaction).where(
            Transaction.user_id == current_user.id
        ).order_by(Transaction.date.desc()).limit(30)
        transactions = db.execute(tx_stmt).scalars().all()
        
        recent_transactions = []
        total_income = 0
        total_expense = 0
        
        for tx in transactions:
            amount = float(tx.amount)
            if tx.type == "income":
                total_income += amount
            elif tx.type == "expense":
                total_expense += amount
                
            recent_transactions.append({
                "amount": amount,
                "type": tx.type,
                "category": tx.category,
                "date": str(tx.date)
            })
            
        # 3. Aggregate Budgets
        budget_stmt = select(ExpenseLimit).where(ExpenseLimit.user_id == current_user.id)
        budgets = db.execute(budget_stmt).scalars().all()
        budgets_data = [
            {"category": b.category, "limit_amount": float(b.limit_amount), "month": b.month}
            for b in budgets
        ]
        
        # 4. Aggregate Savings Goals
        goal_stmt = select(SavingsGoal).where(SavingsGoal.user_id == current_user.id)
        goals = db.execute(goal_stmt).scalars().all()
        goals_data = []
        for g in goals:
            target = float(g.target_amount)
            current = float(g.current_amount)
            goals_data.append({
                "name": g.name,
                "category": g.category,
                "target_amount": target,
                "current_amount": current,
                "remaining_amount": max(0.0, target - current),
                "deadline": str(g.deadline) if g.deadline else None
            })
            
        # 5. Aggregate EMIs
        emi_stmt = select(EMI).where(EMI.user_id == current_user.id)
        emis = db.execute(emi_stmt).scalars().all()
        emis_data = [
            {
                "name": e.name,
                "principal": float(e.principal),
                "emi_amount": float(e.emi_amount),
                "months": e.months,
                "interest_rate": float(e.interest_rate) if e.interest_rate else 0
            }
            for e in emis
        ]
        
        # 6. Construct Minimized Snapshot
        snapshot = {
            "balances": balance_data,
            "calculated_totals_for_recent_transactions": {
                "income": total_income,
                "expense": total_expense
            },
            "recent_transactions": recent_transactions,
            "budgets": budgets_data,
            "goals": goals_data,
            "emis": emis_data
        }
        
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to aggregate financial data."
        )
        
    # Construct Server-Side Prompt Structure to prevent injection
    prompt = f"""SYSTEM INSTRUCTIONS:
{SYSTEM_INSTRUCTIONS}

FINANCIAL SNAPSHOT:
{json.dumps(snapshot)}

USER QUESTION:
{question}"""

    # Call Gemini REST API directly using requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY.get_secret_value()}"
    
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.45,
            "maxOutputTokens": 1024,
        }
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10.0)
        response.raise_for_status()
        
        data = response.json()
        answer = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        if not answer:
            answer = "I could not generate a response from the provided financial data."
            
        return AICoachResponse(answer=answer)
        
    except requests.RequestException:
        # Crucial security: Mask all external API and network errors, prevent leaking the API key in the traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate financial advice right now."
        )
