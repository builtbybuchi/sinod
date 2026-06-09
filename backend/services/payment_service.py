"""
Payment service implementation using Squadco API
"""

import httpx
import logging
from typing import Dict, Any

from config import settings

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for handling payments via Squadco"""
    
    def __init__(self):
        self.secret_key = settings.SQUADCO_SECRET_KEY
        self.public_key = settings.SQUADCO_PUBLIC_KEY
        self.base_url = settings.SQUADCO_BASE_URL
    
    async def initiate_payment(
        self,
        amount: float,
        email: str,
        currency: str,
        attendee_id: str,
        event_id: str
    ) -> Dict[str, Any]:
        """
        Initiate payment with Squadco
        
        Args:
            amount: Amount in specified currency
            email: Customer email
            currency: Currency code (e.g., NGN)
            attendee_id: Attendee document ID
            event_id: Event page URL
            
        Returns:
            Dictionary with checkout URL and transaction reference
        """
        try:
            async with httpx.AsyncClient() as client:
                # Generate unique transaction reference
                import time
                transaction_ref = f"SQLEXR{int(time.time() * 1000)}"
                
                response = await client.post(
                    f"{self.base_url}/transaction/initiate",
                    headers={
                        "Authorization": f"Bearer {self.secret_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "amount": int(amount * 100),  # Convert to kobo/cents
                        "email": email,
                        "currency": currency,
                        "initiate_type": "inline",  # Required for inline widget
                        "transaction_ref": transaction_ref,
                        "callback_url": f"{settings.FRONTEND_URL}/payment/verify?attendee_id={attendee_id}&event_id={event_id}",
                        "metadata": {
                            "attendee_id": attendee_id,
                            "event_id": event_id
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Squadco API Full Response: {data}")
                    
                    if data.get("success"):
                        # Extract data exactly as Squadco returns it
                        response_data = data.get("data", {})
                        
                        # Get checkout_url and transaction_ref
                        checkout_url = response_data.get("checkout_url")
                        transaction_ref = response_data.get("transaction_ref")
                        
                        logger.info(f"Payment initiated - Ref: {transaction_ref}, Checkout URL: {checkout_url}")
                        
                        # If checkout_url is missing, return transaction_ref for inline checkout
                        if not checkout_url:
                            logger.warning("Squadco did not return checkout_url. Switching to inline checkout.")
                            if not transaction_ref:
                                logger.error(f"Squadco did not return transaction_ref either. Full response: {data}")
                                return {
                                    "success": False,
                                    "error": "Payment provider returned no checkout URL or transaction reference."
                                }
                            return {
                                "success": True,
                                "use_inline": True, # Signal to frontend to use inline widget
                                "transaction_ref": transaction_ref
                            }
                        
                        # If checkout_url is present, return it for redirect
                        return {
                            "success": True,
                            "use_inline": False,
                            "checkout_url": checkout_url,
                            "transaction_ref": transaction_ref
                        }
                    else:
                        error_msg = data.get("message", "Payment initiation failed")
                        logger.error(f"Payment initiation failed: {error_msg}")
                        return {
                            "success": False,
                            "error": error_msg
                        }
                else:
                    error_msg = f"Squadco API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "error": error_msg
                    }
                    
        except Exception as e:
            error_msg = f"Error initiating payment: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }
    
    async def verify_payment(
        self,
        transaction_ref: str
    ) -> Dict[str, Any]:
        """
        Verify payment status with Squadco
        
        Args:
            transaction_ref: Transaction reference from Squadco
            
        Returns:
            Dictionary with payment status and details
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/transaction/verify/{transaction_ref}",
                    headers={
                        "Authorization": f"Bearer {self.secret_key}"
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get("success"):
                        transaction_data = data.get("data", {})
                        transaction_status = transaction_data.get("transaction_status")
                        amount = transaction_data.get("transaction_amount", 0) / 100  # Convert from kobo
                        
                        is_paid = transaction_status == "success"
                        
                        logger.info(f"Payment verified: {transaction_ref} - Status: {transaction_status}")
                        
                        return {
                            "success": True,
                            "paid": is_paid,
                            "transaction_status": transaction_status,
                            "amount": amount
                        }
                    else:
                        error_msg = data.get("message", "Payment verification failed")
                        logger.error(f"Payment verification failed: {error_msg}")
                        return {
                            "success": False,
                            "paid": False,
                            "error": error_msg
                        }
                else:
                    error_msg = f"Squadco API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "paid": False,
                        "error": error_msg
                    }
                    
        except Exception as e:
            error_msg = f"Error verifying payment: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "paid": False,
                "error": error_msg
            }
    
    async def transfer_funds(
        self,
        amount: float,
        bank_code: str,
        account_number: str,
        account_name: str,
        currency: str = 'NGN'
    ) -> Dict[str, Any]:
        """
        Transfer funds to bank account via Squadco
        
        Args:
            amount: Amount to transfer
            bank_code: Bank code (e.g., "058" for GTBank)
            account_number: Recipient account number
            account_name: Recipient account name
            currency: Currency code (default: NGN)
            
        Returns:
            Dictionary with transfer status and reference
        """
        try:
            import time
            transaction_ref = f"WTH{int(time.time() * 1000)}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/payout/transfer",
                    headers={
                        "Authorization": f"Bearer {self.secret_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "transaction_reference": transaction_ref,
                        "bank_code": bank_code,
                        "account_number": account_number,
                        "account_name": account_name,
                        "amount": int(amount * 100),  # Convert to kobo
                        "currency_id": currency,
                        "remark": "Event revenue withdrawal"
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Squadco Transfer Response: {data}")
                    
                    if data.get("success"):
                        logger.info(f"Transfer successful: {transaction_ref} - ₦{amount}")
                        return {
                            "success": True,
                            "reference": transaction_ref,
                            "message": "Transfer initiated successfully"
                        }
                    else:
                        error_msg = data.get("message", "Transfer failed")
                        logger.error(f"Transfer failed: {error_msg}")
                        return {
                            "success": False,
                            "error": error_msg
                        }
                else:
                    error_msg = f"Squadco API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "error": error_msg
                    }
                    
        except Exception as e:
            error_msg = f"Error transferring funds: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }


# Singleton instance
payment_service = PaymentService()
