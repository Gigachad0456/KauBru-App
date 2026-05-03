from typing import List
from fastapi import APIRouter, Depends

from app import schemas
from app.auth import get_current_user
from app import models

router = APIRouter(prefix="/premium", tags=["Premium"])

PLANS: List[schemas.PremiumPlan] = [
    schemas.PremiumPlan(
        id="student",
        name="Student Plan",
        price="₹99",
        period="month",
        is_best_value=False,
        benefits=[
            "Basic dictionary access",
            "10 saved words",
            "5 lessons",
            "Community contributions",
        ],
    ),
    schemas.PremiumPlan(
        id="standard",
        name="Standard Plan",
        price="₹199",
        period="month",
        is_best_value=False,
        benefits=[
            "Full dictionary access",
            "Unlimited saved words",
            "All lessons",
            "Pronunciation audio",
            "Community contributions",
        ],
    ),
    schemas.PremiumPlan(
        id="annual",
        name="Annual Plan",
        price="₹499",
        period="year",
        is_best_value=True,
        benefits=[
            "Everything in Standard",
            "Offline dictionary",
            "AI voice practice",
            "Premium folk stories",
            "Priority support",
            "Save 79% vs monthly",
        ],
    ),
]


@router.get("/plans", response_model=List[schemas.PremiumPlan])
def get_plans(_: models.User = Depends(get_current_user)):
    return PLANS
