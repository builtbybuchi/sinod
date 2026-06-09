"""
Withdrawal Service
Handles event host withdrawals with escrow system:
- 60% available immediately after payment hold period
- 40% held until 26 hours after event end time (escrow for refund claims)
- Platform fee: 5% + 1.6% gateway = 6.6% total (deducted based on fee_bearer)
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
import asyncio
import concurrent.futures

from config import settings

logger = logging.getLogger(__name__)


class WithdrawalService:
    """Service for handling event host withdrawals with escrow"""
    
    def __init__(self):
        self.platform_fee_percentage = 5.0  # 5% platform fee
        self.gateway_fee_percentage = 1.6   # 1.6% Squadco gateway fee
        self.hold_period_hours = 48  # 48-hour payment hold
        self.escrow_hours_post_event = 26  # 26 hours after event ends for escrow release
        self.immediate_release_percentage = 60  # 60% available before escrow release
        
        # Setup Appwrite client
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        self.databases = Databases(self.client)
    
    async def calculate_available_balance(
        self,
        user_email: str,
        event_id: str = None
    ) -> Dict[str, Any]:
        """
        Calculate available balance for withdrawal
        
        Args:
            user_email: Event host email
            event_id: Optional specific event ID (if None, calculates for all events)
            
        Returns:
            Dictionary with available balance and breakdown
        """
        try:
            # Run Appwrite queries in executor
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                # Get user's events
                if event_id:
                    events = await loop.run_in_executor(
                        executor,
                        lambda: self.databases.list_documents(
                            database_id=settings.APPWRITE_DATABASE_ID,
                            collection_id=settings.APPWRITE_EVENTS_COLLECTION_ID,
                            queries=[
                                Query.equal('event_page_url', event_id),
                                Query.equal('user_email', user_email),
                                Query.equal('paid', True)
                            ]
                        )
                    )
                else:
                    events = await loop.run_in_executor(
                        executor,
                        lambda: self.databases.list_documents(
                            database_id=settings.APPWRITE_DATABASE_ID,
                            collection_id=settings.APPWRITE_EVENTS_COLLECTION_ID,
                            queries=[
                                Query.equal('user_email', user_email),
                                Query.equal('paid', True)
                            ]
                        )
                    )
                
                events_list = events.get('documents', [])
                
                if not events_list:
                    return {
                        "success": True,
                        "available_balance": 0,
                        "total_revenue": 0,
                        "platform_fee": 0,
                        "pending_amount": 0,
                        "escrowed_amount": 0,
                        "withdrawn_amount": 0,
                        "events_breakdown": []
                    }
                
                # Payment hold cutoff (48 hours ago)
                cutoff_time = datetime.utcnow() - timedelta(hours=self.hold_period_hours)
                cutoff_iso = cutoff_time.isoformat() + 'Z'
                
                total_available = 0
                total_pending = 0
                total_escrowed = 0
                total_withdrawn = 0
                events_breakdown = []
                
                for event in events_list:
                    event_id = event['event_page_url']
                    event_price = event.get('event_price', 0)
                    
                    # Get paid attendees for this event
                    attendees = await loop.run_in_executor(
                        executor,
                        lambda: self.databases.list_documents(
                            database_id=settings.APPWRITE_DATABASE_ID,
                            collection_id=settings.APPWRITE_ATTENDEES_COLLECTION_ID,
                            queries=[
                                Query.equal('event_id', event_id),
                                Query.equal('paid', True)
                            ]
                        )
                    )
                    
                    attendees_list = attendees.get('documents', [])
                    
                    # Split attendees into eligible and pending based on 48hr rule
                    eligible_attendees = []
                    pending_attendees = []
                    
                    for attendee in attendees_list:
                        created_at = attendee.get('$createdAt', '')
                        if created_at < cutoff_iso:
                            eligible_attendees.append(attendee)
                        else:
                            pending_attendees.append(attendee)
                    
                    # Get previous withdrawals for this event
                    withdrawals = await loop.run_in_executor(
                        executor,
                        lambda: self.databases.list_documents(
                            database_id=settings.APPWRITE_DATABASE_ID,
                            collection_id='withdrawals',  # You'll need to create this collection
                            queries=[
                                Query.equal('event_id', event_id),
                                Query.equal('user_email', user_email),
                                Query.equal('status', 'completed')
                            ]
                        )
                    )
                    
                    withdrawn_for_event = sum(w.get('net_amount', 0) for w in withdrawals.get('documents', []))
                    
                    # Calculate amounts
                    eligible_revenue = len(eligible_attendees) * event_price
                    pending_revenue = len(pending_attendees) * event_price
                    
                    # Determine fee deduction: if fee_bearer is 'host', deduct total fees from host
                    fee_bearer = event.get('fee_bearer', 'attendee')
                    if fee_bearer == 'host':
                        total_fee_pct = self.platform_fee_percentage + self.gateway_fee_percentage  # 6.6%
                    else:
                        # When attendee pays fees, host still owes platform fee
                        total_fee_pct = self.platform_fee_percentage  # 5%
                    
                    eligible_net = eligible_revenue * (1 - total_fee_pct / 100)
                    
                    # Escrow logic: check if event has ended + 26 hours
                    event_end_time_str = event.get('event_end_time') or event.get('event_time', '')
                    escrow_released = False
                    try:
                        event_end_dt = datetime.fromisoformat(event_end_time_str.replace('Z', '+00:00')).replace(tzinfo=None)
                        escrow_release_dt = event_end_dt + timedelta(hours=self.escrow_hours_post_event)
                        escrow_released = datetime.utcnow() >= escrow_release_dt
                    except (ValueError, AttributeError):
                        # If we can't parse, default to not released
                        escrow_released = False
                    
                    if escrow_released:
                        # Full amount available (minus fees and already withdrawn)
                        available_for_event = max(0, eligible_net - withdrawn_for_event)
                        escrowed_for_event = 0
                    else:
                        # Only 60% available, 40% held in escrow
                        immediate_amount = eligible_net * (self.immediate_release_percentage / 100)
                        escrowed_for_event = eligible_net * ((100 - self.immediate_release_percentage) / 100)
                        available_for_event = max(0, immediate_amount - withdrawn_for_event)
                    
                    total_available += available_for_event
                    total_pending += pending_revenue
                    total_escrowed += escrowed_for_event
                    total_withdrawn += withdrawn_for_event
                    
                    events_breakdown.append({
                        "event_id": event_id,
                        "event_name": event.get('event_name', 'Unknown Event'),
                        "event_price": event_price,
                        "fee_bearer": fee_bearer,
                        "eligible_registrations": len(eligible_attendees),
                        "pending_registrations": len(pending_attendees),
                        "gross_revenue": eligible_revenue,
                        "fee_percentage": total_fee_pct,
                        "platform_fee": eligible_revenue * (total_fee_pct / 100),
                        "net_revenue": eligible_net,
                        "already_withdrawn": withdrawn_for_event,
                        "available": available_for_event,
                        "escrowed": escrowed_for_event,
                        "escrow_released": escrow_released,
                        "pending": pending_revenue
                    })
                
                # Calculate totals from breakdown
                total_gross_revenue = sum(e['gross_revenue'] for e in events_breakdown)
                total_platform_fee = sum(e['platform_fee'] for e in events_breakdown)
                
                return {
                    "success": True,
                    "available_balance": round(total_available, 2),
                    "total_revenue": round(total_gross_revenue, 2),
                    "platform_fee": round(total_platform_fee, 2),
                    "pending_amount": round(total_pending, 2),
                    "escrowed_amount": round(total_escrowed, 2),
                    "withdrawn_amount": round(total_withdrawn, 2),
                    "platform_fee_percentage": self.platform_fee_percentage,
                    "gateway_fee_percentage": self.gateway_fee_percentage,
                    "hold_period_hours": self.hold_period_hours,
                    "escrow_hours_post_event": self.escrow_hours_post_event,
                    "immediate_release_percentage": self.immediate_release_percentage,
                    "events_breakdown": events_breakdown
                }
                
        except Exception as e:
            error_msg = f"Error calculating available balance: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }
    
    async def initiate_withdrawal(
        self,
        user_email: str,
        amount: float,
        bank_details: Dict[str, str],
        event_id: str = None
    ) -> Dict[str, Any]:
        """
        Initiate withdrawal to host's bank account
        
        Args:
            user_email: Event host email
            amount: Amount to withdraw
            bank_details: Dictionary with bank_code, account_number, account_name
            event_id: Optional specific event ID
            
        Returns:
            Dictionary with withdrawal status
        """
        try:
            # Verify available balance
            balance_info = await self.calculate_available_balance(user_email, event_id)
            
            if not balance_info.get('success'):
                return {
                    "success": False,
                    "error": "Could not verify available balance"
                }
            
            available = balance_info.get('available_balance', 0)
            
            if amount > available:
                return {
                    "success": False,
                    "error": f"Insufficient balance. Available: ₦{available:.2f}, Requested: ₦{amount:.2f}"
                }
            
            if amount < 100:
                return {
                    "success": False,
                    "error": "Minimum withdrawal amount is ₦100"
                }
            
            # Import payment service for Squadco transfer
            from services.payment_service import payment_service
            
            # Initiate transfer via Squadco
            transfer_result = await payment_service.transfer_funds(
                amount=amount,
                bank_code=bank_details.get('bank_code'),
                account_number=bank_details.get('account_number'),
                account_name=bank_details.get('account_name'),
                currency='NGN'
            )
            
            if not transfer_result.get('success'):
                return {
                    "success": False,
                    "error": transfer_result.get('error', 'Transfer failed')
                }
            
            # The amount requested is already net of fees (since calculate_available_balance already deducted fees)
            # We just need to record the gross equivalent for the withdrawal record
            # Determine effective fee percentage from the event(s)
            breakdown = balance_info.get('events_breakdown', [])
            if breakdown:
                avg_fee_pct = sum(e.get('fee_percentage', self.platform_fee_percentage) for e in breakdown) / len(breakdown)
            else:
                avg_fee_pct = self.platform_fee_percentage
            
            gross_amount = amount / (1 - avg_fee_pct / 100)
            platform_fee = gross_amount - amount
            
            # Create withdrawal record
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                withdrawal_record = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.create_document(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='withdrawals',
                        document_id='unique()',
                        data={
                            'user_email': user_email,
                            'event_id': event_id or 'all_events',
                            'gross_amount': round(gross_amount, 2),
                            'platform_fee': round(platform_fee, 2),
                            'net_amount': round(amount, 2),
                            'status': 'completed',
                            'transfer_reference': transfer_result.get('reference'),
                            'bank_details': bank_details,
                            'withdrawn_at': datetime.utcnow().isoformat() + 'Z'
                        }
                    )
                )
            
            logger.info(f"Withdrawal successful: {user_email} - ₦{amount}")
            
            return {
                "success": True,
                "message": "Withdrawal initiated successfully",
                "amount": amount,
                "platform_fee": round(platform_fee, 2),
                "transfer_reference": transfer_result.get('reference'),
                "withdrawal_id": withdrawal_record['$id']
            }
            
        except Exception as e:
            error_msg = f"Error initiating withdrawal: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }
    
    async def get_withdrawal_history(
        self,
        user_email: str,
        event_id: str = None
    ) -> Dict[str, Any]:
        """
        Get withdrawal history for user
        
        Args:
            user_email: Event host email
            event_id: Optional specific event ID
            
        Returns:
            Dictionary with withdrawal history
        """
        try:
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                queries = [Query.equal('user_email', user_email)]
                if event_id:
                    queries.append(Query.equal('event_id', event_id))
                queries.append(Query.order_desc('$createdAt'))
                
                withdrawals = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.list_documents(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='withdrawals',
                        queries=queries
                    )
                )
                
                return {
                    "success": True,
                    "withdrawals": withdrawals.get('documents', [])
                }
                
        except Exception as e:
            error_msg = f"Error fetching withdrawal history: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "error": error_msg
            }


# Singleton instance
withdrawal_service = WithdrawalService()
