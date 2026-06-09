"""
Withdrawal API routes
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
import logging

from services.withdrawal_service import withdrawal_service

logger = logging.getLogger(__name__)

router = APIRouter()


class AvailableBalanceRequest(BaseModel):
    """Request model for checking available balance"""
    user_email: EmailStr
    event_id: Optional[str] = None


class InitiateWithdrawalRequest(BaseModel):
    """Request model for initiating withdrawal"""
    user_email: EmailStr
    amount: float
    bank_code: str
    account_number: str
    account_name: str
    event_id: Optional[str] = None


class WithdrawalHistoryRequest(BaseModel):
    """Request model for withdrawal history"""
    user_email: EmailStr
    event_id: Optional[str] = None


@router.post("/available")
async def get_available_balance(request: AvailableBalanceRequest):
    """
    Get available balance for withdrawal
    
    - **user_email**: Event host email address
    - **event_id**: Optional specific event ID (if not provided, calculates for all events)
    
    Returns breakdown of available balance, pending amounts, and per-event details
    """
    try:
        result = await withdrawal_service.calculate_available_balance(
            user_email=request.user_email,
            event_id=request.event_id
        )
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to calculate available balance")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_available_balance endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/initiate")
async def initiate_withdrawal(request: InitiateWithdrawalRequest):
    """
    Initiate withdrawal to host's bank account
    
    - **user_email**: Event host email address
    - **amount**: Amount to withdraw (after 3% platform fee deduction)
    - **bank_code**: Bank code (e.g., "058" for GTBank)
    - **account_number**: Bank account number
    - **account_name**: Account holder name
    - **event_id**: Optional specific event ID
    
    Withdrawals can only be made for registrations at least 48 hours old.
    Platform fee of 3% is automatically deducted.
    """
    try:
        result = await withdrawal_service.initiate_withdrawal(
            user_email=request.user_email,
            amount=request.amount,
            bank_details={
                "bank_code": request.bank_code,
                "account_number": request.account_number,
                "account_name": request.account_name
            },
            event_id=request.event_id
        )
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Failed to initiate withdrawal")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in initiate_withdrawal endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/history")
async def get_withdrawal_history(request: WithdrawalHistoryRequest):
    """
    Get withdrawal history for user
    
    - **user_email**: Event host email address
    - **event_id**: Optional specific event ID
    
    Returns list of past withdrawals with details
    """
    try:
        result = await withdrawal_service.get_withdrawal_history(
            user_email=request.user_email,
            event_id=request.event_id
        )
        
        if result.get("success"):
            return result
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to fetch withdrawal history")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_withdrawal_history endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/health")
async def withdrawal_health():
    """Check withdrawal service health"""
    return {
        "service": "withdrawal",
        "status": "healthy",
        "platform_fee": "3%",
        "hold_period": "48 hours"
    }
