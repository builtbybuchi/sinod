"""
Routes package initialization
"""

from . import email_routes, payment_routes, ai_routes, withdrawal_routes, events_routes, websocket_routes, newsletter_routes, contact_messages_routes, refund_routes

__all__ = [
    "email_routes",
    "payment_routes",
    "ai_routes",
    "withdrawal_routes",
    "events_routes",
    "websocket_routes",
    "newsletter_routes",
    "contact_messages_routes",
    "refund_routes"
]
