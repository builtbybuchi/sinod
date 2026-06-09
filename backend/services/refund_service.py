"""
Refund Service
Handles refund requests for event attendees on Sinod':

Policy:
- Within 24 hours of registration: 100% full refund (including fees) — auto-approved,
  since escrow holds funds for 48 hours anyway.
- The total 6.6% fee (5% platform + 1.6% gateway) is NON-REFUNDABLE regardless of who pays it
  (except for the 24hr registration window above).
- If a request is made > 48 hours before event start: 40% of the ticket price (minus 6.6% fee)
  is refunded immediately. For a full refund, attendee must provide a reason and admin must approve.
- If a request is made <= 48 hours before event start: ALL refunds require reason + admin approval.
- Attendees have a maximum of 12 hours AFTER the event starts to request a refund.
  After 12 hours past the event start time, no refund is possible.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
from appwrite.query import Query
import asyncio
import concurrent.futures

from config import settings

logger = logging.getLogger(__name__)


class RefundService:
    """Service for handling attendee refund requests"""

    def __init__(self):
        self.total_fee_percentage = 6.6  # 5% platform + 1.6% gateway — non-refundable
        self.immediate_refund_percentage = 40  # 40% auto-refund if >48hrs before event
        self.auto_refund_hours = 48  # >48 hrs before event = 40% auto
        self.max_hours_after_start = 12  # 12 hrs after event start is the absolute cutoff
        self.full_refund_registration_hours = 24  # 100% refund within 24hrs of registration

        # Setup Appwrite client
        self.client = Client()
        self.client.set_endpoint(settings.APPWRITE_ENDPOINT)
        self.client.set_project(settings.APPWRITE_PROJECT_ID)
        self.client.set_key(settings.APPWRITE_API_KEY)
        self.databases = Databases(self.client)

    def _calculate_refund_amount(self, ticket_price: float, percentage: float = 100) -> float:
        """
        Calculate refund amount after deducting non-refundable 6.6% fee.
        percentage: what % of the remaining (after fee) amount to refund.
        """
        refundable_base = ticket_price * (1 - self.total_fee_percentage / 100)
        return round(refundable_base * (percentage / 100), 2)

    async def request_refund(
        self,
        attendee_email: str,
        event_id: str,
        reason: str = ""
    ) -> Dict[str, Any]:
        """
        Submit a refund request for an attendee registration.
        
        Rules (applied in order):
        1. Event must be a paid event with a paid registration
        2. Maximum 12 hours after event start to submit a request
        3. Within 24 hours of registration: 100% full refund (fees included) — auto-approved
        4. More than 48 hours before event: 40% auto-refund, full requires reason + admin
        5. 48 hours or less before event: ALL refunds require reason + admin approval
        """
        try:
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                # 1. Look up the event
                events = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.list_documents(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id=settings.APPWRITE_EVENTS_COLLECTION_ID,
                        queries=[
                            Query.equal('event_page_url', event_id)
                        ]
                    )
                )

                events_list = events.get('documents', [])
                if not events_list:
                    return {"success": False, "error": "Event not found"}

                event = events_list[0]

                if not event.get('paid'):
                    return {"success": False, "error": "This is a free event — no refund applicable"}

                event_price = event.get('event_price', 0)
                if event_price <= 0:
                    return {"success": False, "error": "Event has no ticket price"}

                # 2. Check timing
                event_time_str = event.get('event_time', '')
                try:
                    event_dt = datetime.fromisoformat(event_time_str.replace('Z', '+00:00')).replace(tzinfo=None)
                except (ValueError, AttributeError):
                    return {"success": False, "error": "Could not determine event start time"}

                now = datetime.utcnow()
                hours_until_event = (event_dt - now).total_seconds() / 3600

                # Absolute cutoff: 12 hours AFTER event start
                if hours_until_event < -self.max_hours_after_start:
                    return {
                        "success": False,
                        "error": f"Refund requests must be submitted within {self.max_hours_after_start} hours after the event starts. This window has passed."
                    }

                # 3. Find the attendee registration
                attendees = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.list_documents(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id=settings.APPWRITE_ATTENDEES_COLLECTION_ID,
                        queries=[
                            Query.equal('event_id', event_id),
                            Query.equal('email', attendee_email),
                            Query.equal('paid', True)
                        ]
                    )
                )

                attendees_list = attendees.get('documents', [])
                if not attendees_list:
                    return {"success": False, "error": "No paid registration found for this email"}

                attendee = attendees_list[0]

                # 4. Check for existing refund request
                existing = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.list_documents(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='refunds',
                        queries=[
                            Query.equal('attendee_email', attendee_email),
                            Query.equal('event_id', event_id),
                            Query.not_equal('status', 'rejected')
                        ]
                    )
                )

                if existing.get('documents', []):
                    existing_status = existing['documents'][0].get('status', 'pending')
                    return {
                        "success": False,
                        "error": f"A refund request already exists (status: {existing_status})"
                    }

                # 5. Check if within 24 hours of registration — 100% full refund
                registration_time_str = attendee.get('$createdAt', '')
                within_24hr_of_registration = False
                try:
                    reg_dt = datetime.fromisoformat(registration_time_str.replace('Z', '+00:00')).replace(tzinfo=None)
                    hours_since_registration = (now - reg_dt).total_seconds() / 3600
                    within_24hr_of_registration = hours_since_registration <= self.full_refund_registration_hours
                except (ValueError, AttributeError):
                    pass  # Can't determine registration time, skip this tier

                if within_24hr_of_registration:
                    # 100% refund including fees — escrow still holds the funds
                    status_val = "approved"
                    refund_amount = event_price  # Full ticket price, fees included
                    fee_deducted = 0
                    admin_note = "Auto-approved: 100% refund within 24 hours of registration (escrow window)."
                    message = "Your full refund has been approved. Since you requested within 24 hours of registration, you receive a 100% refund including all fees."
                else:
                    # 6. Determine refund logic based on event timing
                    fee_deducted = round(event_price * self.total_fee_percentage / 100, 2)

                    if hours_until_event > self.auto_refund_hours:
                        # >48 hours before event: 40% auto-refund, rest needs admin
                        immediate_amount = self._calculate_refund_amount(event_price, self.immediate_refund_percentage)
                        full_amount = self._calculate_refund_amount(event_price, 100)

                        if reason.strip():
                            # Has reason -> request full refund (40% immediate + 60% pending admin)
                            status_val = "partial_approved"
                            refund_amount = full_amount
                            admin_note = f"40% auto-refunded. Remaining awaiting admin approval."
                            message = f"40% of your refund has been processed immediately. Your request for the remaining amount is pending admin approval."
                        else:
                            # No reason -> only 40% immediate
                            status_val = "approved"
                            refund_amount = immediate_amount
                            admin_note = "Auto-approved 40% refund (>48hrs before event)."
                            message = f"40% refund approved. The 6.6% transaction fee is non-refundable. For a full refund, submit a new request with an explicit reason."
                    else:
                        # <=48 hours before event (or after start, within 12hr window):
                        # ALL refunds require reason + admin approval
                        if not reason.strip():
                            return {
                                "success": False,
                                "error": "A detailed reason is required for refund requests made within 48 hours of the event. Please explain why you need a refund."
                            }

                        full_amount = self._calculate_refund_amount(event_price, 100)
                        immediate_amount = 0
                        status_val = "pending"
                        refund_amount = full_amount
                        admin_note = ""
                        
                        if hours_until_event < 0:
                            message = "Your refund request has been submitted for admin review. Since the event has already started, approval is at admin discretion."
                        else:
                            message = "Your refund request has been submitted for admin review. You'll be notified once a decision is made."

                # 7. Create refund record
                refund_data = {
                    'attendee_email': attendee_email,
                    'attendee_id': attendee['$id'],
                    'event_id': event_id,
                    'event_name': event.get('event_name', 'Unknown Event'),
                    'host_email': event.get('user_email', ''),
                    'ticket_price': event_price,
                    'refund_amount': round(refund_amount, 2),
                    'fee_deducted': fee_deducted,
                    'reason': reason,
                    'status': status_val,
                    'requested_at': now.isoformat() + 'Z',
                    'resolved_at': (now.isoformat() + 'Z') if status_val in ('approved', 'partial_approved') else '',
                    'admin_note': admin_note,
                }

                refund_doc = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.create_document(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='refunds',
                        document_id=ID.unique(),
                        data=refund_data
                    )
                )

                # 7. If approved or partial_approved, mark attendee as refunded
                if status_val in ('approved', 'partial_approved'):
                    await self._process_refund(attendee['$id'], event_id, executor, loop)

                logger.info(f"Refund request created: {attendee_email} for event {event_id} — status: {status_val}, amount: {refund_amount}")

                return {
                    "success": True,
                    "message": message,
                    "refund_id": refund_doc['$id'],
                    "status": status_val,
                    "amount": round(refund_amount, 2),
                    "fee_deducted": fee_deducted,
                }

        except Exception as e:
            error_msg = f"Error requesting refund: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {"success": False, "error": error_msg}

    async def admin_action(
        self,
        refund_id: str,
        action: str,
        admin_email: str,
        admin_note: str = ""
    ) -> Dict[str, Any]:
        """
        Admin approve or reject a refund request.
        For 'partial_approved' refunds, approving releases the remaining 60%.
        For 'pending' refunds, approving grants the full refund amount.
        """
        if action not in ('approve', 'reject'):
            return {"success": False, "error": "Action must be 'approve' or 'reject'"}

        try:
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                # Get refund doc
                refund_doc = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.get_document(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='refunds',
                        document_id=refund_id
                    )
                )

                current_status = refund_doc.get('status')
                if current_status not in ('pending', 'partial_approved'):
                    return {"success": False, "error": f"Refund is already {current_status} — no further action needed"}

                now = datetime.utcnow()
                new_status = 'approved' if action == 'approve' else 'rejected'

                # Update refund record
                await loop.run_in_executor(
                    executor,
                    lambda: self.databases.update_document(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='refunds',
                        document_id=refund_id,
                        data={
                            'status': new_status,
                            'resolved_at': now.isoformat() + 'Z',
                            'admin_note': admin_note,
                            'admin_email': admin_email,
                        }
                    )
                )

                # If approved, process the refund (mark attendee as unpaid / cancelled)
                if action == 'approve':
                    attendee_id = refund_doc.get('attendee_id', '')
                    event_id = refund_doc.get('event_id', '')
                    if attendee_id and event_id:
                        await self._process_refund(attendee_id, event_id, executor, loop)

                logger.info(f"Refund {refund_id} {new_status} by {admin_email}")

                return {
                    "success": True,
                    "message": f"Refund {new_status}",
                    "refund_id": refund_id,
                    "status": new_status,
                    "amount": refund_doc.get('refund_amount', 0)
                }

        except Exception as e:
            error_msg = f"Error processing admin action: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {"success": False, "error": error_msg}

    async def list_refunds(
        self,
        event_id: str = None,
        attendee_email: str = None,
        host_email: str = None,
        status_filter: str = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        List refund requests with optional filters
        """
        try:
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                queries = []

                if event_id:
                    queries.append(Query.equal('event_id', event_id))
                if attendee_email:
                    queries.append(Query.equal('attendee_email', attendee_email))
                if host_email:
                    queries.append(Query.equal('host_email', host_email))
                if status_filter:
                    queries.append(Query.equal('status', status_filter))

                queries.append(Query.order_desc('$createdAt'))
                queries.append(Query.limit(limit))
                queries.append(Query.offset(offset))

                result = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.list_documents(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='refunds',
                        queries=queries
                    )
                )

                return {
                    "success": True,
                    "refunds": result.get('documents', []),
                    "total": result.get('total', 0)
                }

        except Exception as e:
            error_msg = f"Error listing refunds: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {"success": False, "error": error_msg, "refunds": [], "total": 0}

    async def get_refund_status(
        self,
        attendee_email: str,
        event_id: str
    ) -> Dict[str, Any]:
        """
        Check if there's a refund request for this attendee + event
        """
        try:
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                result = await loop.run_in_executor(
                    executor,
                    lambda: self.databases.list_documents(
                        database_id=settings.APPWRITE_DATABASE_ID,
                        collection_id='refunds',
                        queries=[
                            Query.equal('attendee_email', attendee_email),
                            Query.equal('event_id', event_id),
                            Query.order_desc('$createdAt'),
                            Query.limit(1)
                        ]
                    )
                )

                docs = result.get('documents', [])
                if docs:
                    refund = docs[0]
                    return {
                        "success": True,
                        "has_refund": True,
                        "refund_id": refund['$id'],
                        "status": refund.get('status', 'pending'),
                        "amount": refund.get('refund_amount', 0),
                        "requested_at": refund.get('requested_at', ''),
                    }
                else:
                    return {
                        "success": True,
                        "has_refund": False,
                    }

        except Exception as e:
            error_msg = f"Error checking refund status: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return {"success": False, "error": error_msg}

    async def _process_refund(self, attendee_id: str, event_id: str, executor, loop):
        """
        Internal: Mark attendee as refunded (set paid=false).
        The actual money transfer back is handled separately by admin.
        """
        try:
            await loop.run_in_executor(
                executor,
                lambda: self.databases.update_document(
                    database_id=settings.APPWRITE_DATABASE_ID,
                    collection_id=settings.APPWRITE_ATTENDEES_COLLECTION_ID,
                    document_id=attendee_id,
                    data={
                        'paid': False,
                        'approved': False,
                    }
                )
            )
            logger.info(f"Processed refund for attendee {attendee_id}, event {event_id}")
        except Exception as e:
            logger.error(f"Error processing refund for attendee {attendee_id}: {e}")


# Singleton instance
refund_service = RefundService()
